import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Satellite as SatelliteIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  MapPin, 
  Activity, 
  X, 
  Eye, 
  Sparkles,
  Compass,
  Radio
} from 'lucide-react';

export type EarthViewMode = 'natural' | 'ndvi' | 'night' | 'moisture';

export interface TelemetryHotspot {
  id: string;
  name: string;
  country: string;
  crop: string;
  lat: number;
  lon: number;
  ndvi: number;
  soilMoisture: string;
  healthStatus: 'Optimum' | 'Moderate Stress' | 'Drought Anomaly' | 'Severe Degradation';
  satPass: string;
}

export const GLOBAL_HOTSPOTS: TelemetryHotspot[] = [
  {
    id: 'hs-1',
    name: 'Central Valley Farmlands',
    country: 'United States (California)',
    crop: 'Almonds, Citrus & Vineyards',
    lat: 36.7783,
    lon: -119.4179,
    ndvi: 0.74,
    soilMoisture: '32.4% (Irrigated)',
    healthStatus: 'Optimum',
    satPass: 'Sentinel-2B in 04h 12m'
  },
  {
    id: 'hs-2',
    name: 'Mato Grosso Cerrado Basin',
    country: 'Brazil',
    crop: 'Soybean & Corn Mega-Fields',
    lat: -12.6819,
    lon: -56.9211,
    ndvi: 0.81,
    soilMoisture: '41.8% (Optimal)',
    healthStatus: 'Optimum',
    satPass: 'PlanetScope Dove in 01h 45m'
  },
  {
    id: 'hs-3',
    name: 'Punjab Breadbasket Plains',
    country: 'India',
    crop: 'Wheat, Rice & Mustard',
    lat: 31.1471,
    lon: 75.3412,
    ndvi: 0.52,
    soilMoisture: '21.5% (Heat Anomaly)',
    healthStatus: 'Moderate Stress',
    satPass: 'Landsat-9 in 06h 30m'
  },
  {
    id: 'hs-4',
    name: 'Bordeaux Agro-Vineyard Corridor',
    country: 'France',
    crop: 'Viticulture & Cereal Terroir',
    lat: 44.8378,
    lon: -0.5792,
    ndvi: 0.68,
    soilMoisture: '28.9% (Normal)',
    healthStatus: 'Optimum',
    satPass: 'Sentinel-2A in 02h 10m'
  },
  {
    id: 'hs-5',
    name: 'Rift Valley Highlands',
    country: 'Kenya',
    crop: 'Tea, Coffee & Maize',
    lat: 0.1769,
    lon: 36.0023,
    ndvi: 0.43,
    soilMoisture: '14.2% (Drought Risk)',
    healthStatus: 'Drought Anomaly',
    satPass: 'Sentinel-2B in 08h 15m'
  },
  {
    id: 'hs-6',
    name: 'Darling Downs Granary',
    country: 'Australia (Queensland)',
    crop: 'Sorghum, Barley & Cotton',
    lat: -27.5598,
    lon: 151.9507,
    ndvi: 0.62,
    soilMoisture: '26.1% (Adequate)',
    healthStatus: 'Optimum',
    satPass: 'PlanetScope Dove in 03h 22m'
  },
  {
    id: 'hs-7',
    name: 'Nile Delta Fertile Plain',
    country: 'Egypt',
    crop: 'Cotton, Citrus & Legumes',
    lat: 30.8761,
    lon: 31.0004,
    ndvi: 0.71,
    soilMoisture: '35.0% (Canal Fed)',
    healthStatus: 'Optimum',
    satPass: 'Sentinel-2A in 05h 40m'
  }
];

interface CinematicEarthProps {
  speedFactor?: number;
  allowDirectInteraction?: boolean;
  onSelectHotspot?: (hotspot: TelemetryHotspot | null) => void;
}

export default function CinematicEarthBackground({ 
  speedFactor = 1.0, 
  allowDirectInteraction = true,
  onSelectHotspot 
}: CinematicEarthProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<EarthViewMode>('natural');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<TelemetryHotspot | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<TelemetryHotspot | null>(null);
  const [_currentZoom, setCurrentZoom] = useState<number>(5.2);

  // References for three.js manipulation outside the animation loop
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const satGroupRef = useRef<THREE.Group | null>(null);
  const hotspotsGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const uniformsRef = useRef<{ [key: string]: THREE.IUniform } | null>(null);
  const resetOrientationRef = useRef<() => void>(() => {});
  const zoomFnRef = useRef<(delta: number) => void>(() => {});

  // Update shader uniforms when activeMode changes
  useEffect(() => {
    if (uniformsRef.current) {
      if (activeMode === 'natural') {
        uniformsRef.current.uViewMode.value = 0.0;
      } else if (activeMode === 'ndvi') {
        uniformsRef.current.uViewMode.value = 1.0;
      } else if (activeMode === 'night') {
        uniformsRef.current.uViewMode.value = 2.0;
      } else if (activeMode === 'moisture') {
        uniformsRef.current.uViewMode.value = 3.0;
      }
    }
  }, [activeMode]);

  // Toggle satellites visibility
  useEffect(() => {
    if (satGroupRef.current) {
      satGroupRef.current.visible = showOrbits;
    }
  }, [showOrbits]);

  // Select hotspot notification
  const handleSelectSpot = useCallback((spot: TelemetryHotspot | null) => {
    setSelectedHotspot(spot);
    if (onSelectHotspot) onSelectHotspot(spot);

    // Rotate earth smoothly toward the target hotspot lat/lon
    if (spot && earthMeshRef.current) {
      const targetY = -((spot.lon + 90) * (Math.PI / 180));
      const targetX = (spot.lat) * (Math.PI / 180) * 0.4;
      
      // Smooth animated transition
      const startY = earthMeshRef.current.rotation.y;
      const startX = earthMeshRef.current.rotation.x;
      const startTime = performance.now();
      const duration = 1200;

      const animateFocus = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

        if (earthMeshRef.current) {
          earthMeshRef.current.rotation.y = startY + (targetY - startY) * ease;
          earthMeshRef.current.rotation.x = startX + (targetX - startX) * ease;
        }

        if (progress < 1) {
          requestAnimationFrame(animateFocus);
        }
      };
      requestAnimationFrame(animateFocus);
    }
  }, [onSelectHotspot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── 1. Three.js Scene, Camera & WebGL Renderer Setup ────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // ─── 2. Ultra-High Fidelity Procedural Earth Textures ─────────
    // Helper to generate realistic high-resolution equirectangular texture maps
    function generatePhotorealisticEarthTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 4096;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();

      // Deep Space / Ocean Basemap with Depth Bathymetry
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGrad.addColorStop(0.0, '#030814'); // Arctic abyss
      oceanGrad.addColorStop(0.15, '#05112c');
      oceanGrad.addColorStop(0.35, '#081c44'); // Temperate deep waters
      oceanGrad.addColorStop(0.50, '#0c275e'); // Tropical blue waters
      oceanGrad.addColorStop(0.65, '#081c44');
      oceanGrad.addColorStop(0.85, '#05112c');
      oceanGrad.addColorStop(1.0, '#030814'); // Antarctic abyss
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add Continental & Coastal Shallow Waters (Turquoise continental shelves)
      const drawShallowShelf = (cx: number, cy: number, rx: number, ry: number) => {
        const shelfGrad = ctx.createRadialGradient(cx, cy, rx * 0.4, cx, cy, rx * 1.2);
        shelfGrad.addColorStop(0, 'rgba(0, 180, 216, 0.35)');
        shelfGrad.addColorStop(0.7, 'rgba(10, 80, 150, 0.18)');
        shelfGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shelfGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 1.2, ry * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      // Continental Shelves around major landmasses
      drawShallowShelf(1050, 650, 480, 320); // North America
      drawShallowShelf(1450, 1350, 320, 480); // South America
      drawShallowShelf(2400, 600, 750, 400); // Eurasia
      drawShallowShelf(2250, 1150, 420, 500); // Africa
      drawShallowShelf(3400, 1400, 360, 280); // Australia
      drawShallowShelf(2900, 850, 320, 260); // India & SE Asia

      // Detailed Landmass Drawing Routine with Biome Texturing
      const drawContinent = (
        pathPoints: [number, number][], 
        baseColor: string, 
        vegetationColor: string, 
        _desertColor?: string
      ) => {
        ctx.save();
        ctx.beginPath();
        pathPoints.forEach(([x, y], idx) => {
          const px = (x / 360 + 0.5) * canvas.width;
          const py = (-y / 180 + 0.5) * canvas.height;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();

        // Base Landfill
        ctx.fillStyle = baseColor;
        ctx.fill();

        // Biome / Vegetation Texture Overlay
        ctx.fillStyle = vegetationColor;
        ctx.globalAlpha = 0.85;
        ctx.fill();

        // Subtle topographic / coastal border highlight
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(125, 244, 255, 0.28)';
        ctx.stroke();

        ctx.restore();
      };

      // Accurate Geographic Polygons [Lon, Lat]
      // 1. North America
      drawContinent([
        [-168, 65], [-160, 71], [-130, 70], [-100, 75], [-75, 78], [-60, 60], [-55, 48],
        [-65, 43], [-75, 35], [-80, 25], [-88, 20], [-80, 8], [-77, 8], [-85, 15],
        [-97, 18], [-105, 23], [-117, 32], [-124, 40], [-125, 50], [-135, 58], [-150, 60],
        [-165, 62]
      ], '#16281a', '#1e3d24');

      // 2. Greenland & Arctic Islands
      drawContinent([
        [-55, 60], [-40, 60], [-20, 70], [-18, 80], [-40, 83], [-60, 80], [-55, 70]
      ], '#cadbe8', '#e2f0fa');

      // 3. South America
      drawContinent([
        [-78, 10], [-72, 11], [-60, 8], [-50, -2], [-35, -5], [-37, -12], [-42, -23],
        [-52, -33], [-65, -45], [-68, -55], [-75, -50], [-74, -40], [-72, -30], [-70, -18],
        [-80, -5], [-80, 5]
      ], '#142918', '#1a4220');

      // 4. Europe
      drawContinent([
        [-9, 36], [-8, 43], [-1, 44], [0, 49], [-5, 52], [-4, 58], [10, 55], [18, 58],
        [28, 70], [35, 68], [30, 60], [25, 50], [15, 45], [15, 38], [22, 38], [28, 41],
        [20, 36], [0, 36]
      ], '#1a2e1d', '#234427');

      // 5. Africa
      drawContinent([
        [-17, 15], [-17, 28], [-6, 36], [10, 37], [25, 32], [32, 31], [35, 28], [43, 12],
        [51, 10], [45, 0], [40, -10], [33, -28], [26, -34], [18, -34], [12, -20],
        [9, 2], [3, 6], [-5, 5], [-12, 8]
      ], '#2e2718', '#38301d');

      // 6. Northern Eurasia / Siberia
      drawContinent([
        [30, 60], [40, 66], [60, 68], [80, 73], [105, 77], [130, 73], [170, 68], [178, 65],
        [160, 55], [140, 50], [130, 42], [115, 38], [90, 45], [60, 50], [45, 52]
      ], '#1b2f1f', '#24452a');

      // 7. India & Southern / Southeast Asia
      drawContinent([
        [60, 25], [68, 24], [72, 19], [77, 8], [80, 13], [85, 20], [92, 22], [98, 18],
        [103, 10], [105, 20], [120, 24], [122, 32], [120, 40], [105, 35], [90, 28],
        [75, 30], [68, 30]
      ], '#19331f', '#244e2b');

      // 8. Australia & New Zealand
      drawContinent([
        [114, -22], [120, -15], [135, -12], [142, -11], [148, -20], [153, -28], [150, -37],
        [138, -35], [130, -32], [115, -34], [113, -26]
      ], '#3b2816', '#4a341d');

      // 9. Antarctica
      drawContinent([
        [-180, -78], [-120, -74], [-60, -68], [-40, -75], [0, -70], [60, -68], [120, -72],
        [180, -78], [180, -90], [-180, -90]
      ], '#d5e7f2', '#edf6fc');

      // Add Micro-Features: Great Lakes, Amazon Basin, Nile, Sahara Dunes
      // Sahara Desert golden dune glow
      const saharaGrad = ctx.createRadialGradient(2350, 720, 50, 2350, 720, 320);
      saharaGrad.addColorStop(0, 'rgba(180, 130, 60, 0.85)');
      saharaGrad.addColorStop(0.6, 'rgba(140, 100, 45, 0.6)');
      saharaGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = saharaGrad;
      ctx.fillRect(1900, 500, 900, 450);

      // Amazon River Basin dense emerald canopy
      const amazonGrad = ctx.createRadialGradient(1500, 1080, 40, 1500, 1080, 240);
      amazonGrad.addColorStop(0, 'rgba(16, 85, 38, 0.9)');
      amazonGrad.addColorStop(0.8, 'rgba(24, 70, 34, 0.6)');
      amazonGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = amazonGrad;
      ctx.fillRect(1250, 850, 500, 450);

      // Polar Ice caps glow
      ctx.fillStyle = 'rgba(235, 245, 255, 0.92)';
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, 80, canvas.width / 2, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    }

    // High-Resolution City Night Lights Texture (Gold/Amber Urban Clusters)
    function generateNightLightsTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 4096;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawCityCluster = (lon: number, lat: number, radius: number, intensity: number = 1.0) => {
        const px = (lon / 360 + 0.5) * canvas.width;
        const py = (-lat / 180 + 0.5) * canvas.height;

        const grad = ctx.createRadialGradient(px, py, 1, px, py, radius);
        grad.addColorStop(0, `rgba(255, 225, 140, ${0.95 * intensity})`);
        grad.addColorStop(0.2, `rgba(255, 180, 70, ${0.75 * intensity})`);
        grad.addColorStop(0.6, `rgba(200, 120, 30, ${0.35 * intensity})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Individual sparkling urban nodes
        for (let i = 0; i < 18; i++) {
          const ox = px + (Math.random() - 0.5) * radius * 1.5;
          const oy = py + (Math.random() - 0.5) * radius * 1.5;
          ctx.fillStyle = Math.random() > 0.4 ? '#fff4cc' : '#ffd166';
          ctx.fillRect(ox, oy, Math.random() * 2 + 1, Math.random() * 2 + 1);
        }
      };

      // Major Megalopolises & Agricultural Transport Corridors
      // North America
      drawCityCluster(-74, 40.7, 45, 1.0); // NYC / BosWash
      drawCityCluster(-87.6, 41.8, 38, 0.9); // Chicago / Midwest
      drawCityCluster(-118.2, 34, 42, 1.0); // LA / Southern Cal
      drawCityCluster(-122.4, 37.7, 35, 0.9); // Bay Area / Silicon Valley
      drawCityCluster(-95.3, 29.7, 32, 0.85); // Houston / Gulf Coast
      drawCityCluster(-84.3, 33.7, 28, 0.8); // Atlanta
      drawCityCluster(-99.1, 19.4, 34, 0.85); // Mexico City

      // Europe
      drawCityCluster(2.35, 48.8, 40, 1.0); // Paris
      drawCityCluster(-0.12, 51.5, 42, 1.0); // London
      drawCityCluster(13.4, 52.5, 34, 0.9); // Berlin / Central EU
      drawCityCluster(12.5, 41.9, 28, 0.8); // Rome
      drawCityCluster(37.6, 55.7, 36, 0.9); // Moscow

      // Asia
      drawCityCluster(139.6, 35.6, 50, 1.0); // Tokyo Kanto Basin
      drawCityCluster(121.4, 31.2, 48, 1.0); // Shanghai Yangtze Delta
      drawCityCluster(116.4, 39.9, 44, 0.95); // Beijing
      drawCityCluster(113.2, 23.1, 46, 1.0); // Pearl River Delta / HK
      drawCityCluster(77.2, 28.6, 42, 0.95); // New Delhi
      drawCityCluster(72.8, 19.0, 40, 0.95); // Mumbai
      drawCityCluster(100.5, 13.7, 32, 0.85); // Bangkok
      drawCityCluster(106.8, -6.2, 35, 0.85); // Jakarta

      // South America, Africa & Australia
      drawCityCluster(-46.6, -23.5, 42, 0.95); // São Paulo
      drawCityCluster(-58.3, -34.6, 35, 0.85); // Buenos Aires
      drawCityCluster(31.2, 30.0, 36, 0.9); // Cairo Nile Basin
      drawCityCluster(28.0, -26.2, 28, 0.8); // Johannesburg
      drawCityCluster(151.2, -33.8, 34, 0.85); // Sydney
      drawCityCluster(144.9, -37.8, 30, 0.8); // Melbourne

      return new THREE.CanvasTexture(canvas);
    }

    // Dynamic Multi-Spectral NDVI Vegetation Index Heatmap Texture
    function generateNDVIHeatmapTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();

      ctx.fillStyle = '#0a1020'; // Non-vegetated ocean
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // High NDVI lush biomes (Deep Green to Vibrant Lime)
      const drawNDVIZone = (cx: number, cy: number, rx: number, ry: number, ndviVal: string) => {
        const grad = ctx.createRadialGradient(cx, cy, rx * 0.2, cx, cy, rx);
        grad.addColorStop(0, ndviVal);
        grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      drawNDVIZone(550, 320, 220, 140, 'rgba(34, 197, 94, 0.95)'); // N. America Corn Belt
      drawNDVIZone(760, 680, 200, 260, 'rgba(16, 185, 129, 0.98)'); // Amazon Basin
      drawNDVIZone(1200, 580, 180, 200, 'rgba(74, 222, 128, 0.9)'); // Congo Rainforest
      drawNDVIZone(1480, 360, 260, 160, 'rgba(34, 197, 94, 0.95)'); // European Agricultural Plains
      drawNDVIZone(1650, 480, 220, 180, 'rgba(234, 179, 8, 0.85)'); // Indo-Gangetic Plains (Heat stressed)
      drawNDVIZone(1800, 420, 200, 150, 'rgba(16, 185, 129, 0.92)'); // SE Asia Rice Paddy Belt

      return new THREE.CanvasTexture(canvas);
    }

    // Multi-Layer Volumetric Clouds Texture
    function generatePhotorealisticCloudTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 4096;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();

      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Swirling cyclonic storm patterns & trade wind cloud bands
      for (let i = 0; i < 480; i++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height;
        const cr = Math.random() * 240 + 60;
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cr);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.3, 'rgba(240, 250, 255, 0.65)');
        grad.addColorStop(0.65, 'rgba(215, 235, 255, 0.2)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tropical Convergence Spiral Storm Formations
      const drawCyclone = (x: number, y: number, r: number) => {
        for (let a = 0; a < Math.PI * 4; a += 0.25) {
          const dist = (a / (Math.PI * 4)) * r;
          const px = x + Math.cos(a) * dist;
          const py = y + Math.sin(a) * dist * 0.6;
          const spotR = (dist / r) * 45 + 10;
          const grad = ctx.createRadialGradient(px, py, 2, px, py, spotR);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, spotR, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      drawCyclone(1100, 750, 180); // Atlantic Hurricane
      drawCyclone(3200, 800, 220); // Pacific Typhoon
      drawCyclone(2900, 1100, 160); // Indian Ocean Cyclone

      return new THREE.CanvasTexture(canvas);
    }

    // ─── 3. Starry Cosmos Background ────────────────────────────
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 70 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);

      const bright = Math.random();
      starColors[i3] = bright > 0.5 ? 0.95 : 0.45;
      starColors[i3 + 1] = bright > 0.5 ? 0.98 : 0.65;
      starColors[i3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ─── 4. Main Earth Sphere with Photorealistic Shader ─────────
    const earthRadius = 5.8;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 160, 160);

    const earthCustomShader = {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D nightMap;
        uniform sampler2D ndviMap;
        uniform sampler2D cloudMap;
        uniform vec3 lightPosition;
        uniform float uViewMode; // 0.0=natural, 1.0=ndvi, 2.0=night, 3.0=moisture
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          vec3 lightDir = normalize(lightPosition - vPosition);
          
          float nDotL = dot(vNormal, lightDir);
          float dayIntensity = smoothstep(-0.2, 0.5, nDotL);
          float nightIntensity = 1.0 - smoothstep(-0.1, 0.4, nDotL);

          vec4 dayColor = texture2D(map, vUv);
          vec4 nightCityColor = texture2D(nightMap, vUv);
          vec4 ndviColor = texture2D(ndviMap, vUv);
          vec4 cloudColor = texture2D(cloudMap, vUv);

          // Specular Glint on Oceans
          vec3 halfVector = normalize(lightDir + viewDir);
          float NdotH = max(0.0, dot(vNormal, halfVector));
          float specular = pow(NdotH, 48.0) * (1.0 - cloudColor.r * 0.9);
          vec3 specColor = vec3(0.5, 0.85, 1.0) * specular * 1.8 * dayIntensity;

          // Select Base Surface by Active View Mode
          vec3 baseSurface = dayColor.rgb;
          if (uViewMode == 1.0) {
            baseSurface = mix(dayColor.rgb * 0.4, ndviColor.rgb * 1.5, 0.85);
          } else if (uViewMode == 2.0) {
            baseSurface = dayColor.rgb * 0.15;
          } else if (uViewMode == 3.0) {
            baseSurface = mix(dayColor.rgb * 0.5, vec3(0.0, 0.85, 1.0), cloudColor.r * 1.2);
          }

          // Composite Clouds on Day Side
          vec3 illuminatedDay = mix(baseSurface, vec3(0.96, 0.98, 1.0), cloudColor.r * 0.92);
          illuminatedDay = (illuminatedDay * dayIntensity) + specColor;

          // Composite Night City Lights on Dark Hemisphere
          vec3 illuminatedNight = (nightCityColor.rgb * 2.2 * nightIntensity) + (baseSurface * 0.05);

          // Day / Night Blend
          vec3 surfaceColor = illuminatedDay + illuminatedNight;

          // Rayleigh Blue Horizon Limb Rim Glow
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          rim = pow(rim, 3.8);
          vec3 rimColor = mix(vec3(0.0, 0.65, 1.0), vec3(0.85, 0.98, 1.0), rim);

          vec3 finalColor = surfaceColor + (rimColor * rim * 2.4 * (dayIntensity + 0.3));

          // Smooth depth horizon fade
          float depthFade = smoothstep(-2.0, 0.6, vPosition.y);
          finalColor *= depthFade;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    };

    const earthTexture = generatePhotorealisticEarthTexture();
    const nightTexture = generateNightLightsTexture();
    const ndviTexture = generateNDVIHeatmapTexture();
    const cloudTexture = generatePhotorealisticCloudTexture();

    const uniforms = {
      map: { value: earthTexture },
      nightMap: { value: nightTexture },
      ndviMap: { value: ndviTexture },
      cloudMap: { value: cloudTexture },
      lightPosition: { value: new THREE.Vector3(2.5, 4.0, -2.5) },
      uViewMode: { value: 0.0 },
    };
    uniformsRef.current = uniforms;

    const earthMat = new THREE.ShaderMaterial({
      vertexShader: earthCustomShader.vertexShader,
      fragmentShader: earthCustomShader.fragmentShader,
      uniforms,
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -5.95, 0);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // ─── 5. Radiant Atmospheric Halo & Horizon Bloom ────────────
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 glowColor;
      uniform float coefficient;
      uniform float power;
      void main() {
        vec3 viewDirection = normalize(-vPosition);
        float intensity = pow(coefficient + dot(vNormal, viewDirection), power);
        intensity = clamp(intensity, 0.0, 1.0);
        
        vec3 finalGlow = mix(glowColor, vec3(0.95, 0.98, 1.0), pow(intensity, 3.2));
        float horizonClip = smoothstep(-1.5, 0.5, vPosition.y);
        gl_FragColor = vec4(finalGlow, intensity * 0.98 * horizonClip);
      }
    `;

    const atmosphereGeo = new THREE.SphereGeometry(earthRadius + 0.18, 128, 128);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(0x0077ff) },
        coefficient: { value: 0.12 },
        power: { value: 4.0 },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthMesh.add(atmosphereMesh);
    atmosphereMeshRef.current = atmosphereMesh;

    // ─── 6. Orbiting Satellites with Telemetry Scans ─────────────
    const satellites: Array<{ root: THREE.Group; speed: number; mesh: THREE.Mesh }> = [];
    const satGroup = new THREE.Group();
    earthMesh.add(satGroup);
    satGroupRef.current = satGroup;


    function createSatellite(
      orbitRadius: number, 
      inclination: number, 
      speed: number, 
      colorHex: number,
      _name?: string
    ) {
      const satRoot = new THREE.Group();
      satRoot.rotation.x = inclination;

      const bodyGeo = new THREE.BoxGeometry(0.08, 0.04, 0.05);
      const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        metalness: 0.9, 
        roughness: 0.2 
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);

      // Gold insulation blanket foil
      const foilGeo = new THREE.BoxGeometry(0.05, 0.03, 0.03);
      const foilMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const foil = new THREE.Mesh(foilGeo, foilMat);
      foil.position.set(0, 0, 0.02);
      body.add(foil);

      // Photovoltaic Solar Panels
      const panelGeo = new THREE.PlaneGeometry(0.18, 0.05);
      const panelMat = new THREE.MeshBasicMaterial({ 
        color: 0x00eefc, 
        side: THREE.DoubleSide 
      });
      const leftPanel = new THREE.Mesh(panelGeo, panelMat);
      leftPanel.position.x = -0.13;
      const rightPanel = new THREE.Mesh(panelGeo, panelMat);
      rightPanel.position.x = 0.13;
      body.add(leftPanel);
      body.add(rightPanel);

      // Downward Multi-Spectral Cone
      const beamGeo = new THREE.CylinderGeometry(0.005, 0.12, 0.8, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = -0.4;
      body.add(beam);

      body.position.set(orbitRadius, 0, 0);
      satRoot.add(body);
      satGroup.add(satRoot);

      satellites.push({ root: satRoot, speed, mesh: body });
    }

    createSatellite(earthRadius + 0.65, Math.PI / 4.2, 0.0045, 0x00eefc, 'Sentinel-2A');
    createSatellite(earthRadius + 0.90, -Math.PI / 5.5, 0.0032, 0x7df4ff, 'PlanetScope Dove');
    createSatellite(earthRadius + 0.78, Math.PI / 3.1, 0.0052, 0x38bdf8, 'Landsat-9');

    // ─── 7. Interactive Telemetry Hotspot Beacons ────────────────
    const hotspotsGroup = new THREE.Group();
    earthMesh.add(hotspotsGroup);
    hotspotsGroupRef.current = hotspotsGroup;

    // Helper: Convert Lat/Lon to 3D Sphere Surface Coordinates
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    const hotspotMeshes: Array<{ mesh: THREE.Mesh; data: TelemetryHotspot }> = [];

    GLOBAL_HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, earthRadius + 0.04);
      
      // Outer Pulsing Ring
      const ringGeo = new THREE.RingGeometry(0.04, 0.07, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spot.healthStatus === 'Optimum' ? 0x22c55e : (spot.healthStatus === 'Drought Anomaly' ? 0xef4444 : 0xf59e0b),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);

      // Center Core Beacon
      const coreGeo = new THREE.SphereGeometry(0.025, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.copy(pos);

      hotspotsGroup.add(ring);
      hotspotsGroup.add(core);

      hotspotMeshes.push({ mesh: core, data: spot });
    });

    // ─── 8. 3D Raycasting, Mouse Drag & Interactive Zoom ────────
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocityX = 0;
    let dragVelocityY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!allowDirectInteraction) return;
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition = { x: clientX, y: clientY };
      dragVelocityX = 0;
      dragVelocityY = 0;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      targetMouseX = (clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (clientY / window.innerHeight - 0.5) * 2;

      if (isDragging && earthMeshRef.current) {
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;

        dragVelocityX = deltaX * 0.003;
        dragVelocityY = deltaY * 0.003;

        earthMeshRef.current.rotation.y += dragVelocityX;
        earthMeshRef.current.rotation.x += dragVelocityY;

        // Clamp vertical tilt to prevent gimbal disorientation
        earthMeshRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, earthMeshRef.current.rotation.x));

        previousMousePosition = { x: clientX, y: clientY };
      }

      // Check Hotspot Raycasting on Desktop
      if (!('touches' in e)) {
        mouseVector.x = (clientX / window.innerWidth) * 2 - 1;
        mouseVector.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouseVector, camera);

        const intersects = raycaster.intersectObjects(hotspotMeshes.map(h => h.mesh));
        if (intersects.length > 0) {
          const matched = hotspotMeshes.find(h => h.mesh === intersects[0].object);
          if (matched) {
            setHoveredHotspot(matched.data);
            container.style.cursor = 'pointer';
          }
        } else {
          setHoveredHotspot(null);
          container.style.cursor = isDragging ? 'grabbing' : 'default';
        }
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handlePointerClick = (e: MouseEvent) => {
      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects(hotspotMeshes.map(h => h.mesh));
      if (intersects.length > 0) {
        const matched = hotspotMeshes.find(h => h.mesh === intersects[0].object);
        if (matched) {
          handleSelectSpot(matched.data);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!allowDirectInteraction) return;
      const zoomDelta = e.deltaY * 0.0015;
      const newPos = Math.max(3.8, Math.min(7.5, camera.position.z + zoomDelta));
      camera.position.z = newPos;
      setCurrentZoom(newPos);
    };

    const zoomStep = (delta: number) => {
      const newPos = Math.max(3.8, Math.min(7.5, camera.position.z + delta));
      camera.position.z = newPos;
      setCurrentZoom(newPos);
    };
    zoomFnRef.current = zoomStep;

    const resetOrientation = () => {
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.set(0, 0, 0);
      }
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 5.2);
        setCurrentZoom(5.2);
      }
      setSelectedHotspot(null);
    };
    resetOrientationRef.current = resetOrientation;

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('click', handlePointerClick);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('resize', handleResize);

    // ─── 9. Render Animation Loop ───────────────────────────────
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth mouse parallax
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      camera.position.x = mouseX * 0.22;
      camera.position.y = 0.0 + mouseY * 0.14;
      camera.lookAt(0, -0.2, 0);

      // Autonomous rotation when not actively dragging
      if (!isDragging && earthMeshRef.current) {
        // Apply inertia decay
        if (Math.abs(dragVelocityX) > 0.0001) {
          earthMeshRef.current.rotation.y += dragVelocityX;
          dragVelocityX *= 0.94;
        } else if (isPlaying) {
          earthMeshRef.current.rotation.y += 0.0007 * speedFactor;
        }

        if (Math.abs(dragVelocityY) > 0.0001) {
          earthMeshRef.current.rotation.x += dragVelocityY;
          dragVelocityY *= 0.94;
          earthMeshRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, earthMeshRef.current.rotation.x));
        }
      }

      // Orbiting satellites
      satellites.forEach((sat) => {
        sat.root.rotation.y += sat.speed * speedFactor * (isPlaying ? 1.0 : 0.2);
      });

      // Pulse hotspot beacons
      const time = performance.now() * 0.003;
      hotspotsGroup.children.forEach((child, idx) => {
        if (idx % 2 === 0) { // Rings
          const scale = 1.0 + Math.sin(time + idx) * 0.25;
          child.scale.set(scale, scale, 1);
        }
      });

      starField.rotation.y += 0.00004;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('click', handlePointerClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [speedFactor, allowDirectInteraction, handleSelectSpot]);

  return (
    <div className="fixed inset-0 w-screen h-screen z-0 overflow-hidden bg-black select-none pointer-events-auto">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Interactive Orbital HUD Control Dock */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Floating Telemetry Hotspot Info Card */}
        {(selectedHotspot || hoveredHotspot) && (
          <div className="w-80 bg-dark-900/90 border border-primary/40 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_35px_rgba(0,163,255,0.3)] text-white animate-fade-in transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary-300">
                  Global Earth Observation Zone
                </span>
              </div>
              {selectedHotspot && (
                <button 
                  onClick={() => handleSelectSpot(null)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <h4 className="text-base font-bold text-white leading-tight">
              {(selectedHotspot || hoveredHotspot)?.name}
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              {(selectedHotspot || hoveredHotspot)?.country}
            </p>

            <div className="grid grid-cols-2 gap-2 bg-dark-950/60 rounded-xl p-2.5 border border-white/10 text-xs mb-3">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Crop Canopy</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {(selectedHotspot || hoveredHotspot)?.crop}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">NDVI Vegetation</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(selectedHotspot || hoveredHotspot)?.ndvi.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Soil Moisture</span>
                <span className="font-semibold text-slate-200">
                  {(selectedHotspot || hoveredHotspot)?.soilMoisture}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Risk Status</span>
                <span className={`font-semibold ${
                  (selectedHotspot || hoveredHotspot)?.healthStatus === 'Optimum' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {(selectedHotspot || hoveredHotspot)?.healthStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-white/10">
              <span className="flex items-center gap-1.5 text-primary-300">
                <Radio className="w-3 h-3 animate-spin" />
                {(selectedHotspot || hoveredHotspot)?.satPass}
              </span>
              <span>
                {(selectedHotspot || hoveredHotspot)?.lat.toFixed(2)}°, {(selectedHotspot || hoveredHotspot)?.lon.toFixed(2)}°
              </span>
            </div>
          </div>
        )}

        {/* Multi-Spectral Layer Selector & Control Bar */}
        <div className="flex items-center gap-2 bg-black/70 border border-white/15 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-2xl">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-dark-800/80 rounded-xl p-1 border border-white/10 text-xs">
            <button
              onClick={() => setActiveMode('natural')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeMode === 'natural' ? 'bg-primary-500 text-dark-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'
              }`}
              title="Natural Color (True Color RGB Composite)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>True Color</span>
            </button>
            <button
              onClick={() => setActiveMode('ndvi')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeMode === 'ndvi' ? 'bg-emerald-500 text-dark-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'
              }`}
              title="NDVI Normalized Difference Vegetation Index"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>NDVI Heatmap</span>
            </button>
            <button
              onClick={() => setActiveMode('night')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeMode === 'night' ? 'bg-amber-500 text-dark-950 font-bold shadow-md' : 'text-slate-300 hover:text-white'
              }`}
              title="City Night Lights (Earth at Night)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Night Lights</span>
            </button>
          </div>

          <div className="h-5 w-px bg-white/20" />

          {/* Satellite Orbit Toggle */}
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            className={`p-2 rounded-xl border transition-all ${
              showOrbits 
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-300' 
                : 'bg-dark-800/80 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Orbiting Satellites & Lasers"
          >
            <SatelliteIcon className="w-4 h-4" />
          </button>

          {/* Play/Pause Rotation */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-dark-800/80 hover:bg-dark-700 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title={isPlaying ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Reset Orientation */}
          <button
            onClick={() => resetOrientationRef.current()}
            className="p-2 bg-dark-800/80 hover:bg-dark-700 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Reset Earth Alignment"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zoom Buttons */}
          <button
            onClick={() => zoomFnRef.current(-0.6)}
            className="p-2 bg-dark-800/80 hover:bg-dark-700 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomFnRef.current(0.6)}
            className="p-2 bg-dark-800/80 hover:bg-dark-700 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Instructions Hint */}
      <div className="fixed top-20 right-6 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[11px] text-slate-400 font-mono">
        <Compass className="w-3.5 h-3.5 text-primary-400" />
        <span>Drag to rotate 3D Earth • Scroll to zoom • Click beacons for telemetry</span>
      </div>
    </div>
  );
}
