import { useState } from "react";
import { Farm } from "../../lib/api";
import { onboardService, AVAILABLE_CROPS } from "../../lib/onboardService";
import { CheckSquare, Square, ChevronRight } from "lucide-react";

interface Props {
  farms: Farm[];
  onNext: (cropSelections: Record<string, string[]>) => void;
  onBack: () => void;
}

export function StepSelectCrops({ farms, onNext, onBack }: Props) {
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const saved = onboardService.get().cropSelections;
    // Pre-check each farm's existing crop_type
    const init: Record<string, string[]> = {};
    farms.forEach(f => {
      init[f.id] = saved[f.id] ?? (f.crop_type ? [f.crop_type] : []);
    });
    return init;
  });

  const toggle = (farmId: string, crop: string) => {
    setSelections(prev => {
      const current = prev[farmId] || [];
      const next = current.includes(crop)
        ? current.filter(c => c !== crop)
        : [...current, crop];
      return { ...prev, [farmId]: next };
    });
  };

  const handleNext = () => {
    farms.forEach(f => onboardService.setCrops(f.id, selections[f.id] || []));
    onNext(selections);
  };

  const totalCrops = Object.values(selections).flat().length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-white">What are you growing?</h2>
        <p className="text-slate-400 text-sm mt-1">Select the crops grown on each farm.</p>
      </div>

      <div className="space-y-4">
        {farms.map(farm => (
          <div key={farm.id} className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-3">{farm.name}</p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_CROPS.map(crop => {
                const checked = (selections[farm.id] || []).includes(crop);
                return (
                  <button
                    key={crop}
                    onClick={() => toggle(farm.id, crop)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                      checked
                        ? "bg-emerald-950/40 border border-emerald-600/50 text-emerald-200"
                        : "bg-dark-900/60 border border-dark-600 text-slate-400 hover:border-dark-500"
                    }`}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    }
                    <span className="truncate">{crop}</span>
                  </button>
                );
              })}
            </div>
            {(selections[farm.id] || []).length === 0 && (
              <p className="text-xs text-amber-400 mt-2">Please select at least one crop.</p>
            )}
          </div>
        ))}
      </div>

      {totalCrops > 0 && (
        <p className="text-center text-sm text-emerald-400 font-medium">
          {totalCrops} crop type{totalCrops > 1 ? "s" : ""} selected across {farms.length} farm{farms.length > 1 ? "s" : ""}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl border border-dark-600 text-slate-300 text-sm font-semibold hover:bg-dark-700 transition-colors">
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={totalCrops === 0}
          className="flex-[2] py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          Start Analysis <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
