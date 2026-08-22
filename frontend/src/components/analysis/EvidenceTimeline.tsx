import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Satellite, ScanLine, Activity, AlertTriangle, Cpu, ShieldCheck } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  status: 'completed' | 'processing' | 'waiting';
  timestamp?: string;
}

interface EvidenceTimelineProps {
  currentStageId?: string;
  completedStages?: string[];
  isCompleted?: boolean;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  currentStageId,
  completedStages = [],
  isCompleted = false,
}) => {
  const steps: TimelineStep[] = [
    {
      id: 'satellite_observation',
      label: 'Satellite Observation',
      sublabel: 'PlanetScope 3m & Sentinel-2 Ingest',
      icon: <Satellite className="w-4 h-4" />,
      status: isCompleted || completedStages.includes('satellite_imagery') || completedStages.includes('roi_definition') ? 'completed' : currentStageId === 'satellite_imagery' || currentStageId === 'roi_definition' ? 'processing' : 'waiting',
    },
    {
      id: 'spectral_scan',
      label: 'Spectral Scan',
      sublabel: 's2cloudless & Surface Reflectance',
      icon: <ScanLine className="w-4 h-4" />,
      status: isCompleted || completedStages.includes('cloud_masking') ? 'completed' : currentStageId === 'cloud_masking' ? 'processing' : 'waiting',
    },
    {
      id: 'ndvi_calculation',
      label: 'NDVI Calculation',
      sublabel: 'Canopy Vigour & EVI / NDWI Extraction',
      icon: <Activity className="w-4 h-4" />,
      status: isCompleted || completedStages.includes('feature_extraction') ? 'completed' : currentStageId === 'feature_extraction' ? 'processing' : 'waiting',
    },
    {
      id: 'crop_stress_detection',
      label: 'Crop Stress Detection',
      sublabel: 'Otsu Loss Cutoff & Deficit Segmentation',
      icon: <AlertTriangle className="w-4 h-4" />,
      status: isCompleted || completedStages.includes('thresholding') ? 'completed' : currentStageId === 'thresholding' ? 'processing' : 'waiting',
    },
    {
      id: 'ml_damage_prediction',
      label: 'ML Damage Prediction',
      sublabel: 'XGBoost & RandomForest Yield Models',
      icon: <Cpu className="w-4 h-4" />,
      status: isCompleted || completedStages.includes('vectorize_extent') ? 'completed' : currentStageId === 'vectorize_extent' ? 'processing' : 'waiting',
    },
    {
      id: 'claim_assessment',
      label: 'Claim Assessment',
      sublabel: 'Groth16 zk-SNARK & Ledger Commit',
      icon: <ShieldCheck className="w-4 h-4" />,
      status: isCompleted || completedStages.includes('db_ledger') ? 'completed' : currentStageId === 'db_ledger' ? 'processing' : 'waiting',
    },
  ];

  return (
    <div className="bg-dark-900/90 backdrop-blur-md rounded-2xl border border-dark-700 p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-dark-700/80 pb-2.5">
        <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
          Visual Evidence Timeline
        </h4>
        <span className="text-[10px] font-mono text-primary-400">
          {isCompleted ? '6/6 Stages Verified' : 'Real-Time Job Sync'}
        </span>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const isDone = step.status === 'completed';
          const isProc = step.status === 'processing';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                isProc
                  ? 'bg-primary-950/60 border border-primary-500/40 shadow-sm'
                  : isDone
                  ? 'bg-dark-950/60 border border-emerald-500/20'
                  : 'bg-dark-950/30 border border-dark-800 opacity-50'
              }`}
            >
              {/* Status Icon */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isProc
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                    : 'bg-dark-800 text-slate-600'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isProc ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold truncate ${
                      isDone ? 'text-white' : isProc ? 'text-primary-300' : 'text-slate-500'
                    }`}
                  >
                    {idx + 1}. {step.label}
                  </span>
                  <span className="text-[10px] font-mono shrink-0 ml-2">
                    {isDone ? (
                      <span className="text-emerald-400 font-bold">✓ completed</span>
                    ) : isProc ? (
                      <span className="text-primary-400 font-bold">⏳ processing</span>
                    ) : (
                      <span className="text-slate-600">○ waiting</span>
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">{step.sublabel}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default EvidenceTimeline;
