import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RotateCcw, Sparkles } from 'lucide-react';

interface FarmMapProps {
  onChange?: (coords: number[][]) => void;
  existingBoundary?: number[][];
  readOnly?: boolean;
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

export default function FarmMap({ onChange, existingBoundary, readOnly = false }: FarmMapProps) {
  const [points, setPoints] = useState<number[][]>(existingBoundary || []);
  const [mapReady, setMapReady] = useState(false);

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

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-dark-700 shadow-md relative z-0 flex flex-col min-h-[420px]">
      {/* Interactive Controls Overlay for Farmer */}
      {!readOnly && (
        <div className="absolute top-3 left-3 z-[1000] bg-dark-900/90 backdrop-blur border border-dark-600 rounded-lg p-2 flex items-center gap-2 text-xs shadow-xl">
          <div className="flex items-center gap-1 text-slate-300 font-medium px-1">
            <MapPin className="w-3.5 h-3.5 text-primary-400" />
            <span>Click map to add corners ({points.length} vertices)</span>
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

      <MapContainer center={center} zoom={points.length > 0 ? 15 : 13} className="h-full w-full flex-1">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapClickHandler onAddPoint={handleAddPoint} disabled={readOnly} />

        {/* Drawn Markers */}
        {points.map((pt, idx) => (
          <CircleMarker
            key={`pt-${idx}`}
            center={[pt[0], pt[1]]}
            radius={5}
            pathOptions={{ color: '#10b981', fillColor: '#34d399', fillOpacity: 0.9 }}
          />
        ))}

        {/* Polygon */}
        {points.length >= 3 && (
          <Polygon
            positions={points as L.LatLngTuple[]}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: readOnly ? undefined : '4, 4'
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
