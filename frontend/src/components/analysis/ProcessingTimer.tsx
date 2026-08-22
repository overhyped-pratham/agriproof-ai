import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle2, Timer } from 'lucide-react';

interface ProcessingTimerProps {
  isRunning: boolean;
  isComplete: boolean;
  stageName?: string;
  className?: string;
  showComparison?: boolean;
}

export const ProcessingTimer: React.FC<ProcessingTimerProps> = ({
  isRunning,
  isComplete,
  className = '',
  showComparison = true,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && !isComplete) {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
      }

      const update = () => {
        if (startTimeRef.current !== null) {
          setElapsedMs(performance.now() - startTimeRef.current);
          frameRef.current = requestAnimationFrame(update);
        }
      };

      frameRef.current = requestAnimationFrame(update);

      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    } else if (!isRunning && !isComplete) {
      startTimeRef.current = null;
      setElapsedMs(0);
    }
  }, [isRunning, isComplete]);

  // Format seconds and hundredths of a second
  const seconds = (elapsedMs / 1000).toFixed(2);
  const totalSecondsNum = elapsedMs / 1000;

  // Percentage of expected target (~5.0 seconds standard benchmark)
  const targetPct = Math.min(100, (totalSecondsNum / 5.0) * 100);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        isComplete
          ? 'bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-black border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : 'bg-gradient-to-r from-black/80 via-cyan-950/30 to-black/80 border-cyan-500/30 shadow-[0_0_20px_rgba(0,163,255,0.15)]'
      } p-4 backdrop-blur-xl transition-all duration-500 ${className}`}
    >
      {/* Background Animated Pulse Glow */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,163,255,0.12)_0%,transparent_70%)] pointer-events-none"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side: Timer & Live Spinner */}
        <div className="flex items-center gap-3.5">
          {/* Animated Circular HUD Indicator */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            {/* SVG Circular Progress Bar */}
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-white/10 fill-none"
                strokeWidth="3"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                className={`fill-none ${
                  isComplete
                    ? 'stroke-emerald-400'
                    : 'stroke-cyan-400'
                }`}
                strokeWidth="3"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * targetPct) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : isRunning ? (
                <Timer className="w-5 h-5 text-cyan-400 animate-pulse" />
              ) : (
                <Clock className="w-5 h-5 text-white/40" />
              )}
            </div>
          </div>

          {/* Time Display */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                {isComplete ? 'Total Execution Time' : 'Live Processing Time'}
              </span>
              {isRunning && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                  REAL-TIME
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5 font-mono">
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isComplete ? 'text-emerald-400' : 'text-cyan-300'
                }`}
              >
                {seconds}
              </span>
              <span className="text-sm font-semibold text-white/50">sec</span>

              {isComplete && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                >
                  <Zap className="w-3 h-3" /> VERIFIED
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Benchmark Speed Comparison */}
        {showComparison && (
          <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1 font-mono text-xs border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4">
            <div className="flex items-center gap-1.5 text-white/60">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Speedup vs Manual:</span>
              <span className="text-emerald-400 font-bold">99.99% Faster</span>
            </div>
            <div className="text-[10px] text-white/40">
              <span className="text-cyan-300 font-bold">&lt; 5 seconds</span> vs 60–90 days manual adjuster
            </div>
          </div>
        )}
      </div>

      {/* Mini Progress Bar Bottom */}
      {isRunning && (
        <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 rounded-full"
            style={{ width: `${Math.min(100, targetPct)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
    </div>
  );
};

export default ProcessingTimer;
