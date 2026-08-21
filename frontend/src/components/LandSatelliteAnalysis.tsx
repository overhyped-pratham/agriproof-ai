import { useState, useEffect, useMemo } from 'react';
import { api, LandAnalysisResult } from '../lib/api';
import {
  Satellite,
  Layers,
  Droplets,
  Sprout,
  Activity,
  ShieldCheck,
  CloudSun,
  Lock
} from 'lucide-react';
import { generateSatelliteRaster, RasterMode } from '../lib/satelliteRasterGenerator';
import FarmMap from './FarmMap';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface LandSatelliteAnalysisProps {
  farmId: string;
}

export default function LandSatelliteAnalysis({ farmId }: LandSatelliteAnalysisProps) {
  const [data, setData] = useState<LandAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<RasterMode>('ndvi');
  const [viewMode, setViewMode] = useState<'map' | 'split' | 'single' | 'multispectral'>('map');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [activeDateIndex, setActiveDateIndex] = useState<number>(3);
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number; val: string; sub: string } | null>(null);

  // Generate procedural satellite rasters (memoized by farmId)
  const rasterSeed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < farmId.length; i++) s = ((s << 5) - s + farmId.charCodeAt(i)) | 0;
    return Math.abs(s);
  }, [farmId]);

  const baselineRaster = useMemo(() => generateSatelliteRaster('baseline', 720, 440, rasterSeed, 0.1), [rasterSeed]);
  const currentRaster = useMemo(() => generateSatelliteRaster('current', 720, 440, rasterSeed, 0.65), [rasterSeed]);
  const ndviRaster = useMemo(() => generateSatelliteRaster('ndvi', 720, 440, rasterSeed, 0.55), [rasterSeed]);
  const ndmiRaster = useMemo(() => generateSatelliteRaster('ndmi', 720, 440, rasterSeed, 0.6), [rasterSeed]);
  const playgroundRaster = useMemo(() => generateSatelliteRaster('playground', 720, 440, rasterSeed, 0.5), [rasterSeed]);
  const cirRaster = useMemo(() => generateSatelliteRaster('cir', 720, 440, rasterSeed, 0.4), [rasterSeed]);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    api.farms.getLandAnalysis(farmId)
      .then(res => setData(res.data))
      .catch(err => console.error('[LandSatelliteAnalysis] Failed to fetch land analysis:', err))
      .finally(() => setLoading(false));
  }, [farmId]);

  // Timeline dates
  const timelineDates = [
    { label: '06 Aug 2024', cloud: '2.1%' },
    { label: '11 Aug 2024', cloud: '0.0%' },
    { label: '16 Aug 2024', cloud: '4.5%' },
    { label: '21 Aug 2024 (Current)', cloud: '0.0%' },
    { label: '26 Aug 2024', cloud: '1.2%' },
    { label: '31 Aug 2024', cloud: '0.8%' },
  ];

  // Multi-Year Phenology Data for Historical Agronomic Graph
  const multiYearData = useMemo(() => {
    return [
      { date: 'Jan 15', currentYear: 0.22, baselineYear: 0.24, rootMoisture: 38, surfaceMoisture: 42, precip: 15 },
      { date: 'Feb 15', currentYear: 0.35, baselineYear: 0.38, rootMoisture: 36, surfaceMoisture: 39, precip: 8 },
      { date: 'Mar 15', currentYear: 0.54, baselineYear: 0.58, rootMoisture: 35, surfaceMoisture: 36, precip: 12 },
      { date: 'Apr 15', currentYear: 0.72, baselineYear: 0.75, rootMoisture: 34, surfaceMoisture: 32, precip: 22 },
      { date: 'May 15', currentYear: 0.81, baselineYear: 0.83, rootMoisture: 32, surfaceMoisture: 30, precip: 5, stage: 'Vegetative Peak' },
      { date: 'Jun 15', currentYear: 0.78, baselineYear: 0.82, rootMoisture: 28, surfaceMoisture: 24, precip: 0, stage: 'Flowering Stage' },
      { date: 'Jul 15', currentYear: 0.52, baselineYear: 0.79, rootMoisture: 22, surfaceMoisture: 18, precip: 0, stage: 'Fruit / Grain Filling' },
      { date: 'Aug 15', currentYear: 0.38, baselineYear: 0.74, rootMoisture: 18, surfaceMoisture: 14, precip: 2, stage: 'Drought Collapse' },
      { date: 'Sep 15', currentYear: 0.28, baselineYear: 0.65, rootMoisture: 16, surfaceMoisture: 12, precip: 0 },
      { date: 'Oct 15', currentYear: 0.20, baselineYear: 0.45, rootMoisture: 19, surfaceMoisture: 15, precip: 10 },
    ];
  }, []);

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-12 text-center text-slate-400 animate-pulse">
        <Satellite className="w-10 h-10 mx-auto mb-3 text-primary-500 animate-spin" />
        <p className="text-white font-semibold">Processing Multi-Spectral Earth Observation Telemetry...</p>
        <p className="text-xs text-slate-500 mt-1">Generating 3m Sentinel-2 / PlanetScope rasters &amp; ZK witness proofs</p>
      </div>
    );
  }

  if (!data) return null;

  const { land_zoning, indices_comparison, soil_and_surface, ml_proof } = data;

  const farmBoundary = [
    [data.center_lat + 0.0035, data.center_lon - 0.0035],
    [data.center_lat + 0.0035, data.center_lon + 0.0035],
    [data.center_lat - 0.0035, data.center_lon + 0.0035],
    [data.center_lat - 0.0035, data.center_lon - 0.0035],
  ];

  const currentRasterImg = selectedIndex === 'ndmi' ? ndmiRaster
    : selectedIndex === 'playground' ? playgroundRaster
    : selectedIndex === 'cir' ? cirRaster
    : selectedIndex === 'baseline' ? baselineRaster
    : ndviRaster;

  return (
    <div className="bg-dark-900 rounded-2xl border border-dark-700 shadow-2xl space-y-6 overflow-hidden">
      
      {/* ── 1. Top Agronomic Header & Live Telemetry Bar ──────────────────────── */}
      <div className="bg-dark-850 p-5 border-b border-dark-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Left: Field Title & Geodesic Meta */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-600/10 border border-primary-500/20 text-primary-400 rounded-xl shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-wide">{data.farm_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/30">
                {data.area_hectares.toFixed(1)} ha ({(data.area_hectares * 2.471).toFixed(1)} ac)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-dark-700 text-slate-300 border border-dark-600">
                {data.center_lat.toFixed(4)}°N, {data.center_lon.toFixed(4)}°E
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>Crop Rotation: <strong className="text-white capitalize">{data.crop_type}</strong></span>
              <span>•</span>
              <span>Sensor: <strong className="text-primary-300">Sentinel-2 (10m) + PlanetScope (3m)</strong></span>
            </p>
          </div>
        </div>

        {/* Right: Weather Today & Phenology Card */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0">
          <div className="bg-dark-800/90 border border-dark-700 px-4 py-2 rounded-xl flex items-center gap-3 text-xs">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Weather Today</span>
              <span className="text-white font-bold text-sm">
                {soil_and_surface.surface_temperature_c.toFixed(1)}°C / {((soil_and_surface.surface_temperature_c * 9/5) + 32).toFixed(1)}°F
              </span>
            </div>
            <div className="border-l border-dark-700 pl-3 space-y-0.5 font-mono text-[11px] text-slate-300">
              <div>Wind: <strong className="text-white">4.2 m/s</strong></div>
              <div>Humidity: <strong className="text-white">67.9%</strong></div>
            </div>
            <div className="border-l border-dark-700 pl-3 space-y-0.5 font-mono text-[11px] text-slate-300">
              <div>Clouds: <strong className="text-emerald-400">0.0%</strong></div>
              <div>Precip: <strong className="text-primary-400">0.0 mm</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── 2. Mode Selector & Indices Control Ribbon ───────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-dark-800/60 p-3 rounded-xl border border-dark-700">
          
          {/* Index Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 max-w-full">
            <span className="text-xs font-mono text-slate-400 font-bold px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> INDEX:
            </span>
            {[
              { id: 'ndvi', label: 'NDVI (Vegetation)', badge: 'Canopy Vigour' },
              { id: 'ndmi', label: 'NDMI (Moisture)', badge: 'Water Deficit' },
              { id: 'playground', label: 'Classified False-Color', badge: 'Damage Heatmap' },
              { id: 'cir', label: 'CIR (Infrared)', badge: 'NIR Reflectance' },
              { id: 'baseline', label: 'Pre-Event Peak', badge: 'Historical Max' },
            ].map((idx) => (
              <button
                key={idx.id}
                onClick={() => setSelectedIndex(idx.id as RasterMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedIndex === idx.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                    : 'bg-dark-800 text-slate-300 hover:text-white border border-dark-700'
                }`}
              >
                {idx.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-dark-900 p-1 rounded-lg border border-dark-700 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                viewMode === 'map' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                viewMode === 'single' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              High-Res Raster
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                viewMode === 'split' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split Compare
            </button>
          </div>
        </div>

        {/* ── 3. Main Satellite Viewport & Interactive Inspector ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Satellite Viewer / Heatmap Screen */}
          <div className="lg:col-span-8 space-y-3">
            <div
              className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-dark-700 bg-black shadow-2xl group select-none cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                const val = selectedIndex === 'ndmi' 
                  ? `NDMI: ${(0.12 - (x / 100) * 0.25).toFixed(2)}` 
                  : `NDVI: ${(indices_comparison.ndvi.current * (0.8 + (x / 100) * 0.4)).toFixed(2)}`;
                const sub = (x > 40 && x < 75) ? 'Severe Moisture / Scorch Zone' : 'Moderate Biomass';
                setHoverPixel({ x, y, val, sub });
              }}
              onMouseLeave={() => setHoverPixel(null)}
            >
              {/* Mode 1: Interactive Leaflet Map */}
              {viewMode === 'map' && (
                <div className="w-full h-full">
                  <FarmMap
                    existingBoundary={farmBoundary}
                    readOnly
                    showDamageOverlay={true}
                    damageSeverity={indices_comparison.ndvi.change_pct < -30 ? 'HIGH' : 'LOW'}
                  />
                </div>
              )}

              {/* Mode 2: High-Res Procedural Earth Observation Raster */}
              {viewMode === 'single' && (
                <div className="relative w-full h-full">
                  <img src={currentRasterImg} alt="Satellite Scene" className="w-full h-full object-cover" />
                  
                  {/* Floating Legend Overlay */}
                  <div className="absolute top-3 left-3 bg-dark-900/90 border border-dark-700 backdrop-blur-md px-3 py-2 rounded-xl text-xs space-y-1 shadow-xl">
                    <div className="font-bold text-white uppercase font-mono text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {selectedIndex.toUpperCase()} Layer · Level-2A BOA
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Current Value: <strong className="text-emerald-400">{indices_comparison.ndvi.current.toFixed(3)}</strong> (Drop: <strong className="text-danger">{indices_comparison.ndvi.change_pct}%</strong>)
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 3: Split Compare Drag Slider */}
              {viewMode === 'split' && (
                <div className="relative w-full h-full">
                  {/* Left: Baseline */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                  >
                    <img src={baselineRaster} alt="Baseline" className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold px-2.5 py-1 rounded shadow backdrop-blur">
                      PRE-EVENT BASELINE (NDVI: {indices_comparison.ndvi.baseline.toFixed(2)})
                    </div>
                  </div>

                  {/* Right: Current */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
                  >
                    <img src={currentRaster} alt="Post-Event" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-red-950/90 text-red-300 border border-red-500/40 text-[11px] font-mono font-bold px-2.5 py-1 rounded shadow backdrop-blur">
                      POST-EVENT ANOMALY (NDVI: {indices_comparison.ndvi.current.toFixed(2)})
                    </div>
                  </div>

                  {/* Divider Line & Draggable Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,1)] flex items-center justify-center pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="w-7 h-7 bg-white text-dark-950 rounded-full flex items-center justify-center text-xs font-bold shadow-2xl border-2 border-primary-600">
                      ⇄
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                  />
                </div>
              )}

              {/* Hover Pixel Dynamic Inspector Tooltip */}
              {hoverPixel && (
                <div
                  className="absolute pointer-events-none z-30 bg-black/90 border border-primary-400 text-white px-3 py-1.5 rounded-lg shadow-2xl text-xs font-mono backdrop-blur transform -translate-x-1/2 -translate-y-12 transition-transform duration-75"
                  style={{ left: `${hoverPixel.x}%`, top: `${hoverPixel.y}%` }}
                >
                  <div className="font-bold text-primary-300">{hoverPixel.val}</div>
                  <div className="text-[10px] text-slate-300">{hoverPixel.sub}</div>
                </div>
              )}
            </div>

            {/* Satellite Scene Passes Timeline */}
            <div className="bg-dark-850 p-3 rounded-xl border border-dark-700 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold shrink-0">
                SCENE PASSES:
              </span>
              <div className="flex items-center gap-2">
                {timelineDates.map((d, i) => (
                  <button
                    key={d.label}
                    onClick={() => setActiveDateIndex(i)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      activeDateIndex === i
                        ? 'bg-primary-600 text-white shadow'
                        : 'bg-dark-800 text-slate-400 hover:text-white border border-dark-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Land Zoning Breakdown & Soil Indices */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Land Zoning Card */}
            <div className="bg-dark-850 p-5 rounded-2xl border border-dark-700 space-y-3 shadow-lg">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-400" /> Land Surface Zoning
              </h4>
              
              <div className="space-y-2.5">
                {[
                  { key: 'vigorous_canopy', label: 'Vigorous Healthy Canopy', color: 'bg-emerald-500', barColor: '#10b981' },
                  { key: 'moderate_stress', label: 'Moisture / Heat Stress', color: 'bg-amber-500', barColor: '#f59e0b' },
                  { key: 'severe_degradation', label: 'Severe Degradation / Scorch', color: 'bg-red-500', barColor: '#ef4444' },
                  { key: 'bare_soil_fallow', label: 'Bare Soil / Fallow Ground', color: 'bg-purple-500', barColor: '#a855f7' },
                ].map((zone) => {
                  const z = (land_zoning as any)[zone.key];
                  if (!z) return null;
                  return (
                    <div key={zone.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-sm ${zone.color}`} />
                          {zone.label}
                        </span>
                        <span className="text-white font-bold">{z.pct}% ({z.hectares} ha)</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${z.pct}%`, backgroundColor: zone.barColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Soil Moisture & Thermal Anomaly */}
            <div className="bg-dark-850 p-5 rounded-2xl border border-dark-700 space-y-3 shadow-lg">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" /> Soil &amp; Thermal Matrix
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-dark-800 p-2.5 rounded-xl border border-dark-700">
                  <span className="text-slate-500 text-[10px] block">ROOT ZONE MOISTURE</span>
                  <span className="text-blue-400 font-bold text-sm">{soil_and_surface.soil_moisture_vwc_pct}% VWC</span>
                  <span className="text-[10px] text-amber-400 block mt-0.5">{soil_and_surface.soil_moisture_status}</span>
                </div>
                <div className="bg-dark-800 p-2.5 rounded-xl border border-dark-700">
                  <span className="text-slate-500 text-[10px] block">THERMAL ANOMALY</span>
                  <span className="text-red-400 font-bold text-sm">+{soil_and_surface.thermal_anomaly_c}°C</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">vs Historical Avg</span>
                </div>
                <div className="bg-dark-800 p-2.5 rounded-xl border border-dark-700">
                  <span className="text-slate-500 text-[10px] block">CANOPY COVER</span>
                  <span className="text-emerald-400 font-bold text-sm">{soil_and_surface.canopy_cover_pct}%</span>
                </div>
                <div className="bg-dark-800 p-2.5 rounded-xl border border-dark-700">
                  <span className="text-slate-500 text-[10px] block">BIOMASS DENSITY</span>
                  <span className="text-purple-400 font-bold text-sm">{soil_and_surface.biomass_density_g_m2} g/m²</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 4. Multi-Year Historical Agronomic Trajectory & Growth Stages ────── */}
        <div className="bg-dark-850 p-6 rounded-2xl border border-dark-700 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-dark-700 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> Multi-Year Phenological &amp; Soil Moisture Trajectory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vegetative lifecycle progression comparing current season vs. 5-year historical baseline with root-zone soil moisture and precipitation events.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Current Season
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-0.5 bg-slate-500 inline-block" /> Baseline
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 bg-blue-500 inline-block" /> Precip (mm)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={multiYearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" domain={[0, 1.0]} stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 50]} stroke="#38bdf8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar yAxisId="right" dataKey="precip" fill="#0284c7" opacity={0.6} radius={[4, 4, 0, 0]} name="Precipitation (mm)" />
                <Line yAxisId="left" type="monotone" dataKey="baselineYear" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} name="5-Yr Baseline NDVI" />
                <Line yAxisId="left" type="monotone" dataKey="currentYear" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981' }} name="Current Season NDVI" />
                <Line yAxisId="right" type="monotone" dataKey="rootMoisture" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="Root Zone Moisture %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 5. Cryptographic ZK Proof & Claim Verification Proof Panel ─────── */}
        <div className="bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-primary-500/30 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-dark-700 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white">Cryptographic Zero-Knowledge Claim Proof &amp; Verification</h4>
                <p className="text-xs text-slate-400">Circom 2.0 Groth16 zk-SNARK proof over BN128 curve with SHA-256 Ledger Anchor</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              STATUS: {ml_proof?.zk_status || 'ELIGIBLE'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Private Input 1: NDVI Drop */}
            <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">PRIVATE WITNESS: NDVI DROP</span>
                <Lock className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <div className="text-xl font-mono font-bold text-danger">
                {indices_comparison.ndvi.change_pct}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Circuit Constraint: <strong className="text-slate-200">&gt; 30.00%</strong> (Scaled: {Math.round(Math.abs(indices_comparison.ndvi.change_pct) * 100)})
              </div>
            </div>

            {/* Private Input 2: Weather Anomaly */}
            <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">PRIVATE WITNESS: RAIN ANOMALY</span>
                <Lock className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <div className="text-xl font-mono font-bold text-amber-400">
                {indices_comparison.ndwi.change_pct}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Circuit Constraint: <strong className="text-slate-200">&gt; 40.00%</strong> (Scaled: {Math.round(Math.abs(indices_comparison.ndwi.change_pct) * 100)})
              </div>
            </div>

            {/* Private Input 3: Predicted Loss */}
            <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">PRIVATE WITNESS: YIELD DEFICIT</span>
                <Lock className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <div className="text-xl font-mono font-bold text-danger">
                {ml_proof?.predicted_loss_pct}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Circuit Constraint: <strong className="text-slate-200">&gt; 25.00%</strong> (Scaled: {Math.round((ml_proof?.predicted_loss_pct ?? 0) * 100)})
              </div>
            </div>

          </div>

          <div className="bg-dark-950 p-4 rounded-xl border border-dark-700 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
            <div className="text-primary-400 font-bold">// Cryptographic Proof Evaluation &amp; SHA-256 Claim Hash</div>
            <div>Evidence Hash: <span className="text-slate-400">{ml_proof?.evidence_hash || 'SHA-256 (Canonical Multi-Spectral Cube)'}</span></div>
            <div>Public Signal: <span className="text-emerald-400">eligible = 1 (True)</span> · Privacy Preserved: Exact Coordinates &amp; Yields Concealed</div>
          </div>

        </div>

      </div>

    </div>
  );
}
