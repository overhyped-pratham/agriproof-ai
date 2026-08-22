import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Farm } from "../../lib/api";
import { api } from "../../lib/api";
import { onboardService } from "../../lib/onboardService";
import { Loader2, CheckCircle2, XCircle, Satellite, ChevronRight } from "lucide-react";
import ProcessingTimer from "../analysis/ProcessingTimer";

interface Props {
  farms: Farm[];
  cropSelections: Record<string, string[]>;
  onBack: () => void;
}

type FarmStatus = "waiting" | "running" | "done" | "error";

interface FarmProgress {
  farm: Farm;
  status: FarmStatus;
  elapsedSec?: string;
}

export function StepAnalyze({ farms, cropSelections, onBack }: Props) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<FarmProgress[]>(
    farms.map(f => ({ farm: f, status: "waiting" }))
  );
  const [started, setStarted] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const updateStatus = (farmId: string, status: FarmStatus, elapsedSec?: string) => {
    setProgress(prev => prev.map(p => p.farm.id === farmId ? { ...p, status, elapsedSec: elapsedSec || p.elapsedSec } : p));
  };

  const startAnalysis = async () => {
    setStarted(true);
    const results: boolean[] = [];

    for (const farm of farms) {
      const t0 = performance.now();
      updateStatus(farm.id, "running");
      try {
        await api.farms.analyze(farm.id);
        const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
        updateStatus(farm.id, "done", `${elapsed}s`);
        results.push(true);
      } catch {
        // If analyze fails, check if analysis already exists
        try {
          await api.farms.getAnalysis(farm.id);
          const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
          updateStatus(farm.id, "done", `${elapsed}s`);
          results.push(true);
        } catch {
          updateStatus(farm.id, "error");
          results.push(false);
        }
      }
    }

    const anyDone = results.some(Boolean);
    if (anyDone) setAllDone(true);
  };

  const goToDashboard = () => {
    const firstDone = progress.find(p => p.status === "done");
    if (firstDone) {
      onboardService.clear();
      navigate(`/dashboard/${firstDone.farm.id}`);
    }
  };

  const statusIcon = (status: FarmStatus) => {
    if (status === "waiting") return <div className="w-5 h-5 rounded-full border-2 border-dark-600" />;
    if (status === "running") return <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />;
    if (status === "done")    return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    if (status === "error")   return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const statusLabel = (status: FarmStatus) => {
    if (status === "waiting") return "Waiting…";
    if (status === "running") return "Analysing satellite data…";
    if (status === "done")    return "Analysis complete";
    if (status === "error")   return "Failed — check connection";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Satellite Analysis</h2>
        <p className="text-slate-400 text-sm mt-1">
          We will run a full NDVI, moisture and damage assessment for each farm.
        </p>
      </div>

      {/* Live Animated Processing Timer HUD */}
      {started && (
        <ProcessingTimer
          isRunning={started && !allDone}
          isComplete={allDone}
          stageName="Multi-Farm Satellite Analysis"
        />
      )}

      {/* Farm summary cards */}
      <div className="space-y-2">
        {progress.map(({ farm, status, elapsedSec }) => (
          <div
            key={farm.id}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${
              status === "done" ? "bg-emerald-950/30 border-emerald-700/40" :
              status === "error" ? "bg-red-950/30 border-red-700/40" :
              status === "running" ? "bg-dark-800 border-emerald-600/30" :
              "bg-dark-800 border-dark-700"
            }`}
          >
            {statusIcon(status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{farm.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {(cropSelections[farm.id] || [farm.crop_type]).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {elapsedSec && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  ⚡ {elapsedSec}
                </span>
              )}
              <span className={`text-xs font-medium ${
                status === "done" ? "text-emerald-400" :
                status === "error" ? "text-red-400" :
                status === "running" ? "text-emerald-300" :
                "text-slate-500"
              }`}>
                {statusLabel(status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected summary */}
      <div className="bg-dark-800/60 border border-dark-700 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">Selected Farms</span>
        <span className="text-white font-semibold">{farms.length}</span>
        <span className="text-slate-400">Selected Crops</span>
        <span className="text-white font-semibold">{Object.values(cropSelections).flat().length}</span>
      </div>

      <div className="flex gap-3">
        {!started && (
          <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl border border-dark-600 text-slate-300 text-sm font-semibold hover:bg-dark-700 transition-colors">
            ← Back
          </button>
        )}
        {!started && (
          <button
            onClick={startAnalysis}
            className="flex-[2] py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Satellite className="w-4 h-4" /> Start Satellite Analysis
          </button>
        )}
        {allDone && (
          <button
            onClick={goToDashboard}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            View Results <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
