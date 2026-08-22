import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Eye, Sliders } from 'lucide-react';

interface HeatmapRevealProps {
  originalImageUrl: string;
  heatmapImageUrl: string;
  farmName?: string;
  cropType?: string;
  areaHa?: number;
  onImageError?: () => void;
}

export type ViewMode = 'original' | 'heatmap' | 'overlay';

export const HeatmapReveal: React.FC<HeatmapRevealProps> = ({
  originalImageUrl,
  heatmapImageUrl,
  farmName = 'Registered Farm Parcel',
  cropType = 'Wheat',
  areaHa = 9.6,
  onImageError,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [opacity, setOpacity] = useState<number>(0.75);

  return (
    <div className="space-y-4">
      {/* Top Controls: Mode Switcher & Opacity Slider */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-dark-900/90 backdrop-blur p-3 rounded-2xl border border-dark-700 shadow-md">
        {/* Toggle Group */}
        <div className="flex items-center gap-1.5 bg-dark-950 p-1 rounded-xl border border-dark-700/80">
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'original'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Original
          </button>
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'heatmap'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Heatmap
          </button>
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'overlay'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Overlay
          </button>
        </div>

        {/* Opacity Slider (enabled in Overlay mode) */}
        {viewMode === 'overlay' && (
          <div className="flex items-center gap-3 w-full sm:w-auto bg-dark-950 px-3 py-1.5 rounded-xl border border-dark-700/80">
            <span className="text-xs font-mono text-slate-400">Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-28 h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <span className="text-xs font-mono font-bold text-primary-300 w-10 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Main Image Comparison Frame */}
      <div className="relative w-full aspect-[16/10] max-h-[500px] rounded-2xl overflow-hidden border border-primary-500/40 bg-dark-950 shadow-2xl shadow-primary-950/30">
        {/* Base Layer: Original Satellite Snapshot */}
        <img
          src={originalImageUrl}
          alt="Original Satellite Observation"
          onError={onImageError}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlaid Layer: Actual Damage / NDVI Heatmap Artifact */}
        {viewMode !== 'original' && (
          <motion.img
            src={heatmapImageUrl}
            alt="Multi-Spectral Damage Heatmap"
            onError={onImageError}
            initial={{ opacity: 0 }}
            animate={{ opacity: viewMode === 'heatmap' ? 1 : opacity }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Tactical Badges Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="bg-dark-950/85 backdrop-blur border border-primary-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-bold text-white">
              {viewMode === 'original'
                ? 'RAW SATELLITE BASEMAP'
                : viewMode === 'heatmap'
                ? 'ANALYSIS DAMAGE HEATMAP'
                : 'SYNTHESIZED SPECTRAL OVERLAY'}
            </span>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20">
          <div className="bg-dark-950/85 backdrop-blur border border-dark-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 shadow-lg">
            {farmName} · {cropType} · {areaHa.toFixed(1)} ha
          </div>
        </div>
      </div>

      {/* Semantic Legend (Phase 4) */}
      <div className="bg-dark-900/90 backdrop-blur rounded-xl border border-dark-700/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
          Classification Legend:
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-slate-200">Healthy Vegetation (NDVI &gt; 0.60)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_#facc15]" />
            <span className="text-slate-200">Moderate Stress (NDVI 0.40 - 0.60)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
            <span className="text-slate-200">High Stress (NDVI 0.30 - 0.40)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            <span className="text-slate-200">Severe Damage / Trigger (&lt; 0.30)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapReveal;
