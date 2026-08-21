import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, Bot, Lock, Link as LinkIcon, CheckCircle2, Loader2 } from 'lucide-react';

interface ZKProofCardProps {
  claimId: string;
  eligible: boolean;
  isVerifying: boolean;
}

export default function ZKProofCard({ claimId, eligible, isVerifying }: ZKProofCardProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isVerifying) {
      setStep(0);
      const timer1 = setTimeout(() => setStep(1), 1500);
      const timer2 = setTimeout(() => setStep(2), 3000);
      const timer3 = setTimeout(() => setStep(3), 5000);
      const timer4 = setTimeout(() => setStep(4), 6500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else {
      setStep(4);
    }
  }, [isVerifying]);

  const steps = [
    { id: 1, icon: <Satellite className="w-6 h-6" />, label: 'Satellite Evidence', desc: 'Validating Sentinel-2 imagery signatures' },
    { id: 2, icon: <Bot className="w-6 h-6" />, label: 'AI Prediction', desc: 'Verifying model execution trace' },
    { id: 3, icon: <Lock className="w-6 h-6" />, label: 'Zero-Knowledge Proof', desc: 'Checking SNARK proof validity' },
    { id: 4, icon: <LinkIcon className="w-6 h-6" />, label: 'Ledger Record', desc: 'Confirming immutable hash on chain' },
  ];

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-dark-700 bg-dark-900/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="text-primary-600" /> ZK Verification Process
          </h2>
          <p className="text-slate-400 text-sm mt-1">Claim: {claimId}</p>
        </div>
        {step === 4 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className={`px-4 py-2 rounded-full font-bold text-sm ${eligible ? 'bg-success/20 text-success border border-success/50' : 'bg-danger/20 text-danger border border-danger/50'}`}
          >
            {eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
          </motion.div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {steps.map((s, i) => {
          const isActive = step === i;
          const isComplete = step > i;
          const isPending = step < i;

          return (
            <div key={s.id} className="flex items-start gap-4">
              <div className="mt-1 relative">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500
                  ${isComplete ? 'bg-success/20 border-success text-success' : ''}
                  ${isActive ? 'bg-primary-600/20 border-primary-600 text-primary-600' : ''}
                  ${isPending ? 'bg-dark-700 border-dark-600 text-slate-500' : ''}
                `}>
                  {isComplete ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className={`absolute top-10 left-1/2 -ml-[1px] w-[2px] h-10 transition-colors duration-500 ${isComplete ? 'bg-success' : 'bg-dark-700'}`} />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-medium ${isComplete || isActive ? 'text-white' : 'text-slate-500'}`}>
                  {s.label}
                </h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-primary-600 flex items-center gap-2 text-sm font-mono bg-dark-900/50 p-2 rounded"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </motion.div>
                  )}
                  {isComplete && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-success flex items-center gap-2 text-sm font-mono"
                    >
                      ✓ Verified
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
      
      {step === 4 && eligible && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border-t border-success/30 p-4 text-center"
        >
          <p className="text-success font-bold text-lg">ELIGIBLE FOR INSURANCE REVIEW</p>
        </motion.div>
      )}
    </div>
  );
}
