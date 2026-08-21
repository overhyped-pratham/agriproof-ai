import { useEffect, useState } from 'react';
import { api, Claim, LedgerVerification } from '../lib/api';
import LedgerBlock from '../components/LedgerBlock';
import { Database, ShieldCheck, RefreshCw, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LedgerPage() {
  const [chain, setChain]                         = useState<Claim[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [isVerifying, setIsVerifying]             = useState(false);
  const [verificationResult, setVerificationResult] = useState<LedgerVerification | null>(null);

  const fetchChain = async () => {
    try {
      setLoading(true);
      const res = await api.ledger.getChain();
      // Backend returns { chain: [...] } — unwrap the array
      setChain(res.data.chain ?? []);
    } catch (err) {
      console.error('[LedgerPage] Failed to fetch chain:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChain(); }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.ledger.verify();
      const data = res.data;
      setVerificationResult({
        ...data,
        message: data.valid
          ? `Chain intact — ${data.block_count} block${data.block_count !== 1 ? 's' : ''} verified.`
          : `Chain compromised at block #${data.broken_at}. Hash mismatch detected.`,
      });
    } catch (err) {
      console.error('[LedgerPage] Verification failed:', err);
      setVerificationResult({ valid: false, block_count: 0, broken_at: null, message: 'Verification request failed.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-purple-500" /> Immutable Claim Ledger
          </h1>
          <p className="text-slate-400 mt-2">Public, tamper-proof record of all processed insurance claims.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-dark-800 border border-dark-700 px-4 py-2 rounded-lg text-sm">
            <span className="text-slate-400">Total Blocks:</span>{' '}
            <span className="text-white font-bold">{chain.length}</span>
          </div>
          <button
            onClick={handleVerify}
            disabled={isVerifying || chain.length === 0}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:text-purple-300 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying…' : 'Verify Chain Integrity'}
          </button>
        </div>
      </div>

      {verificationResult && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${
            verificationResult.valid
              ? 'bg-success/10 border-success text-success'
              : 'bg-danger/10 border-danger text-danger'
          }`}
        >
          {verificationResult.valid
            ? <ShieldCheck className="w-6 h-6 shrink-0" />
            : <AlertOctagon className="w-6 h-6 shrink-0" />}
          <div>
            <p className="font-bold">{verificationResult.valid ? 'Chain Intact' : 'Chain Compromised'}</p>
            <p className="text-sm opacity-90">{verificationResult.message}</p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading ledger data…</div>
      ) : (
        <div className="space-y-0 pl-4 md:pl-8">
          {chain.map((claim, index) => (
            <div key={claim.id} className="relative">
              <LedgerBlock claim={claim} isFirst={index === 0} />
            </div>
          ))}
          {chain.length === 0 && (
            <div className="text-center py-12 bg-dark-800 rounded-xl border border-dark-700 text-slate-400">
              No blocks in the ledger yet. Register a farm and generate a claim to mine the genesis block.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
