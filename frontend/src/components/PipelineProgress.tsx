import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { wsAnalysisUrl, api, Farm } from '../lib/api';
import { CheckCircle2, Loader2, CircleDashed, ShieldCheck, Activity, Satellite, Sparkles, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';
import AnalysisPipelineSnapshots from './AnalysisPipelineSnapshots';
import PrecisionSatelliteGISConsole from './PrecisionSatelliteGISConsole';
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
  const [viewMode, setViewMode]           = useState<'gis_console' | 'snapshots' | 'split'>('gis_console');

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
      }, 1200);
    }
  }, [data, onComplete, disconnect]);

  const activeStage = stages.find(s => s.status === 'processing') || stages[3];

  return (
    <div className="space-y-6">
      {/* Real-time View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-800 p-3 rounded-2xl border border-dark-700 shadow-md">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30">
            <Satellite className="w-4 h-4" />
          </span>
          <span className="font-bold text-white">Active Processing Mode:</span>
          <span className="text-emerald-400">Sentinel-2 MSI Multi-Spectral Ingestion</span>
        </div>

        <div className="flex items-center gap-1.5 bg-dark-900 p-1 rounded-xl border border-dark-700 text-xs font-mono">
          <button
            onClick={() => setViewMode('gis_console')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'gis_console'
                ? 'bg-primary-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>GIS Satellite Studio</span>
          </button>

          <button
            onClick={() => setViewMode('snapshots')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'snapshots'
                ? 'bg-primary-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>7-Stage Pipeline Flow</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-primary-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Precision GIS Satellite Console at Processing Time */}
      {(viewMode === 'gis_console' || viewMode === 'split') && (
        <div className="w-full">
          <PrecisionSatelliteGISConsole
            farmId={farmId}
            farmName={farm?.name || 'Registered Farm Parcel'}
            cropType={farm?.crop_type || 'Winter Rapeseed'}
            areaHa={farm?.area_hectares || 9.6}
            centerLat={farm?.center_lat || 49.8880}
            centerLon={farm?.center_lon || 28.8644}
            currentNdvi={0.41}
            baselineNdvi={0.68}
            isProcessing={!isFinished}
            activeProcessingStageTitle={activeStage?.title || 'Computing Indices'}
            activeProcessingProgress={activeStage?.progress || 70}
          />
        </div>
      )}

      {/* Visual 7-Stage Pipeline Snapshots Flow */}
      {(viewMode === 'snapshots' || viewMode === 'split') && (
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
      )}

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

