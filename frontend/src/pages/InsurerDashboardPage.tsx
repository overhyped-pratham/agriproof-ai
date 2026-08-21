import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Coins,
  TrendingUp,
  Activity,
  CheckCircle2,
  ExternalLink,
  Lock,
  Layers,
  MapPin,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function InsurerDashboardPage() {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<string>('CLM-4821');
  const [fraudResult, setFraudResult] = useState<any>(null);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [disbursing, setDisbursing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.insurer.getRiskHeatmap();
      setHeatmapData(res.data);
      if (res.data?.regions?.length > 0) {
        handleFraudCheck('CLM-AD9D3E02');
      }
    } catch (e) {
      console.error('Failed to load insurer heatmap:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFraudCheck = async (claimId: string) => {
    setSelectedClaim(claimId);
    try {
      const res = await api.insurer.getFraudCheck(claimId);
      setFraudResult(res.data);
    } catch (e) {
      console.error('Fraud check error:', e);
    }
  };

  const handleDisburse = async () => {
    setDisbursing(true);
    try {
      const res = await api.insurer.disbursePayout({
        claim_id: selectedClaim || 'CLM-AD9D3E02',
        wallet_address: '0x71C839561F03235b2e9871Eb3A839561F03235A2',
        amount_usdc: 3500.0,
      });
      setPayoutResult(res.data);
    } catch (e) {
      console.error('Payout failed:', e);
    } finally {
      setDisbursing(false);
    }
  };

  if (loading || !heatmapData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-primary-400" />
        <p className="font-semibold text-white">Loading Insurer Parametric Risk Matrix...</p>
      </div>
    );
  }

  const { summary, regions } = heatmapData;

  const chartData = regions.map((r: any) => ({
    name: r.name.split(' ')[0],
    coverage: r.total_coverage_usd / 1000,
    payouts: r.payouts_disbursed_usd / 1000,
    risk: r.risk_score,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* ── 1. Top Insurer Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-700 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Insurer Parametric Risk &amp; Settlement Dashboard
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time regional satellite hazard heatmaps, zero-trust cryptographic verification, and automated smart contract liquidity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> ZK VERIFICATION: ACTIVE
          </span>
          <button
            onClick={fetchData}
            className="p-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-lg border border-dark-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. Insurer KPI Metrics ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-1 shadow-lg">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-400" /> TOTAL INSURED POOL
          </span>
          <div className="text-2xl font-bold text-white">
            ${(summary.total_insured_value_usd / 1000000).toFixed(2)}M USD
          </div>
          <span className="text-[11px] text-slate-400">{summary.active_policies_count} Underwritten Policies</span>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-1 shadow-lg">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary-400" /> TOTAL PAYOUTS SETTLED
          </span>
          <div className="text-2xl font-bold text-primary-400">
            ${(summary.total_payouts_disbursed_usd / 1000).toFixed(0)}k USDC
          </div>
          <span className="text-[11px] text-emerald-400">Avg Settlement: {summary.automated_settlement_avg_seconds}s</span>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-1 shadow-lg">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-400" /> POOL SOLVENCY RATIO
          </span>
          <div className="text-2xl font-bold text-white">
            {(summary.pool_solvency_ratio * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-emerald-400">Over-Collateralized Risk</span>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-1 shadow-lg">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-400" /> ZK AUDIT INTEGRITY
          </span>
          <div className="text-2xl font-bold text-emerald-400">
            {summary.zk_proof_integrity_rate}
          </div>
          <span className="text-[11px] text-slate-400">Zero False Positives</span>
        </div>
      </div>

      {/* ── 3. Regional Risk Grid & Exposure Graph ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Regional Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-400" /> Regional Hazard Matrix &amp; Multi-Spectral Anomaly
            </h3>
            <span className="text-xs text-slate-400 font-mono">4 Monitored Zones</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {regions.map((reg: any) => (
              <div
                key={reg.region_id}
                className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-3 hover:border-primary-500/50 transition-all shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{reg.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{reg.dominant_crop} · {reg.active_policies} Farms</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    reg.risk_score > 70 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    RISK: {reg.risk_score}/100
                  </span>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Avg NDVI Drop:</span>
                    <span className="text-danger font-bold">-{reg.avg_ndvi_drop_pct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Drought Level:</span>
                    <span className="text-white">{reg.drought_severity}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Settled Payouts:</span>
                    <span className="text-primary-400 font-bold">${(reg.payouts_disbursed_usd / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                <div className="w-full bg-dark-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${reg.risk_score}%`,
                      backgroundColor: reg.risk_score > 70 ? '#ef4444' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Liquidity & Exposure Chart */}
        <div className="lg:col-span-5 bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-dark-700 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Coverage vs Settled Payouts ($k)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">By Region</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="coverage" fill="#10b981" radius={[4, 4, 0, 0]} name="Insured Pool ($k)" />
                <Bar dataKey="payouts" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Payouts ($k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 4. Automated Fraud Check & Smart Contract Payout Settlement ─────── */}
      <div className="bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-indigo-500/30 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-700 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Automated Satellite Fraud Prevention &amp; Web3 Smart Contract Settlement
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Claim: <strong className="text-primary-300">{selectedClaim}</strong> · Target: Patiala Farm, Punjab
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDisburse}
              disabled={disbursing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Coins className="w-4 h-4" />
              {disbursing ? 'Settling On-Chain...' : 'Execute Smart Contract Payout ($3,500 USDC)'}
            </button>
          </div>
        </div>

        {/* Fraud Prevention Objective Telemetry Checks */}
        {fraudResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {fraudResult.objective_checks?.map((chk: any) => (
              <div key={chk.check_name} className="bg-dark-800 p-3.5 rounded-xl border border-dark-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 truncate">{chk.check_name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {chk.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{chk.detail}</p>
                <div className="text-[10px] text-primary-400 font-bold">Confidence: {(chk.confidence * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        )}

        {/* On-Chain Settlement Receipt */}
        {payoutResult && (
          <div className="bg-dark-950 p-5 rounded-xl border border-emerald-500/40 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ON-CHAIN SETTLEMENT CONFIRMED (POLYGON PoS)
              </span>
              <span>Block #{payoutResult.block_number}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 text-[11px]">
              <div>Tx Hash: <span className="text-primary-300">{payoutResult.transaction_hash}</span></div>
              <div>Disbursed: <strong className="text-white">${payoutResult.payout_amount_usdc} USDC</strong></div>
              <div>Token: <span className="text-slate-400">{payoutResult.token_contract}</span></div>
              <div>Recipient: <span className="text-slate-400">{payoutResult.recipient_wallet}</span></div>
            </div>

            <div className="pt-2 border-t border-dark-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Gas Used: {payoutResult.gas_used} (Groth16 Verification)</span>
              <a
                href={payoutResult.explorer_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary-400 hover:underline flex items-center gap-1"
              >
                View on PolygonScan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
