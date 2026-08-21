import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { wsAnalysisUrl, api, Farm } from '../lib/api';
import { CheckCircle2, Loader2, CircleDashed } from 'lucide-react';
import { motion } from 'framer-motion';
import AnalysisPipelineSnapshots from './AnalysisPipelineSnapshots';

interface PipelineProgressProps {
  farmId: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 'satellite_fetch', label: '🛰️ Fetching satellite imagery (PlanetScope 3m + Sentinel-2)...' },
  { id: 'cloud_mask',      label: '☁️ Applying cloud masking (s2cloudless)...' },
  { id: 'index_calc',      label: '🌿 Computing NDVI / EVI / NDWI / NDMI indices...' },
  { id: 'weather_fetch',   label: '🌧️ Fetching real-time weather data (Open-Meteo)...' },
  { id: 'ml_analysis',     label: '🤖 Running XGBoost yield & damage AI models...' },
  { id: 'eligibility',     label: '📋 Evaluating insurance eligibility rules...' },
];

export default function PipelineProgress({ farmId, onComplete }: PipelineProgressProps) {
  const { data, isConnected, disconnect } = useWebSocket(wsAnalysisUrl(farmId));
  const [stepStatuses, setStepStatuses] = useState<Record<string, 'pending' | 'running' | 'complete'>>({});
  const [isFinished, setIsFinished]     = useState(false);
  const [lastMessage, setLastMessage]   = useState<string>('Connecting to analysis pipeline...');
  const [currentStep, setCurrentStep]   = useState<string>('satellite_fetch');
  const [farm, setFarm]                 = useState<Farm | null>(null);

  useEffect(() => {
    if (!farmId) return;
    api.farms.get(farmId)
      .then(res => setFarm(res.data))
      .catch(err => console.error('[PipelineProgress] Failed to fetch farm:', err));
  }, [farmId]);

  useEffect(() => {
    if (!data) return;

    const { step, status, message } = data as { step: string; status: string; message: string };

    if (message) setLastMessage(message);
    if (step) setCurrentStep(step);

    // Terminal "done" step — pipeline fully complete
    if (step === 'done' && status === 'complete') {
      const all: Record<string, 'complete'> = {};
      STEPS.forEach(s => { all[s.id] = 'complete'; });
      setStepStatuses(all);
      setIsFinished(true);
      disconnect();
      onComplete();
      return;
    }

    if (step && status) {
      setStepStatuses(prev => ({ ...prev, [step]: status as 'running' | 'complete' }));
    }
  }, [data, onComplete, disconnect]);

  const completedKeys = Object.keys(stepStatuses).filter(k => stepStatuses[k] === 'complete');
  if (isFinished) completedKeys.push('done');

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Snapshots Flow */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5 shadow-lg">
        <AnalysisPipelineSnapshots
          farmName={farm?.name}
          cropType={farm?.crop_type}
          centerLat={farm?.center_lat}
          centerLon={farm?.center_lon}
          areaHa={farm?.area_hectares}
          activeStepKey={currentStep}
          completedStepKeys={completedKeys}
        />
      </div>

      {/* Progress execution logs */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-md font-mono text-sm">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-dark-700">
          <h3 className="text-white font-bold font-sans">Live Pipeline Execution Log</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            {isFinished ? 'Complete' : isConnected ? 'Connected & Streaming' : 'Connecting...'}
          </div>
        </div>

        <div className="space-y-4">
          {STEPS.map((step) => {
            const status    = stepStatuses[step.id] ?? 'pending';
            const isComplete = status === 'complete' || isFinished;
            const isActive   = status === 'running';
            const isPending  = status === 'pending' && !isFinished;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  ) : (
                    <CircleDashed className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 flex justify-between items-center">
                  <span className={
                    isComplete ? 'text-slate-300'
                    : isActive  ? 'text-primary-400 font-semibold'
                    : 'text-slate-600'
                  }>
                    {step.label}
                  </span>
                  {isActive   && <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />}
                  {isComplete && <span className="text-success font-bold">✓</span>}
                  {isPending  && <span className="text-slate-600 text-xs">[waiting]</span>}
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
            className="mt-4 pt-3 border-t border-dark-700 text-xs text-slate-500 truncate"
          >
            ↳ {lastMessage}
          </motion.p>
        )}
      </div>
    </div>
  );
}
