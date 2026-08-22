import { useEffect, useState } from "react";
import { api, Farm } from "../../lib/api";
import { onboardService } from "../../lib/onboardService";
import { CheckSquare, Square, Loader2, Tractor, ChevronRight } from "lucide-react";

interface Props {
  onNext: (farms: Farm[]) => void;
  onBack: () => void;
}

export function StepSelectFarms({ onNext, onBack }: Props) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => onboardService.get().selectedFarmIds);

  useEffect(() => {
    api.farms.list()
      .then(res => setFarms(res.data || []))
      .catch(() => setError("Could not load farms. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    const session = onboardService.get();
    onboardService.save({ ...session, selectedFarmIds: selectedIds });
    const selected = farms.filter(f => selectedIds.includes(f.id));
    onNext(selected);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Your Farms</h2>
        <p className="text-slate-400 text-sm mt-1">Select the farms you want to analyse.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-600/40 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {!loading && !error && farms.length === 0 && (
        <div className="text-slate-400 text-sm text-center py-8">
          No farms registered yet. <a href="/register" className="text-emerald-400 underline">Register a farm</a> first.
        </div>
      )}

      {!loading && farms.length > 0 && (
        <div className="divide-y divide-dark-700 border border-dark-700 rounded-2xl overflow-hidden">
          {farms.map(farm => {
            const selected = selectedIds.includes(farm.id);
            return (
              <button
                key={farm.id}
                onClick={() => toggle(farm.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${selected ? "bg-emerald-950/30" : "bg-dark-800 hover:bg-dark-750"}`}
              >
                {selected
                  ? <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                  : <Square className="w-5 h-5 text-slate-500 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${selected ? "text-emerald-200" : "text-white"}`}>{farm.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {farm.area_hectares ? `${farm.area_hectares} ha` : ""}{farm.crop_type ? ` · ${farm.crop_type}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Tractor className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedIds.length > 0 && (
        <p className="text-center text-sm text-emerald-400 font-medium">
          {selectedIds.length} farm{selectedIds.length > 1 ? "s" : ""} selected
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl border border-dark-600 text-slate-300 text-sm font-semibold hover:bg-dark-700 transition-colors">
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={selectedIds.length === 0}
          className="flex-[2] py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          Select Crops <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
