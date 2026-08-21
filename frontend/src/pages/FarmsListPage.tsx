import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Farm } from '../lib/api';
import { Tractor, Plus, ChevronRight, Activity, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  registered: 'bg-slate-500/20 text-slate-400 border-slate-600',
  analyzing:  'bg-yellow-500/20 text-yellow-400 border-yellow-600',
  analyzed:   'bg-success/20 text-success border-success/50',
};

export default function FarmsListPage() {
  const [farms, setFarms]   = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.farms.list()
      .then(res => setFarms(res.data))
      .catch(err => console.error('[FarmsListPage] Failed to fetch farms:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Tractor className="text-primary-500" /> My Farms
          </h1>
          <p className="text-slate-400 mt-2">
            All registered farms — click any to view its dashboard.
          </p>
        </div>
        <Link
          to="/register"
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Register New Farm
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading farms…</div>
      ) : farms.length === 0 ? (
        <div className="text-center py-16 bg-dark-800 rounded-xl border border-dark-700">
          <Tractor className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">No farms registered yet.</p>
          <Link to="/register" className="text-primary-400 hover:text-primary-300 underline text-sm">
            Register your first farm →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {farms.map(farm => (
            <Link
              key={farm.id}
              to={`/dashboard/${farm.id}`}
              className="flex items-center gap-4 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 rounded-xl p-5 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-semibold truncate">{farm.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full border capitalize font-medium shrink-0 ${STATUS_COLORS[farm.status] ?? STATUS_COLORS.registered}`}>
                    {farm.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    {farm.crop_type.charAt(0).toUpperCase() + farm.crop_type.slice(1)}
                  </span>
                  <span>{farm.area_hectares.toFixed(1)} ha</span>
                  <span>{farm.policy_id}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(parseISO(farm.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-mono mt-1 truncate">
                  {farm.center_lat.toFixed(4)}°N, {farm.center_lon.toFixed(4)}°E · {farm.commitment_hash.substring(0, 16)}…
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
