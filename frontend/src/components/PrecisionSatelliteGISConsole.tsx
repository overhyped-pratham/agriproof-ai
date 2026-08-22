import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Calendar,
  Sliders,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Sprout,
  Compass,
  SplitSquareVertical,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { soundFx } from '../lib/soundFx';

export type SpectralBandType =
  | 'NDVI'
  | 'NDMI'
  | 'NDRE'
  | 'MSAVI'
  | 'RECI'
  | 'FALSE_COLOR'
  | 'SURFACE_MOISTURE'
  | 'ROOT_ZONE_MOISTURE';

export interface SatellitePass {
  id: string;
  date: string;
  displayDate: string;
  cloudCoverPct: number;
  satellite: 'Sentinel-2A' | 'Sentinel-2B' | 'Landsat 8';
  ndvi: number;
  ndmi: number;
  ndre: number;
  rainfallMm: number;
  rootMoisturePct: number;
  surfaceMoisturePct: number;
  growthStage: string;
  hasLossAnomaly: boolean;
}

interface PrecisionSatelliteGISConsoleProps {
  farmId?: string;
  farmName?: string;
  cropType?: string;
  areaHa?: number;
  centerLat?: number;
  centerLon?: number;
  currentNdvi?: number;
  baselineNdvi?: number;
  stressLevel?: string;
  isProcessing?: boolean;
  activeProcessingStageTitle?: string;
  activeProcessingProgress?: number;
}

export const PrecisionSatelliteGISConsole: React.FC<PrecisionSatelliteGISConsoleProps> = ({
  farmName = 'Field 171 (Kazatinskiy Parcel)',
  cropType = 'Winter Rapeseed',
  areaHa = 9.6,
  centerLat = 49.888,
  centerLon = 28.8644,
  currentNdvi: _currentNdvi = 0.41,
  baselineNdvi: _baselineNdvi = 0.68,
  stressLevel: _stressLevel = 'MODERATE',
  isProcessing = false,
  activeProcessingStageTitle = 'Computing Multi-Spectral Indices',
  activeProcessingProgress = 65,
}) => {
  // Active states
  const [selectedBand, setSelectedBand] = useState<SpectralBandType>('NDVI');
  const [secondaryBand] = useState<SpectralBandType>('NDMI');
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [selectedPassIndex, setSelectedPassIndex] = useState<number>(5);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; ndviVal: number; ndmiVal: number } | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<'Sentinel-2' | 'Landsat 8' | 'DEM' | 'MODIS'>('Sentinel-2');
  const [opacity, setOpacity] = useState<number>(0.85);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sentinel-2 Bi-Weekly Orbital Passes (Current 2026 Season)
  const passes: SatellitePass[] = useMemo(() => [
    {
      id: 'p1',
      date: '2026-05-10',
      displayDate: '10 May',
      cloudCoverPct: 0,
      satellite: 'Sentinel-2A',
      ndvi: 0.69,
      ndmi: 0.44,
      ndre: 0.58,
      rainfallMm: 22,
      rootMoisturePct: 58.4,
      surfaceMoisturePct: 62.1,
      growthStage: 'Early Stem Elongation',
      hasLossAnomaly: false,
    },
    {
      id: 'p2',
      date: '2026-05-25',
      displayDate: '25 May',
      cloudCoverPct: 5,
      satellite: 'Sentinel-2B',
      ndvi: 0.74,
      ndmi: 0.48,
      ndre: 0.65,
      rainfallMm: 34,
      rootMoisturePct: 64.2,
      surfaceMoisturePct: 68.5,
      growthStage: 'Canopy Development',
      hasLossAnomaly: false,
    },
    {
      id: 'p3',
      date: '2026-06-11',
      displayDate: '11 Jun',
      cloudCoverPct: 10,
      satellite: 'Sentinel-2A',
      ndvi: 0.78,
      ndmi: 0.51,
      ndre: 0.69,
      rainfallMm: 18,
      rootMoisturePct: 55.0,
      surfaceMoisturePct: 59.2,
      growthStage: 'Peak Heading & Flowering',
      hasLossAnomaly: false,
    },
    {
      id: 'p4',
      date: '2026-07-02',
      displayDate: '02 Jul',
      cloudCoverPct: 0,
      satellite: 'Sentinel-2B',
      ndvi: 0.62,
      ndmi: 0.35,
      ndre: 0.52,
      rainfallMm: 4,
      rootMoisturePct: 44.1,
      surfaceMoisturePct: 41.3,
      growthStage: 'Grain Development',
      hasLossAnomaly: false,
    },
    {
      id: 'p5',
      date: '2026-07-22',
      displayDate: '22 Jul',
      cloudCoverPct: 0,
      satellite: 'Sentinel-2A',
      ndvi: 0.49,
      ndmi: 0.22,
      ndre: 0.41,
      rainfallMm: 1,
      rootMoisturePct: 36.2,
      surfaceMoisturePct: 32.5,
      growthStage: 'Drought Stress Onset',
      hasLossAnomaly: true,
    },
    {
      id: 'p6',
      date: '2026-08-06',
      displayDate: '06 Aug',
      cloudCoverPct: 0,
      satellite: 'Sentinel-2B',
      ndvi: 0.41,
      ndmi: 0.12,
      ndre: 0.33,
      rainfallMm: 0,
      rootMoisturePct: 28.5,
      surfaceMoisturePct: 24.1,
      growthStage: 'Severe Desiccation Anomaly',
      hasLossAnomaly: true,
    },
    {
      id: 'p7',
      date: '2026-08-19',
      displayDate: '19 Aug',
      cloudCoverPct: 0,
      satellite: 'Sentinel-2A',
      ndvi: 0.34,
      ndmi: 0.05,
      ndre: 0.26,
      rainfallMm: 0,
      rootMoisturePct: 21.3,
      surfaceMoisturePct: 18.0,
      growthStage: 'Critical Vegetation Loss',
      hasLossAnomaly: true,
    },
    {
      id: 'p8',
      date: '2026-08-22',
      displayDate: '22 Aug',
      cloudCoverPct: 0,
      satellite: 'Sentinel-2B',
      ndvi: 0.31,
      ndmi: 0.02,
      ndre: 0.23,
      rainfallMm: 0,
      rootMoisturePct: 19.1,
      surfaceMoisturePct: 15.4,
      growthStage: 'Terminal Loss / Payout Trigger',
      hasLossAnomaly: true,
    },
  ], []);

  const activePass = passes[selectedPassIndex] || passes[passes.length - 1];

  // Draw procedural high-fidelity multi-spectral field heatmap
  const renderFieldRaster = (
    canvas: HTMLCanvasElement | null,
    band: SpectralBandType,
    healthFactor: number,
    seed: number
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Realistic multi-spectral field canvas simulation
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const noise = (x: number, y: number, s: number) => {
      const nx = x * 0.022 + s * 1.3;
      const ny = y * 0.022 + s * 0.8;
      return (
        0.5 +
        0.28 * Math.sin(nx * 1.8 + Math.cos(ny * 2.2)) +
        0.18 * Math.sin(nx * 3.4 - ny * 3.1) +
        0.12 * Math.cos(nx * 0.9 + ny * 1.4)
      );
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Polygon boundary mask (tilted parcel shape matching screenshots)
        // Triangle/Trapezoid polygon boundaries
        const normalizedX = x / width;
        const normalizedY = y / height;
        const inPolygon =
          normalizedX > 0.08 &&
          normalizedX < 0.92 &&
          normalizedY > 0.12 &&
          normalizedY < 0.88;

        if (!inPolygon) {
          // Transparent outside field boundary
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
          continue;
        }

        const n = noise(x, y, seed);
        // Gradient across parcel (severe drought zone in the middle/left as in screenshot)
        const spatialStress = 0.5 + 0.5 * Math.sin((normalizedX - 0.45) * Math.PI * 2);
        const val = Math.max(
          0,
          Math.min(1, (n * 0.55 + spatialStress * 0.45) * (healthFactor / 0.55))
        );

        let r = 0, g = 0, b = 0, a = Math.floor(opacity * 255);

        if (band === 'NDVI') {
          // High-contrast NDVI palette: Red -> Orange -> Yellow -> Spring Green -> Deep Emerald
          if (val < 0.28) {
            r = 239; g = 68; b = 68; // Critical Red
          } else if (val < 0.42) {
            r = 249; g = 115; b = 22; // Orange drought stress
          } else if (val < 0.58) {
            r = 234; g = 179; b = 8; // Yellow moderate
          } else if (val < 0.72) {
            r = 132; g = 204; b = 22; // Light green
          } else {
            r = 16; g = 185; b = 129; // Deep healthy green
          }
        } else if (band === 'NDMI' || band === 'SURFACE_MOISTURE' || band === 'ROOT_ZONE_MOISTURE') {
          // NDMI Canopy Moisture: Distinct purple/lilac/indigo palette as in user screenshot
          const moistureIntensity = Math.min(1, val * 1.25);
          r = Math.floor(190 - moistureIntensity * 70);
          g = Math.floor(195 - moistureIntensity * 50);
          b = 245;
          a = Math.floor(opacity * 240);
        } else if (band === 'NDRE' || band === 'MSAVI' || band === 'RECI') {
          // Red-Edge Chlorophyll
          if (val < 0.35) {
            r = 225; g = 29; b = 72;
          } else if (val < 0.52) {
            r = 245; g = 158; b = 11;
          } else {
            r = 34; g = 197; b = 94;
          }
        } else if (band === 'FALSE_COLOR') {
          // False-color infrared B8/B4/B3
          r = Math.floor(val * 235 + 20);
          g = Math.floor((1 - val) * 60 + 20);
          b = Math.floor((1 - val) * 90 + 30);
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw sharp white high-contrast vector field boundary with glow
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 163, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.strokeRect(width * 0.08, height * 0.12, width * 0.84, height * 0.76);
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    renderFieldRaster(canvasRef.current, selectedBand, activePass.ndvi, 101 + selectedPassIndex);
    if (isSplitMode) {
      renderFieldRaster(secondaryCanvasRef.current, secondaryBand, activePass.ndmi, 202 + selectedPassIndex);
    }
  }, [selectedBand, secondaryBand, isSplitMode, selectedPassIndex, opacity, activePass]);

  // Handle Canvas Cursor Probe
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = x / rect.width;
    const relY = y / rect.height;

    // Check if inside field parcel
    if (relX >= 0.08 && relX <= 0.92 && relY >= 0.12 && relY <= 0.88) {
      // Localized variation based on pass
      const localNdvi = Math.max(0.18, Math.min(0.85, activePass.ndvi + (relX - 0.5) * 0.22));
      const localNdmi = Math.max(0, Math.min(0.6, activePass.ndmi + (relX - 0.5) * 0.15));
      setHoverCoord({
        x,
        y,
        ndviVal: Math.round(localNdvi * 100) / 100,
        ndmiVal: Math.round(localNdmi * 100) / 100,
      });
    } else {
      setHoverCoord(null);
    }
  };

  return (
    <div
      className={`w-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 flex flex-col font-sans transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'relative min-h-[640px]'
      }`}
    >
      {/* Top Bar: Field Identity, Dataset Selector & Top Action Controls */}
      <div className="bg-slate-900/95 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur z-20">
        {/* Field Identity Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">{farmName}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                {areaHa.toFixed(1)} ha ({Math.round(areaHa * 2.471)} ac)
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                {cropType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
              <span>{centerLat.toFixed(4)}° N, {centerLon.toFixed(4)}° E</span>
              <span>•</span>
              <span className="text-primary-400 font-semibold">{selectedDataset} Surface Reflectance (L2A)</span>
            </div>
          </div>
        </div>

        {/* Center/Right Controls: Dataset Selector, Split Mode, Opacity & Fullscreen */}
        <div className="flex items-center gap-2.5">
          {/* Processing Status Banner if active */}
          {isProcessing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-950/80 border border-primary-500/40 text-xs font-mono text-primary-300 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-400" />
              <span>{activeProcessingStageTitle} ({activeProcessingProgress}%)</span>
            </div>
          )}

          {/* Dataset Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['Sentinel-2', 'Landsat 8', 'DEM', 'MODIS'] as const).map((ds) => (
              <button
                key={ds}
                onClick={() => {
                  setSelectedDataset(ds);
                  soundFx.playSpectralSelect();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedDataset === ds
                    ? 'bg-primary-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ds}
              </button>
            ))}
          </div>

          {/* Split Mode (Side-by-Side Dual Analysis) */}
          <button
            onClick={() => {
              setIsSplitMode(!isSplitMode);
              soundFx.playPassTransition();
            }}
            title="Toggle Split-Screen Comparison (NDVI vs NDMI)"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all ${
              isSplitMode
                ? 'bg-primary-500/20 border-primary-500 text-primary-300 shadow-[0_0_12px_rgba(0,163,255,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-primary-400" />
            <span>Split Screen</span>
          </button>

          {/* Opacity Slider */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            <Sliders className="w-3.5 h-3.5" />
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 accent-primary-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="w-7 text-right">{Math.round(opacity * 100)}%</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Body: Left Indices Drawer, Center Satellite Canvas Viewport, Right Field Telemetry */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative overflow-hidden">
        {/* Left Floating Indices Menu (EOS / Sentinel Hub style) */}
        <div className="lg:col-span-2 bg-slate-900/90 border-r border-slate-800/90 p-3.5 flex flex-col justify-between space-y-4 z-10 backdrop-blur">
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Layers className="w-3.5 h-3.5 text-primary-400" /> Vegetation Indices
            </div>

            <div className="space-y-1">
              {[
                { id: 'NDVI', label: 'NDVI', desc: 'Chlorophyll Vigor (B8-B4)/(B8+B4)' },
                { id: 'NDRE', label: 'NDRE', desc: 'Red-Edge Chlorophyll (B8-B5)' },
                { id: 'MSAVI', label: 'MSAVI', desc: 'Soil-Adjusted Veg Index' },
                { id: 'RECI', label: 'RECI', desc: 'Red-Edge Chlorophyll Index' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedBand(item.id as SpectralBandType);
                    soundFx.playSpectralSelect();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between border ${
                    selectedBand === item.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md font-bold'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800/60 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-100">{item.label}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[130px]">{item.desc}</div>
                  </div>
                  {selectedBand === item.id && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  )}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold pt-2 border-t border-slate-800">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Moisture & Soil
            </div>

            <div className="space-y-1">
              {[
                { id: 'NDMI', label: 'NDMI', desc: 'Canopy Water Deficit (B8-B11)' },
                { id: 'SURFACE_MOISTURE', label: 'Surface Moisture %', desc: 'Top 5cm Soil Moisture' },
                { id: 'ROOT_ZONE_MOISTURE', label: 'Root Zone Moisture %', desc: 'Deep Root Available Water' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedBand(item.id as SpectralBandType);
                    soundFx.playSpectralSelect();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between border ${
                    selectedBand === item.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md font-bold'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800/60 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-100">{item.label}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[130px]">{item.desc}</div>
                  </div>
                  {selectedBand === item.id && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Color Scale Legend */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{selectedBand} Legend</span>
              <span className="font-bold text-slate-200">
                {selectedBand === 'NDMI' ? '-0.2 to +0.8' : '0.0 to 1.0'}
              </span>
            </div>
            {selectedBand === 'NDMI' || selectedBand.includes('MOISTURE') ? (
              <div className="h-3 w-full rounded-md bg-gradient-to-r from-slate-200 via-purple-300 to-indigo-600 shadow" />
            ) : (
              <div className="h-3 w-full rounded-md bg-gradient-to-r from-red-500 via-amber-400 via-lime-400 to-emerald-600 shadow" />
            )}
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Severe Stress</span>
              <span>Moderate</span>
              <span>Dense Lush</span>
            </div>
          </div>
        </div>

        {/* Center Satellite Map Viewport with High-Res Satellite Background and Multi-Spectral Field Canvas */}
        <div className={`relative ${isSplitMode ? 'lg:col-span-7' : 'lg:col-span-7'} bg-[#0a1118] flex flex-col justify-between overflow-hidden group`}>
          {/* Simulated High-Res Satellite Imagery Background (Farmland satellite tile) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#07131e] to-[#03080e] overflow-hidden">
            {/* Synthetic Earth Farmland Grid Texture */}
            <div
              className="absolute inset-0 opacity-40 mix-blend-luminosity"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231e293b' fill-opacity='0.4'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px',
              }}
            />
            {/* Natural Field Crop Satellite Base Texture */}
            <div className="absolute inset-0 bg-[#0f241a]/60" />
          </div>

          {/* Center Map Viewport Top Overlay: Satellite Pass Date Badge & Resolution */}
          <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto bg-slate-950/85 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-primary-400" />
              <span className="font-bold text-white">{activePass.displayDate} 2026</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-400">{activePass.satellite}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400">Clouds: {activePass.cloudCoverPct}%</span>
            </div>

            <div className="pointer-events-auto bg-slate-950/85 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ground Resolution: 10m / Pixel</span>
            </div>
          </div>

          {/* Central Interactive Satellite Canvas Area */}
          <div
            className="relative z-10 flex-1 flex items-center justify-center p-6 cursor-crosshair select-none"
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoverCoord(null)}
          >
            {isSplitMode ? (
              /* Side-by-Side Dual Spectral View (Screenshot 2 style) */
              <div className="grid grid-cols-2 gap-4 w-full h-full max-h-[380px]">
                {/* Left Field: Primary Band (e.g. NDVI) */}
                <div className="relative flex flex-col items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800/80 p-2 overflow-hidden shadow-inner">
                  <div className="absolute top-2 left-2 z-20 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400 font-bold">
                    {selectedBand}: {activePass.ndvi.toFixed(2)}
                  </div>
                  <canvas ref={canvasRef} width={340} height={230} className="w-full h-full object-contain rounded-lg shadow-xl" />
                </div>

                {/* Right Field: Secondary Band (e.g. NDMI Purple Moisture) */}
                <div className="relative flex flex-col items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800/80 p-2 overflow-hidden shadow-inner">
                  <div className="absolute top-2 left-2 z-20 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-400 font-bold">
                    {secondaryBand}: {activePass.ndmi.toFixed(2)}
                  </div>
                  <canvas ref={secondaryCanvasRef} width={340} height={230} className="w-full h-full object-contain rounded-lg shadow-xl" />
                </div>
              </div>
            ) : (
              /* Single Large Canvas Mode with Polygon & Hover Probe */
              <div className="relative w-full h-full max-w-[540px] max-h-[360px] flex items-center justify-center">
                <img
                  src="/assets/snapshots/captured_ndmi_falsecolor.png"
                  alt="Sentinel-2 Surface Reflectance (L2A)"
                  className="w-full h-full object-contain rounded-xl shadow-2xl"
                />

                {/* Hover Probe Tooltip Box (Screenshot 2 Pin: NDVI: 0.45 Moderate vegetation) */}
                {hoverCoord && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ left: hoverCoord.x, top: hoverCoord.y - 65 }}
                    className="absolute pointer-events-none z-30 transform -translate-x-1/2 bg-slate-950/95 border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{selectedBand}: {hoverCoord.ndviVal.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {hoverCoord.ndviVal < 0.3
                        ? 'Severe Drought Anomaly'
                        : hoverCoord.ndviVal < 0.5
                        ? 'Moderate vegetation'
                        : 'Dense active canopy'}
                    </div>
                    {/* Small pin pointer triangle */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-950" />
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Satellite Orbital Passes Slider Strip (Screenshot 1 & 3 style) */}
          <div className="relative z-10 bg-slate-950/95 border-t border-slate-800 p-2.5 backdrop-blur">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono text-slate-400 pr-2 border-r border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-primary-400" /> Passes:
              </div>

              {passes.map((pass, idx) => {
                const isSelected = selectedPassIndex === idx;
                return (
                  <button
                    key={pass.id}
                    onClick={() => {
                      setSelectedPassIndex(idx);
                      soundFx.playPassTransition();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex flex-col items-center shrink-0 border ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-400 shadow-[0_0_12px_rgba(0,163,255,0.4)] font-bold'
                        : pass.hasLossAnomaly
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{pass.displayDate}</span>
                    <span className="text-[9px] opacity-80">{selectedBand}: {pass.ndvi.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Field Intelligence, Agronomic Rotation, Weather Today & Scouting Tasks (Screenshot 1 & 3) */}
        <div className="lg:col-span-3 bg-slate-900/90 border-l border-slate-800 p-4 space-y-4 overflow-y-auto backdrop-blur">
          {/* Weather Today (Screenshot 1/3: 20°C, Wind 4m/s, Humidity 67.9%, Clouds 60.8%) */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold text-slate-300">Weather Today</span>
              <span className="text-[11px] text-primary-400">Live Telemetry</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white font-mono flex items-center gap-1.5">
                  <Sun className="w-5 h-5 text-amber-400" /> 20°C
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Partly Sunny / Trace Rain</div>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                <div>Precipitation: <strong className="text-white">0.2 mm</strong></div>
                <div className="text-[10px] text-slate-500">14-Day Dry Trend</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono text-[11px]">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] flex items-center justify-center gap-1">
                  <Wind className="w-3 h-3 text-sky-400" /> Wind
                </div>
                <div className="font-bold text-white mt-0.5">4 m/s</div>
              </div>

              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" /> Humidity
                </div>
                <div className="font-bold text-white mt-0.5">67.9%</div>
              </div>

              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] flex items-center justify-center gap-1">
                  <CloudRain className="w-3 h-3 text-indigo-400" /> Clouds
                </div>
                <div className="font-bold text-white mt-0.5">60.8%</div>
              </div>
            </div>
          </div>

          {/* Crop Rotation & Sowing Telemetry */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" /> Crop Rotation
              </span>
              <span className="text-emerald-400 font-semibold text-[11px]">Season 2025-2026</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-slate-400">Crop:</span>
              <span className="font-bold text-white">{cropType}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Sowing Date:</span>
              <span className="font-bold text-slate-200">15.11.2025</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Phenological Stage:</span>
              <span className="font-bold text-amber-400">{activePass.growthStage}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Surface Moisture:</span>
              <span className="font-bold text-cyan-300">{activePass.surfaceMoisturePct}%</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Root Zone Moisture:</span>
              <span className="font-bold text-indigo-300">{activePass.rootMoisturePct}%</span>
            </div>
          </div>

          {/* Scouting & Parametric Verification Trigger Task (Screenshot 1 & 3) */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-400" /> Scouting & Insurance Task
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                Trigger Ready
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Automated Sentinel-2 L2A telemetry confirmed a <strong>39% vegetation index drop</strong> exceeding the 30% parametric threshold.
            </p>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span>ZK Groth16 Proof:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Recharts Multi-Year & Moisture Curve (Screenshot 1, 3, 5 style) */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-primary-400" /> Multi-Year Historical Vegetation & Moisture Curve
            </span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> 2026 Current
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> 5-Yr Baseline
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Root Zone Moisture %
              </span>
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-400" /> Precip (mm)
              </span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Current Pass: <strong className="text-white">{activePass.displayDate}</strong> (NDVI: {activePass.ndvi.toFixed(2)})
          </div>
        </div>

        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={passes} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <XAxis dataKey="displayDate" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="left" domain={[0, 1.0]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 50]} stroke="#818cf8" tick={{ fill: '#818cf8', fontSize: 9 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <ReferenceLine yAxisId="left" y={0.30} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '30% Claim Trigger', fill: '#ef4444', fontSize: 9, position: 'insideTopLeft' }} />
              <Bar yAxisId="right" dataKey="rainfallMm" fill="#6366f1" opacity={0.6} barSize={10} name="Precip (mm)" />
              <Line yAxisId="left" type="monotone" dataKey="rootMoisturePct" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="Root Moisture %" />
              <Area yAxisId="left" type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={2.5} fill="#10b981" fillOpacity={0.15} name="NDVI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PrecisionSatelliteGISConsole;
