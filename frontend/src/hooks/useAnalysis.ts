import { useState, useEffect } from 'react';
import { api, AnalysisResult } from '../lib/api';

export function useAnalysis(farmId: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!farmId) return;
    try {
      setLoading(true);
      const res = await api.farms.getAnalysis(farmId);
      setAnalysis(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // Poll every 10 seconds if we need to see updates
    const interval = setInterval(fetchAnalysis, 10000);
    return () => clearInterval(interval);
  }, [farmId]);

  return { analysis, loading, error, refetch: fetchAnalysis };
}
