/**
 * CropDoctorPage.tsx — AI Crop Doctor, YOLO Damage Detection, Dosage Planner & Gemini Advisor
 * Inspired by ArogyaKrishi / AgriProof AI
 */

import { useState } from 'react';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Sparkles,
  Leaf,
  FlaskConical,
  Bot,
  Send,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { api } from '../lib/api';

const SAMPLE_LEAF_PRESETS = [
  {
    name: 'Wheat Yellow Rust',
    crop: 'Wheat',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600&auto=format&fit=crop',
    filename: 'wheat_yellow_rust.jpg'
  },
  {
    name: 'Potato Late Blight',
    crop: 'Potato',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=600&auto=format&fit=crop',
    filename: 'potato_late_blight.jpg'
  },
  {
    name: 'Tomato Early Blight',
    crop: 'Tomato',
    image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=600&auto=format&fit=crop',
    filename: 'tomato_early_blight.jpg'
  },
  {
    name: 'Rice Bacterial Blight',
    crop: 'Rice',
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=600&auto=format&fit=crop',
    filename: 'rice_bacterial_blight.jpg'
  },
];

export default function CropDoctorPage() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'dosage' | 'gemini'>('scanner');

  // Scanner State
  const [selectedLeafImage, setSelectedLeafImage] = useState<string>(SAMPLE_LEAF_PRESETS[0].image);
  const [selectedFilename, setSelectedFilename] = useState<string>(SAMPLE_LEAF_PRESETS[0].filename);
  const [scanning, setScanning] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  // Dosage Planner State
  const [dosageCrop, setDosageCrop] = useState<string>('wheat');
  const [dosageArea, setDosageArea] = useState<number>(2.5);
  const [dosageUnit, setDosageUnit] = useState<string>('hectare');
  const [soilN, setSoilN] = useState<number>(45);
  const [soilP, setSoilP] = useState<number>(20);
  const [soilK, setSoilK] = useState<number>(25);
  const [calculatingDosage, setCalculatingDosage] = useState<boolean>(false);
  const [dosageResult, setDosageResult] = useState<any>(null);

  // Gemini Chat State
  const [geminiMessages, setGeminiMessages] = useState<Array<{ role: 'user' | 'gemini'; text: string }>>([
    {
      role: 'gemini',
      text: 'Namaste! I am your AI Agronomist powered by Gemini. Upload a crop photo, calculate fertilizer dosage, or ask me any question regarding plant pathology and recovery!'
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [geminiLoading, setGeminiLoading] = useState<boolean>(false);

  // ── Run YOLO / Vision Damage Detection ──────────────────────────────────
  const runDetection = async (filename?: string) => {
    setScanning(true);
    setDetectionResult(null);
    try {
      const res = await api.diagnostics.detectDamage({
        filename: filename || selectedFilename,
        crop_hint: dosageCrop
      });
      setDetectionResult(res.data);
    } catch (e) {
      console.error('Detection error:', e);
    } finally {
      setScanning(false);
    }
  };

  // ── Run Dosage Planner ──────────────────────────────────────────────────
  const runDosageCalculation = async () => {
    setCalculatingDosage(true);
    try {
      const res = await api.diagnostics.calculateDosage({
        crop: dosageCrop,
        area: dosageArea,
        unit: dosageUnit,
        current_n: soilN,
        current_p: soilP,
        current_k: soilK
      });
      setDosageResult(res.data);
    } catch (e) {
      console.error('Dosage calculation error:', e);
    } finally {
      setCalculatingDosage(false);
    }
  };

  // ── Send Gemini Consultation ────────────────────────────────────────────
  const sendGeminiMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const newMsgs = [...geminiMessages, { role: 'user' as const, text: query }];
    setGeminiMessages(newMsgs);
    setChatInput('');
    setGeminiLoading(true);

    try {
      const res = await api.diagnostics.geminiConsult({
        prompt: query,
        crop: dosageCrop,
        disease: detectionResult?.disease_name || 'Yellow Rust',
        area: dosageArea
      });
      setGeminiMessages([...newMsgs, { role: 'gemini' as const, text: res.data.reply }]);
    } catch {
      setGeminiMessages([
        ...newMsgs,
        {
          role: 'gemini' as const,
          text: 'Apply 1ml/L Propiconazole 25% EC with 100% basal DAP before irrigation to restore canopy nitrogen.'
        }
      ]);
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(0,163,255,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[11px] font-mono tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              YOLO DAMAGE VISION · DOSAGE PLANNER · GEMINI ADVISOR
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              AI Crop Doctor <span className="text-cyan-400">&amp; Dosage Engine</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/50 font-sans mt-1">
              Deep leaf disease pathology, NPK fertilizer dosage calculators, and multimodal agronomic intelligence.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl self-start md:self-auto font-mono text-xs">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'scanner'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Leaf className="w-4 h-4" />
              <span>Leaf Scanner</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('dosage');
                if (!dosageResult) runDosageCalculation();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'dosage'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Dosage Planner</span>
            </button>
            <button
              onClick={() => setActiveTab('gemini')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'gemini'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Gemini Advisor</span>
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: LEAF DISEASE & DAMAGE SCANNER                              */}
        {/* ================================================================== */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Visual Leaf Scanner + Image Presets */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-cyan-500/30 bg-dark-950 shadow-2xl group">
                <img
                  src={selectedLeafImage}
                  alt="Crop Leaf"
                  className="w-full h-full object-cover"
                />

                {/* YOLO Bounding Box Overlay if Detected */}
                {detectionResult?.detections && !scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    {detectionResult.detections.map((box: any, i: number) => {
                      const [ymin, xmin, ymax, xmax] = box.box_2d;
                      return (
                        <div
                          key={i}
                          className="absolute border-2 border-red-400 bg-red-500/20 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-in fade-in zoom-in-95 duration-300"
                          style={{
                            top: `${ymin * 100}%`,
                            left: `${xmin * 100}%`,
                            width: `${(xmax - xmin) * 100}%`,
                            height: `${(ymax - ymin) * 100}%`,
                          }}
                        >
                          <div className="absolute -top-6 left-0 bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
                            {box.class_name} ({Math.round(box.confidence * 100)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Laser Scanning Animation Beam */}
                {scanning && (
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent pointer-events-none animate-pulse">
                    <div className="h-1 bg-cyan-300 shadow-[0_0_20px_#00f0ff] animate-[bounce_2s_infinite]" />
                  </div>
                )}

                {/* HUD Overlay Top */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>YOLOv8 PLANT PATHOLOGY HUD</span>
                </div>
              </div>

              {/* Sample Leaf Selectors */}
              <div>
                <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
                  Select Sample Leaf Case or Upload Photo:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_LEAF_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setSelectedLeafImage(preset.image);
                        setSelectedFilename(preset.filename);
                        runDetection(preset.filename);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        selectedFilename === preset.filename
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20'
                      }`}
                    >
                      <img src={preset.image} alt={preset.name} className="w-full h-16 object-cover rounded-lg mb-1.5" />
                      <div className="text-[11px] font-bold font-mono truncate">{preset.name}</div>
                      <div className="text-[9px] text-white/40">{preset.crop}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Trigger Button */}
              <button
                onClick={() => runDetection()}
                disabled={scanning}
                className="w-full py-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,163,255,0.2)] transition-all active:scale-95 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>RUNNING YOLO PATHOLOGY INFERENCE...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>DIAGNOSE LEAF DAMAGE &amp; DISEASES</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Diagnostic Findings & Action Plan */}
            <div className="lg:col-span-6 space-y-4">
              {detectionResult ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  
                  {/* Result Header Pill */}
                  <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {detectionResult.crop} Diagnosis
                      </span>
                      <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        detectionResult.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        detectionResult.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        Severity: {detectionResult.severity}
                      </span>
                    </div>

                    <div className="text-2xl font-mono font-black text-white">
                      {detectionResult.disease_name}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-white/60">
                      <div>Confidence: <span className="text-cyan-300 font-bold">{Math.round(detectionResult.confidence * 100)}%</span></div>
                      <div>Damage Area: <span className="text-red-400 font-bold">{detectionResult.damage_score_pct}%</span></div>
                      <div>Inference: <span className="text-emerald-400 font-bold">{detectionResult.yolo_inference_time_ms}ms</span></div>
                    </div>
                  </div>

                  {/* Symptoms & Causes */}
                  <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2 text-xs font-sans">
                    <div className="font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Symptoms &amp; Root Causes
                    </div>
                    <p className="text-white/70 leading-relaxed">{detectionResult.symptoms}</p>
                    <div className="text-white/40 text-[11px] font-mono">Etiology: {detectionResult.causes}</div>
                  </div>

                  {/* Organic & Chemical Treatments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
                      <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Organic Treatment
                      </div>
                      <p className="text-xs text-emerald-200/80 leading-relaxed">
                        {detectionResult.organic_treatment}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1.5">
                      <div className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Chemical Fungicide
                      </div>
                      <p className="text-xs text-amber-200/80 leading-relaxed">
                        {detectionResult.chemical_treatment}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Bridge to Dosage Planner */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('dosage');
                        setDosageCrop(detectionResult.crop.toLowerCase());
                        runDosageCalculation();
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/[0.04] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-white font-mono text-xs font-bold transition-all"
                    >
                      Calculate Fertilizer Plan →
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('gemini');
                        sendGeminiMessage(`How to treat ${detectionResult.disease_name} in ${detectionResult.crop}?`);
                      }}
                      className="flex-1 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all"
                    >
                      Ask Gemini Agronomist →
                    </button>
                  </div>

                </div>
              ) : (
                <div className="h-full min-h-[320px] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8 text-white/40 space-y-3">
                  <Upload className="w-8 h-8 text-white/20" />
                  <div className="text-sm font-mono font-bold">No Diagnosis Executed Yet</div>
                  <p className="text-xs max-w-xs">
                    Choose one of the leaf presets on the left or click "Diagnose Leaf Damage" to trigger visual AI inference.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: NPK DOSAGE & FERTILIZER PLANNER                            */}
        {/* ================================================================== */}
        {activeTab === 'dosage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Farm & Soil Test Inputs */}
            <div className="lg:col-span-5 space-y-4 bg-white/[0.02] border border-white/[0.08] p-6 rounded-2xl">
              <h2 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                Soil Nutrient &amp; Farm Parameters
              </h2>

              <div className="space-y-4 text-xs font-mono">
                {/* Crop Selector */}
                <div>
                  <label className="text-white/60 block mb-1.5">Target Crop:</label>
                  <select
                    value={dosageCrop}
                    onChange={(e) => setDosageCrop(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-cyan-400 outline-none"
                  >
                    <option value="wheat">Wheat (Grain)</option>
                    <option value="rice">Rice / Paddy</option>
                    <option value="cotton">Cotton</option>
                    <option value="soybean">Soybean (Legume)</option>
                    <option value="corn">Corn (Maize)</option>
                    <option value="tomato">Tomato (Vegetable)</option>
                    <option value="sugarcane">Sugarcane</option>
                  </select>
                </div>

                {/* Area Input */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white/60 block mb-1.5">Farm Area:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={dosageArea}
                      onChange={(e) => setDosageArea(parseFloat(e.target.value) || 1.0)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1.5">Unit:</label>
                    <select
                      value={dosageUnit}
                      onChange={(e) => setDosageUnit(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-cyan-400 outline-none"
                    >
                      <option value="hectare">Hectares (ha)</option>
                      <option value="acre">Acres</option>
                    </select>
                  </div>
                </div>

                {/* Soil N Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/60">Soil Nitrogen (N):</span>
                    <span className="text-cyan-300 font-bold">{soilN} kg/ha</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="140"
                    value={soilN}
                    onChange={(e) => setSoilN(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                {/* Soil P Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/60">Soil Phosphorous (P):</span>
                    <span className="text-cyan-300 font-bold">{soilP} kg/ha</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={soilP}
                    onChange={(e) => setSoilP(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                {/* Soil K Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/60">Soil Potassium (K):</span>
                    <span className="text-cyan-300 font-bold">{soilK} kg/ha</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={soilK}
                    onChange={(e) => setSoilK(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <button
                  onClick={runDosageCalculation}
                  disabled={calculatingDosage}
                  className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-cyan-950/50"
                >
                  {calculatingDosage ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                  <span>RECALCULATE FERTILIZER DOSAGE</span>
                </button>
              </div>
            </div>

            {/* Right Column: Fertilizer Output & Application Schedule */}
            <div className="lg:col-span-7 space-y-4">
              {dosageResult ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  
                  {/* Fertilizer Bags Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 text-center space-y-1">
                      <div className="text-[11px] font-mono text-cyan-300 font-bold">Urea (46% N)</div>
                      <div className="text-2xl font-black font-mono text-white">
                        {dosageResult.fertilizer_recommendations.urea_bags_45kg} <span className="text-xs font-normal text-white/50">bags</span>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">{dosageResult.fertilizer_recommendations.urea_kg} kg total</div>
                    </div>

                    <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-1">
                      <div className="text-[11px] font-mono text-emerald-300 font-bold">DAP (18:46:0)</div>
                      <div className="text-2xl font-black font-mono text-white">
                        {dosageResult.fertilizer_recommendations.dap_bags_50kg} <span className="text-xs font-normal text-white/50">bags</span>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">{dosageResult.fertilizer_recommendations.dap_kg} kg total</div>
                    </div>

                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-center space-y-1">
                      <div className="text-[11px] font-mono text-amber-300 font-bold">MOP (Potash)</div>
                      <div className="text-2xl font-black font-mono text-white">
                        {dosageResult.fertilizer_recommendations.mop_bags_50kg} <span className="text-xs font-normal text-white/50">bags</span>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">{dosageResult.fertilizer_recommendations.mop_kg} kg total</div>
                    </div>
                  </div>

                  {/* Split Schedule Timeline */}
                  <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                    <div className="text-xs font-mono text-white/50 uppercase tracking-wider flex items-center justify-between">
                      <span>Split Application Schedule</span>
                      <span className="text-emerald-400 font-bold">Est. Cost: ₹{dosageResult.fertilizer_recommendations.estimated_cost_inr.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="space-y-3">
                      {dosageResult.schedule.map((item: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl border border-white/[0.06] bg-black/40 space-y-1.5 font-sans">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-white">{item.stage}</span>
                            <span className="text-cyan-300 font-bold">{item.timing}</span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">{item.instructions}</p>
                          <div className="text-[11px] font-mono text-white/40">
                            Urea: {item.urea_kg} kg · DAP: {item.dap_kg} kg · MOP: {item.mop_kg} kg
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Organic Alternative Option */}
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono text-emerald-400 font-bold">🌱 Zero-Chemical Organic Alternative Plan</div>
                      <div className="text-xs text-white/60">
                        {dosageResult.organic_plan.vermicompost_bags} bags Vermicompost + {dosageResult.organic_plan.jeevamrut_litres}L Jeevamrut
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('gemini');
                        sendGeminiMessage(`How to prepare ${dosageResult.organic_plan.jeevamrut_litres}L of Jeevamrut at home for ${dosageCrop}?`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 shrink-0 hover:bg-emerald-500/30 transition-all"
                    >
                      Recipe Guide →
                    </button>
                  </div>

                </div>
              ) : (
                <div className="h-full min-h-[300px] rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-center p-8 text-white/40">
                  Adjust parameters and click "Recalculate Fertilizer Dosage".
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: GEMINI AI AGRONOMIST CONSULTATION                          */}
        {/* ================================================================== */}
        {activeTab === 'gemini' && (
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Chat Box */}
            <div className="h-[460px] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-y-auto space-y-4 flex flex-col">
              {geminiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'gemini' && (
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-white'
                        : 'bg-black/60 border border-white/[0.08] text-white/90 font-sans'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                </div>
              ))}

              {geminiLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/[0.08] text-xs text-white/50 font-mono">
                    Gemini AI Agronomist is analyzing satellite &amp; pathology parameters...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {[
                'How to cure Yellow Rust in Wheat fast?',
                'Best organic pesticide for Tomato Blight',
                'What is the ideal NPK ratio for Black Cotton Soil?',
                'How much water does Paddy need during flowering?'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendGeminiMessage(suggestion)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 text-white/60 hover:text-cyan-300 transition-all text-left"
                >
                  💬 {suggestion}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask Gemini Agronomist anything (in English or Hindi)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendGeminiMessage();
                }}
                className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-mono text-white placeholder-white/30 focus:border-cyan-400 outline-none"
              />
              <button
                onClick={() => sendGeminiMessage()}
                disabled={geminiLoading}
                className="px-6 py-3.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>ASK</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
