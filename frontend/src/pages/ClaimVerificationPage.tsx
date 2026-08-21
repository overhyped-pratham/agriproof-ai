import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, Claim, VerificationResult } from '../lib/api';
import ZKProofCard from '../components/ZKProofCard';
import { Copy, FileJson, RefreshCw, Hash, Database, ShieldCheck, ShieldX } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ClaimVerificationPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim]                         = useState<Claim | null>(null);
  const [verifying, setVerifying]                 = useState(false);
  const [verifyResult, setVerifyResult]           = useState<VerificationResult | null>(null);
  const [showJson, setShowJson]                   = useState(false);

  const fetchClaim = async () => {
    if (!claimId) return;
    try {
      const res = await api.claims.get(claimId);
      setClaim(res.data);
    } catch (err) {
      console.error('[ClaimVerificationPage] Failed to fetch claim:', err);
    }
  };

  const runVerification = async () => {
    if (!claimId) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.claims.verify(claimId);
      setVerifyResult(res.data);
    } catch (err) {
      console.error('[ClaimVerificationPage] Verification failed:', err);
      setVerifyResult({
        claim_id: claimId,
        zk_proof_valid: false,
        zk_proof_message: 'Verification request failed.',
        ledger_valid: false,
        overall_valid: false,
      });
    } finally {
      setVerifying(false);
    }
  };

  // Fetch claim on mount, then run verification automatically
  useEffect(() => {
    fetchClaim();
    runVerification();
  }, [claimId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!claim) {
    return <div className="p-8 text-center text-slate-400">Loading claim data…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-end mb-8 border-b border-dark-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Claim Verification
            <span className="px-3 py-1 bg-primary-600/10 text-primary-500 text-sm rounded-full font-mono font-bold border border-primary-600/30">
              {claim.claim_id}
            </span>
          </h1>
          <p className="text-slate-400 mt-2">
            Created: {format(parseISO(claim.created_at), 'MMMM dd, yyyy HH:mm:ss')}
          </p>
        </div>
        <button
          onClick={runVerification}
          disabled={verifying}
          className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
          {verifying ? 'Verifying…' : 'Verify Again'}
        </button>
      </div>

      {/* Real verification result banner */}
      {verifyResult && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          verifyResult.overall_valid
            ? 'bg-success/10 border-success/40 text-success'
            : 'bg-danger/10 border-danger/40 text-danger'
        }`}>
          {verifyResult.overall_valid
            ? <ShieldCheck className="w-6 h-6 shrink-0" />
            : <ShieldX className="w-6 h-6 shrink-0" />}
          <div className="text-sm space-y-0.5">
            <p className="font-bold">{verifyResult.overall_valid ? 'Proof Verified ✓' : 'Verification Failed'}</p>
            <p className="opacity-80">ZK Proof: {verifyResult.zk_proof_valid ? '✓ Valid' : '✗ Invalid'} — {verifyResult.zk_proof_message}</p>
            <p className="opacity-80">Ledger Chain: {verifyResult.ledger_valid ? '✓ Intact' : '✗ Broken'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: ZK Proof Animation */}
        <div className="lg:col-span-3">
          <ZKProofCard
            claimId={claim.claim_id}
            eligible={claim.eligible}
            isVerifying={verifying}
          />
        </div>

        {/* Right: Technical Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cryptographic Hashes */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-slate-400" /> Cryptographic Proofs
            </h3>
            <div className="space-y-4 font-mono text-sm">
              {[
                { label: 'Satellite Evidence Hash', value: claim.satellite_evidence_hash, color: 'text-slate-300' },
                { label: 'AI Prediction Hash',      value: claim.prediction_hash,         color: 'text-slate-300' },
                { label: 'ZK SNARK Proof Hash',     value: claim.zk_proof_hash,           color: 'text-primary-400 font-bold' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-slate-500 mb-1 text-xs uppercase tracking-wider">{label}</p>
                  <div className="flex items-center gap-2 bg-dark-900 p-2 rounded border border-dark-600">
                    <span className={`${color} truncate flex-1`}>{value}</span>
                    <button onClick={() => copyToClipboard(value)} className="text-slate-500 hover:text-white shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ledger Details */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-400" /> Ledger Details
            </h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-slate-500">Block Index</span>
                <span className="text-slate-200">#{claim.block_index}</span>
              </div>
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-slate-500">Block Hash</span>
                <span className="text-slate-200 truncate w-48 text-right" title={claim.block_hash}>
                  {claim.block_hash.substring(0, 20)}…
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Previous Hash</span>
                <span className="text-slate-200 truncate w-48 text-right" title={claim.previous_block_hash}>
                  {claim.previous_block_hash.substring(0, 20)}…
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowJson(!showJson)}
            className="w-full bg-dark-800 hover:bg-dark-700 border border-dark-600 text-slate-300 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <FileJson className="w-4 h-4" />
            {showJson ? 'Hide Raw JSON' : 'View Raw JSON'}
          </button>

          {showJson && (
            <div className="bg-dark-950 p-4 rounded-xl border border-dark-700 overflow-x-auto">
              <pre className="text-xs text-emerald-400 font-mono">
                {JSON.stringify(claim, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
