import { useState, useEffect } from "react";
import { MapPin, Navigation, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { onboardService, FarmerLocation } from "../../lib/onboardService";

interface Props {
  onNext: (location: FarmerLocation) => void;
}

type GeoState = "idle" | "requesting" | "resolving" | "done" | "denied" | "error";

export function StepLocation({ onNext }: Props) {
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [location, setLocation] = useState<FarmerLocation | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Auto-request on mount
  useEffect(() => {
    const saved = onboardService.get().location;
    if (saved) { setLocation(saved); setGeoState("done"); }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) { setGeoState("denied"); return; }
    setGeoState("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoState("resolving");
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const label = await onboardService.reverseGeocode(lat, lon);
        const loc = { lat, lon, label };
        onboardService.setLocation(loc);
        setLocation(loc);
        setGeoState("done");
      },
      () => { setGeoState("denied"); setShowSearch(true); }
    );
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  };

  const selectSearchResult = (r: any) => {
    const loc: FarmerLocation = {
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      label: r.address?.village || r.address?.town || r.address?.city || r.display_name,
    };
    onboardService.setLocation(loc);
    setLocation(loc);
    setGeoState("done");
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Where is your farm?</h2>
        <p className="text-slate-400 text-sm mt-1">We use your location to find your registered farms.</p>
      </div>

      {/* GPS Button */}
      {geoState !== "done" && (
        <button
          onClick={requestLocation}
          disabled={geoState === "requesting" || geoState === "resolving"}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-base transition-colors shadow-lg"
        >
          {geoState === "requesting" || geoState === "resolving" ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>{geoState === "requesting" ? "Getting location…" : "Looking up village…"}</span></>
          ) : (
            <><Navigation className="w-5 h-5" /><span>Use my current location</span></>
          )}
        </button>
      )}

      {/* Location confirmed card */}
      {geoState === "done" && location && (
        <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-emerald-300 font-semibold text-sm">{location.label}</p>
            <p className="text-slate-400 text-xs mt-1 font-mono">
              {location.lat.toFixed(5)}°N &nbsp;·&nbsp; {location.lon.toFixed(5)}°E
            </p>
          </div>
          <button onClick={() => { setGeoState("idle"); setShowSearch(true); }} className="text-xs text-slate-400 underline shrink-0">Change</button>
        </div>
      )}

      {/* Denied banner */}
      {geoState === "denied" && (
        <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300 text-sm">Location access is unavailable. Please search your location below.</p>
        </div>
      )}

      {/* Search toggle */}
      {!showSearch && geoState !== "done" && (
        <button onClick={() => setShowSearch(true)} className="text-sm text-slate-400 underline text-center">
          Search location manually
        </button>
      )}

      {/* Search box */}
      {showSearch && geoState !== "done" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Village, town or district…"
                className="w-full pl-9 pr-3 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden divide-y divide-dark-700">
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => selectSearchResult(r)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 text-left transition-colors">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-slate-200 truncate">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next CTA */}
      {geoState === "done" && location && (
        <button
          onClick={() => onNext(location)}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors shadow-lg mt-2"
        >
          Continue → Draw Field Boundary
        </button>
      )}
    </div>
  );
}
