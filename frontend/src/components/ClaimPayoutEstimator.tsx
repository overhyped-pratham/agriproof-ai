import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ClaimPayoutEstimate } from '../lib/api';
import {
  ShieldAlert,
  ShieldCheck,
  Coins,
  TrendingDown,
  Calculator,
  ArrowRight,
  AlertTriangle,
  Lock,
  CloudRain,
  Cpu,
  RefreshCw,
  Percent,
  Sprout,
  HelpCircle,
} from 'lucide-react';

interface ClaimPayoutEstimatorProps {
  farmId: string;
  onClaimSubmitted?: (claimId: string) => void;
}

export default function ClaimPayoutEstimator({ farmId, onClaimSubmitted }: ClaimPayoutEstimatorProps) {
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<ClaimPayoutEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  useEffect(() => {
    if (!farmId) return;
    fetchEstimate();
  }, [farmId]);

  const fetchEstimate = async () => {
    setLoading(true);
    try {
      const res = await api.claims.getEstimate(farmId);
      setEstimate(res.data);
    } catch (err) {
      console.error('[ClaimPayoutEstimator] Failed to fetch estimate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClaim = async () => {
    if (!farmId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.claims.create({ farm_id: farmId });
      if (onClaimSubmitted) {
        onClaimSubmitted(res.data.id || res.data.claim_id);
      } else {
        navigate(`/claim/${res.data.id || res.data.claim_id}`);
      }
    } catch (err) {
      console.error('[ClaimPayoutEstimator] Failed to submit claim:', err);
      alert('Failed to generate Zero-Knowledge claim. Please ensure satellite analysis is completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-primary-400" />
        <p className="font-semibold text-white">Calculating Parametric Payout Estimation from Satellite Analysis...</p>
      </div>
    );
  }

  if (!estimate) return null;

  const isEligible = estimate.claim_eligibility_status === 'ELIGIBLE';

  const severityBadgeColors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    MODERATE: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  };

  return (
    <div className="bg-dark-850 rounded-2xl border border-indigo-500/30 p-6 md:p-8 shadow-2xl space-y-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* ── 1. Top Section Header ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-700 pb-6">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-primary-600 rounded-xl text-white shadow-lg shadow-primary-950/40">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Insurance Claim &amp; Payout Estimation
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${severityBadgeColors[estimate.damage_severity]}`}>
                SEVERITY: {estimate.damage_severity}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Deterministic parametric evaluation derived directly from Sentinel-2 multi-spectral observations &amp; XGBoost yield predictions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
          <span className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1.5 ${
            isEligible ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          }`}>
            {isEligible ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {estimate.claim_eligibility_status}
          </span>
        </div>
      </div>

      {/* ── 2. Visual Value Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Card 1: Estimated Payout */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-5 rounded-xl border border-primary-500/40 shadow-lg space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-primary-400">
            <Coins className="w-16 h-16" />
          </div>
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-400" /> ESTIMATED PAYOUT
          </span>
          <div className="text-3xl font-black text-emerald-400">
            ₹{estimate.estimated_payout_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 block pt-1">
            Max: ₹{estimate.maximum_payout_allowed.toLocaleString('en-IN')} INR
          </span>
        </div>

        {/* Card 2: Overall Crop Damage */}
        <div className="bg-dark-800 p-5 rounded-xl border border-dark-700 space-y-1 shadow-md">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-danger" /> OVERALL CROP DAMAGE
          </span>
          <div className="text-2xl font-bold text-danger">
            {estimate.overall_crop_damage_pct.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400">
            Trigger Threshold: {estimate.policy_threshold_pct}%
          </span>
        </div>

        {/* Card 3: Total Insured Value */}
        <div className="bg-dark-800 p-5 rounded-xl border border-dark-700 space-y-1 shadow-md">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> TOTAL SUM INSURED
          </span>
          <div className="text-2xl font-bold text-white">
            ₹{estimate.total_insured_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">
            {estimate.area_hectares} ha · {estimate.crop_type}
          </span>
        </div>

        {/* Card 4: Analysis Confidence */}
        <div className="bg-dark-800 p-5 rounded-xl border border-dark-700 space-y-1 shadow-md">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-primary-400" /> AI CONFIDENCE SCORE
          </span>
          <div className="text-2xl font-bold text-primary-400">
            {estimate.analysis_confidence_score_pct.toFixed(1)}%
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> ZK Verifiable
          </span>
        </div>

      </div>

      {/* ── 3. Visual Connection: Analysis Factors to Claim Math ─────────────── */}
      <div className="bg-dark-900 p-6 rounded-2xl border border-dark-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary-400" /> Contributing Multi-Spectral &amp; Agronomic Factors
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Policy: <strong className="text-white">{estimate.policy_name}</strong> ({estimate.policy_id})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Factor 1: NDVI Decline */}
          <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" /> NDVI Decline
              </span>
              <span className="font-bold text-danger">-{estimate.ndvi_decline_pct}%</span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-danger rounded-full"
                style={{ width: `${Math.min(100, estimate.ndvi_decline_pct * 1.5)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">Canopy vigor loss vs 5-yr baseline</span>
          </div>

          {/* Factor 2: Stressed Crop Area */}
          <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Stressed Crop Area
              </span>
              <span className="font-bold text-warning">{estimate.stressed_crop_area_pct}%</span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-warning rounded-full"
                style={{ width: `${Math.min(100, estimate.stressed_crop_area_pct)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              {(estimate.area_hectares * (estimate.stressed_crop_area_pct / 100)).toFixed(1)} ha under acute stress
            </span>
          </div>

          {/* Factor 3: AI Predicted Yield Loss */}
          <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-primary-400" /> AI Predicted Loss
              </span>
              <span className="font-bold text-primary-400">{estimate.ai_predicted_yield_loss_pct}%</span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full"
                style={{ width: `${Math.min(100, estimate.ai_predicted_yield_loss_pct * 1.5)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">XGBoost harvest regression</span>
          </div>

          {/* Factor 4: Weather Anomaly Contribution */}
          <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-indigo-400" /> Weather Contribution
              </span>
              <span className="font-bold text-indigo-300">{estimate.weather_anomaly_contribution_pct}%</span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${Math.min(100, estimate.weather_anomaly_contribution_pct)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">Rainfall deficit / thermal shock</span>
          </div>

        </div>

        {/* ── 4. Transparent Mathematical Formula Breakdown Accordion ────────── */}
        <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFormulaDetails(!showFormulaDetails)}>
            <div className="flex items-center gap-2 text-primary-300 font-bold">
              <Calculator className="w-4 h-4" />
              <span>Transparent Payout Calculation Pipeline</span>
            </div>
            <button className="text-xs text-slate-400 hover:text-white underline">
              {showFormulaDetails ? 'Hide Calculation Steps' : 'View Calculation Steps'}
            </button>
          </div>

          {showFormulaDetails && (
            <div className="pt-3 border-t border-dark-800 space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-primary-400 font-bold">Step 1 (Base Coverage):</span>
                <span>{estimate.formula_breakdown.base_coverage}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400 font-bold">Step 2 (Damage Weighting):</span>
                <span>{estimate.formula_breakdown.damage_weighting}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-400 font-bold">Step 3 (Payout Factor):</span>
                <span>{estimate.formula_breakdown.payout_factor}</span>
              </div>
              <div className="flex items-start gap-2 text-emerald-400 font-bold">
                <span>Result:</span>
                <span>{estimate.formula_breakdown.final_formula}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Mandatory Disclaimer & Claim Submission Trigger ──────────────── */}
      <div className="bg-dark-900 p-5 rounded-2xl border border-dark-700 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Prominent Legal / Parametric Disclaimer */}
        <div className="flex items-start gap-3">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-amber-300/90 font-mono">
              ⚠️ {estimate.payout_disclaimer}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Evidence Status: <strong className="text-emerald-400 font-mono">{estimate.evidence_verification_status}</strong> via SHA-256 block hash and Circom BN128 zk-SNARK constraints.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerateClaim}
          disabled={!isEligible || isSubmitting}
          className={`px-8 py-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all shrink-0 w-full md:w-auto shadow-xl ${
            isEligible
              ? 'bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-600 hover:from-primary-500 hover:to-emerald-500 text-white shadow-primary-950/60 hover:scale-[1.02]'
              : 'bg-dark-800 text-slate-500 border border-dark-700 cursor-not-allowed'
          }`}
        >
          <Lock className="w-4 h-4" />
          {isSubmitting
            ? 'Evaluating Groth16 zk-SNARK...'
            : isEligible
            ? `Submit Verified Claim ($${estimate.estimated_payout_amount.toLocaleString()})`
            : 'Claim Criteria Not Met'}
          {isEligible && !isSubmitting && <ArrowRight className="w-4 h-4" />}
        </button>

      </div>

    </div>
  );
}
