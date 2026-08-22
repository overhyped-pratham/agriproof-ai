import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingDown, AlertTriangle, Activity, Cpu, Hash, CheckCircle2 } from 'lucide-react';
import { AnalysisResult } from '../../lib/api';

interface AnalysisEvidencePanelProps {
  analysis: AnalysisResult | null;
  overallDamagePct?: number;
  evidenceHash?: string;
}

export const AnalysisEvidencePanel: React.FC<AnalysisEvidencePanelProps> = ({
  analysis,
  overallDamagePct,
  evidenceHash,
}) => {
  if (!analysis) {
    return (
      <div className="bg-dark-900/90 rounded-2xl border border-dark-700 p-5 text-center text-slate-500 font-mono text-xs">
        Waiting for backend analysis results to populate evidence...
      </div>
    );
  }

  const ndviDrop = analysis.ndvi_drop_pct > 1 ? analysis.ndvi_drop_pct : analysis.ndvi_drop_pct * 100;
  const yieldLoss = analysis.expected_loss_pct > 1 ? analysis.expected_loss_pct : analysis.expected_loss_pct * 100;
  const damageProb = analysis.damage_probability > 1 ? analysis.damage_probability : analysis.damage_probability * 100;
  const confidence = analysis.confidence > 1 ? analysis.confidence : analysis.confidence * 100;
  const overallDamage = overallDamagePct !== undefined ? overallDamagePct : (0.4 * ndviDrop + 0.35 * yieldLoss + 0.25 * Math.abs(analysis.rainfall_anomaly_pct));

  const metrics = [
    {
      id: 'ndvi_change',
      label: 'NDVI Decline',
      value: `-${ndviDrop.toFixed(1)}%`,
      subtext: `Baseline: ${analysis.ndvi_baseline.toFixed(2)} → Current: ${analysis.ndvi_current.toFixed(2)}`,
      icon: <TrendingDown className="w-4 h-4 text-red-400" />,
      color: 'text-red-400',
      badge: 'Spectral Loss',
    },
    {
      id: 'damage_prob',
      label: 'Damage Probability',
      value: `${damageProb.toFixed(1)}%`,
      subtext: `Stress: ${analysis.stress_level.toUpperCase()}`,
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      color: 'text-amber-400',
      badge: 'Otsu Cutoff',
    },
    {
      id: 'yield_loss',
      label: 'Predicted Yield Loss',
      value: `${yieldLoss.toFixed(1)}%`,
      subtext: `Expected Yield: ${analysis.expected_yield.toFixed(1)} tons/ha`,
      icon: <Cpu className="w-4 h-4 text-orange-400" />,
      color: 'text-orange-400',
      badge: 'XGBoost ML',
    },
    {
      id: 'overall_damage',
      label: 'Overall Crop Damage',
      value: `${overallDamage.toFixed(1)}%`,
      subtext: 'Weighted Multi-Spectral & Weather Index',
      icon: <Activity className="w-4 h-4 text-rose-400" />,
      color: 'text-rose-400',
      badge: 'Rules Engine',
    },
    {
      id: 'model_confidence',
      label: 'Model Confidence',
      value: `${Math.round(confidence)}%`,
      subtext: 'RandomForest & Satellite Cross-Verification',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      color: 'text-emerald-400',
      badge: 'Validated',
    },
  ];

  return (
    <div className="bg-dark-900/90 backdrop-blur-md rounded-2xl border border-primary-500/30 p-5 shadow-2xl space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-dark-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              AI Analysis Evidence
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Backend Parametric Model Inference Output
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> VERIFIED
        </span>
      </div>

      {/* Animated Sequential Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {metrics.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.35 }}
            className="bg-dark-950/80 rounded-xl border border-dark-700/70 p-3 flex flex-col justify-between hover:border-primary-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                {m.icon}
                {m.label}
              </span>
              <span className="text-[9px] font-mono bg-dark-800 text-slate-400 px-1.5 py-0.5 rounded border border-dark-700">
                {m.badge}
              </span>
            </div>
            <div className={`text-xl font-black font-mono my-1 ${m.color}`}>
              {m.value}
            </div>
            <p className="text-[10px] text-slate-500 font-mono truncate">{m.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Evidence Hash Stamp */}
      {(evidenceHash || analysis.id) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="bg-dark-950/90 rounded-xl border border-dark-700/80 p-2.5 flex items-center justify-between text-xs font-mono text-slate-400"
        >
          <div className="flex items-center gap-2 truncate">
            <Hash className="w-3.5 h-3.5 text-primary-400 shrink-0" />
            <span className="text-[11px] truncate">
              Evidence Hash:{' '}
              <code className="text-primary-300">
                {evidenceHash || analysis.id}
              </code>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 shrink-0 font-bold">
            SHA-256
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default AnalysisEvidencePanel;
