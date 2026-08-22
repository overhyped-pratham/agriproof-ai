/**
 * Lightweight localStorage-backed offline cache for farm analysis data.
 * Provides read-through / write-through helpers so the app degrades
 * gracefully when the FastAPI backend is unreachable.
 *
 * API shape is designed to match the AI Studio usage pattern:
 *   cached.analysis, cached.cachedAtFormatted, offlineStorage.saveAnalysis(),
 *   offlineStorage.saveFarms(), offlineStorage.getFarms() returning Farm[] | null
 */

import type { AnalysisResult, Farm } from './api';

const KEYS = {
  analysis: (farmId: string) => `agriproof:analysis:${farmId}`,
  farm:     (farmId: string) => `agriproof:farm:${farmId}`,
  farms:    ()               => `agriproof:farms`,
};

// ── Internal helpers ─────────────────────────────────────────────────────────

function safeRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// ── Typed cache entries ───────────────────────────────────────────────────────

interface AnalysisCacheEntry {
  analysis: AnalysisResult;
  cachedAt: string;
  cachedAtFormatted: string;
}

interface FarmsCacheEntry {
  farms: Farm[];
  cachedAt: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const offlineStorage = {
  // ── Analysis ──────────────────────────────────────────────────────────────
  getAnalysis(farmId: string): AnalysisCacheEntry | null {
    return safeRead<AnalysisCacheEntry>(KEYS.analysis(farmId));
  },
  saveAnalysis(farmId: string, analysis: AnalysisResult): void {
    const now = new Date().toISOString();
    const entry: AnalysisCacheEntry = {
      analysis,
      cachedAt: now,
      cachedAtFormatted: formatTime(now),
    };
    safeWrite(KEYS.analysis(farmId), entry);
  },
  // Alias for setAnalysis used in legacy code
  setAnalysis(farmId: string, analysis: AnalysisResult): void {
    this.saveAnalysis(farmId, analysis);
  },

  // ── Individual Farm ───────────────────────────────────────────────────────
  getFarm(farmId: string): Farm | null {
    return safeRead<Farm>(KEYS.farm(farmId));
  },
  setFarm(farmId: string, farm: Farm): void {
    safeWrite(KEYS.farm(farmId), farm);
  },

  // ── Farm List ─────────────────────────────────────────────────────────────
  /** Returns Farm[] directly (not wrapped), or null if no cache. */
  getFarms(): Farm[] | null {
    const entry = safeRead<FarmsCacheEntry>(KEYS.farms());
    return entry?.farms ?? null;
  },
  saveFarms(farms: Farm[]): void {
    const entry: FarmsCacheEntry = {
      farms,
      cachedAt: new Date().toISOString(),
    };
    safeWrite(KEYS.farms(), entry);
  },
  // Alias
  setFarms(farms: Farm[]): void {
    this.saveFarms(farms);
  },

  // ── Clear ─────────────────────────────────────────────────────────────────
  clear(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith('agriproof:'))
      .forEach(k => localStorage.removeItem(k));
  },
};
