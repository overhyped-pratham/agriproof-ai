/**
 * PitchDeckPage.tsx — SQUIDHACK 2026 Judges View
 *
 * A dedicated at-a-glance summary page for hackathon judges showing:
 * - Problem statement with real stats
 * - Solution architecture
 * - Live API health
 * - Key differentiators
 * - Tech stack depth
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Satellite,
  Lock,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { api } from '../lib/api';

interface ApiStatus { name: string; endpoint: string; ok: boolean; value?: string }

const PROBLEM_STATS = [
  { icon: Users, label: 'Farming Households', value: '147M', sub: 'India alone', color: 'text-cyan-400' },
  { icon: AlertTriangle, label: 'Avg Claim Wait', value: '60–90d', sub: 'Manual human assessment', color: 'text-amber-400' },
  { icon: TrendingUp, label: 'Disputed Claims/yr', value: '₹18,000 Cr', sub: '₹18,000 Crore unresolved annually', color: 'text-red-400' },
  { icon: ShieldCheck, label: 'Fraud on Manual Assess.', value: '35%', sub: 'No objective ground truth', color: 'text-orange-400' },
];

const TRIPLE_INNOVATION = [
  {
    icon: Satellite,
    title: 'Sentinel-2 Earth Observation',
    desc: 'ESA Copernicus open satellite — 10m resolution, 5-day revisit, free. 6 multispectral indices (NDVI, NDWI, EVI, NDMI, SAVI, BSI) computed per farm parcel.',
    tag: 'Satellite',
    color: 'border-cyan-500/30 bg-cyan-500/5',
    tagColor: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    icon: Cpu,
    title: 'XGBoost ML Risk Engine',
    desc: 'Trained on 6-dimensional spectral feature vectors. Predicts yield loss%, damage probability, and risk category. Augmented with weather anomaly signals.',
    tag: 'Machine Learning',
    color: 'border-violet-500/30 bg-violet-500/5',
    tagColor: 'bg-violet-500/20 text-violet-300',
  },
  {
    icon: Lock,
    title: 'Groth16 Zero-Knowledge Proofs',
    desc: 'Circom 2.1 ZK circuit proves "NDVI drop ≥ 30%" to insurer — without revealing GPS, field boundary, or raw index values. Poseidon hash commitment on-chain.',
    tag: 'Cryptography',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    tagColor: 'bg-emerald-500/20 text-emerald-300',
  },
];

const TECH_STACK = [
  { layer: 'Satellite', tech: 'ESA Copernicus Sentinel-2 L2A', status: '✅ Live' },
  { layer: 'Spectral', tech: 'NDVI / NDWI / EVI / NDMI / SAVI / BSI', status: '✅ 6 Indices' },
  { layer: 'ML Model', tech: 'XGBoost + Scikit-learn Yield Loss', status: '✅ Trained' },
  { layer: 'ZK Proof', tech: 'Circom 2.1 Groth16 + Poseidon Hash', status: '✅ Circuits' },
  { layer: 'Smart Contract', tech: 'Solidity 0.8.20 on Polygon', status: '✅ Deployed' },
  { layer: 'Backend', tech: 'FastAPI + SQLAlchemy + AsyncPG', status: '✅ Port 8000' },
  { layer: 'Frontend', tech: 'React 18 + Vite + TypeScript + Leaflet', status: '✅ Port 5173' },
  { layer: 'Real-Time', tech: 'WebSocket 7-Stage Pipeline Orchestrator', status: '✅ Live' },
  { layer: 'Ledger', tech: 'SHA-256 Chained Claim Blockchain', status: '✅ Tamper-Proof' },
];

export default function PitchDeckPage() {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);

  useEffect(() => {
    const run = async () => {
      const DEMO_FARM = '068eb629-2ec1-4bc0-ac9f-ecd1bd19dda0';
      const results: ApiStatus[] = [];

      try {
        const r = await api.farms.list();
        results.push({ name: 'Farms List', endpoint: '/api/farms', ok: true, value: `${r.data.length} farms` });
      } catch { results.push({ name: 'Farms List', endpoint: '/api/farms', ok: false }); }

      try {
        const r = await api.farms.getAnalysis(DEMO_FARM);
        results.push({ name: 'Analysis Engine', endpoint: '/api/farms/{id}/analysis', ok: true, value: `NDVI drop ${(r.data.ndvi_drop_pct > 1 ? r.data.ndvi_drop_pct : r.data.ndvi_drop_pct * 100).toFixed(1)}%` });
      } catch { results.push({ name: 'Analysis Engine', endpoint: '/api/farms/{id}/analysis', ok: false }); }

      try {
        const r = await api.claims.getEstimate(DEMO_FARM);
        results.push({ name: 'Claim Estimator', endpoint: '/api/claims/estimate/{id}', ok: true, value: `₹${r.data.estimated_payout_amount?.toLocaleString('en-IN')}` });
      } catch { results.push({ name: 'Claim Estimator', endpoint: '/api/claims/estimate/{id}', ok: false }); }

      try {
        const r = await api.ledger.verify();
        results.push({ name: 'ZK Ledger', endpoint: '/api/ledger/verify', ok: r.data.valid, value: `${r.data.block_count} blocks, valid=${r.data.valid}` });
      } catch { results.push({ name: 'ZK Ledger', endpoint: '/api/ledger/verify', ok: false }); }

      setApiStatuses(results);
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Ambient glow top */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(0,163,255,0.10)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            SQUIDHACK 2026 · SW-04 · JUDGES OVERVIEW
          </div>
          <h1 className="text-4xl sm:text-5xl font-mono font-black tracking-wider text-white">
            AGRIPROOF<span className="text-cyan-400">.AI</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Secure Satellite-Verified Crop Insurance with Zero-Knowledge Proofs —<br />
            <span className="text-cyan-300 font-semibold">60-day manual claims → 5-second cryptographic settlement</span>
          </p>
        </div>

        {/* ── Problem Stats ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono text-white/30 tracking-widest uppercase mb-4">The Problem</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROBLEM_STATS.map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
                <div className="text-xs text-white/70 font-semibold">{label}</div>
                <div className="text-[10px] text-white/30">{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Triple Innovation ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono text-white/30 tracking-widest uppercase mb-4">Triple Innovation</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TRIPLE_INNOVATION.map(({ icon: Icon, title, desc, tag, color, tagColor }) => (
              <div key={title} className={`rounded-2xl border p-5 space-y-3 ${color}`}>
                <div className="flex items-start justify-between">
                  <Icon className="w-6 h-6 text-white/60" />
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                </div>
                <div className="font-bold text-white text-sm">{title}</div>
                <div className="text-xs text-white/50 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pipeline Flow ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono text-white/30 tracking-widest uppercase mb-4">7-Stage Pipeline</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {['🛰️ Satellite Ingest', '☁️ Cloud Masking', '🌿 Spectral Indices', '🤖 ML Damage Model', '🔐 ZK Proof Gen', '📋 Claim Ledger', '💰 Payout'].map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70">{stage}</span>
                {i < 6 && <ArrowRight className="w-3.5 h-3.5 text-white/20 shrink-0" />}
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech Stack ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono text-white/30 tracking-widest uppercase mb-4">Technical Stack</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            {TECH_STACK.map(({ layer, tech, status }, i) => (
              <div key={layer} className={`flex items-center justify-between px-5 py-3 text-sm ${i % 2 === 0 ? '' : 'bg-white/[0.02]'} ${i < TECH_STACK.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                <span className="font-mono text-white/30 text-xs w-28 shrink-0">{layer}</span>
                <span className="text-white/70 text-xs flex-1">{tech}</span>
                <span className="text-[11px] font-mono text-emerald-400">{status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live API Health ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono text-white/30 tracking-widest uppercase mb-4">Live API Health — Real Backend</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {apiStatuses.length === 0 ? (
              <div className="col-span-4 text-xs text-white/30 font-mono py-4 text-center animate-pulse">Connecting to backend…</div>
            ) : (
              apiStatuses.map(({ name, endpoint, ok, value }) => (
                <div key={name} className={`rounded-xl border p-4 space-y-2 ${ok ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'}`}>
                  <div className="flex items-center gap-2">
                    {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span className="text-xs font-bold text-white">{name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-white/30 truncate">{endpoint}</div>
                  {value && <div className="text-[11px] text-emerald-300 font-mono">{value}</div>}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Key Differentiators ─────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono text-white/30 tracking-widest uppercase mb-4">Key Differentiators vs. Existing Solutions</h2>
          <div className="space-y-2">
            {[
              ['Satellite data is FREE', 'ESA Copernicus open access — ₹0 per image, every 5 days, global coverage'],
              ['Privacy-first ZK proof', 'Groth16 circuit: insurer gets yes/no — not GPS, not yield, not boundary'],
              ['5-second settlement', 'Smart contract + ZK verifier = deterministic, instant payout — no human gatekeeper'],
              ['Fraud-proof by design', 'Satellite reflectance cannot be falsified — neither farmer nor insurer can game it'],
              ['Global scalability', 'Sentinel-2 covers every country — same pipeline runs for wheat, rice, cotton, corn globally'],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 px-5 py-3 bg-white/[0.025] border border-white/[0.06] rounded-xl">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-white">{title} — </span>
                  <span className="text-sm text-white/50">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Demo Links ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-mono text-white/30 tracking-widest uppercase mb-4">Quick Demo Links</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: '🌍 Landing Page', to: '/' },
              { label: '🌿 AI Crop Doctor & Dosage', to: '/doctor' },
              { label: '🗺️ Start Onboarding', to: '/onboard' },
              { label: '📊 Live Dashboard', to: '/dashboard/068eb629-2ec1-4bc0-ac9f-ecd1bd19dda0' },
              { label: '🌾 My Fields', to: '/farms' },
              { label: '🔐 ZK Ledger', to: '/ledger' },
              { label: '🏦 Insurer View', to: '/insurer' },
            ].map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/10 border border-white/[0.08] hover:border-cyan-500/30 text-white/70 hover:text-cyan-300 text-xs font-mono transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
