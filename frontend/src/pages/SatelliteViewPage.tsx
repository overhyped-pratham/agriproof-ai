import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Sliders, Mountain } from 'lucide-react';
import FarmMap from '../components/FarmMap';
import AnalysisPipelineSnapshots from '../components/AnalysisPipelineSnapshots';
import LandSatelliteAnalysis from '../components/LandSatelliteAnalysis';
import { useAnalysis } from '../hooks/useAnalysis';
import { api, Farm } from '../lib/api';

export default function SatelliteViewPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate   = useNavigate();
  const { analysis } = useAnalysis(farmId);
  const [farm, setFarm]                 = useState<Farm | null>(null);
  const [layer, setLayer]               = useState('ndvi');
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showLandAnalysis, setShowLandAnalysis] = useState(false);

  // Fetch the real farm record to get actual coordinates
  useEffect(() => {
    if (!farmId) return;
    api.farms.get(farmId)
      .then(res => setFarm(res.data))
      .catch(err => console.error('[SatelliteViewPage] Failed to fetch farm:', err));
  }, [farmId]);

  const layers = [
    { id: 'truecolor', name: 'True Color' },
    { id: 'cloudmask', name: 'Cloud Mask' },
    { id: 'ndvi',      name: 'NDVI (Vegetation)' },
    { id: 'evi',       name: 'EVI (Enhanced)' },
    { id: 'ndwi',      name: 'NDWI (Water)' },
    { id: 'threshold', name: 'Threshold Mask' },
    { id: 'vector',    name: 'Vector Extent' },
  ];

  // Build a small bounding box around the farm center for the map
  const farmBoundary: number[][] | undefined = farm
    ? [
        [farm.center_lat + 0.005, farm.center_lon - 0.005],
        [farm.center_lat + 0.005, farm.center_lon + 0.005],
        [farm.center_lat - 0.005, farm.center_lon + 0.005],
        [farm.center_lat - 0.005, farm.center_lon - 0.005],
      ]
    : undefined;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-dark-900 relative">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            className="bg-dark-900/90 text-white px-4 py-2 rounded-lg border border-dark-600 shadow-lg hover:bg-dark-800 flex items-center gap-2 backdrop-blur transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="bg-dark-900/90 rounded-lg border border-dark-600 shadow-lg backdrop-blur flex p-1 overflow-x-auto max-w-[50vw]">
            {layers.map(l => (
              <button
                key={l.id}
                onClick={() => setLayer(l.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  layer === l.id ? 'bg-primary-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 pointer-events-auto">
          <button
            onClick={() => {
              setShowLandAnalysis(!showLandAnalysis);
              if (showSnapshots) setShowSnapshots(false);
            }}
            className={`px-3.5 py-2 rounded-lg border shadow-lg backdrop-blur text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showLandAnalysis
                ? 'bg-primary-600 border-primary-500 text-white'
                : 'bg-dark-900/90 border-dark-600 text-slate-300 hover:text-white'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 text-primary-400" />
            {showLandAnalysis ? 'Hide Land Analysis' : 'Land Surface & Soil Analysis'}
          </button>

          <button
            onClick={() => {
              setShowSnapshots(!showSnapshots);
              if (showLandAnalysis) setShowLandAnalysis(false);
            }}
            className={`px-3.5 py-2 rounded-lg border shadow-lg backdrop-blur text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showSnapshots
                ? 'bg-primary-600 border-primary-500 text-white'
                : 'bg-dark-900/90 border-dark-600 text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {showSnapshots ? 'Hide Snapshots' : 'Pipeline Snapshots'}
          </button>

          {farm && (
            <div className="hidden xl:flex bg-dark-900/90 rounded-lg border border-dark-600 shadow-lg backdrop-blur px-3 py-2 text-xs text-slate-400 font-mono items-center gap-2">
              <span className="text-slate-200 font-semibold">{farm.name}</span>
              <span>·</span>
              <span className="text-primary-400">{farm.area_hectares.toFixed(1)} ha</span>
            </div>
          )}
        </div>
      </div>

      {/* Slide-down Snapshot Pipeline Drawer */}
      {showSnapshots && (
        <div className="absolute top-20 left-4 right-4 z-[1000] bg-dark-900/95 border border-dark-700 p-5 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <AnalysisPipelineSnapshots
            farmName={farm?.name}
            cropType={farm?.crop_type}
            centerLat={farm?.center_lat}
            centerLon={farm?.center_lon}
            areaHa={farm?.area_hectares}
            ndviCurrent={analysis?.ndvi_current}
            ndviBaseline={analysis?.ndvi_baseline}
            ndviDropPct={analysis?.ndvi_drop_pct}
            evi={analysis?.evi_current}
            ndwi={analysis?.ndwi_current}
            damageProb={analysis?.damage_probability}
            riskCategory={analysis?.risk_category}
          />
        </div>
      )}

      {/* Slide-down Land Surface & Soil Analysis Drawer */}
      {showLandAnalysis && farmId && (
        <div className="absolute top-20 left-4 right-4 bottom-24 z-[1000] bg-dark-900/95 border border-dark-700 p-6 rounded-2xl shadow-2xl backdrop-blur-md overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <LandSatelliteAnalysis farmId={farmId} />
        </div>
      )}

      {/* Map with Spectral Overlays */}
      <div className="flex-1 relative z-0">
        <FarmMap existingBoundary={farmBoundary} readOnly />

        {/* Dynamic Multi-Spectral & Mask Overlays matching the snapshots */}
        {layer === 'cloudmask' && (
          <div className="absolute inset-0 pointer-events-none mix-blend-color bg-gradient-to-tr from-purple-900/60 via-transparent to-yellow-400/50 z-[400]" />
        )}
        {layer === 'ndvi' && (
          <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-gradient-to-br from-green-500/20 via-yellow-500/20 to-red-500/20 z-[400]" />
        )}
        {layer === 'evi' && (
          <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-gradient-to-br from-emerald-500/20 via-teal-400/10 to-lime-500/20 z-[400]" />
        )}
        {layer === 'ndwi' && (
          <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-gradient-to-br from-blue-600/20 via-cyan-400/10 to-blue-300/20 z-[400]" />
        )}
        {layer === 'threshold' && (
          <div className="absolute inset-0 pointer-events-none mix-blend-screen bg-gradient-to-t from-black/40 via-amber-500/25 to-black/40 z-[400]" />
        )}
        {layer === 'vector' && (
          <div className="absolute inset-0 pointer-events-none mix-blend-screen bg-gradient-to-br from-cyan-500/15 via-transparent to-cyan-500/15 z-[400]" />
        )}
      </div>

      {/* Bottom Panel — real index values from analysis */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-dark-900/95 backdrop-blur border border-dark-600 p-4 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center gap-2 text-slate-300 mb-3 font-medium">
          <Layers className="w-4 h-4 text-primary-400" /> Current Multi-Spectral Index Values
          {!farm && <span className="text-xs text-slate-500 ml-auto animate-pulse">Loading farm…</span>}
        </div>

        {analysis ? (
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'NDVI',     value: analysis.ndvi_current,  color: 'text-success' },
              { label: 'Baseline', value: analysis.ndvi_baseline, color: 'text-slate-200' },
              { label: 'EVI',      value: analysis.evi_current,   color: 'text-emerald-400' },
              { label: 'NDWI',     value: analysis.ndwi_current,  color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-dark-800 rounded-lg p-2 border border-dark-700">
                <div className="text-xs text-slate-400">{label}</div>
                <div className={`text-lg font-bold ${color}`}>{value.toFixed(3)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 animate-pulse">Loading index data…</div>
        )}

        {layer === 'ndvi' && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-500 w-16 text-right">0.0 (Dead)</span>
            <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-600" />
            <span className="text-xs text-slate-500 w-16">1.0 (Lush)</span>
          </div>
        )}
      </div>
    </div>
  );
}
