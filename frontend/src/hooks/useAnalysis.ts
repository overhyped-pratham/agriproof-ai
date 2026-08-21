import { useState, useEffect, useCallback } from 'react';
import { api, AnalysisResult } from '../lib/api';
import { offlineStorage } from '../lib/offlineStorage';

export function useAnalysis(farmId: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [cachedTime, setCachedTime] = useState<string | null>(null);

  // Load cached data immediately on mount or farmId change
  useEffect(() => {
    if (!farmId) return;
    const cached = offlineStorage.getAnalysis(farmId);
    if (cached && cached.analysis) {
      setAnalysis(cached.analysis);
      setIsFromCache(true);
      setCachedTime(cached.cachedAtFormatted);
    }
  }, [farmId]);

  const fetchAnalysis = useCallback(async () => {
    if (!farmId) return;
    try {
      setLoading(true);
      const res = await api.farms.getAnalysis(farmId);
      if (res.data) {
        setAnalysis(res.data);
        setIsFromCache(false);
        setCachedTime(null);
        setError(null);
        // Persist to local offline cache
        offlineStorage.saveAnalysis(farmId, res.data);
      }
    } catch (err: any) {
      // If network fails, attempt to read from offline cache
      const cached = offlineStorage.getAnalysis(farmId);
      if (cached && cached.analysis) {
        setAnalysis(cached.analysis);
        setIsFromCache(true);
        setCachedTime(cached.cachedAtFormatted);
        setError(null);
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch analysis and no offline cache found');
      }
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    fetchAnalysis();
    // Poll every 15 seconds if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchAnalysis();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [farmId, fetchAnalysis]);

  return { analysis, loading, error, isFromCache, cachedTime, refetch: fetchAnalysis };
}

