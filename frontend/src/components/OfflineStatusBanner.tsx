import React from 'react';
import { WifiOff, Database, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineStatusBannerProps {
  isFromCache?: boolean;
  cachedTime?: string | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  isFromCache = false,
  cachedTime,
  onRefresh,
  isLoading = false
}) => {
  const isOnline = useOnlineStatus();

  // If user is online and data is fresh from network, show a subtle sync badge
  if (isOnline && !isFromCache) {
    return (
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Sentinel-2 Telemetry Online • Auto-Cached for Offline Resilience</span>
        </span>
        <span className="text-[10px] text-emerald-500 hidden sm:inline">Offline Cache Active</span>
      </div>
    );
  }

  // Offline or viewing cached snapshot
  return (
    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
          {!isOnline ? <WifiOff className="w-5 h-5" /> : <Database className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            {!isOnline ? 'OFFLINE MODE ACTIVE' : 'CACHED SATELLITE SNAPSHOT'}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300">
              LocalStorage Resilience
            </span>
          </div>
          <p className="text-xs text-amber-300/80 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Displaying last-known crop health telemetry
              {cachedTime ? ` (Cached: ${cachedTime})` : ''}
            </span>
          </p>
        </div>
      </div>

      {onRefresh && isOnline && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-white text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Live Telemetry</span>
        </button>
      )}
    </div>
  );
};

export default OfflineStatusBanner;
