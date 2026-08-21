import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmMap from '../components/FarmMap';
import { api } from '../lib/api';

export default function RegisterFarmPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    cropType: 'wheat',
    sowingDate: new Date().toISOString().split('T')[0],
    policyId: 'POLICY-001',
  });
  const [boundary, setBoundary] = useState<number[][]>([]);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (boundary.length === 0) {
      alert('Please draw the farm boundary on the map');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:                formData.name,
        polygon_coordinates: boundary,
        crop_type:           formData.cropType,
        sowing_date:         formData.sowingDate,
        policy_id:           formData.policyId,
      };

      // POST /api/farms — backend computes center, area, and commitment hash
      const res = await api.farms.create(payload);
      const farm = res.data;

      // Navigate to dashboard — PipelineProgress opens a WebSocket that
      // triggers the full analysis pipeline. No blocking HTTP call needed.
      navigate(`/dashboard/${farm.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to register farm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Register New Farm</h1>
        <p className="text-slate-400 mt-1">
          Draw your farm boundary and select policy details to begin AI monitoring.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 pb-8">
        {/* Map Section */}
        <div className="lg:w-2/3 h-[400px] lg:h-full relative rounded-xl overflow-hidden border border-dark-700">
          <FarmMap onChange={setBoundary} />
          {boundary.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-dark-900/90 text-white px-4 py-2 rounded-full text-sm font-medium border border-primary-600 shadow-lg pointer-events-none z-[1000]">
              Draw a polygon to define your farm boundary
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="lg:w-1/3 flex flex-col h-full">
          <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-xl p-6 flex flex-col h-full shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Farm Details</h2>

            <div className="space-y-5 flex-1 overflow-y-auto pr-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-300">Field / Farm Name</label>
                  <span className="text-xs text-primary-400 font-mono">Optional • Zero-PII</span>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g. North Field (or blank for Anonymous ID)"
                />
                <p className="text-xs text-slate-400 mt-1">
                  If blank, an anonymous cryptographic hash ID is auto-assigned.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Crop Type</label>
                <select
                  value={formData.cropType}
                  onChange={e => setFormData({ ...formData, cropType: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="wheat">Wheat</option>
                  <option value="rice">Rice</option>
                  <option value="soybean">Soybean</option>
                  <option value="corn">Corn</option>
                  <option value="cotton">Cotton</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sowing Date</label>
                <input
                  type="date"
                  required
                  value={formData.sowingDate}
                  onChange={e => setFormData({ ...formData, sowingDate: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Insurance Policy</label>
                <select
                  value={formData.policyId}
                  onChange={e => setFormData({ ...formData, policyId: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="POLICY-001">POLICY-001 (Standard Drought)</option>
                  <option value="POLICY-002">POLICY-002 (Premium Comprehensive)</option>
                  <option value="POLICY-003">POLICY-003 (Flood Protection)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-dark-700">
                <p className="text-xs text-slate-500">
                  Area and farm coordinates are computed server-side from the drawn polygon.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-dark-700">
              <button
                type="submit"
                disabled={loading || boundary.length === 0}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-dark-600 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                {loading ? 'Registering...' : 'Register Farm & Start Analysis'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
