import { useState, useEffect, useMemo } from 'react';
import { api, LandAnalysisResult } from '../lib/api';
import {
  Satellite,
  Layers,
  Thermometer,
  Droplets,
  Sprout,
  Activity,
  Info,
  Compass
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generateSatelliteRaster } from '../lib/satelliteRasterGenerator';

interface LandSatelliteAnalysisProps {
  farmId: string;
}

export default function LandSatelliteAnalysis({ farmId }: LandSatelliteAnalysisProps) {
  const [data, setData] = useState<LandAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBandIndex, setActiveBandIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'baseline' | 'current' | 'cir'>('split');
  const [sliderPos, setSliderPos] = useState<number>(50);

  // Generate procedural satellite rasters (memoized by farmId)
  const rasterSeed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < farmId.length; i++) s = ((s << 5) - s + farmId.charCodeAt(i)) | 0;
    return Math.abs(s);
  }, [farmId]);
  const baselineRaster = useMemo(() => generateSatelliteRaster('baseline', 640, 400, rasterSeed), [rasterSeed]);
  const currentRaster = useMemo(() => generateSatelliteRaster('current', 640, 400, rasterSeed), [rasterSeed]);
  const cirRaster = useMemo(() => generateSatelliteRaster('cir', 640, 400, rasterSeed), [rasterSeed]);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    api.farms.getLandAnalysis(farmId)
      .then(res => setData(res.data))
      .catch(err => console.error('[LandSatelliteAnalysis] Failed to fetch land analysis:', err))
      .finally(() => setLoading(false));
  }, [farmId]);

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8 text-center text-slate-400 animate-pulse">
        <Satellite className="w-8 h-8 mx-auto mb-2 text-primary-500 animate-spin" />
        Processing satellite multi-spectral land imagery & soil surface metrics…
      </div>
    );
  }

  if (!data) return null;

  const { land_zoning, indices_comparison, soil_and_surface, spectral_reflectance_curve, satellite_metadata } = data;

  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 shadow-xl space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-dark-700">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-primary-600/10 text-primary-400 rounded-lg border border-primary-500/20">
              <Satellite className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Satellite Land Surface & Crop Canopy Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                High-resolution multi-spectral Earth Observation (3m Ground Sample Distance) pre/post disaster assessment.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-dark-900/90 p-1 rounded-xl border border-dark-700 self-start md:self-auto">
          {[
            { id: 'split', label: 'Split Compare' },
            { id: 'baseline', label: 'Pre-Event Peak' },
            { id: 'current', label: 'Post-Event Land' },
            { id: 'cir', label: 'Color-Infrared (CIR)' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode.id
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Visual Imagery Snapshot & Land Zoning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: High-Res Land Satellite Snapshots */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-dark-600 bg-dark-950 shadow-2xl group select-none">
            {/* Visual Container */}
            {viewMode === 'split' && (
              <div className="relative w-full h-full">
                {/* Baseline Layer (Left) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                  }}
                >
                  <img src={baselineRaster} alt="Baseline healthy canopy" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-dark-900/90 text-success border border-success/40 text-[11px] font-mono font-bold px-2.5 py-1 rounded-md shadow backdrop-blur">
                    PRE-EVENT BASELINE (NDVI: {indices_comparison.ndvi.baseline.toFixed(2)})
                  </div>
                </div>

                {/* Current Post-Event Layer (Right) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                  }}
                >
                  <img src={currentRaster} alt="Post-event drought" className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-dark-900/90 text-danger border border-danger/40 text-[11px] font-mono font-bold px-2.5 py-1 rounded-md shadow backdrop-blur">
                    POST-EVENT CURRENT (NDVI: {indices_comparison.ndvi.current.toFixed(2)})
                  </div>
                </div>

                {/* Split line & draggable handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="w-7 h-7 bg-white text-dark-950 rounded-full flex items-center justify-center text-xs font-bold shadow-2xl border-2 border-primary-600">
                    ⇄
                  </div>
                </div>

                {/* Range input overlay for intuitive sliding */}
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

            {viewMode === 'baseline' && (
              <div className="relative w-full h-full overflow-hidden">
                <img src={baselineRaster} alt="Sentinel-2 MSI Level-2A True Color" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-dark-950/40 pointer-events-none" />
                
                {/* HUD Corner Accents */}
                <div className="absolute top-4 left-4 border-l-2 border-t-2 border-emerald-400/70 w-6 h-6 pointer-events-none" />
                <div className="absolute top-4 right-4 border-r-2 border-t-2 border-emerald-400/70 w-6 h-6 pointer-events-none" />
                <div className="absolute bottom-12 left-4 border-l-2 border-b-2 border-emerald-400/70 w-6 h-6 pointer-events-none" />
                <div className="absolute bottom-12 right-4 border-r-2 border-b-2 border-emerald-400/70 w-6 h-6 pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 bg-dark-900/90 text-success border border-success/40 text-[11px] font-mono font-bold px-3 py-1 rounded-md shadow-lg backdrop-blur flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  PRE-EVENT BASELINE (NDVI: {indices_comparison.ndvi.baseline.toFixed(2)})
                </div>

                {/* Center Reticle / Metadata */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center z-10 space-y-1.5 bg-black/60 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-white/10 shadow-2xl">
                    <span className="px-3 py-0.5 bg-success/20 text-success font-mono text-[11px] font-bold rounded-full border border-success/40 inline-block">
                      Healthy Vegetative Peak
                    </span>
                    <p className="text-white text-base md:text-lg font-bold">Sentinel-2 MSI Level-2A (True Color RGB)</p>
                    <p className="text-slate-300 text-xs font-mono">
                      NDVI: <strong className="text-emerald-400">{indices_comparison.ndvi.baseline.toFixed(3)}</strong> · EVI: <strong className="text-emerald-400">{indices_comparison.evi.baseline.toFixed(3)}</strong> · Canopy Cover: <strong className="text-emerald-400">{soil_and_surface.canopy_cover_pct}%</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'current' && (
              <div className="relative w-full h-full overflow-hidden">
                <img src={currentRaster} alt="Post-event PlanetScope 3m Capture" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-dark-950/40 pointer-events-none" />

                {/* HUD Corner Accents */}
                <div className="absolute top-4 left-4 border-l-2 border-t-2 border-red-500/70 w-6 h-6 pointer-events-none" />
                <div className="absolute top-4 right-4 border-r-2 border-t-2 border-red-500/70 w-6 h-6 pointer-events-none" />
                <div className="absolute bottom-12 left-4 border-l-2 border-b-2 border-red-500/70 w-6 h-6 pointer-events-none" />
                <div className="absolute bottom-12 right-4 border-r-2 border-b-2 border-red-500/70 w-6 h-6 pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-3 right-3 bg-dark-900/90 text-danger border border-danger/40 text-[11px] font-mono font-bold px-3 py-1 rounded-md shadow-lg backdrop-blur flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
                  POST-EVENT CURRENT (NDVI: {indices_comparison.ndvi.current.toFixed(2)})
                </div>

                {/* Center Anomaly Box */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center z-10 space-y-1.5 bg-black/60 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-red-500/30 shadow-2xl">
                    <span className="px-3 py-0.5 bg-danger/20 text-danger font-mono text-[11px] font-bold rounded-full border border-danger/40 inline-block">
                      Post-Anomaly Soil &amp; Crop Degradation
                    </span>
                    <p className="text-white text-base md:text-lg font-bold">PlanetScope 3m High-Resolution Capture</p>
                    <p className="text-slate-300 text-xs font-mono">
                      NDVI: <strong className="text-red-400">{indices_comparison.ndvi.current.toFixed(3)}</strong> (Drop: <strong className="text-red-400">{indices_comparison.ndvi.change_pct}%</strong>) · Surface Temp: <strong className="text-amber-400">{soil_and_surface.surface_temperature_c}°C</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'cir' && (
              <div className="relative w-full h-full overflow-hidden">
                <img src={cirRaster} alt="Color-Infrared False Composite (CIR)" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-dark-950/40 pointer-events-none" />

                {/* HUD Corner Accents */}
                <div className="absolute top-4 left-4 border-l-2 border-t-2 border-pink-500/70 w-6 h-6 pointer-events-none" />
                <div className="absolute top-4 right-4 border-r-2 border-t-2 border-pink-500/70 w-6 h-6 pointer-events-none" />
                <div className="absolute bottom-12 left-4 border-l-2 border-b-2 border-pink-500/70 w-6 h-6 pointer-events-none" />
                <div className="absolute bottom-12 right-4 border-r-2 border-b-2 border-pink-500/70 w-6 h-6 pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 bg-dark-900/90 text-pink-400 border border-pink-500/40 text-[11px] font-mono font-bold px-3 py-1 rounded-md shadow-lg backdrop-blur">
                  CIR FALSE-COLOR (NIR / RED / GREEN)
                </div>

                {/* Center Callout */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center z-10 space-y-1.5 bg-black/60 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-pink-500/30 shadow-2xl">
                    <span className="px-3 py-0.5 bg-pink-500/20 text-pink-400 font-mono text-[11px] font-bold rounded-full border border-pink-500/40 inline-block">
                      Cellular Biomass Vigour Index (CIR)
                    </span>
                    <p className="text-white text-base md:text-lg font-bold">Multi-Spectral Infrared False Composite</p>
                    <p className="text-slate-300 text-xs font-mono">
                      Vibrant Magenta = Active Mesophyll · Grey/Cyan = Severe Defoliation &amp; Dry Earth
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Info Bar inside snapshot */}
            <div className="absolute bottom-2 left-2 right-2 bg-dark-900/90 backdrop-blur border border-dark-700/80 px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs font-mono text-slate-300 pointer-events-none">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-primary-400" /> {data.center_lat.toFixed(4)}°N, {data.center_lon.toFixed(4)}°E
              </span>
              <span className="text-slate-400">GSD: {satellite_metadata.ground_sample_distance_m}m / pixel</span>
              <span className="text-primary-400 font-bold">{data.area_hectares.toFixed(1)} ha</span>
            </div>
          </div>

          {/* Satellite Capture Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="bg-dark-900 p-2.5 rounded-xl border border-dark-700">
              <span className="text-slate-500 block text-[10px]">SENSOR</span>
              <span className="text-slate-200 font-semibold truncate block" title={satellite_metadata.sensor}>
                {satellite_metadata.sensor.split('+')[0]}
              </span>
            </div>
            <div className="bg-dark-900 p-2.5 rounded-xl border border-dark-700">
              <span className="text-slate-500 block text-[10px]">CORRECTION</span>
              <span className="text-slate-200 font-semibold truncate block">{satellite_metadata.atmospheric_correction}</span>
            </div>
            <div className="bg-dark-900 p-2.5 rounded-xl border border-dark-700">
              <span className="text-slate-500 block text-[10px]">BASELINE PASS</span>
              <span className="text-emerald-400 font-semibold truncate block">2024-06-20 (Peak)</span>
            </div>
            <div className="bg-dark-900 p-2.5 rounded-xl border border-dark-700">
              <span className="text-slate-500 block text-[10px]">CURRENT PASS</span>
              <span className="text-amber-400 font-semibold truncate block">{satellite_metadata.current_pass.substring(0, 10)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Land Surface Composition & Zoning Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary-400" /> Land Surface Zoning Breakdown
              </h4>
              <span className="text-xs font-mono text-slate-400">{data.area_hectares.toFixed(2)} Total ha</span>
            </div>

            {/* Stacked Distribution Bar */}
            <div className="h-4 w-full bg-dark-950 rounded-full overflow-hidden flex border border-dark-700 shadow-inner">
              <div style={{ width: `${land_zoning.vigorous_canopy.pct}%` }} className="bg-emerald-500 h-full" title={`Vigorous: ${land_zoning.vigorous_canopy.pct}%`} />
              <div style={{ width: `${land_zoning.moderate_stress.pct}%` }} className="bg-amber-500 h-full" title={`Moderate Stress: ${land_zoning.moderate_stress.pct}%`} />
              <div style={{ width: `${land_zoning.severe_degradation.pct}%` }} className="bg-red-500 h-full" title={`Severe Loss: ${land_zoning.severe_degradation.pct}%`} />
              <div style={{ width: `${land_zoning.bare_soil_fallow.pct}%` }} className="bg-purple-500 h-full" title={`Bare Soil: ${land_zoning.bare_soil_fallow.pct}%`} />
            </div>

            {/* Zoning Breakdown Cards */}
            <div className="space-y-2">
              {[
                { zone: land_zoning.vigorous_canopy, color: 'bg-emerald-500', text: 'text-emerald-400' },
                { zone: land_zoning.moderate_stress, color: 'bg-amber-500', text: 'text-amber-400' },
                { zone: land_zoning.severe_degradation, color: 'bg-red-500', text: 'text-red-400' },
                { zone: land_zoning.bare_soil_fallow, color: 'bg-purple-500', text: 'text-purple-400' },
              ].map(({ zone, color, text }) => (
                <div key={zone.label} className="flex items-center justify-between p-2 rounded-lg bg-dark-800 border border-dark-700 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-sm ${color} shrink-0`} />
                    <span className="text-slate-300 font-medium">{zone.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-400">{zone.hectares.toFixed(2)} ha</span>
                    <span className={`font-bold ${text} w-12 text-right`}>{zone.pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Soil Moisture & Thermal Health Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-900 p-3.5 rounded-xl border border-dark-700 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> Soil Moisture (VWC)
              </div>
              <p className="text-xl font-bold text-blue-400 font-mono">
                {soil_and_surface.soil_moisture_vwc_pct}%
              </p>
              <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                soil_and_surface.soil_moisture_vwc_pct < 15
                  ? 'bg-danger/20 text-danger border-danger/40'
                  : 'bg-success/20 text-success border-success/40'
              }`}>
                {soil_and_surface.soil_moisture_status}
              </span>
            </div>

            <div className="bg-dark-900 p-3.5 rounded-xl border border-dark-700 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Land Surface Temp
              </div>
              <p className="text-xl font-bold text-orange-400 font-mono">
                {soil_and_surface.surface_temperature_c}°C
              </p>
              <span className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40">
                +{soil_and_surface.thermal_anomaly_c}°C Anomaly
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Spectral Index Comparison Matrix */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" /> Multi-Spectral Index Comparison (Baseline vs Current)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'NDVI', label: 'NDVI (Canopy Vigour)', item: indices_comparison.ndvi, desc: 'Normalized Difference Veg Index' },
            { id: 'EVI', label: 'EVI (Enhanced Veg)', item: indices_comparison.evi, desc: 'Enhanced Vegetation Index' },
            { id: 'NDWI', label: 'NDWI (Water Content)', item: indices_comparison.ndwi, desc: 'Normalized Difference Water' },
            { id: 'NDMI', label: 'NDMI (Moisture Index)', item: indices_comparison.ndmi, desc: 'Normalized Moisture Index' },
            { id: 'SAVI', label: 'SAVI (Soil-Adjusted)', item: indices_comparison.savi, desc: 'Soil-Adjusted Veg Index' },
            { id: 'BSI', label: 'BSI (Bare Soil Index)', item: indices_comparison.bsi, desc: 'Bare Soil & Ground Index' },
          ].map(({ id, label, item }) => {
            const isNegative = item.change_pct < 0;
            return (
              <div key={id} className="bg-dark-900 p-3 rounded-xl border border-dark-700 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block">{id}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{label}</span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-white font-mono">{item.current.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 font-mono">base: {item.baseline.toFixed(2)}</span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold flex items-center gap-0.5 mt-0.5 ${
                    isNegative ? 'text-danger' : 'text-success'
                  }`}>
                    {isNegative ? '▼' : '▲'} {item.change_pct > 0 ? `+${item.change_pct}%` : `${item.change_pct}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Multi-Spectral Band Reflectance Curve */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" /> Multi-Spectral Band Reflectance Signature Curve
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any spectral band to inspect biophysical wavelength absorption and cellular reflection dynamics.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400 rounded" /> Baseline Healthy
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-400 rounded" /> Current Stressed
            </span>
          </div>
        </div>

        {/* Spectral Band Bars / Chart */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {spectral_reflectance_curve.map((band, idx) => {
            const isSelected = activeBandIndex === idx;
            return (
              <div
                key={band.band}
                onClick={() => setActiveBandIndex(isSelected ? null : idx)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary-950/60 border-primary-500 ring-2 ring-primary-500/20'
                    : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                }`}
              >
                <span className="text-xs font-bold text-slate-200 block truncate">{band.band.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{band.wavelength_nm} nm</span>

                <div className="mt-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Base:</span>
                    <span className="text-emerald-400">{(band.baseline * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Curr:</span>
                    <span className="text-rose-400">{(band.current * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-dark-700 text-[10px] font-mono text-primary-400 truncate">
                  {band.delta}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Band Detail Explanation Callout */}
        {activeBandIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-primary-950/40 border border-primary-800/40 rounded-xl text-xs text-slate-200 space-y-1"
          >
            <div className="font-bold text-primary-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-primary-400" />
              {spectral_reflectance_curve[activeBandIndex].band}: {spectral_reflectance_curve[activeBandIndex].delta}
            </div>
            <p className="text-slate-400 leading-relaxed">
              {activeBandIndex === 2 && 'Red Band (665nm): Healthy crops strongly absorb red light for photosynthesis. Elevated red reflectance indicates severe chlorophyll degradation.'}
              {activeBandIndex === 3 && 'Near-Infrared (842nm): Healthy leaf internal mesophyll strongly reflects NIR. The 49.6% drop proves widespread cellular structure collapse.'}
              {activeBandIndex === 4 && 'SWIR-1 (1610nm): Short-Wave Infrared reflectance surges as moisture in plant leaf vacuoles and topsoil evaporates.'}
              {activeBandIndex === 5 && 'SWIR-2 (2190nm): Elevated SWIR-2 indicates bare dry soil exposure with loss of vegetative canopy blanket.'}
              {(activeBandIndex === 0 || activeBandIndex === 1) && 'Visible Blue/Green Bands: Reflectance changes highlight atmospheric aerosol penetration and pigment changes.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
