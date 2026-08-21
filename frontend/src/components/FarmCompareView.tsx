import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Tractor,
  Activity,
  Droplets,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Scale,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  Calendar,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api, Farm, AnalysisResult } from '../lib/api';

interface FarmCompareViewProps {
  farms: Farm[];
  initialFarmAId?: string;
  initialFarmBId?: string;
  onClose?: () => void;
}

export const FarmCompareView: React.FC<FarmCompareViewProps> = ({
  farms,
  initialFarmAId,
  initialFarmBId,
  onClose,
}) => {
  const [farmAId, setFarmAId] = useState<string>(
    initialFarmAId || farms[0]?.id || ''
  );
  const [farmBId, setFarmBId] = useState<string>(
    initialFarmBId || (farms.length > 1 ? farms[1]?.id : farms[0]?.id || '')
  );

  const [analysisA, setAnalysisA] = useState<AnalysisResult | null>(null);
  const [analysisB, setAnalysisB] = useState<AnalysisResult | null>(null);
  const [loadingA, setLoadingA] = useState<boolean>(false);
  const [loadingB, setLoadingB] = useState<boolean>(false);

  const farmA = farms.find((f) => f.id === farmAId);
  const farmB = farms.find((f) => f.id === farmBId);

  // Fetch Analysis for Farm A
  useEffect(() => {
    if (!farmAId) return;
    setLoadingA(true);
    api.farms
      .getAnalysis(farmAId)
      .then((res) => setAnalysisA(res.data))
      .catch((err) => {
        console.error('Failed to load analysis for Farm A:', err);
        setAnalysisA(null);
      })
      .finally(() => setLoadingA(false));
  }, [farmAId]);

  // Fetch Analysis for Farm B
  useEffect(() => {
    if (!farmBId) return;
    setLoadingB(true);
    api.farms
      .getAnalysis(farmBId)
      .then((res) => setAnalysisB(res.data))
      .catch((err) => {
        console.error('Failed to load analysis for Farm B:', err);
        setAnalysisB(null);
      })
      .finally(() => setLoadingB(false));
  }, [farmBId]);

  const handleSwap = () => {
    const temp = farmAId;
    setFarmAId(farmBId);
    setFarmBId(temp);
  };

  // Prepare combined NDVI time series for dual comparison chart
  const timeSeriesCombined = React.useMemo(() => {
    const tsA = analysisA?.ndvi_time_series || [];
    const tsB = analysisB?.ndvi_time_series || [];

    const dateMap = new Map<string, { date: string; ndviA?: number; ndviB?: number }>();

    tsA.forEach((item) => {
      const d = item.date.split('T')[0];
      dateMap.set(d, { date: d, ndviA: Number(item.ndvi.toFixed(2)) });
    });

    tsB.forEach((item) => {
      const d = item.date.split('T')[0];
      const existing = dateMap.get(d) || { date: d };
      dateMap.set(d, { ...existing, ndviB: Number(item.ndvi.toFixed(2)) });
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [analysisA, analysisB]);

  // Helper for status badge styles
  const getStressBadge = (stress?: string) => {
    const s = stress?.toUpperCase() || 'LOW';
    if (s === 'HIGH' || s === 'CRITICAL' || s === 'SEVERE') {
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
    if (s === 'MODERATE' || s === 'MEDIUM') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  const getRiskBadge = (category?: string) => {
    const c = category?.toUpperCase() || 'LOW';
    if (c === 'HIGH' || c === 'CRITICAL' || c === 'SEVERE') {
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
    if (c === 'MODERATE' || c === 'MEDIUM') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mt-32" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mt-32" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Dual Farm Split-View Comparison
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Side-by-side performance benchmarks, spectral indices, and climate risk telemetry
              </p>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-auto"
          >
            Exit Split-View
          </button>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center relative z-10 bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
        {/* Farm A Selector (Emerald theme) */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
            Select Left Farm (Parcel A)
          </label>
          <div className="relative">
            <select
              value={farmAId}
              onChange={(e) => setFarmAId(e.target.value)}
              className="w-full bg-slate-900 border border-emerald-500/50 text-white rounded-lg px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} disabled={f.id === farmBId}>
                  {f.name} ({f.crop_type} • {f.area_hectares.toFixed(1)} ha)
                </option>
              ))}
            </select>
            <Tractor className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center py-1 md:py-0">
          <button
            onClick={handleSwap}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-all shadow-md active:scale-95"
            title="Swap Left and Right Farms"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Farm B Selector (Indigo theme) */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-indigo-400/30" />
            Select Right Farm (Parcel B)
          </label>
          <div className="relative">
            <select
              value={farmBId}
              onChange={(e) => setFarmBId(e.target.value)}
              className="w-full bg-slate-900 border border-indigo-500/50 text-white rounded-lg px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none cursor-pointer"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} disabled={f.id === farmAId}>
                  {f.name} ({f.crop_type} • {f.area_hectares.toFixed(1)} ha)
                </option>
              ))}
            </select>
            <Tractor className="w-4 h-4 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Side-by-Side Main Comparison Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* ================= FARM A CARD ================= */}
        <div className="bg-slate-800/80 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-5 shadow-xl transition-all relative">
          <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  Parcel A
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300 uppercase">
                  {farmA?.status || 'Active'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{farmA?.name || 'Farm A'}</h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {farmA?.center_lat.toFixed(4)}°N, {farmA?.center_lon.toFixed(4)}°E
              </p>
            </div>
            {farmA && (
              <Link
                to={`/dashboard/${farmA.id}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors shrink-0"
              >
                <span>View Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loadingA ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
              <span className="text-xs">Loading telemetry for {farmA?.name}…</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Core Vitality Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Crop Type</span>
                  <span className="text-sm font-bold text-white capitalize">{farmA?.crop_type || '—'}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Parcel Area</span>
                  <span className="text-sm font-bold text-white">{farmA?.area_hectares.toFixed(1)} ha</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Health Score</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {analysisA ? `${(analysisA.crop_health_score * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Stress Level</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block ${getStressBadge(analysisA?.stress_level)}`}>
                    {analysisA?.stress_level || 'LOW'}
                  </span>
                </div>
              </div>

              {/* Spectral Telemetry */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Vegetation & Spectral Indices
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Current NDVI</span>
                    <span className="text-base font-bold text-white">
                      {analysisA?.ndvi_current.toFixed(2) || '—'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Base: {analysisA?.ndvi_baseline.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NDVI Drop</span>
                    <span
                      className={`text-base font-bold ${
                        (analysisA?.ndvi_drop_pct || 0) > 30 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {analysisA?.ndvi_drop_pct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {(analysisA?.ndvi_drop_pct || 0) > 30 ? 'Trigger Exceeded' : 'Nominal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">EVI / NDWI</span>
                    <span className="text-base font-bold text-slate-200">
                      {analysisA?.evi_current.toFixed(2)} / {analysisA?.ndwi_current.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Canopy / Moisture</span>
                  </div>
                </div>
              </div>

              {/* Climate & Risk Profile */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  Climate & Environmental Conditions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">30d Rainfall</span>
                    <span className="text-base font-bold text-white">
                      {analysisA?.rainfall_mm_30d.toFixed(1)} mm
                    </span>
                    <span
                      className={`text-[10px] block ${
                        (analysisA?.rainfall_anomaly_pct || 0) < 0 ? 'text-amber-400' : 'text-blue-400'
                      }`}
                    >
                      {analysisA?.rainfall_anomaly_pct.toFixed(0)}% Anomaly
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mean Temp</span>
                    <span className="text-base font-bold text-white">
                      {analysisA?.temperature_mean.toFixed(1)}°C
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Heat Stress: {analysisA?.heat_stress_score.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Drought Risk</span>
                    <span className="text-base font-bold text-amber-400">
                      {((analysisA?.drought_risk || 0) * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Cat: {analysisA?.risk_category || 'MODERATE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Economic & Insurance Projection */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Expected Yield</span>
                  <span className="text-lg font-bold text-white">
                    {analysisA?.expected_yield.toFixed(1)} t/ha
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Predicted Loss: {analysisA?.expected_loss_pct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Parametric Trigger</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border mt-1 ${
                      (analysisA?.ndvi_drop_pct || 0) >= 30 || (analysisA?.expected_loss_pct || 0) >= 20
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {(analysisA?.ndvi_drop_pct || 0) >= 30 || (analysisA?.expected_loss_pct || 0) >= 20
                      ? 'Payout Eligible'
                      : 'Active Monitoring'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= FARM B CARD ================= */}
        <div className="bg-slate-800/80 border-2 border-indigo-500/40 rounded-2xl p-5 space-y-5 shadow-xl transition-all relative">
          <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                  Parcel B
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300 uppercase">
                  {farmB?.status || 'Active'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{farmB?.name || 'Farm B'}</h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" />
                {farmB?.center_lat.toFixed(4)}°N, {farmB?.center_lon.toFixed(4)}°E
              </p>
            </div>
            {farmB && (
              <Link
                to={`/dashboard/${farmB.id}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors shrink-0"
              >
                <span>View Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loadingB ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
              <span className="text-xs">Loading telemetry for {farmB?.name}…</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Core Vitality Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Crop Type</span>
                  <span className="text-sm font-bold text-white capitalize">{farmB?.crop_type || '—'}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Parcel Area</span>
                  <span className="text-sm font-bold text-white">{farmB?.area_hectares.toFixed(1)} ha</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Health Score</span>
                  <span className="text-sm font-bold text-indigo-400">
                    {analysisB ? `${(analysisB.crop_health_score * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Stress Level</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block ${getStressBadge(analysisB?.stress_level)}`}>
                    {analysisB?.stress_level || 'LOW'}
                  </span>
                </div>
              </div>

              {/* Spectral Telemetry */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Vegetation & Spectral Indices
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Current NDVI</span>
                    <span className="text-base font-bold text-white">
                      {analysisB?.ndvi_current.toFixed(2) || '—'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Base: {analysisB?.ndvi_baseline.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NDVI Drop</span>
                    <span
                      className={`text-base font-bold ${
                        (analysisB?.ndvi_drop_pct || 0) > 30 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {analysisB?.ndvi_drop_pct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {(analysisB?.ndvi_drop_pct || 0) > 30 ? 'Trigger Exceeded' : 'Nominal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">EVI / NDWI</span>
                    <span className="text-base font-bold text-slate-200">
                      {analysisB?.evi_current.toFixed(2)} / {analysisB?.ndwi_current.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Canopy / Moisture</span>
                  </div>
                </div>
              </div>

              {/* Climate & Risk Profile */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  Climate & Environmental Conditions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">30d Rainfall</span>
                    <span className="text-base font-bold text-white">
                      {analysisB?.rainfall_mm_30d.toFixed(1)} mm
                    </span>
                    <span
                      className={`text-[10px] block ${
                        (analysisB?.rainfall_anomaly_pct || 0) < 0 ? 'text-amber-400' : 'text-blue-400'
                      }`}
                    >
                      {analysisB?.rainfall_anomaly_pct.toFixed(0)}% Anomaly
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mean Temp</span>
                    <span className="text-base font-bold text-white">
                      {analysisB?.temperature_mean.toFixed(1)}°C
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Heat Stress: {analysisB?.heat_stress_score.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Drought Risk</span>
                    <span className="text-base font-bold text-amber-400">
                      {((analysisB?.drought_risk || 0) * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Cat: {analysisB?.risk_category || 'MODERATE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Economic & Insurance Projection */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Expected Yield</span>
                  <span className="text-lg font-bold text-white">
                    {analysisB?.expected_yield.toFixed(1)} t/ha
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Predicted Loss: {analysisB?.expected_loss_pct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Parametric Trigger</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border mt-1 ${
                      (analysisB?.ndvi_drop_pct || 0) >= 30 || (analysisB?.expected_loss_pct || 0) >= 20
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {(analysisB?.ndvi_drop_pct || 0) >= 30 || (analysisB?.expected_loss_pct || 0) >= 20
                      ? 'Payout Eligible'
                      : 'Active Monitoring'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Differential Head-to-Head Benchmark Table */}
      {analysisA && analysisB && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4 relative z-10">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Direct Metric Differential (A vs B)
            </h4>
            <span className="text-xs text-slate-400">
              Positive values favor superior vegetative condition
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* NDVI Delta */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">NDVI Difference</span>
                <span className="text-base font-bold text-white">
                  {(analysisA.ndvi_current - analysisB.ndvi_current > 0 ? '+' : '') +
                    (analysisA.ndvi_current - analysisB.ndvi_current).toFixed(2)}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  analysisA.ndvi_current > analysisB.ndvi_current
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {analysisA.ndvi_current > analysisB.ndvi_current ? 'Parcel A Higher' : 'Parcel B Higher'}
              </span>
            </div>

            {/* Health Delta */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Crop Health Advantage</span>
                <span className="text-base font-bold text-white">
                  {Math.abs(
                    (analysisA.crop_health_score - analysisB.crop_health_score) * 100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  analysisA.crop_health_score > analysisB.crop_health_score
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {analysisA.crop_health_score >= analysisB.crop_health_score
                  ? 'Parcel A Healthier'
                  : 'Parcel B Healthier'}
              </span>
            </div>

            {/* Drought Risk Delta */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Lower Drought Stress</span>
                <span className="text-base font-bold text-white">
                  {analysisA.drought_risk <= analysisB.drought_risk ? farmA?.name : farmB?.name}
                </span>
              </div>
              <span className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                {Math.abs((analysisA.drought_risk - analysisB.drought_risk) * 100).toFixed(0)}% Lower Risk
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dual NDVI Time Series Trajectory Chart */}
      {timeSeriesCombined.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Comparative Multi-Temporal NDVI Progression
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Orbital Sentinel-2 spectral indices trajectory mapped across matching historical time windows
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block" />
                {farmA?.name || 'Parcel A'}
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-3 h-1 bg-indigo-400 rounded-full inline-block" />
                {farmB?.name || 'Parcel B'}
              </span>
            </div>
          </div>

          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesCombined} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 1]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ndviA"
                  name={farmA?.name || 'Parcel A'}
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="ndviB"
                  name={farmB?.name || 'Parcel B'}
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
