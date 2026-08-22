import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  RefreshCw,
  Send,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Droplets,
  Sprout,
  ShieldCheck,
  Copy,
  Check,
  MessageSquare,
  HelpCircle,
  Activity,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { api, Farm, AnalysisResult, AIExplanationResult, AIAskResponse } from '../lib/api';

interface FarmAIExplainerProps {
  farm: Farm;
  analysis?: AnalysisResult | null;
  weather?: any;
}

const LANGUAGES = [
  { code: 'en', label: 'English (EN)', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🌾' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
];

const TONES = [
  { id: 'farmer_simple', label: 'Farmer-Friendly', desc: 'Simple, jargon-free & practical advice' },
  { id: 'agronomist_deep', label: 'Agronomist Detail', desc: 'Technical spectral & soil dynamics' },
  { id: 'audio_briefing', label: 'Quick Radio Briefing', desc: 'Short, clear spoken overview' },
];

const SUGGESTED_QUESTIONS = [
  'Can my crops recover if I irrigate heavily this week?',
  'Explain in simple terms why insurance payout was triggered or not.',
  'What are the most vulnerable zones of my farm right now?',
  'How does temperature and soil dryness affect my final grain yield?',
];

export const FarmAIExplainer: React.FC<FarmAIExplainerProps> = ({ farm, analysis, weather }) => {
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('en');
  const [tone, setTone] = useState<string>('farmer_simple');
  const [customPrompt, _setCustomPrompt] = useState<string>('');
  
  // Q&A Chat State
  const [chatQuestion, setChatQuestion] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ question: string; response: AIAskResponse; timestamp: string }>
  >([]);

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'report' | 'ask' | 'checklist'>('report');

  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const fetchExplanation = async (userPrompt?: string) => {
    if (!farm?.id) return;
    setLoading(true);
    try {
      const res = await api.farms.getAIExplanation(farm.id, {
        language,
        tone,
        prompt: userPrompt || customPrompt,
        weather,
      });
      setExplanation(res.data);
    } catch (err) {
      console.error('Failed to load AI explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplanation();
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [farm.id, language, tone]);

  const handleSpeechToggle = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead =
      explanation?.audioSummaryText ||
      explanation?.headline + '. ' + explanation?.simpleSummary;

    if (!textToRead) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Set appropriate language voice if available
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'es') utterance.lang = 'es-ES';
    else if (language === 'fr') utterance.lang = 'fr-FR';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleAskQuestion = async (q: string) => {
    const questionText = q.trim();
    if (!questionText || chatLoading) return;

    setChatLoading(true);
    try {
      const res = await api.ai.askAdvisor({
        farmId: farm.id,
        question: questionText,
        language,
        tone,
      });

      setChatHistory((prev) => [
        {
          question: questionText,
          response: res.data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      setChatQuestion('');
      setActiveTab('ask');
    } catch (err) {
      console.error('Failed to ask AI advisor:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!explanation) return;
    const text = `🌾 AGRIPROOF AI SIMPLIFIED REPORT FOR ${farm.name.toUpperCase()}
Crop: ${farm.crop_type} | Area: ${farm.area_hectares} ha | Generated: ${new Date(explanation.generatedAt).toLocaleDateString()}

HEADLINE:
${explanation.headline}

SUMMARY:
${explanation.simpleSummary}

WATER & SOIL:
${explanation.soilAndWaterStatus}

INSURANCE & RISK:
${explanation.insuranceAndRiskExplanation}

RECOMMENDED FARMING ACTIONS:
${explanation.actionableRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md relative overflow-hidden transition-all">
      {/* Background glowing ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                AI Farm Advisor & Scenario Explainer
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Bot className="w-3.5 h-3.5" />
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Translating complex satellite telemetry and parametric insurance logic into plain, actionable farmer language
            </p>
          </div>
        </div>

        {/* Action Controls & Language Select */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 pr-7 font-medium focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
              title="Select simplified report language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Tone Selector */}
          <div className="relative">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 pr-7 font-medium focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
              title="Select report tone"
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Audio Speech Button */}
          <button
            onClick={handleSpeechToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
            }`}
            title="Read simplified briefing aloud"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span>Pause Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Listen Aloud</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchExplanation()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:border-slate-600 disabled:opacity-50 transition-colors"
            title="Re-generate explanation with fresh satellite context"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 mt-4 border-b border-slate-800/80 pb-2 relative z-10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'report'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" />
          Simplified Situation Report
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Farmer Action Plan ({explanation?.actionableRecommendations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ask'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Ask Advisor ({chatHistory.length})
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && !explanation && (
        <div className="py-12 flex flex-col items-center justify-center text-center relative z-10">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-white font-medium">Gemini 3.7 Flash is analyzing satellite telemetry...</p>
          <p className="text-slate-400 text-xs mt-1">
            Simplifying multi-spectral indexes, Otsu damage distributions, and parametric contract metrics
          </p>
        </div>
      )}

      {/* Main Content Area */}
      {explanation && !loading && (
        <div className="mt-5 space-y-6 relative z-10">
          {/* TAB 1: SIMPLIFIED REPORT */}
          {activeTab === 'report' && (
            <>
              {/* Highlight Headline Box */}
              <div className="bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-slate-800/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 block mb-0.5">
                      Status Summary • {farm.crop_type.toUpperCase()} ({farm.area_hectares} ha)
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {explanation.headline}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors shrink-0"
                  title="Copy full simplified report"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* 4 Quick Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {explanation.keyInsights.map((insight, idx) => {
                  let badgeColor = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
                  if (insight.status === 'good') badgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                  if (insight.status === 'warning') badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                  if (insight.status === 'alert') badgeColor = 'bg-red-500/10 text-red-300 border-red-500/30';

                  return (
                    <div
                      key={idx}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-medium">{insight.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
                          {insight.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white mb-1">{insight.value}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{insight.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* 3 Core Explanation Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. What the Satellite Sees */}
                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                      <Sprout className="w-4 h-4" />
                      <h4>Crop & Canopy Condition</h4>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {explanation.simpleSummary}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between">
                    <span>Baseline NDVI: {analysis?.ndvi_baseline?.toFixed(2) || '0.65'}</span>
                    <span className="font-semibold text-emerald-400">Current: {analysis?.ndvi_current?.toFixed(2) || '0.36'}</span>
                  </div>
                </div>

                {/* 2. Water & Soil Situation */}
                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-2">
                      <Droplets className="w-4 h-4" />
                      <h4>Water, Rain & Soil Health</h4>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {explanation.soilAndWaterStatus}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between">
                    <span>30d Rain: {analysis?.rainfall_mm_30d?.toFixed(1) || '14.2'} mm</span>
                    <span className={`font-semibold ${(analysis?.rainfall_anomaly_pct || 0) < 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {analysis?.rainfall_anomaly_pct?.toFixed(0) || '-61'}% Anomaly
                    </span>
                  </div>
                </div>

                {/* 3. Insurance & Payout Scenario */}
                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <h4>Parametric Insurance Scenario</h4>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {explanation.insuranceAndRiskExplanation}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between">
                    <span>Trigger Threshold: 30% drop</span>
                    <span className="font-semibold text-purple-400">
                      {(analysis?.ndvi_drop_pct || 0) > 30 ? 'Payout Triggered' : 'Monitoring Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simplified FAQs Accordion */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 sm:p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Common Questions for this Farm Report
                </h4>
                <div className="space-y-2.5">
                  {explanation.faqs.map((faq, index) => {
                    const isExpanded = expandedFaq === index;
                    return (
                      <div
                        key={index}
                        className="border border-slate-700/60 bg-slate-800/80 rounded-lg overflow-hidden transition-colors"
                      >
                        <button
                          onClick={() => setExpandedFaq(isExpanded ? null : index)}
                          className="w-full px-4 py-3 text-left font-medium text-xs sm:text-sm text-slate-200 flex items-center justify-between gap-3 hover:text-white"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-bold">
                              Q
                            </span>
                            {faq.question || (faq as any).q}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1 text-xs sm:text-sm text-slate-300 border-t border-slate-700/40 bg-slate-900/40 leading-relaxed">
                            {faq.answer || (faq as any).a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ACTION CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      Actionable Farming Recommendations for This Week
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Targeted on-the-ground steps synthesized from Sentinel-2 multi-spectral observations and weather trends
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    High Priority
                  </span>
                </div>

                <div className="space-y-3">
                  {explanation.actionableRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASK ADVISOR CHAT */}
          {activeTab === 'ask' && (
            <div className="space-y-4">
              {/* Quick Questions Prompt Pills */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-300 mb-2 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Suggested Questions for Farmer Guidance:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(q)}
                      className="text-left text-xs bg-slate-900/70 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 p-2.5 rounded-lg transition-colors flex items-center justify-between gap-2"
                    >
                      <span>{q}</span>
                      <Send className="w-3 h-3 text-emerald-400 shrink-0 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl p-2 focus-within:border-emerald-500 transition-colors">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskQuestion(chatQuestion);
                  }}
                  placeholder="Ask any question about your crop health, insurance, or soil moisture..."
                  className="bg-transparent text-sm text-white placeholder-slate-400 px-3 py-2 focus:outline-none flex-1"
                />
                <button
                  onClick={() => handleAskQuestion(chatQuestion)}
                  disabled={chatLoading || !chatQuestion.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 shadow-md"
                >
                  {chatLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Ask AI</span>
                </button>
              </div>

              {/* Chat History */}
              <div className="space-y-3">
                {chatHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/40 pb-2">
                      <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Farmer: "{item.question}"
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {item.response.answer}
                    </p>
                    {item.response.bulletPoints && item.response.bulletPoints.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {item.response.bulletPoints.map((bp, bpIdx) => (
                          <li key={bpIdx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.response.suggestedFollowUps && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Follow up:</span>
                        {item.response.suggestedFollowUps.map((fu, fuIdx) => (
                          <button
                            key={fuIdx}
                            onClick={() => handleAskQuestion(fu)}
                            className="text-[11px] bg-slate-900 hover:bg-slate-750 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md transition-colors"
                          >
                            {fu}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
