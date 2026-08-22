import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Satellite, ScanLine, CheckCircle2, Loader2, Timer } from 'lucide-react';

interface SatelliteScannerProps {
  imageUrl: string;
  isScanning: boolean;
  scanProgress: number; // 0 - 100
  statusMessage: string;
  stageName?: string;
  farmName?: string;
  coordinates?: string;
  onImageError?: () => void;
}

export const SatelliteScanner: React.FC<SatelliteScannerProps> = ({
  imageUrl,
  isScanning,
  scanProgress,
  statusMessage,
  stageName = 'Satellite Observation Ingestion',
  farmName = 'Registered Farm Parcel',
  coordinates,
  onImageError,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isScanning) {
      if (startRef.current === null) startRef.current = performance.now();
      const tick = () => {
        if (startRef.current !== null) {
          setElapsedMs(performance.now() - startRef.current);
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isScanning]);
  return (
    <div className="relative w-full aspect-[16/10] max-h-[520px] rounded-2xl overflow-hidden border border-primary-500/40 bg-dark-950 shadow-2xl shadow-primary-950/40 select-none">
      {/* 1. Underlying Satellite Snapshot */}
      <img
        src={imageUrl}
        alt="Satellite Observation"
        onError={onImageError}
        className="w-full h-full object-cover"
      />

      {/* 2. Tactical GIS Reticle Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,163,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,163,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Top-Left Corner HUD */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5">
          <div className="bg-dark-950/90 backdrop-blur border border-primary-500/50 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-lg">
            <Satellite className="w-4 h-4 text-primary-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white tracking-wide">
              SENTINEL-2 L2A · 10m GSD
            </span>
          </div>
          {coordinates && (
            <div className="bg-dark-950/80 backdrop-blur border border-dark-700 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-300">
              {coordinates}
            </div>
          )}
        </div>

        {/* Top-Right Stage Tag & Live Timer */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Live Stopwatch Counter Badge */}
          <div className="bg-dark-950/90 backdrop-blur border border-cyan-500/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-lg font-mono text-xs text-cyan-300">
            <Timer className={`w-3.5 h-3.5 ${isScanning ? 'text-cyan-400 animate-spin' : 'text-emerald-400'}`} />
            <span className="font-bold tracking-wider">{(elapsedMs / 1000).toFixed(2)}s</span>
          </div>

          <div className="bg-primary-950/90 backdrop-blur border border-primary-500/50 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-lg">
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 text-primary-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="text-xs font-mono font-bold text-primary-300">
              {stageName}
            </span>
          </div>
        </div>

        {/* Tactical Crosshair Markers in 4 corners */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-primary-400/80" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-primary-400/80" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-primary-400/80" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-primary-400/80" />
      </div>

      {/* 3. Horizontal Scanning Beam & Translucent Analysis Area (Phase 1) */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Translucent analyzed area trailing above the scan line */}
          <motion.div
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-primary-500/10 via-primary-500/20 to-primary-400/30 backdrop-blur-[0.5px]"
            style={{ height: `${scanProgress}%` }}
            transition={{ duration: 0.15, ease: 'linear' }}
          />

          {/* Glowing Horizontal Scanning Beam Line */}
          <motion.div
            className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_#22d3ee,0_0_30px_#00a3ff]"
            style={{ top: `${scanProgress}%` }}
            transition={{ duration: 0.15, ease: 'linear' }}
          >
            {/* Center target laser dot */}
            <div className="absolute left-1/2 -top-1 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
          </motion.div>

          {/* Sub-beam trailing diffraction lines */}
          <motion.div
            className="absolute left-0 right-0 h-[1px] bg-cyan-400/40"
            style={{ top: `calc(${scanProgress}% - 6px)` }}
            transition={{ duration: 0.15, ease: 'linear' }}
          />
        </div>
      )}

      {/* 4. Bottom Live Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-dark-950/90 backdrop-blur border-t border-dark-700/80 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-xs font-mono text-slate-200">
          <ScanLine className="w-4 h-4 text-primary-400" />
          <span>{statusMessage || 'Analyzing multi-spectral pixel reflectance...'}</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] font-mono text-slate-400">{farmName}</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-28 bg-dark-800 rounded-full overflow-hidden border border-dark-700">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-cyan-400 rounded-full transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold font-mono text-primary-300 w-9 text-right">
              {Math.round(scanProgress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteScanner;
