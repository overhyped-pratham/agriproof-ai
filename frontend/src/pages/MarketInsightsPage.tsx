/**
 * MarketInsightsPage.tsx - Market Insights Screen
 *
 * Implements the exact Terraform Organic / Heritage design from Stitch:
 * - Search & Filter bar
 * - Top Movers cards (Soybeans, Wheat, Cotton, Corn with percentage deltas and trend icons)
 * - All Commodities List with sparklines, contract names, and price pills
 */

import React, { useState, useMemo } from 'react';

interface CommodityItem {
  id: string;
  name: string;
  contract: string;
  price: string;
  change: string;
  isPositive: boolean;
  isTopMover?: boolean;
}

const COMMODITIES_DATA: CommodityItem[] = [
  {
    id: 'soybeans',
    name: 'Soybeans',
    contract: 'May 24 Contract',
    price: '₹4,850/Qtl',
    change: '+2.4%',
    isPositive: true,
    isTopMover: true,
  },
  {
    id: 'wheat',
    name: 'Wheat (Mill Quality)',
    contract: 'Jul 24 Contract',
    price: '₹2,425/Qtl',
    change: '-1.2%',
    isPositive: false,
    isTopMover: true,
  },
  {
    id: 'corn',
    name: 'Corn (Maize)',
    contract: 'Mar 24 Contract',
    price: '₹2,150/Qtl',
    change: '+0.8%',
    isPositive: true,
    isTopMover: true,
  },
  {
    id: 'cotton',
    name: 'Cotton (Kapas)',
    contract: 'May 24 Contract',
    price: '₹7,250/Qtl',
    change: '-0.4%',
    isPositive: false,
    isTopMover: true,
  },
  {
    id: 'oats',
    name: 'Barley / Oats',
    contract: 'Mar 24 Contract',
    price: '₹1,850/Qtl',
    change: '+0.1%',
    isPositive: true,
  },
  {
    id: 'mustard',
    name: 'Mustard Seed',
    contract: 'Apr 24 Contract',
    price: '₹5,420/Qtl',
    change: '+1.9%',
    isPositive: true,
  },
  {
    id: 'rice',
    name: 'Paddy / Basmati Rice',
    contract: 'Sep 24 Contract',
    price: '₹3,680/Qtl',
    change: '+3.1%',
    isPositive: true,
  },
];

export const MarketInsightsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = useMemo(() => {
    return COMMODITIES_DATA.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contract.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const topMovers = useMemo(() => {
    return COMMODITIES_DATA.filter((c) => c.isTopMover);
  }, []);

  return (
    <div className="min-h-screen bg-black/95 text-slate-100 font-sans pb-24 md:pb-12 pt-6">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* ── Search & Filter Header ───────────────────────────────────────── */}
        <section className="mt-2 space-y-3">
          <h2 className="text-2xl font-bold text-[#17341c] dark:text-emerald-400 font-sans">
            Market Insights
          </h2>
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737971]"
              data-icon="search"
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commodities..."
              className="w-full bg-[#f4f4ee] dark:bg-dark-800 border-2 border-[#e3e3de] dark:border-dark-700 focus:border-[#17341c] dark:focus:border-emerald-500 rounded-xl py-3 pl-12 pr-4 text-sm text-[#1a1c19] dark:text-white outline-none transition-colors"
            />
          </div>
        </section>

        {/* ── Top Movers ───────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-[#424841] dark:text-slate-400">
            Top Movers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topMovers.map((mover) => (
              <div
                key={mover.id}
                className="bg-white dark:bg-dark-800 shadow-[0_8px_16px_0_rgba(23,52,28,0.06)] dark:shadow-none border border-[#e3e3de] dark:border-dark-700 rounded-2xl p-4 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-[#1a1c19] dark:text-white">
                    {mover.name}
                  </span>
                  <span
                    className={`material-symbols-outlined text-lg ${
                      mover.isPositive ? 'text-[#17341c] dark:text-emerald-400' : 'text-[#ba1a1a] dark:text-red-400'
                    }`}
                  >
                    {mover.isPositive ? 'trending_up' : 'trending_down'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#17341c] dark:text-emerald-400">
                  {mover.price}
                </div>
                <div
                  className={`text-xs mt-1 font-semibold ${
                    mover.isPositive ? 'text-[#17341c] dark:text-emerald-400' : 'text-[#ba1a1a] dark:text-red-400'
                  }`}
                >
                  {mover.change} today
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── All Commodities List ─────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-[#424841] dark:text-slate-400">
            All Commodities
          </h3>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-[0_8px_16px_0_rgba(23,52,28,0.06)] dark:shadow-none border border-[#e3e3de] dark:border-dark-700 overflow-hidden divide-y divide-[#f4f4ee] dark:divide-dark-700">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-[#fafaf4] dark:hover:bg-dark-700/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-0.5 w-1/3">
                  <span className="text-base font-bold text-[#1a1c19] dark:text-white">{item.name}</span>
                  <span className="text-xs text-[#737971]">{item.contract}</span>
                </div>

                {/* Sparkline approximation */}
                <div className="w-1/3 h-7 bg-[#f4f4ee] dark:bg-dark-900 rounded-lg flex items-center justify-center">
                  <svg className="w-24 h-4 text-[#17341c] dark:text-emerald-400" fill="none" viewBox="0 0 100 20" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={item.isPositive ? 'M0 16 L25 12 L50 14 L75 6 L100 2' : 'M0 4 L25 8 L50 6 L75 14 L100 18'}
                    />
                  </svg>
                </div>

                <div className="flex flex-col items-end gap-1 w-1/3">
                  <span className="text-sm font-bold text-[#1a1c19] dark:text-white">{item.price}</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.isPositive
                        ? 'bg-[#c8ecc8] text-[#03210b] dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-[#ffdad6] text-[#93000a] dark:bg-red-500/20 dark:text-red-300'
                    }`}
                  >
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default MarketInsightsPage;
