import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Activity, CheckCircle2, Loader2, CircleDashed } from 'lucide-react';

interface SpectralAnalysisPanelProps {
  redBandStatus: 'pending' | 'processing' | 'completed';
  nirBandStatus: 'pending' | 'processing' | 'completed';
  ndviStatus: 'pending' | 'processing' | 'completed';
  redBandValue?: number | string;
  nirBandValue?: number | string;
  ndviValue?: number | string;
  progressPct?: number;
}

export const SpectralAnalysisPanel: React.FC<SpectralAnalysisPanelProps> = ({
  redBandStatus,
  nirBandStatus,
  ndviStatus,
  redBandValue,
  nirBandValue,
  ndviValue,
  progressPct = 0,
}) => {
  return (
    <div className="bg-dark-900/90 backdrop-blur-md rounded-2xl border border-primary-500/30 p-4 shadow-xl shadow-black/60 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-700/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-400" />
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
            Spectral Band Analysis
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-950 text-primary-300 border border-primary-500/30">
          MSI 60m/10m
        </span>
      </div>

      {/* Band 1: B04 Red Band (665 nm) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            B04 RED BAND (665 nm)
          </span>
          <span className="text-[11px]">
            {redBandStatus === 'completed' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {redBandValue !== undefined ? `${redBandValue}%` : 'Extracted'}
              </span>
            ) : redBandStatus === 'processing' ? (
              <span className="text-primary-400 font-bold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <CircleDashed className="w-3 h-3" /> Pending
              </span>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden border border-dark-700">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-red-400"
            initial={{ width: 0 }}
            animate={{
              width:
                redBandStatus === 'completed'
                  ? '100%'
                  : redBandStatus === 'processing'
                  ? `${Math.min(100, progressPct * 1.3)}%`
                  : '0%',
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Band 2: B08 NIR Band (842 nm) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            B08 NIR BAND (842 nm)
          </span>
          <span className="text-[11px]">
            {nirBandStatus === 'completed' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {nirBandValue !== undefined ? `${nirBandValue}%` : 'Extracted'}
              </span>
            ) : nirBandStatus === 'processing' ? (
              <span className="text-primary-400 font-bold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <CircleDashed className="w-3 h-3" /> Pending
              </span>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden border border-dark-700">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            initial={{ width: 0 }}
            animate={{
              width:
                nirBandStatus === 'completed'
                  ? '100%'
                  : nirBandStatus === 'processing'
                  ? `${Math.min(100, Math.max(0, (progressPct - 20) * 1.4))}%`
                  : '0%',
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Band 3: NDVI Formula (B08 - B04) / (B08 + B04) */}
      <div className="space-y-1.5 pt-1 border-t border-dark-700/60">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-primary-300 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary-400" />
            NDVI INDEX RATIO
          </span>
          <span className="text-[11px]">
            {ndviStatus === 'completed' ? (
              <span className="text-emerald-400 font-bold font-mono">
                {ndviValue !== undefined ? ndviValue : 'Calculated'}
              </span>
            ) : ndviStatus === 'processing' ? (
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Calculating
              </span>
            ) : (
              <span className="text-slate-500">○ Waiting for calculation</span>
            )}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>Formula: (NIR − Red) / (NIR + Red)</span>
          <span className="text-slate-500">Range: -1.0 to +1.0</span>
        </div>
      </div>
    </div>
  );
};

export default SpectralAnalysisPanel;
