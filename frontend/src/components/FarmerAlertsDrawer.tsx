import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, wsAnalysisUrl } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Bell,
  Smartphone,
  CheckCircle2,
  Send,
  Zap,
  Radio,
} from 'lucide-react';

interface FarmerAlertsDrawerProps {
  farmId: string;
}

export default function FarmerAlertsDrawer({ farmId }: FarmerAlertsDrawerProps) {
  const [alertsData, setAlertsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [dispatchStatus, setDispatchStatus] = useState<any>(null);
  const [dispatching, setDispatching] = useState(false);

  // 1. Initial REST API load of alerts
  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    api.farmer
      .getAlerts(farmId)
      .then((res) => setAlertsData(res.data))
      .catch((err) => console.error('Failed to load farmer alerts:', err))
      .finally(() => setLoading(false));
  }, [farmId]);

  // 2. Real-Time WebSocket Listener for Automatic Message Dispatch
  const { data: wsData } = useWebSocket(wsAnalysisUrl(farmId));

  useEffect(() => {
    if (!wsData) return;

    // Check if backend pushed an automatic advisory dispatch event
    if (wsData.type === 'advisory_auto_dispatched' || wsData.stage === 'advisory_dispatch') {
      const alert = wsData.alert || {};
      setDispatchStatus({
        status: 'AUTO_DISPATCHED_VIA_SOCKET',
        delivery_receipt: 'DELIVERED_TO_HANDSET (Auto-Push via Socket)',
        recipient: alert.phone || phoneNumber,
        channel: alert.delivery_channel || channel.toUpperCase(),
        timestamp: new Date().toLocaleTimeString() + ' (Auto-Triggered)',
      });
    } else if (wsData.type === 'alert_dispatched_ack') {
      setDispatchStatus({
        status: wsData.status || 'DISPATCHED',
        delivery_receipt: wsData.delivery_receipt || 'DELIVERED_TO_HANDSET',
        recipient: wsData.recipient || phoneNumber,
        channel: wsData.channel || channel.toUpperCase(),
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }, [wsData, phoneNumber, channel]);

  const handleSimulateDispatch = async () => {
    setDispatching(true);
    try {
      const res = await api.farmer.simulateDispatch({
        farm_id: farmId,
        phone_number: phoneNumber,
        channel: channel,
      });
      setDispatchStatus(res.data);
    } catch (e) {
      console.error('Failed to dispatch alert:', e);
    } finally {
      setDispatching(false);
    }
  };

  if (loading || !alertsData) return null;

  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-700 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Bell className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Actionable Agronomy &amp; Low-Bandwidth Advisory
            </h3>
            <p className="text-xs text-slate-400">
              Zero-Internet SMS &amp; WhatsApp fallback alerts for remote agricultural parcels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Real-time Socket Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>SOCKET AUTO-DISPATCH ACTIVE</span>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/30">
            {alertsData.active_alerts_count} Active Advisories
          </span>
        </div>
      </div>

      {/* Advisory Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alertsData.alerts?.map((alt: any) => (
          <div
            key={alt.id}
            className="bg-dark-850 p-4 rounded-xl border border-dark-700 space-y-3 flex flex-col justify-between shadow-md hover:border-dark-600 transition"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    alt.severity === 'HIGH'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {alt.type}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Auto-Push Ready
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{alt.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{alt.message}</p>
            </div>

            <div className="pt-2 border-t border-dark-700">
              <span className="text-[11px] font-mono text-primary-400 font-semibold block">
                💡 Recommended Action: {alt.action}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Low-Bandwidth Dispatch Simulator & WebSocket Trigger Box */}
      <div className="bg-dark-900 p-5 rounded-xl border border-primary-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white font-mono uppercase">
              Simulate 2G/3G Low-Bandwidth Push (SMS / WhatsApp)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Automatic Broadcast on Anomaly Detection</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-dark-800 px-3 py-2 rounded-xl border border-dark-700 flex-1">
            <span className="text-slate-400 text-xs font-mono">Phone:</span>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-transparent text-white text-xs font-mono focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700">
            <button
              onClick={() => setChannel('whatsapp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                channel === 'whatsapp' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setChannel('sms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                channel === 'sms' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              SMS
            </button>
          </div>

          <button
            onClick={handleSimulateDispatch}
            disabled={dispatching}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {dispatching ? 'Transmitting...' : 'Dispatch Alert'}
          </button>
        </div>

        {/* Live Automatic Dispatch Notification Banner */}
        <AnimatePresence>
          {dispatchStatus && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-950/90 p-3.5 rounded-xl border border-emerald-500/50 text-xs font-mono text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>{dispatchStatus.delivery_receipt}</strong> → {dispatchStatus.recipient} ({dispatchStatus.channel})
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40">
                {dispatchStatus.timestamp}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
