import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number;
  category: string;
  label: string;
}

export default function RiskGauge({ score, category, label }: RiskGaugeProps) {
  // Normalize score to 0-100 range
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  // Calculate rotation (0 to 180 degrees)
  // At 0 score, rotation is 0. At 100 score, rotation is 180.
  const rotation = (normalizedScore / 100) * 180;
  
  // Determine color based on score
  let colorClass = "text-primary-600";
  if (normalizedScore > 30) colorClass = "text-warning";
  if (normalizedScore > 60) colorClass = "text-orange-500";
  if (normalizedScore > 80) colorClass = "text-danger";

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-dark-800 rounded-xl border border-dark-700 shadow-md">
      <div className="relative w-48 h-24 overflow-hidden flex justify-center">
        {/* SVG Arc for gauge background */}
        <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-md">
          {/* Green zone */}
          <path d="M 10 50 A 40 40 0 0 1 21 21.7" fill="none" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" />
          {/* Yellow zone */}
          <path d="M 21 21.7 A 40 40 0 0 1 50 10" fill="none" stroke="#facc15" strokeWidth="8" />
          {/* Orange zone */}
          <path d="M 50 10 A 40 40 0 0 1 79 21.7" fill="none" stroke="#f97316" strokeWidth="8" />
          {/* Red zone */}
          <path d="M 79 21.7 A 40 40 0 0 1 90 50" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
        </svg>

        {/* Animated Needle */}
        <motion.div 
          className="absolute bottom-0 w-1 h-20 bg-slate-200 origin-bottom rounded-t-full shadow-lg"
          initial={{ rotate: -90 }}
          animate={{ rotate: -90 + rotation }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: "bottom center" }}
        />
        
        {/* Needle center pin */}
        <div className="absolute bottom-0 w-4 h-4 bg-slate-300 rounded-full translate-y-1/2 border-2 border-dark-900" />
      </div>

      <div className="mt-4 text-center">
        <div className={`text-4xl font-bold ${colorClass}`}>{Math.round(normalizedScore)}</div>
        <div className="text-lg font-semibold text-slate-200 mt-1">{category}</div>
        <div className="text-sm text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  );
}
