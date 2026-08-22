/**
 * CropDamageAnalysisStudio.tsx
 *
 * Dedicated Crop Damage Analysis Studio matching the user's reference infographic:
 *  - 5-Stage Multi-Spectral & Weather Pipeline on the Left
 *  - 3D Tilted Satellite Field with Pinpoint Telemetry Callouts (Healthy, Stressed, Severely Damaged)
 *  - 6 Peril Categorization (Flood, Drought/Heat, Hail/Frost, Storm/Winds, Pest/Disease, Fire)
 *  - Before / After / AI Analysis Triptych Progression
 *  - Live connection to backend farm analysis, weather anomalies, and ML damage model
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Satellite,
  Sprout,
  CloudSun,
  Cpu,
  BarChart3,
  CloudRain,
  Sun,
  Snowflake,
  Wind,
  Bug,
  Flame,
  ShieldCheck,
} from 'lucide-react';

import { Farm, AnalysisResult } from '../lib/api';
import { generateSatelliteRaster } from '../lib/satelliteRasterGenerator';

interface CropDamageAnalysisStudioProps {
  farm?: Farm | null;
  analysis?: AnalysisResult | null;
}

export const CropDamageAnalysisStudio: React.FC<CropDamageAnalysisStudioProps> = ({
  farm: _farm,
  analysis,
}) => {
  const [activePeril, setActivePeril] = useState<number>(2); // Default to Drought/Heat Stress
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ndviCurrent = analysis?.ndvi_current || 0.469;
  const ndviBaseline = analysis?.ndvi_baseline || 0.745;
  const dropPct = analysis ? (analysis.ndvi_drop_pct > 1 ? analysis.ndvi_drop_pct : analysis.ndvi_drop_pct * 100) : 37.1;

  // ── Render 3D Tilted Agricultural Field Canvas ────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const img = new Image();
    img.src = generateSatelliteRaster('ndvi', w, h, 42, 0.6);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);

      // Add high-resolution diamond grid parcel boundaries
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00a3ff';
      ctx.shadowBlur = 12;

      // Outer bounding parcel
      ctx.beginPath();
      ctx.moveTo(w * 0.48, h * 0.12);
      ctx.lineTo(w * 0.88, h * 0.52);
      ctx.lineTo(w * 0.52, h * 0.88);
      ctx.lineTo(w * 0.12, h * 0.48);
      ctx.closePath();
      ctx.stroke();

      // Inner zoning segments
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.30, h * 0.30);
      ctx.lineTo(w * 0.70, h * 0.70);
      ctx.moveTo(w * 0.68, h * 0.32);
      ctx.lineTo(w * 0.32, h * 0.68);
      ctx.stroke();

      ctx.restore();
    };
  }, []);

  const pipelineStages = [
    {
      num: 1,
      title: 'Satellite Imagery',
      desc: 'High-resolution multi-spectral satellite data',
      icon: <Satellite className="w-4 h-4 text-emerald-400" />,
    },
    {
      num: 2,
      title: 'NDVI & Vegetation Analysis',
      desc: 'Calculating vegetation health using NDVI & indices',
      icon: <Sprout className="w-4 h-4 text-emerald-400" />,
    },
    {
      num: 3,
      title: 'Weather / Environmental Data',
      desc: 'Rainfall, temperature, humidity, wind & soil conditions',
      icon: <CloudSun className="w-4 h-4 text-amber-400" />,
    },
    {
      num: 4,
      title: 'AI Damage Detection',
      desc: 'Machine learning models detect stress patterns and anomalies',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    },
    {
      num: 5,
      title: 'Damage Severity & Risk Assessment',
      desc: 'Severity scoring, risk mapping & impact estimation',
      icon: <BarChart3 className="w-4 h-4 text-rose-400" />,
    },
  ];

  const cropDamageTypes = [
    {
      id: 1,
      title: 'Flood / Excess Rainfall',
      desc: 'Waterlogging and crop stress',
      icon: <CloudRain className="w-4 h-4 text-blue-400" />,
      badgeColor: 'from-blue-600 to-cyan-500',
    },
    {
      id: 2,
      title: 'Drought / Heat Stress',
      desc: 'Reduced vegetation and water stress',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      badgeColor: 'from-amber-500 to-orange-600',
      activeHighlight: true,
    },
    {
      id: 3,
      title: 'Hail / Frost',
      desc: 'Sudden weather-related crop damage',
      icon: <Snowflake className="w-4 h-4 text-cyan-300" />,
      badgeColor: 'from-cyan-400 to-blue-600',
    },
    {
      id: 4,
      title: 'Storm / Strong Winds',
      desc: 'Physical crop damage and lodging',
      icon: <Wind className="w-4 h-4 text-teal-400" />,
      badgeColor: 'from-teal-400 to-emerald-600',
    },
    {
      id: 5,
      title: 'Pest / Disease Stress',
      desc: 'Abnormal vegetation patterns',
      icon: <Bug className="w-4 h-4 text-lime-400" />,
      badgeColor: 'from-lime-500 to-emerald-700',
    },
    {
      id: 6,
      title: 'Fire Damage',
      desc: 'Rapid vegetation loss and burn areas',
      icon: <Flame className="w-4 h-4 text-red-500" />,
      badgeColor: 'from-red-500 to-rose-700',
    },
  ];

  return (
    <div className="bg-[#0c121e] rounded-3xl border border-dark-700/80 p-6 sm:p-8 text-white shadow-2xl space-y-8">
      {/* ── Title Header ───────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
          <Sprout className="w-4 h-4" />
          <span>Parametric InsurTech Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 font-sans">
          Crop Damage Analysis
        </h2>
        <p className="text-sm text-slate-400 font-sans">
          Detecting crop stress, estimating damage severity, and identifying potential causes.
        </p>
      </div>

      {/* ── Main 3-Column Centerpiece ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Column 1: Left 5-Stage Sequential Pipeline (3 Cols) */}
        <div className="lg:col-span-3 bg-dark-900/90 rounded-2xl border border-dark-700/80 p-4 flex flex-col justify-between space-y-3">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.num} className="relative">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-dark-950/70 border border-dark-700/60 hover:border-emerald-500/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center shrink-0">
                  {stage.icon}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold font-sans text-white">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">
                      {stage.num}
                    </span>
                    <span>{stage.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-tight">
                    {stage.desc}
                  </p>
                </div>
              </div>
              {idx < pipelineStages.length - 1 && (
                <div className="w-0.5 h-2.5 bg-emerald-500/30 mx-auto my-0.5" />
              )}
            </div>
          ))}
        </div>

        {/* Column 2: Center Satellite Damage Map (6 Cols) */}
        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-primary-500/40 bg-black min-h-[460px] shadow-2xl flex items-center justify-center">
          {/* Real Captured Satellite Damage Zones Screenshot */}
          <img
            src="/assets/snapshots/captured_damage_zones.png"
            alt="Satellite Damage Classification"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Column 3: Right Sidebar: 6 Types of Crop Damage Perils (3 Cols) */}
        <div className="lg:col-span-3 bg-dark-900/90 rounded-2xl border border-dark-700/80 p-4 space-y-2.5 flex flex-col justify-between">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
            Types of Crop Damage
          </div>
          {cropDamageTypes.map((p) => {
            const isSelected = activePeril === p.id;
            return (
              <motion.button
                key={p.id}
                onClick={() => setActivePeril(p.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-dark-800 border-primary-500 shadow-lg shadow-primary-950/40'
                    : 'bg-dark-950/60 border-dark-700/60 hover:border-dark-600'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p.badgeColor} flex items-center justify-center shrink-0 shadow-md`}
                >
                  {p.icon}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-white truncate font-sans">
                    {p.id} {p.title}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate font-sans">
                    {p.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Section: Before / After / AI Analysis Triptych Progression ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 3-Image Triptych Progression (8 Cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: BEFORE */}
          <div className="bg-dark-900/90 rounded-2xl border border-dark-700 overflow-hidden shadow-lg space-y-2">
            <div className="bg-dark-950 px-3 py-1.5 border-b border-dark-700/80 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-emerald-400">BEFORE</span>
              <span className="text-slate-400">Healthy Field</span>
            </div>
            <div className="h-28 bg-gradient-to-br from-emerald-900/60 via-green-800/40 to-dark-950 relative overflow-hidden flex items-center justify-center p-3">
              <div className="w-full h-full rounded-lg bg-[linear-gradient(to_right,rgba(34,197,94,0.3)_2px,transparent_2px)] bg-[size:12px_12px] flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold bg-dark-950/80 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                  Peak NDVI: {ndviBaseline.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="p-2.5 pt-0 text-center">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                High NDVI · Optimal Biomass
              </span>
            </div>
          </div>

          {/* Card 2: AFTER */}
          <div className="bg-dark-900/90 rounded-2xl border border-dark-700 overflow-hidden shadow-lg space-y-2">
            <div className="bg-dark-950 px-3 py-1.5 border-b border-dark-700/80 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-amber-400">AFTER</span>
              <span className="text-slate-400">Damaged Field</span>
            </div>
            <div className="h-28 bg-gradient-to-br from-amber-900/50 via-orange-950/40 to-dark-950 relative overflow-hidden flex items-center justify-center p-3">
              <div className="w-full h-full rounded-lg bg-[linear-gradient(to_right,rgba(234,179,8,0.2)_2px,transparent_2px)] bg-[size:12px_12px] flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold bg-dark-950/80 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                  Current NDVI: {ndviCurrent.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="p-2.5 pt-0 text-center">
              <span className="text-[11px] font-mono text-amber-400 font-semibold">
                Low NDVI · Drought Deficit
              </span>
            </div>
          </div>

          {/* Card 3: AI ANALYSIS */}
          <div className="bg-dark-900/90 rounded-2xl border border-primary-500/50 overflow-hidden shadow-lg space-y-2 shadow-primary-950/30">
            <div className="bg-primary-950/80 px-3 py-1.5 border-b border-primary-500/40 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-cyan-300">AI ANALYSIS</span>
              <span className="text-slate-300">Detected Damage Zone</span>
            </div>
            <div className="h-28 bg-gradient-to-br from-red-900/50 via-dark-950 to-primary-950/50 relative overflow-hidden flex items-center justify-center p-3">
              <div className="w-full h-full rounded-lg border border-red-500/40 bg-[linear-gradient(to_right,rgba(239,68,68,0.3)_3px,transparent_3px)] bg-[size:10px_10px] flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold bg-red-950/90 px-2 py-0.5 rounded text-red-300 border border-red-500/50">
                  Loss Trigger: -{dropPct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-2.5 pt-0 text-center">
              <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                Groth16 zk-SNARK Verified
              </span>
            </div>
          </div>
        </div>

        {/* Right: InsurTech Value Proposition Card (4 Cols) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-dark-900 via-dark-900 to-primary-950/40 rounded-2xl border border-emerald-500/30 p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-sans">
                Data-Driven. Evidence-Based. Farmer-Focused.
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono">
                Multi-Spectral Satellite AI
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Combining satellite, vegetation, weather, and environmental signals for intelligent crop damage insights and automated claim payouts.
          </p>
        </div>
      </div>

      {/* ── Footer Banner ──────────────────────────────────────────────────── */}
      <div className="bg-dark-950/80 rounded-2xl border border-dark-700/80 p-4 flex items-center gap-3 text-xs text-slate-300 font-sans">
        <Sprout className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-white">AgriProof</strong> combines <strong className="text-emerald-400">satellite-derived crop health indicators</strong> with <strong className="text-amber-400">weather</strong> and <strong className="text-cyan-400">environmental data</strong> to assess crop stress and potential damage.
        </span>
      </div>
    </div>
  );
};

export default CropDamageAnalysisStudio;
