import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { wsAnalysisUrl, api, Farm } from '../lib/api';
import { CheckCircle2, Loader2, CircleDashed, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import AnalysisPipelineSnapshots from './AnalysisPipelineSnapshots';
import {
  PipelineStage,
  INITIAL_PIPELINE_STAGES,
  updatePipelineWithEvent,
  PipelineEvent
} from '../lib/pipelineStore';

interface PipelineProgressProps {
  farmId: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 'roi_definition',    label: '🎯 Defining Geodesic Region-of-Interest & Polygon Commitment...' },
  { id: 'satellite_imagery', label: '🛰️ Ingesting PlanetScope 3m & Sentinel-2 Surface Reflectance (L2A)...' },
  { id: 'cloud_masking',     label: '☁️ Executing s2cloudless Pixel Probability Decision Masking...' },
  { id: 'feature_extraction',label: '🌿 Computing Multi-Spectral Indices (NDVI / EVI / NDWI / NDMI)...' },
  { id: 'thresholding',      label: '🤖 Otsu Binary Thresholding & XGBoost Yield Loss Regression...' },
  { id: 'vectorize_extent',  label: '📐 Extracting Marching Squares Topological Damage Contours...' },
  { id: 'db_ledger',         label: '🔒 Generating Circom 2.0 Groth16 zk-SNARK & Mining Ledger Block...' },
];

export default function PipelineProgress({ farmId, onComplete }: PipelineProgressProps) {
  const { data, isConnected, disconnect } = useWebSocket(wsAnalysisUrl(farmId));
  const [stages, setStages]               = useState<PipelineStage[]>(INITIAL_PIPELINE_STAGES);
  const [isFinished, setIsFinished]       = useState(false);
  const [lastMessage, setLastMessage]     = useState<string>('Connecting to live analysis pipeline...');
  const [farm, setFarm]                   = useState<Farm | null>(null);

  useEffect(() => {
    if (!farmId) return;
    api.farms.get(farmId)
      .then(res => setFarm(res.data))
      .catch(err => console.error('[PipelineProgress] Failed to fetch farm:', err));
  }, [farmId]);

  useEffect(() => {
    if (!data) return;

    const event = data as PipelineEvent;
    if (event.message) setLastMessage(event.message);

    // Update the central stages state with new event
    setStages(prev => updatePipelineWithEvent(prev, event));

    // Terminal completion event
    const rawStage = event.stage || event.step;
    if (rawStage === 'done' && (event.status === 'completed' || event.status === 'complete')) {
      setIsFinished(true);
      setTimeout(() => {
        disconnect();
        onComplete();
      }, 800);
    }
  }, [data, onComplete, disconnect]);

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Snapshots Flow (Real-Time Live Images) */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5 shadow-xl">
        <AnalysisPipelineSnapshots
          stages={stages}
          farmName={farm?.name}
          cropType={farm?.crop_type}
          centerLat={farm?.center_lat}
          centerLon={farm?.center_lon}
          areaHa={farm?.area_hectares}
          allowDemoRun={false}
        />
      </div>

      {/* Progress execution logs */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-md font-mono text-sm">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-dark-700">
          <h3 className="text-white font-bold font-sans flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" /> Live Pipeline Execution Log
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            <span className="text-slate-300">
              {isFinished ? 'Complete & Verified' : isConnected ? 'Connected & Streaming Live EO' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="space-y-3.5">
          {STEPS.map((step) => {
            const stage = stages.find(s => s.id === step.id);
            const isComplete = stage?.status === 'completed' || isFinished;
            const isActive   = stage?.status === 'processing';
            const isPending  = stage?.status === 'pending' && !isFinished;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="w-7 flex justify-center shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  ) : (
                    <CircleDashed className="w-5 h-5 text-slate-700" />
                  )}
                </div>

                <div className="flex-1 flex justify-between items-center text-xs sm:text-sm">
                  <span className={
                    isComplete ? 'text-slate-300'
                    : isActive  ? 'text-primary-300 font-bold'
                    : 'text-slate-600'
                  }>
                    {step.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="text-primary-400 font-bold font-mono text-xs bg-primary-950/60 px-2 py-0.5 rounded border border-primary-500/30">
                        {stage?.progress || 50}%
                      </span>
                    )}
                    {isComplete && <span className="text-emerald-400 font-bold">✓ DONE</span>}
                    {isPending  && <span className="text-slate-700 text-xs">[waiting]</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {lastMessage && (
          <motion.p
            key={lastMessage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-3 border-t border-dark-700 text-xs text-primary-400/80 truncate flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>↳ {lastMessage}</span>
          </motion.p>
        )}
      </div>
    </div>
  );
}
