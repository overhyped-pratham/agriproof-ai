/**
 * FarmsListPage.tsx - Fields Management Screen
 *
 * Implements the exact Terraform Organic / Heritage design from Stitch:
 * - Clean Top Header & "+ New Field" action
 * - Glassmorphic Search & Filter Bar (Search input, Crop Type, Status, Sort)
 * - Fields Bento Grid with Map Headers, Status Pills, Crop Icons, and Hectares
 * - Full integration with real backend API `api.farms.list()` & `offlineStorage`
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Farm } from '../lib/api';
import { offlineStorage } from '../lib/offlineStorage';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';

export default function FarmsListPage() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>(() => offlineStorage.getFarms() || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'size' | 'name' | 'date'>('size');

  const fetchFarms = () => {
    setLoading(true);
    api.farms.list()
      .then((res) => {
        if (res.data) {
          setFarms(res.data);
          setIsFromCache(false);
          offlineStorage.saveFarms(res.data);
        }
      })
      .catch((err) => {
        console.warn('[FarmsListPage] Using cached farms list:', err);
        const cached = offlineStorage.getFarms();
        if (cached && cached.length > 0) {
          setFarms(cached);
          setIsFromCache(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const filteredFarms = useMemo(() => {
    return farms
      .filter((f) => {
        const matchesQuery =
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.crop_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCrop =
          selectedCropFilter === 'all' || f.crop_type.toLowerCase() === selectedCropFilter.toLowerCase();
        return matchesQuery && matchesCrop;
      })
      .sort((a, b) => {
        if (sortBy === 'size') return b.area_hectares - a.area_hectares;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [farms, searchQuery, selectedCropFilter, sortBy]);

  // Satellite scene images matching the design system
  const FIELD_IMAGES = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCRaGSLOp-288yRdNN_M0sZrBRlObwnk4iRo7_UfIDJil4fdzgrdTCMyW5MVCHkRHbMHqDhDxS5Q4m8j-SmHT-XROoBo4RdEN5sNzZoQEdRhlyIylSZmrcafFT1lxfqug7VLYQ0l0kfn1nFtr7WaffOfhRu-GLwAZAkPwwTDNQ3zfrLi5-xqtwp_ZogOAU31GXgnpNFODa_QyFsSDIFocj1ORRf-k9Nnk6hOb6lLyBa0WQBYNm5-q7nMg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB8sClUhOmTHQ82kTv_UGNTiRrM6a8WFp-O5BjBJfs5UinzPBhxz9-jlABmR0zsLS7VT5NPwZX_L6bg0F_G7a1V5MSEQ6hWCj9-ay5jv7GzxAe10xOhjvzVAb0hlEeSQWUu2x90r6LMDucW22VDP4g7rlSc86r6yQBgCdf9HMQB6-8Z3T8dHyAMTPaOfFfmy6pg73xPZa6xa7lM1Og7SEkKWjl1obhSCeDAEnYRU_8cGpjWLX6runq7_Q',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBjc4tFoXiG84rtuw0PKUonmm_3VA2XqTde79oWsdK9qXTqmGWln0oJI4W8OdohOmPu1Dj7YjDM_kdC1m4v-cwDt5XMxeQAFbnibxt2a75Ag0f4wBUGsP_qfGe-Q01tWaQzyGBzzgHrOg4GQy1u7YOhczRCU6awoZnongy65VPHM05SB00sc53ndt9LnEUN0PuL5Dq8Ctfxtq_GRT8_sRVhxRd2HJZYrtinW-QwfdngZ928b6SPT02crQ',
  ];

  return (
    <div className="min-h-screen bg-black/95 text-slate-100 font-sans pb-24 md:pb-12 pt-6">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex flex-col gap-6">
        
        {/* Offline Status */}
        <OfflineStatusBanner isFromCache={isFromCache} />

        {/* ── Page Header & Actions ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17341c] dark:text-emerald-400 font-sans tracking-tight">
              Fields
            </h2>
            <p className="text-sm text-[#424841] dark:text-slate-400">
              Manage and monitor your farm plots across all locations with Sentinel-2 Earth Observation telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/onboard"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#17341c] dark:bg-emerald-600 text-white font-semibold text-xs px-6 h-12 rounded-full shadow-[0_4px_16px_0_rgba(23,52,28,0.12)] hover:bg-[#2d4b31] active:scale-95 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New Field</span>
            </Link>
          </div>
        </div>

        {/* ── Filters & Search (Glassmorphic Bar) ─────────────────────────── */}
        <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border border-[#e3e3de] dark:border-dark-700 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_8px_24px_-4px_rgba(23,52,28,0.04)]">
          <div className="relative w-full md:max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737971]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fields by name or crop..."
              className="w-full h-12 pl-12 pr-4 bg-[#f4f4ee] dark:bg-dark-900 rounded-xl border-none text-[#1a1c19] dark:text-white focus:ring-2 focus:ring-[#17341c] dark:focus:ring-emerald-500 text-sm placeholder:text-[#737971] transition-shadow outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 snap-x">
            <select
              value={selectedCropFilter}
              onChange={(e) => setSelectedCropFilter(e.target.value)}
              className="snap-start shrink-0 flex items-center gap-2 bg-[#f4f4ee] dark:bg-dark-900 border border-[#e3e3de] dark:border-dark-700 px-3.5 h-10 rounded-xl text-[#1a1c19] dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Crop Types</option>
              <option value="wheat">Wheat</option>
              <option value="soybean">Soybean</option>
              <option value="cotton">Cotton</option>
              <option value="rice">Rice</option>
              <option value="corn">Corn</option>
            </select>

            <button
              onClick={() => setSortBy(sortBy === 'size' ? 'name' : 'size')}
              className="snap-start shrink-0 flex items-center gap-1.5 bg-[#f4f4ee] dark:bg-dark-900 hover:bg-[#e8e8e3] dark:hover:bg-dark-700 px-3.5 h-10 rounded-xl text-[#1a1c19] dark:text-slate-200 text-xs font-semibold transition-colors border border-[#e3e3de] dark:border-dark-700"
            >
              <span className="material-symbols-outlined text-[16px]">sort</span>
              <span>Sort: {sortBy === 'size' ? 'Size' : 'Name'}</span>
            </button>
          </div>
        </div>

        {/* ── Fields Bento Grid ────────────────────────────────────────────── */}
        {loading ? (
          <div className="p-12 text-center text-[#737971]">
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#17341c] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Fetching registered farm plots...</p>
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-3xl p-12 text-center border border-[#e3e3de] dark:border-dark-700 shadow-sm space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#737971]">nature_people</span>
            <h3 className="text-lg font-bold text-[#17341c] dark:text-white">No Farm Plots Found</h3>
            <p className="text-xs text-[#424841] dark:text-slate-400 max-w-sm mx-auto">
              Start by registering a field boundary or selecting your location.
            </p>
            <Link
              to="/onboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#17341c] text-white text-xs font-bold rounded-full shadow"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Register Field</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarms.map((farm, idx) => {
              const imageSrc = FIELD_IMAGES[idx % FIELD_IMAGES.length];
              return (
                <div
                  key={farm.id}
                  onClick={() => navigate(`/dashboard/${farm.id}`)}
                  className="bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_8px_24px_-4px_rgba(23,52,28,0.06)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300 cursor-pointer border border-[#e3e3de] dark:border-dark-700"
                >
                  {/* Map Header */}
                  <div className="h-44 relative bg-[#f4f4ee] dark:bg-dark-900 w-full overflow-hidden">
                    <img
                      alt={farm.name}
                      src={imageSrc}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#17341c]/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="flex gap-2">
                        <span className="bg-[#2d4b31]/90 text-white font-mono text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm shadow">
                          {farm.status === 'registered' ? 'Active Monitoring' : 'Analyzing'}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1a1c19] dark:text-white mb-1 group-hover:text-[#17341c] dark:group-hover:text-emerald-400 transition-colors">
                        {farm.name}
                      </h3>
                      <p className="text-xs text-[#424841] dark:text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span>{farm.center_lat.toFixed(4)}°N, {farm.center_lon.toFixed(4)}°E</span>
                      </p>
                    </div>

                    <div className="h-[1px] w-full bg-[#f4f4ee] dark:bg-dark-700"></div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-[#737971] uppercase tracking-wider font-mono">Crop</span>
                        <span className="text-sm text-[#1a1c19] dark:text-slate-200 font-semibold flex items-center gap-1.5 capitalize">
                          <span className="material-symbols-outlined text-[#17341c] dark:text-emerald-400 text-[18px]">grass</span>
                          {farm.crop_type}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-[#737971] uppercase tracking-wider font-mono">Size</span>
                        <span className="text-sm text-[#1a1c19] dark:text-slate-200 font-semibold">
                          {farm.area_hectares.toFixed(1)} ha ({(farm.area_hectares * 2.471).toFixed(1)} ac)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
