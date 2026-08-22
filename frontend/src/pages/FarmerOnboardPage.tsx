import { useState } from "react";
import { Farm } from "../lib/api";
import { FarmerLocation } from "../lib/onboardService";
import { StepLocation } from "../components/onboard/StepLocation";
import { StepDrawField } from "../components/onboard/StepDrawField";
import { StepSelectCrops } from "../components/onboard/StepSelectCrops";
import { StepAnalyze } from "../components/onboard/StepAnalyze";
import { Sprout } from "lucide-react";

type Step = 0 | 1 | 2 | 3;

const STEPS = ["Location", "Draw Field", "Select Crops", "Analyse"];

export default function FarmerOnboardPage() {
  const [step, setStep] = useState<Step>(0);
  const [location, setLocation] = useState<FarmerLocation | null>(null);
  const [selectedFarms, setSelectedFarms] = useState<Farm[]>([]);
  const [cropSelections, setCropSelections] = useState<Record<string, string[]>>({});

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-start px-4 py-8 pb-16">
      {/* Logo */}
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg mb-8">
        <Sprout className="w-6 h-6" />
        <span>AgriProof · Farmer Onboarding</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-emerald-600 text-white"
                    : i === step
                    ? "bg-emerald-500 text-white ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-dark-950"
                    : "bg-dark-700 text-slate-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight ${
                  i === step ? "text-emerald-400 font-bold" : i < step ? "text-emerald-600" : "text-slate-600"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        {/* Connector line */}
        <div className="flex items-center mt-1 px-3.5">
          {STEPS.slice(0, -1).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-0.5 ${i < step ? "bg-emerald-600" : "bg-dark-700"}`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className={`w-full ${step === 1 ? 'max-w-2xl' : 'max-w-md'} bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl transition-all duration-300`}>
        {step === 0 && (
          <StepLocation
            onNext={(loc) => {
              setLocation(loc);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <StepDrawField
            location={location}
            onNext={(farm) => {
              setSelectedFarms([farm]);
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <StepSelectCrops
            farms={selectedFarms}
            onNext={(crops) => {
              setCropSelections(crops);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepAnalyze
            farms={selectedFarms}
            cropSelections={cropSelections}
            onBack={() => setStep(2)}
          />
        )}
      </div>

      {/* Bottom hint */}
      <p className="text-slate-600 text-xs text-center mt-6 max-w-xs">
        Your cadastral boundary is verified via Sentinel-2 earth observation and secured with zero-knowledge cryptographic proofs.
      </p>
    </div>
  );
}
