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
                    src={selectedStage.imageUrl || selectedStage.previewUrl}
                    alt={selectedStage.title}
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
    </div>
  );
}
