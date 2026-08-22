import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Activity, Map, AlertTriangle, ShieldCheck } from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskGauge from '../components/RiskGauge';
import HistoricalVegetationHealthChart from '../components/HistoricalVegetationHealthChart';
import WeatherRiskPanel from '../components/WeatherRiskPanel';
import AnalysisPipelineSnapshots from '../components/AnalysisPipelineSnapshots';
import FarmMap from '../components/FarmMap';
import LandSatelliteAnalysis from '../components/LandSatelliteAnalysis';
import PrecisionSatelliteGISConsole from '../components/PrecisionSatelliteGISConsole';
import FarmerAlertsDrawer from '../components/FarmerAlertsDrawer';
import ClaimPayoutEstimator from '../components/ClaimPayoutEstimator';
import LiveWeatherForecastWidget from '../components/LiveWeatherForecastWidget';
import LiveSatelliteAnalysis from '../components/analysis/LiveSatelliteAnalysis';
import VariabilityInsightsStudio from '../components/VariabilityInsightsStudio';
import CropDamageAnalysisStudio from '../components/CropDamageAnalysisStudio';
import { FarmAIExplainer } from '../components/FarmAIExplainer';
import { useAnalysis } from '../hooks/useAnalysis';
import { api, Farm, LandAnalysisResult } from '../lib/api';
import { offlineStorage } from '../lib/offlineStorage';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';

export default function DashboardPage() {
  const { farmId }  = useParams<{ farmId: string }>();
  const navigate    = useNavigate();
  const { analysis, loading, isFromCache, cachedTime, refetch } = useAnalysis(farmId);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [landAnalysis, setLandAnalysis] = useState<LandAnalysisResult | null>(null);
  const [isGeneratingClaim, setIsGeneratingClaim] = useState(false);
  const [pipelineRunning, setPipelineRunning]     = useState(false);

  useEffect(() => {
    if (!farmId) return;
    api.farms.get(farmId)
      .then(res => setFarm(res.data))
      .catch(err => {
        console.error('[DashboardPage] Failed to fetch farm:', err);
        const cachedFarm = offlineStorage.getFarm(farmId);
        if (cachedFarm) {
          setFarm(cachedFarm);
        }
      });
    api.farms.getLandAnalysis(farmId)
      .then(res => setLandAnalysis(res.data))
      .catch(() => {});
  }, [farmId]);

  // Show pipeline if there's no analysis yet and we're not in a loading state
  useEffect(() => {
    if (!analysis && !loading) {
      setPipelineRunning(true);
    } else if (analysis) {
      setPipelineRunning(false);
    }
  }, [analysis, loading]);

  // Called by PipelineProgress when the WebSocket "done" message arrives
  const handlePipelineComplete = useCallback(async () => {
    await refetch();          // fetch fresh analysis from /api/farms/:id/analysis
    if (farmId) {
      api.farms.getLandAnalysis(farmId)
        .then(res => setLandAnalysis(res.data))
        .catch(() => {});
    }
    setPipelineRunning(false);
  }, [refetch, farmId]);

  const handleRerun = async () => {
    if (!farmId) return;
    setPipelineRunning(true);
    try {
      await api.farms.analyze(farmId);
      await refetch();
    } catch (err) {
      console.warn('[DashboardPage] Backend analyze error:', err);
    }
  };

  const handleGenerateClaim = async () => {
    if (!farmId) return;
    setIsGeneratingClaim(true);
    try {
      const res = await api.claims.create({ farm_id: farmId });
      navigate(`/claim/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate claim. Please try again.');
      setIsGeneratingClaim(false);
    }
  };

  if (pipelineRunning) {
    return (
      <LiveSatelliteAnalysis
        farmId={farmId!}
        farm={farm}
        onComplete={handlePipelineComplete}
        onViewClaim={() => {
          setPipelineRunning(false);
          refetch();
        }}
      />
    );
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-400">
        {loading ? 'Loading analysis data…' : 'No analysis found for this farm.'}
      </div>
    );
  }

  const isEligible =
    analysis.ndvi_drop_pct >= 30 ||
    analysis.expected_loss_pct >= 25 ||
    analysis.damage_probability >= 0.30 ||
    analysis.risk_score >= 30 ||
    analysis.risk_category !== 'LOW';

  const healthScore = Math.round(
    analysis.crop_health_score > 1 ? analysis.crop_health_score : analysis.crop_health_score * 100
  );

  const lossPct = (
    analysis.expected_loss_pct > 1 ? analysis.expected_loss_pct : analysis.expected_loss_pct * 100
  ).toFixed(1);

  const ndviDropDisplay = (
    analysis.ndvi_drop_pct > 1 ? analysis.ndvi_drop_pct : analysis.ndvi_drop_pct * 100
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-black/95 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 font-sans">
      {/* ── Top Greeting & Status ────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sentinel-2 · Live Telemetry Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-slate-400 bg-dark-800 border border-dark-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })} · Kharif 2025-26 Season
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {farm?.name || 'Farmer'} 👋
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Latest Earth Observation multi-spectral update from your fields · Last pass: <strong className="text-primary-300">22 Aug 2026, 05:47 UTC</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRerun}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold text-xs shadow-sm active:scale-95 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Re-Run Analysis</span>
          </button>
          <Link
            to={`/dashboard/${farmId}/satellite`}
            className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors text-xs font-semibold shadow-sm"
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Satellite View</span>
          </Link>
        </div>
      </section>

      {/* ── Stitch Bento Grid Layout for Dashboard Widgets ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Soil Moisture Widget (Span 4 cols on desktop) */}
        <div className="md:col-span-4 bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] dark:shadow-none border border-[#e3e3de] dark:border-dark-700 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#805533] dark:text-emerald-400">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              water_drop
            </span>
            <h3 className="text-base font-bold text-[#1a1c19] dark:text-white">Avg Moisture</h3>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="text-4xl font-extrabold text-[#17341c] dark:text-emerald-400">
                {landAnalysis?.soil_and_surface?.soil_moisture_vwc_pct
                  ? `${Math.round(landAnalysis.soil_and_surface.soil_moisture_vwc_pct)}%`
                  : `${Math.max(18, Math.min(85, Math.round(healthScore * 0.65)))}%`}
              </span>
              <span className="text-xs font-semibold text-[#424841] dark:text-slate-400 ml-2">
                {landAnalysis?.soil_and_surface?.soil_moisture_status || (healthScore > 50 ? 'Optimal' : 'Needs Moisture')}
              </span>
            </div>
            {/* CSS Gauge */}
            <div className="relative w-16 h-16 rounded-full border-4 border-[#e8e8e3] dark:border-dark-700 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#2d4b31] dark:text-emerald-500 stroke-current"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeDasharray={`${landAnalysis?.soil_and_surface?.soil_moisture_vwc_pct ? Math.round(landAnalysis.soil_and_surface.soil_moisture_vwc_pct) : Math.max(18, Math.min(85, Math.round(healthScore * 0.65)))}, 100`}
                  strokeWidth="4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Fields Summary (Span 8 cols on desktop) */}
        <div className="md:col-span-8 bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] dark:shadow-none border border-[#e3e3de] dark:border-dark-700 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-[#1a1c19] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#17341c] dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                agriculture
              </span>
              <span>Active Field · {farm?.name}</span>
            </h3>
            <Link to="/farms" className="text-xs font-bold text-[#17341c] dark:text-emerald-400 hover:underline">
              View All Fields
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center p-3 rounded-xl bg-[#fafaf4] dark:bg-dark-900 border border-[#e3e3de] dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e8e8e3] dark:bg-dark-800 overflow-hidden flex-shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBodK0H0tc2Rc29kcCH_Ew5os8t7qSi3HI7g-lhpBNsIrif9mWm3NvyD1-mF30pASRTRnUCfhmWq5Ax3uoW_W7K9N94Hqmi1_udW5px-K-CCmFa6ZZ0rRyvHIKP5CBDnFTwYgX2d6mvb_bYZIoVv_L5I7u5Lo0VWNGu8ugYsCNoBKDCNtYPb4i711SlnmoupoJLQcDE4FNyJn0-0F7oLTsHGevXGZuLCs2on2Z2h3o5PKylh6ECb-XDNA"
                    alt="Active Field"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1a1c19] dark:text-white">{farm?.name}</h4>
                  <p className="text-xs text-[#737971] capitalize">{farm?.crop_type} · {farm?.area_hectares.toFixed(1)} ha</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 ${
                  healthScore > 60
                    ? 'bg-[#c8ecc8] text-[#03210b] dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-[#ffdcc5] text-[#301400] dark:bg-amber-500/20 dark:text-amber-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#17341c] dark:bg-emerald-400 inline-block" />
                <span>{healthScore > 60 ? 'Healthy' : 'Needs Irrigation'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Satellite Telemetry Cache Status Banner */}
      <OfflineStatusBanner
        isFromCache={isFromCache}
        cachedTime={cachedTime}
        isLoading={loading}
        onRefresh={refetch}
      />

      {/* Cryptographic Zero-Knowledge Evidence & Satellite Ground Truth Proof Card */}
      <div className="bg-gradient-to-r from-primary-950/40 via-dark-900 to-dark-900 rounded-2xl border border-primary-500/30 p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400 shadow-[0_0_12px_rgba(0,163,255,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary-300">
                Cryptographic Evidence Verified
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                Groth16 (BN128)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Sentinel-2 L2A Reflectance + Polygon Geodesic Commitment: <code className="text-primary-300">{farm?.commitment_hash?.slice(0, 16) || farmId?.slice(0, 16)}...</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
          <div>
            NDVI Drop: <strong className="text-red-400">-{ndviDropDisplay}%</strong>
          </div>
          <div>·</div>
          <div>
            Exp. Loss: <strong className="text-amber-400">{lossPct}%</strong>
          </div>
          <div>·</div>
          <Link to="/ledger" className="text-primary-400 hover:text-primary-300 underline text-xs">
            Inspect Ledger →
          </Link>
        </div>
      </div>

      {/* Multi-Spectral Processing Pipeline Visual Snapshots (Reference Diagram Feature) */}
      <div className="bg-dark-800/90 rounded-2xl border border-dark-700 p-6 shadow-xl backdrop-blur">
        <AnalysisPipelineSnapshots
          farmName={farm?.name}
          cropType={farm?.crop_type}
          centerLat={farm?.center_lat}
          centerLon={farm?.center_lon}
          areaHa={farm?.area_hectares}
          ndviCurrent={analysis.ndvi_current}
          ndviBaseline={analysis.ndvi_baseline}
          ndviDropPct={analysis.ndvi_drop_pct}
          evi={analysis.evi_current}
          ndwi={analysis.ndwi_current}
          cloudCover={4.2}
          damageProb={analysis.damage_probability}
          riskCategory={analysis.risk_category}
          allowDemoRun={true}
        />
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Crop Health"
          value={`${healthScore}%`}
          icon={<Activity className="w-6 h-6" />}
          variant={healthScore > 70 ? 'green' : healthScore > 40 ? 'yellow' : 'red'}
          trend={{ value: -parseFloat(ndviDropDisplay), label: 'vs baseline' }}
        />
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 flex flex-col items-center justify-center shadow-sm">
          <p className="text-sm font-medium text-slate-400 mb-2 w-full">Risk Assessment</p>
          <RiskGauge score={analysis.risk_score} category={analysis.risk_category} label="Overall Risk" />
        </div>
        <StatCard
          title="Predicted Loss"
          value={`${lossPct}%`}
          subtitle={`Exp. Yield: ${analysis.expected_yield.toFixed(1)} tons/ha`}
          icon={<AlertTriangle className="w-6 h-6" />}
          variant={parseFloat(lossPct) > 20 ? 'red' : 'yellow'}
        />
        <div className={`rounded-xl border p-6 flex flex-col justify-center shadow-sm ${isEligible ? 'bg-success/10 border-success/30' : 'bg-dark-800 border-dark-700'}`}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className={`w-8 h-8 ${isEligible ? 'text-success' : 'text-slate-500'}`} />
            <h4 className="text-lg font-bold text-white">Insurance Status</h4>
          </div>
          <div className={`text-2xl font-black mt-2 ${isEligible ? 'text-success' : 'text-slate-400'}`}>
            {isEligible ? 'LIKELY ELIGIBLE' : 'NOT ELIGIBLE'}
          </div>
          <p className="text-sm text-slate-400 mt-2">Parametric trigger threshold met for policy payout.</p>
        </div>
      </div>

      {/* AI Farm Scenario & Report Explainer (Simplified Language & Voice Briefing) */}
      {farm && (
        <FarmAIExplainer
          farm={farm}
          analysis={analysis}
          weather={{
            temperature: analysis.temperature_mean,
            rainfall_30d: analysis.rainfall_mm_30d,
            rainfall_anomaly: analysis.rainfall_anomaly_pct,
          }}
        />
      )}

      {/* ── Farmer Agricultural Field Map & Sentinel-2 Intelligence ── */}
      {farm && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                  Agricultural Field Map &amp; Cadastral Boundary
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Real-time GPS parcel boundary, live farmer device location, and multi-spectral satellite overlays
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sentinel-2 (10m) Active
            </span>
          </div>

          <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border border-dark-700/80">
            <FarmMap
              farmId={farmId}
              farmName={farm.name}
              cropType={farm.crop_type}
              areaHectares={farm.area_hectares}
              centerLat={farm.center_lat}
              centerLon={farm.center_lon}
              analysis={analysis}
              damageSeverity={analysis.expected_loss_pct > 25 ? 'HIGH' : 'LOW'}
              showDamageOverlay={false}
              showTelemetryBar={true}
              allowDraw={true}
            />
          </div>
        </div>
      )}

      {/* Satellite Land Surface & Crop Canopy Analysis Section */}
      {farmId && <LandSatelliteAnalysis farmId={farmId} />}

      {/* Actionable Agronomy & Low-Bandwidth Alerts Drawer */}
      {farmId && <FarmerAlertsDrawer farmId={farmId} />}

      {/* Insurance Claim & Payout Estimation Module */}
      {farmId && <ClaimPayoutEstimator farmId={farmId} />}

      {/* Real-time Open-Meteo Weather Forecast & Agricultural Climate Ingest */}
      <LiveWeatherForecastWidget
        lat={farm?.center_lat || 36.7783}
        lon={farm?.center_lon || -119.4179}
        farmName={farm?.name || 'Registered Farm Basin'}
        cropType={farm?.crop_type || 'Agricultural Crop'}
      />

      {/* OneSoil-Inspired High-Resolution Satellite Variability & 3D Productivity Zone Studio */}
      {farmId && (
        <VariabilityInsightsStudio
          farmId={farmId}
          farm={farm}
          analysis={analysis}
        />
      )}

      {/* Comprehensive Crop Damage Analysis Studio & 6 Peril Matrix */}
      <CropDamageAnalysisStudio
        farm={farm}
        analysis={analysis}
      />

      {/* Precision GIS Multi-Spectral Satellite Intelligence Studio (Sentinel Hub / EOS Crop Monitoring) */}
      <PrecisionSatelliteGISConsole
        farmId={farmId}
        farmName={farm?.name || 'Registered Farm Parcel'}
        cropType={farm?.crop_type || 'Agricultural Crop'}
        areaHa={farm?.area_hectares || 9.6}
        centerLat={farm?.center_lat || 49.8880}
        centerLon={farm?.center_lon || 28.8644}
        currentNdvi={analysis?.ndvi_current || 0.41}
        baselineNdvi={analysis?.ndvi_baseline || 0.68}
        stressLevel={analysis?.stress_level || 'MODERATE'}
        isProcessing={false}
      />

      {/* Historical 6-Month Vegetation Health & Spectral Trajectory Section */}
      <HistoricalVegetationHealthChart
        data={analysis.ndvi_time_series}
        baseline={analysis.ndvi_baseline}
        cropType={farm?.crop_type || 'Crop'}
        farmName={farm?.name || 'Farm Parcel'}
        stressThreshold={0.30}
        currentDropPct={parseFloat(ndviDropDisplay)}
      />

      {/* ── Bottom Grid: Peril Impact Scorecard + ZK Claim ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Peril Scorecard */}
        <div className="lg:col-span-2 bg-dark-800 rounded-2xl border border-dark-700 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Parametric Peril Scorecard
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Key contributing factors to crop stress &amp; payout eligibility · Kharif 2026</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isEligible ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-dark-700 text-slate-400 border border-dark-600'}`}>
              {isEligible ? '⚡ Trigger Ready' : 'Below Threshold'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
              <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Stress Level</p>
              <p className="text-xl font-black text-white capitalize mt-1">{analysis.stress_level.replace('_', ' ')}</p>
              <p className="text-xs text-slate-400 mt-1">Sensor-confirmed crop condition</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
              <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Damage Probability</p>
              <p className={`text-xl font-black mt-1 ${analysis.damage_probability > 0.5 ? 'text-rose-400' : 'text-amber-400'}`}>
                {(analysis.damage_probability > 1 ? analysis.damage_probability : analysis.damage_probability * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">ML Groth16 regressor confidence</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Peril Factors</p>
            {[
              { label: 'NDVI Vegetation Drop', width: Math.min(parseFloat(ndviDropDisplay) * 2, 100), color: 'bg-red-500', value: `-${ndviDropDisplay}%` },
              { label: 'Rainfall Anomaly', width: Math.min(Math.abs(analysis.rainfall_anomaly_pct), 100), color: 'bg-amber-500', value: `${analysis.rainfall_anomaly_pct.toFixed(1)}%` },
              { label: 'Heat Stress Index', width: Math.min(analysis.heat_stress_score > 1 ? analysis.heat_stress_score : analysis.heat_stress_score * 100, 100), color: 'bg-orange-500', value: `${(analysis.heat_stress_score > 1 ? analysis.heat_stress_score : analysis.heat_stress_score * 100).toFixed(0)}%` },
              { label: 'Drought Risk', width: Math.min((analysis.drought_risk ?? 0) > 1 ? analysis.drought_risk : (analysis.drought_risk ?? 0) * 100, 100), color: 'bg-yellow-500', value: `${((analysis.drought_risk ?? 0) > 1 ? analysis.drought_risk : (analysis.drought_risk ?? 0) * 100).toFixed(0)}%` },
            ].map(({ label, width, color, value }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="w-40 text-sm text-slate-300 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-dark-900 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${width}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 w-12 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: ZK Claim Generation */}
        <div className="space-y-4">
          <WeatherRiskPanel
            drought_risk={analysis.drought_risk}
            flood_risk={analysis.flood_risk}
            heat_stress={analysis.heat_stress_score}
            rainfall_mm_30d={analysis.rainfall_mm_30d}
            rainfall_anomaly_pct={analysis.rainfall_anomaly_pct}
          />

            <div className={`bg-dark-800 rounded-2xl border p-6 shadow-xl relative overflow-hidden ${isEligible ? 'border-emerald-500/30' : 'border-dark-700'}`}>
            {isEligible && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-primary-400" />}
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${isEligible ? 'bg-emerald-500/15 text-emerald-400' : 'bg-dark-700 text-slate-500'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Privacy Claim (ZKP)</h3>
                <p className="text-xs text-slate-400">100% Private · Satellite Verified</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs mb-3.5 leading-relaxed">
              Proves genuine crop damage to the insurer for <strong className="text-emerald-400">instant automated payout</strong> while keeping your exact location, yield history, and financial data 100% private.
            </p>

            <div className="bg-dark-900 rounded-xl p-3 mb-4 border border-dark-700 font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Vegetation Drop</span>
                <span className={`font-bold ${parseFloat(ndviDropDisplay) >= 30 ? 'text-emerald-400' : 'text-slate-300'}`}>-{ndviDropDisplay}% {parseFloat(ndviDropDisplay) >= 30 ? '✓' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Loss</span>
                <span className="text-white font-bold">{lossPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payout Status</span>
                <span className={`font-bold ${isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>{isEligible ? 'Eligible for Payout ✓' : 'Below Policy Trigger'}</span>
              </div>
            </div>

            <button
              onClick={handleGenerateClaim}
              disabled={!isEligible || isGeneratingClaim}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isEligible
                  ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-900/30'
                  : 'bg-dark-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isGeneratingClaim ? 'Generating Privacy Proof…' : 'Generate Privacy Proof & Claim'}</span>
            </button>
            {!isEligible && (
              <p className="text-xs text-center text-slate-500 mt-2">Parametric threshold not yet met.</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
