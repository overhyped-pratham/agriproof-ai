import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Marker, Tooltip, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RotateCcw, Sparkles, Satellite, Layers, Sprout, Calendar, Activity, Info } from 'lucide-react';

export interface FarmPlot {
  id: string;
  name: string;
  cropType: string;
  plantingDate: string;
  lat: number;
  lng: number;
  variety?: string;
  targetYield?: string;
  growthStage?: string;
  health?: 'Optimal' | 'Mild Stress' | 'High Risk' | 'Degraded';
  ndvi?: number;
}

interface FarmMapProps {
  onChange?: (coords: number[][]) => void;
  existingBoundary?: number[][];
  readOnly?: boolean;
  damageSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  showDamageOverlay?: boolean;
  plots?: FarmPlot[];
  onSelectPlot?: (plot: FarmPlot) => void;
}

// Map Click Handler for drawing polygon vertices
function MapClickHandler({ onAddPoint, disabled }: { onAddPoint: (lat: number, lng: number) => void, disabled: boolean }) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onAddPoint(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function FarmMap({
  onChange,
  existingBoundary,
  readOnly = false,
  damageSeverity = 'HIGH',
  showDamageOverlay = false,
  plots = [],
  onSelectPlot
}: FarmMapProps) {
  const [points, setPoints] = useState<number[][]>(existingBoundary || []);
  const [mapReady, setMapReady] = useState(false);
  const [baseMap, setBaseMap] = useState<'satellite' | 'dark'>('satellite');

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (existingBoundary && existingBoundary.length > 0) {
      setPoints(existingBoundary);
    }
  }, [existingBoundary]);

  const handleAddPoint = (lat: number, lng: number) => {
    const newPoints = [...points, [lat, lng]];
    setPoints(newPoints);
    if (onChange && newPoints.length >= 3) {
      onChange(newPoints);
    }
  };

  const handleReset = () => {
    setPoints([]);
    if (onChange) onChange([]);
  };

  const loadPreset = (presetName: 'punjab' | 'kerala' | 'maharashtra') => {
    let preset: number[][] = [];
    if (presetName === 'punjab') {
      preset = [
        [30.3410, 76.3855],
        [30.3410, 76.3883],
        [30.3386, 76.3883],
        [30.3386, 76.3855]
      ];
    } else if (presetName === 'kerala') {
      preset = [
        [10.5290, 76.2130],
        [10.5290, 76.2158],
        [10.5262, 76.2158],
        [10.5262, 76.2130]
      ];
    } else {
      preset = [
        [21.1472, 79.0866],
        [21.1472, 79.0898],
        [21.1444, 79.0898],
        [21.1444, 79.0866]
      ];
    }
    setPoints(preset);
    if (onChange) onChange(preset);
  };

  const center: L.LatLngTuple = points.length > 0
    ? [points[0][0], points[0][1]]
    : [30.3398, 76.3869]; // Default center Punjab

  if (!mapReady) return <div className="h-full w-full bg-dark-800 animate-pulse rounded-xl" />;

  const polygonColor = showDamageOverlay
    ? (damageSeverity === 'CRITICAL' || damageSeverity === 'HIGH' ? '#ef4444' : '#eab308')
    : '#10b981';

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-dark-700 shadow-md relative z-0 flex flex-col min-h-[420px]">
      {/* Top Map Layer Switcher & Registration Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        {/* Layer Mode Toggle */}
        <div className="bg-dark-900/90 backdrop-blur border border-dark-600 rounded-lg p-1 flex items-center gap-1 shadow-xl">
          <button
            type="button"
            onClick={() => setBaseMap('satellite')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              baseMap === 'satellite'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Real-Time Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => setBaseMap('dark')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              baseMap === 'dark'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dark Carto</span>
          </button>
        </div>

        {/* Interactive Controls for Farm Registration */}
        {!readOnly && (
          <div className="bg-dark-900/90 backdrop-blur border border-dark-600 rounded-lg p-1.5 flex items-center gap-2 text-xs shadow-xl">
            <div className="flex items-center gap-1 text-slate-300 font-medium px-1">
              <MapPin className="w-3.5 h-3.5 text-primary-400" />
              <span>Click to add corners ({points.length} pts)</span>
            </div>

            <div className="h-4 w-[1px] bg-dark-600" />

            {/* Quick Presets for Demo */}
            <button
              type="button"
              onClick={() => loadPreset('punjab')}
              className="px-2 py-1 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white rounded border border-dark-600 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" /> Punjab Preset
            </button>

            <button
              type="button"
              onClick={() => loadPreset('kerala')}
              className="px-2 py-1 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white rounded border border-dark-600 transition-colors"
            >
              Kerala Preset
            </button>

            {points.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded border border-red-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map Body */}
      <MapContainer center={center} zoom={points.length > 0 ? 15 : 13} className="h-full w-full flex-1">
        {baseMap === 'satellite' ? (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            maxZoom={19}
          />
        ) : (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        )}

        <MapClickHandler onAddPoint={handleAddPoint} disabled={readOnly} />

        {/* Drawn Vertex Markers */}
        {points.map((pt, idx) => (
          <CircleMarker
            key={`pt-${idx}`}
            center={[pt[0], pt[1]]}
            radius={6}
            pathOptions={{
              color: '#ffffff',
              fillColor: polygonColor,
              fillOpacity: 1.0,
              weight: 2
            }}
          />
        ))}

        {/* Bounding Polygon Area */}
        {points.length >= 3 && (
          <Polygon
            positions={points as L.LatLngTuple[]}
            pathOptions={{
              color: polygonColor,
              fillColor: polygonColor,
              fillOpacity: showDamageOverlay ? 0.35 : 0.20,
              weight: 3,
              dashArray: readOnly ? undefined : '5, 5'
            }}
          />
        )}

        {/* Interactive Farm Plot Markers with Tooltips & Popups */}
        {plots && plots.map((plot) => {
          // Custom Leaflet DivIcon with badge and glowing pulse
          const healthColor =
            plot.health === 'Optimal' ? '#10b981' :
            plot.health === 'Mild Stress' ? '#f59e0b' :
            plot.health === 'High Risk' ? '#ef4444' : '#06b6d4';

          const customPlotIcon = L.divIcon({
            className: 'custom-farm-plot-marker',
            html: `
              <div style="position: relative; width: 34px; height: 34px; display: flex; items-center: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; inset: 0; background: ${healthColor}; opacity: 0.3; border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: relative; width: 30px; height: 30px; background: #0f172a; border: 2px solid ${healthColor}; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                  <span style="font-size: 14px;">🌱</span>
                </div>
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18],
            tooltipAnchor: [0, -18]
          });

          return (
            <Marker
              key={plot.id}
              position={[plot.lat, plot.lng]}
              icon={customPlotIcon}
              eventHandlers={{
                click: () => {
                  if (onSelectPlot) onSelectPlot(plot);
                }
              }}
            >
              {/* Interactive Tooltip: Displays Crop Type & Planting Date on Hover */}
              <Tooltip direction="top" offset={[0, -14]} opacity={0.98} permanent={false}>
                <div className="p-1 text-xs font-sans">
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <span>🌱</span> {plot.name}
                  </div>
                  <div className="text-slate-200 mt-0.5">
                    <span className="font-semibold text-white">Crop:</span> {plot.cropType}
                  </div>
                  <div className="text-slate-300">
                    <span className="font-semibold text-white">Planting Date:</span> {plot.plantingDate}
                  </div>
                  {plot.variety && (
                    <div className="text-slate-400 text-[10px]">
                      Variety: {plot.variety}
                    </div>
                  )}
                </div>
              </Tooltip>

              {/* Rich Interactive Click Popup */}
              <Popup className="farm-plot-popup">
                <div className="p-2 min-w-[210px] text-slate-800 font-sans">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-2 border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <span className="text-base">🌾</span> {plot.name}
                    </h4>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: healthColor }}
                    >
                      {plot.health || 'Optimal'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5 text-emerald-600 inline" /> Crop Type:
                      </span>
                      <span className="font-bold text-slate-900">{plot.cropType}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 inline" /> Planting Date:
                      </span>
                      <span className="font-semibold text-slate-800">{plot.plantingDate}</span>
                    </div>

                    {plot.variety && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Cultivar Variety:</span>
                        <span className="text-slate-800">{plot.variety}</span>
                      </div>
                    )}

                    {plot.growthStage && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Growth Stage:</span>
                        <span className="text-slate-800">{plot.growthStage}</span>
                      </div>
                    )}

                    {plot.ndvi !== undefined && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
                        <span className="text-slate-500 font-medium">Live NDVI Index:</span>
                        <span className="font-bold text-emerald-600">{plot.ndvi.toFixed(3)}</span>
                      </div>
                    )}

                    {plot.targetYield && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Target Yield:</span>
                        <span className="font-semibold text-slate-700">{plot.targetYield}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Real-Time Analysis & Satellite Metadata Watermark */}
      <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-dark-900/90 backdrop-blur border border-dark-700/80 px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs font-mono text-slate-300 pointer-events-none">
        <span className="flex items-center gap-1.5 text-primary-400">
          <Satellite className="w-3.5 h-3.5" />
          <span>REAL-TIME EO SATELLITE CAPTURE (3m GSD)</span>
        </span>
        <span className="text-slate-400">
          Center: {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
        </span>
      </div>
    </div>
  );
}
