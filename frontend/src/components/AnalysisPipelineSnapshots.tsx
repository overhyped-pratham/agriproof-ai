import { useState } from 'react';
import { generatePipelineSnapshots, SnapshotStage } from '../lib/snapshotGenerator';
import { ChevronRight, Maximize2, X, Layers, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisPipelineSnapshotsProps {
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
  compact?: boolean;
}

export default function AnalysisPipelineSnapshots(props: AnalysisPipelineSnapshotsProps) {
  const snapshots = generatePipelineSnapshots({
    farmName: props.farmName,
    cropType: props.cropType,
    centerLat: props.centerLat,
    centerLon: props.centerLon,
    areaHa: props.areaHa,
    ndviCurrent: props.ndviCurrent,
    ndviBaseline: props.ndviBaseline,
    ndviDropPct: props.ndviDropPct,
    evi: props.evi,
    ndwi: props.ndwi,
    cloudCover: props.cloudCover,
    damageProb: props.damageProb,
    riskCategory: props.riskCategory,
  });

  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotStage | null>(null);

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-dark-700">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-400" /> Multi-Spectral Processing Pipeline &amp; Visual Snapshots
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
        <span className="text-xs font-mono text-primary-300 bg-primary-950/60 border border-primary-500/30 px-3 py-1 rounded-full self-start sm:self-auto font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,163,255,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-primary-400" />
          7-Stage AI Vision Flow
        </span>
      </div>

      {/* Horizontal Flow Container */}
      <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-dark-600">
        <div className="flex items-start min-w-[1050px] gap-2 justify-between">
          {snapshots.map((stage, idx) => {
            const isCompleted = props.completedStepKeys
              ? props.completedStepKeys.includes(stage.stepKey) || props.completedStepKeys.includes('done')
              : true;
            const isActive = props.activeStepKey === stage.stepKey;

            return (
              <div key={stage.id} className="flex items-center flex-1 min-w-[140px] max-w-[185px]">
                {/* Stage Column Card */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  onClick={() => setSelectedSnapshot(stage)}
                  className={`w-full flex flex-col items-center justify-between rounded-xl border p-2 cursor-pointer transition-all shadow-lg group relative overflow-hidden bg-dark-900/90 backdrop-blur ${
                    isActive
                      ? 'border-primary-500 ring-2 ring-primary-500/30 shadow-[0_0_20px_rgba(0,163,255,0.25)]'
                      : isCompleted
                      ? 'border-dark-700/80 hover:border-primary-500/60 hover:shadow-[0_0_15px_rgba(0,163,255,0.15)]'
                      : 'border-dark-800 opacity-60'
                  }`}
                >
                  {/* Top Thumbnail Snapshot */}
                  <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-dark-700 bg-dark-950 mb-2.5 shadow-md">
                    <img
                      src={stage.thumbnail}
                      alt={stage.name}
                      className="w-full h-full object-cover bg-black group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-dark-900/90 text-white text-[10px] font-medium px-2 py-1 rounded flex items-center gap-1 shadow border border-dark-600">
                        <Maximize2 className="w-3 h-3 text-primary-400" /> Inspect
                      </span>
                    </div>

                    {/* Stage number tag */}
                    <div className="absolute top-1 left-1 bg-dark-900/90 text-primary-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-primary-500/30">
                      0{idx + 1}
                    </div>

                    {isCompleted && (
                      <div className="absolute top-1 right-1 bg-emerald-500 text-dark-950 rounded-full p-0.5 shadow">
                        <CheckCircle2 className="w-3 h-3 text-white fill-emerald-500" />
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
                      <p className="text-[11px] font-bold leading-tight truncate" title={stage.name}>
                        {stage.name}
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-400 line-clamp-1 leading-tight mb-1 font-mono" title={stage.subtitle}>
                      {stage.subtitle}
                    </p>
                    <span className="inline-block self-center text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-dark-950 text-slate-300 border border-dark-700 truncate max-w-full">
                      {stage.badgeLabel}
                    </span>
                  </div>
                </motion.div>

                {/* Arrow connecting to next step */}
                {idx < snapshots.length - 1 && (
                  <div className="px-1 text-slate-600 flex items-center justify-center shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Snapshot High-Resolution Inspection Modal */}
      <AnimatePresence>
        {selectedSnapshot && (
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
                  <h4 className="text-lg font-bold text-white">{selectedSnapshot.details.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedSnapshot(null)}
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
                    src={selectedSnapshot.thumbnail}
                    alt={selectedSnapshot.name}
                    className="w-full h-auto max-h-[300px] object-contain mx-auto rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 bg-dark-900/90 border border-dark-600 px-3 py-1 rounded-md text-xs font-mono text-slate-300 backdrop-blur">
                    Resolution: {selectedSnapshot.details.resolution}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Processing Logic &amp; Description</h5>
                  <p className="text-sm text-slate-200 leading-relaxed bg-dark-900/60 p-3.5 rounded-xl border border-dark-700 font-mono">
                    {selectedSnapshot.details.description}
                  </p>
                </div>

                {/* Algorithm and Metrics Grid */}
                <div>
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Stage Extraction Metrics</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedSnapshot.details.metrics).map(([key, val]) => (
                      <div key={key} className="bg-dark-900 p-3 rounded-lg border border-dark-700">
                        <span className="text-xs text-slate-400 block mb-0.5 font-mono">{key}</span>
                        <span className="text-sm font-bold text-white font-mono">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-dark-900/80 p-3.5 rounded-xl border border-dark-700 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Algorithm: <strong className="text-primary-300">{selectedSnapshot.details.algorithm}</strong></span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Validated
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-dark-700 bg-dark-900/80 flex justify-end">
                <button
                  onClick={() => setSelectedSnapshot(null)}
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
