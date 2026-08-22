import { useState, useEffect } from 'react';
import { PipelineStage, INITIAL_PIPELINE_STAGES } from '../lib/pipelineStore';
import {
  ChevronRight,
  Maximize2,
  X,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  Play,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSatelliteRaster, RasterMode } from '../lib/satelliteRasterGenerator';

const STAGE_RASTER_MODES: Record<string, { mode: RasterMode; seed: number; severity: number }> = {
  roi_definition:    { mode: 'baseline',   seed: 101, severity: 0.1 },
  satellite_imagery: { mode: 'truecolor',  seed: 202, severity: 0.2 },
  cloud_masking:     { mode: 'cloudmask',  seed: 303, severity: 0.3 },
  feature_extraction:{ mode: 'ndwi',       seed: 404, severity: 0.5 },
  thresholding:      { mode: 'threshold',  seed: 505, severity: 0.7 },
  vectorize_extent:  { mode: 'ndvi',       seed: 606, severity: 0.6 },
  db_ledger:         { mode: 'threshold',  seed: 707, severity: 0.8 },
};

function getFallbackRaster(stageId: string): string {
  const conf = STAGE_RASTER_MODES[stageId] || { mode: 'ndvi', seed: 42, severity: 0.5 };
  return generateSatelliteRaster(conf.mode, 640, 400, conf.seed, conf.severity);
}

interface AnalysisPipelineSnapshotsProps {
  stages?: PipelineStage[];
  farmName?: string;
  cropType?: string;
  centerLat?: number;
  centerLon?: number;
  areaHa?: number;
  ndviCurrent?: number;
  ndviBaseline?: number;
  ndviDropPct?: number;
  evi?: number;
  ndwi?: number;
  cloudCover?: number;
  damageProb?: number;
  riskCategory?: string;
  activeStepKey?: string;
  completedStepKeys?: string[];
  allowDemoRun?: boolean;
}

export default function AnalysisPipelineSnapshots({
  stages: propStages,
  farmName,
  cropType = 'wheat',
  centerLat = 30.3398,
  centerLon = 76.3869,
  areaHa = 8.5,
  activeStepKey,
  completedStepKeys,
  allowDemoRun = true
}: AnalysisPipelineSnapshotsProps) {
  const [internalStages, setInternalStages] = useState<PipelineStage[]>(INITIAL_PIPELINE_STAGES);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [selectedCapturedShot, setSelectedCapturedShot] = useState<number | null>(null);

  const CAPTURED_SHOTS = [
    {
      src: '/assets/snapshots/captured_ndmi_falsecolor.png',
      title: 'NDMI False-Color Composite',
      badge: 'Soil Moisture · Band B8-B11 SWIR',
      tag: 'Pass: 06 Aug 2026 · Sentinel-2B · Clouds: 0%',
      desc: 'Surface Reflectance L2A — Band 8/11 false-color composite showing root-zone moisture deficit zones across the parcel.',
    },
    {
      src: '/assets/snapshots/captured_damage_zones.png',
      title: 'Damage Classification Overlay',
      badge: 'NDVI-Classified Damage Zones',
      tag: 'Healthy (>0.6) · Stressed (0.3–0.6) · Severely Damaged (<0.3)',
      desc: 'Classified vegetation damage zones with field boundary polygon showing Healthy, Stressed, and Severely Damaged parcels.',
    },
    {
      src: '/assets/snapshots/captured_ndvi_raster.png',
      title: 'NDVI 10m×10m Sensor Raster',
      badge: 'NDVI Drop: −36.9% · Expected Loss: 31.6%',
      tag: '22 Aug 2026 · Sentinel-2A · 10m Ground Resolution',
      desc: 'Full 10m per-pixel NDVI raster. Darker tones indicate vegetation loss from drought stress, compacted soil, or nutrient deficiency. Includes AI Agronomy Report.',
    },
    {
      src: '/assets/snapshots/captured_interactive_map.png',
      title: 'Interactive Multi-Spectral Console',
      badge: 'Full Dashboard · All Indices Active',
      tag: '21 Aug 2026 (Current Pass) · NDVI Damage Overlay',
      desc: 'Full multi-spectral dashboard: NDVI index, damage overlay on satellite basemap, land surface zoning breakdown, and soil & thermal matrix.',
    },
  ];

  // Sync internal stages if external prop stages are provided
  useEffect(() => {
    if (propStages && propStages.length > 0) {
      setInternalStages(propStages);
    }
  }, [propStages]);

  // Sync legacy activeStepKey / completedStepKeys if provided
  useEffect(() => {
    if (!propStages && (activeStepKey || completedStepKeys)) {
      setInternalStages((prev) =>
        prev.map((stage) => {
          const isDone = completedStepKeys?.includes(stage.id) || completedStepKeys?.includes('done');
          const isCurrent = activeStepKey === stage.id;
          return {
            ...stage,
            status: isDone ? 'completed' : isCurrent ? 'processing' : stage.status,
            progress: isDone ? 100 : isCurrent ? 65 : stage.progress
          };
        })
      );
    }
  }, [activeStepKey, completedStepKeys, propStages]);

  // Demo simulator for interactive testing when WebSocket is offline
  const runDemoPipeline = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);

    // Reset all stages to pending
    setInternalStages((prev) =>
      prev.map((s) => ({ ...s, status: 'pending', progress: 0 }))
    );

    const stagesList = [...INITIAL_PIPELINE_STAGES];

    for (let i = 0; i < stagesList.length; i++) {
      // Mark processing with incremental progress
      for (let p = 10; p <= 90; p += 25) {
        setInternalStages((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'processing', progress: p } : s
          )
        );
        await new Promise((r) => setTimeout(r, 200));
      }

      // Mark completed
      setInternalStages((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? {
                ...s,
                status: 'completed',
                progress: 100,
                imageUrl: s.previewUrl
              }
            : s
        )
      );
      await new Promise((r) => setTimeout(r, 350));
    }

    setIsDemoRunning(false);
  };

  const resetPipeline = () => {
    setIsDemoRunning(false);
    setInternalStages(INITIAL_PIPELINE_STAGES);
  };

  const displayStages = internalStages;
  const activeProcessingStage = displayStages.find((s) => s.status === 'processing');

  return (
    <div className="w-full space-y-4">
      {/* Header bar with Real-Time Indicator & Demo Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dark-700">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Multi-Spectral Processing Pipeline &amp; Visual Snapshots
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center flex-wrap gap-1 font-mono">
                <span>ROI</span>
                <span className="text-primary-500">→</span>
                <span>Satellite Ingest</span>
                <span className="text-primary-500">→</span>
                <span>Cloud Masking</span>
                <span className="text-primary-500">→</span>
                <span>Spectral Indices</span>
                <span className="text-primary-500">→</span>
                <span>Damage Threshold</span>
                <span className="text-primary-500">→</span>
                <span>Vector Contours</span>
                <span className="text-primary-500">→</span>
                <span className="text-primary-300 font-bold">ZK Claim Ledger</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {allowDemoRun && (
            <button
              type="button"
              onClick={isDemoRunning ? resetPipeline : runDemoPipeline}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                isDemoRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-primary-600/20 text-primary-300 border border-primary-500/40 hover:bg-primary-600/30'
              }`}
            >
              {isDemoRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Reset
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-primary-400" /> Simulate Run
                </>
              )}
            </button>
          )}

          <span className="text-xs font-mono text-primary-300 bg-primary-950/60 border border-primary-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,163,255,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            7-Stage Live Flow
          </span>
        </div>
      </div>

      {/* Real-time Status Message Banner when active */}
      {activeProcessingStage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 rounded-xl bg-primary-950/40 border border-primary-500/40 flex items-center justify-between text-xs font-mono text-slate-300"
        >
          <div className="flex items-center gap-2 text-primary-300">
            <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
            <span>
              Processing <strong>{activeProcessingStage.title}</strong>: {activeProcessingStage.message || 'Executing spectral transformation...'}
            </span>
          </div>
          <span className="text-primary-400 font-bold">{activeProcessingStage.progress}%</span>
        </motion.div>
      )}

      {/* Horizontal 7-Stage Flow Grid */}
      <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-dark-600">
        <div className="flex items-start min-w-[1060px] gap-2 justify-between">
          {displayStages.map((stage, idx) => {
            const isProcessing = stage.status === 'processing';
            const isCompleted = stage.status === 'completed';
            const isPending = stage.status === 'pending';
            const isError = stage.status === 'error';
            const displayImage = stage.imageUrl || stage.previewUrl || `/assets/snapshots/stage${idx + 1}_roi.png`;

            return (
              <div key={stage.id} className="flex items-center flex-1 min-w-[142px] max-w-[185px]">
                {/* Stage Column Card */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  onClick={() => setSelectedStage(stage)}
                  className={`w-full flex flex-col items-center justify-between rounded-xl border p-2 cursor-pointer transition-all shadow-lg group relative overflow-hidden backdrop-blur ${
                    isProcessing
                      ? 'bg-dark-900 border-primary-500 ring-2 ring-primary-500/40 shadow-[0_0_25px_rgba(0,163,255,0.35)]'
                      : isCompleted
                      ? 'bg-dark-900/90 border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                      : isError
                      ? 'bg-dark-900/90 border-red-500/50'
                      : 'bg-dark-950/60 border-dark-800 opacity-60 hover:opacity-100 hover:border-dark-700'
                  }`}
                >
                  {/* Top Thumbnail Snapshot (Real-Time Animated Transition) */}
                  <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-dark-700 bg-dark-950 mb-2.5 shadow-md">
                    {/* Cross-fading image renderer */}
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={displayImage}
                        initial={{ opacity: 0.6, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.6 }}
                        transition={{ duration: 0.35 }}
                        src={displayImage}
                        alt={stage.title}
                        onError={(e) => {
                          const fallback = getFallbackRaster(stage.id);
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className={`w-full h-full object-cover bg-black group-hover:scale-105 transition-transform duration-300 ${
                          isPending ? 'grayscale opacity-40' : ''
                        }`}
                      />
                    </AnimatePresence>

                    {/* Active Processing Scanning HUD Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-primary-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2">
                        <Loader2 className="w-5 h-5 text-primary-400 animate-spin mb-1" />
                        <span className="text-[10px] font-mono font-bold text-white bg-dark-900/90 px-2 py-0.5 rounded border border-primary-500/40 shadow">
                          {stage.progress}%
                        </span>
                        {/* Scanning beam line */}
                        <motion.div
                          animate={{ y: [0, 50, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
                          className="absolute left-0 right-0 h-[2px] bg-primary-400 shadow-[0_0_8px_#00a3ff]"
                        />
                      </div>
                    )}

                    {/* Hover Inspect Overlay */}
                    <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-dark-900/90 text-white text-[10px] font-medium px-2 py-1 rounded flex items-center gap-1 shadow border border-dark-600">
                        <Maximize2 className="w-3 h-3 text-primary-400" /> Inspect
                      </span>
                    </div>

                    {/* Stage number tag */}
                    <div className="absolute top-1 left-1 bg-dark-900/90 text-primary-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-primary-500/30">
                      0{idx + 1}
                    </div>

                    {/* Completion or Error Badge */}
                    {isCompleted && (
                      <div className="absolute top-1 right-1 bg-emerald-500 text-dark-950 rounded-full p-0.5 shadow">
                        <CheckCircle2 className="w-3 h-3 text-white fill-emerald-500" />
                      </div>
                    )}

                    {isError && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow">
                        <AlertCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Connecting indicator icon */}
                  <div className="w-full flex justify-center mb-1 text-slate-500">
                    <span className="text-[10px] font-mono text-primary-500/60">▼</span>
                  </div>

                  {/* Stage Label Block */}
                  <div className="w-full text-center">
                    <div
                      className={`rounded-lg py-1.5 px-2 mb-1.5 border transition-all ${
                        stage.pillColor || 'bg-primary-600/20 text-primary-300 border-primary-500/30'
                      }`}
                    >
                      <p className="text-[11px] font-bold leading-tight truncate" title={stage.title}>
                        {stage.title}
                      </p>
                    </div>

                    {/* Real-time Stage Progress Bar */}
                    {isProcessing && (
                      <div className="h-1 w-full bg-dark-800 rounded-full overflow-hidden mb-1.5">
                        <motion.div
                          className="h-full bg-primary-500 shadow-[0_0_8px_#00a3ff]"
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.progress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    )}

                    <p
                      className="text-[9px] text-slate-400 line-clamp-1 leading-tight mb-1 font-mono"
                      title={stage.subtitle}
                    >
                      {stage.subtitle}
                    </p>
                    <span className="inline-block self-center text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-dark-950 text-slate-300 border border-dark-700 truncate max-w-full">
                      {stage.badgeLabel}
                    </span>
                  </div>
                </motion.div>

                {/* Arrow connecting to next step */}
                {idx < displayStages.length - 1 && (
                  <div className="px-1 text-slate-600 flex items-center justify-center shrink-0">
                    <ChevronRight
                      className={`w-4 h-4 transition-colors ${
                        isCompleted ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Captured Satellite Analysis Screenshots ─────────────────────── */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between border-b border-dark-700 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-white">Captured Satellite Analysis Frames</h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Live imagery captured by Sentinel-2B · 22 Aug 2026 · 10m Ground Resolution · {farmName || 'Agricultural Field'}
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TELEMETRY · 22 AUG 2026
          </span>
        </div>

        {/* 2x2 Captured Screenshot Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              src: '/assets/snapshots/captured_ndmi_falsecolor.png',
              title: 'NDMI False-Color Composite',
              badge: 'Soil Moisture',
              badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
              tag: 'Pass: 06 Aug 2026 · Sentinel-2B · Clouds: 0%',
              desc: 'Surface Reflectance L2A — Band 8/11 false-color composite showing root-zone moisture deficit zones across the parcel.',
              stats: [
                { label: 'Band', value: 'B8-B11 (SWIR)' },
                { label: 'Sensor', value: 'Sentinel-2B' },
                { label: 'Cloud Cover', value: '0%' },
              ]
            },
            {
              src: '/assets/snapshots/captured_damage_zones.png',
              title: 'Damage Classification Overlay',
              badge: 'Damage Zones',
              badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              tag: 'NDVI < 0.3 → Severely Damaged · 0.3–0.6 → Stressed',
              desc: 'Classified vegetation damage zones showing Healthy (NDVI > 0.6), Stressed, and Severely Damaged parcels with field boundary polygon.',
              stats: [
                { label: 'Healthy', value: 'NDVI > 0.6' },
                { label: 'Stressed', value: '0.3–0.6' },
                { label: 'Damaged', value: '< 0.3' },
              ]
            },
            {
              src: '/assets/snapshots/captured_ndvi_raster.png',
              title: 'NDVI 10m×10m Sensor Raster',
              badge: 'NDVI Analysis',
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              tag: 'NDVI Drop: −36.9% · Expected Loss: 31.6%',
              desc: 'Full 10m per-pixel NDVI raster with parcel boundary. Darker tones indicate vegetation loss from drought stress, compacted soil, or nutrient deficiency.',
              stats: [
                { label: 'NDVI Drop', value: '−36.9%' },
                { label: 'Exp. Loss', value: '31.6%' },
                { label: 'Resolution', value: '10m/px' },
              ]
            },
            {
              src: '/assets/snapshots/captured_interactive_map.png',
              title: 'Interactive Multi-Spectral Console',
              badge: 'Full Analysis',
              badgeColor: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
              tag: '21 Aug 2026 (Current Pass) · All indices active',
              desc: 'Full multi-spectral dashboard view showing NDVI index layer, damage overlay on satellite basemap, land surface zoning breakdown, and soil & thermal matrix.',
              stats: [
                { label: 'Scene Pass', value: '21 Aug 2026' },
                { label: 'Crop Health', value: '63%' },
                { label: 'Loss & Risk', value: '39.6% MOD' },
              ]
            },
          ].map((shot, i) => (
            <motion.div
              key={shot.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group bg-dark-900 rounded-2xl border border-dark-700 overflow-hidden hover:border-primary-500/40 transition-all hover:shadow-xl hover:shadow-primary-900/20 cursor-pointer"
              onClick={() => setSelectedCapturedShot(i)}
            >
              {/* Screenshot Thumbnail */}
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <img
                  src={shot.src}
                  alt={shot.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                {/* Top badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${shot.badgeColor}`}>
                    {shot.badge}
                  </span>
                </div>
                {/* Top right: pass date */}
                <div className="absolute top-2 right-2 bg-dark-950/90 backdrop-blur border border-dark-700 px-2 py-0.5 rounded-lg text-[9px] font-mono text-slate-300">
                  {shot.tag.split('·')[0].trim()}
                </div>
                {/* Hover inspect overlay */}
                <div className="absolute inset-0 bg-dark-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-dark-900/95 border border-primary-500/40 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 shadow">
                    <Maximize2 className="w-3.5 h-3.5 text-primary-400" /> Expand Screenshot
                  </span>
                </div>
                {/* Bottom gradient */}
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-dark-900 to-transparent" />
              </div>

              {/* Info Block */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h5 className="text-sm font-bold text-white leading-tight">{shot.title}</h5>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                    ✓ VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{shot.desc}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {shot.stats.map(s => (
                    <div key={s.label} className="bg-dark-800 border border-dark-700 rounded-lg px-2 py-1 text-center min-w-[60px]">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">{s.label}</div>
                      <div className="text-[11px] font-bold text-white font-mono">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Snapshot High-Resolution Inspection Modal */}
      <AnimatePresence>
        {selectedStage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-dark-800 border border-primary-500/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative shadow-primary-950/40"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-900/80">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/40">
                    Stage Inspection
                  </span>
                  <h4 className="text-lg font-bold text-white">{selectedStage.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedStage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Full Resolution Raster Preview */}
                <div className="relative rounded-xl overflow-hidden border border-dark-600 shadow-xl bg-dark-950 p-2">
                  <img
                    src={selectedStage.imageUrl || selectedStage.previewUrl || getFallbackRaster(selectedStage.id)}
                    alt={selectedStage.title}
                    onError={(e) => {
                      const fallback = getFallbackRaster(selectedStage.id);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-auto max-h-[320px] object-contain mx-auto rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 bg-dark-900/90 border border-dark-600 px-3 py-1 rounded-md text-xs font-mono text-slate-300 backdrop-blur">
                    Resolution: 640x400 (3m Ground Sample Distance)
                  </div>
                </div>

                {/* Subtitle & Message */}
                <div>
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Processing Stage Description
                  </h5>
                  <p className="text-sm text-slate-200 leading-relaxed bg-dark-900/60 p-3.5 rounded-xl border border-dark-700 font-mono">
                    {selectedStage.subtitle}.{' '}
                    {selectedStage.message && `Last status: ${selectedStage.message}`}
                  </p>
                </div>

                {/* Stage Metadata Grid if available */}
                <div>
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Stage Extraction &amp; Field Telemetry
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-900 p-3 rounded-lg border border-dark-700">
                      <span className="text-xs text-slate-400 block mb-0.5 font-mono">Farm &amp; Crop</span>
                      <span className="text-sm font-bold text-white font-mono">{farmName || 'Demo Field'} ({cropType.toUpperCase()})</span>
                    </div>
                    <div className="bg-dark-900 p-3 rounded-lg border border-dark-700">
                      <span className="text-xs text-slate-400 block mb-0.5 font-mono">Coordinates &amp; Extent</span>
                      <span className="text-sm font-bold text-white font-mono">{areaHa.toFixed(2)} ha @ {centerLat.toFixed(3)}°N, {centerLon.toFixed(3)}°E</span>
                    </div>
                    {selectedStage.metadata &&
                      Object.entries(selectedStage.metadata).map(([key, val]) => (
                        <div key={key} className="bg-dark-900 p-3 rounded-lg border border-dark-700">
                          <span className="text-xs text-slate-400 block mb-0.5 font-mono">{key}</span>
                          <span className="text-sm font-bold text-primary-300 font-mono">{String(val)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-dark-900/80 p-3.5 rounded-xl border border-dark-700 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>
                    Status:{' '}
                    <strong
                      className={
                        selectedStage.status === 'completed'
                          ? 'text-emerald-400'
                          : selectedStage.status === 'processing'
                          ? 'text-primary-400'
                          : 'text-slate-400'
                      }
                    >
                      {selectedStage.status.toUpperCase()} ({selectedStage.progress}%)
                    </strong>
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Validated Multi-Spectral Asset
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-dark-700 bg-dark-900/80 flex justify-end">
                <button
                  onClick={() => setSelectedStage(null)}
                  className="bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary-900/30"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Captured Screenshot Lightbox Modal ──────────────────────────── */}
      <AnimatePresence>
        {selectedCapturedShot !== null && CAPTURED_SHOTS[selectedCapturedShot] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedCapturedShot(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-dark-800 border border-dark-600 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-900/90">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Satellite Capture · {CAPTURED_SHOTS[selectedCapturedShot].tag.split('·')[0].trim()}
                  </span>
                  <h4 className="text-base font-bold text-white">{CAPTURED_SHOTS[selectedCapturedShot].title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  {/* Prev / Next */}
                  {selectedCapturedShot > 0 && (
                    <button
                      onClick={() => setSelectedCapturedShot(selectedCapturedShot - 1)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-dark-700 text-slate-300 hover:text-white hover:bg-dark-600 border border-dark-600 transition-colors"
                    >
                      ← Prev
                    </button>
                  )}
                  {selectedCapturedShot < CAPTURED_SHOTS.length - 1 && (
                    <button
                      onClick={() => setSelectedCapturedShot(selectedCapturedShot + 1)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-dark-700 text-slate-300 hover:text-white hover:bg-dark-600 border border-dark-600 transition-colors"
                    >
                      Next →
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCapturedShot(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Full Screenshot */}
              <div className="relative bg-black">
                <img
                  src={CAPTURED_SHOTS[selectedCapturedShot].src}
                  alt={CAPTURED_SHOTS[selectedCapturedShot].title}
                  className="w-full max-h-[65vh] object-contain"
                />
                {/* Corner overlay badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-dark-950/95 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold px-2 py-1 rounded-lg backdrop-blur">
                    ✓ ZK-VERIFIED · Sentinel-2 Level 2A
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 bg-dark-950/95 border border-dark-700 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-lg backdrop-blur">
                  {CAPTURED_SHOTS[selectedCapturedShot].badge}
                </div>
              </div>

              {/* Footer info */}
              <div className="p-4 border-t border-dark-700 bg-dark-900/80 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400 leading-relaxed flex-1">
                  {CAPTURED_SHOTS[selectedCapturedShot].desc}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedCapturedShot + 1} / {CAPTURED_SHOTS.length}
                  </span>
                  <button
                    onClick={() => setSelectedCapturedShot(null)}
                    className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
