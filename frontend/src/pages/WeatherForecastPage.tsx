/**
 * WeatherForecastPage.tsx - Agricultural Weather Forecast Screen
 *
 * Implements the exact Terraform Organic / Heritage design from Stitch:
 * - Current Conditions Hero Card (24°C, Partly Cloudy, High/Low, large weather icon)
 * - 24-Hour Horizontal Scroll Snap Cards (Now, 14:00, 15:00, etc.)
 * - Field Conditions Bento Grid (Humidity: 65%, Chance of Rain: 10%, Wind: 12 km/h, UV Index: 6 High)
 * - 7-Day Outlook List (Today, Tue, Wed, Thu, Fri, Sat, Sun with rain chances and temperature ranges)
 */

import React from 'react';

export const WeatherForecastPage: React.FC = () => {
  const hourlyData = [
    { time: 'Now', icon: 'partly_cloudy_day', temp: '24°', isWarm: false },
    { time: '14:00', icon: 'partly_cloudy_day', temp: '25°', isWarm: false },
    { time: '15:00', icon: 'sunny', temp: '27°', isWarm: true },
    { time: '16:00', icon: 'sunny', temp: '28°', isWarm: true },
    { time: '17:00', icon: 'partly_cloudy_day', temp: '26°', isWarm: false },
    { time: '18:00', icon: 'cloud', temp: '23°', isWarm: false },
    { time: '19:00', icon: 'cloud', temp: '21°', isWarm: false },
    { time: '20:00', icon: 'nights_stay', temp: '20°', isWarm: false },
  ];

  const weeklyOutlook = [
    { day: 'Today', icon: 'partly_cloudy_day', rainPct: '10%', high: '28°', low: '16°' },
    { day: 'Tue', icon: 'sunny', rainPct: '0%', high: '30°', low: '18°' },
    { day: 'Wed', icon: 'cloud', rainPct: '20%', high: '26°', low: '15°' },
    { day: 'Thu', icon: 'rainy', rainPct: '60%', high: '22°', low: '14°' },
    { day: 'Fri', icon: 'rainy', rainPct: '80%', high: '20°', low: '13°' },
    { day: 'Sat', icon: 'partly_cloudy_day', rainPct: '30%', high: '24°', low: '14°' },
    { day: 'Sun', icon: 'sunny', rainPct: '10%', high: '27°', low: '15°' },
  ];

  return (
    <div className="min-h-screen bg-black/95 text-slate-100 font-sans pb-24 md:pb-12 pt-6">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* ── Current Conditions Hero ──────────────────────────────────────── */}
        <section className="bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] dark:shadow-none border border-[#e3e3de] dark:border-dark-700 p-6 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, #17341c 0%, transparent 50%)' }}
          />

          <div className="flex flex-col z-10 w-full md:w-auto text-center md:text-left mb-6 md:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2d2f2c] dark:text-white mb-1">
              South Field Region
            </h1>
            <p className="text-xs text-[#424841] dark:text-slate-400 flex items-center justify-center md:justify-start gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span>Updated 10 mins ago · Live Agronomic Ingest</span>
            </p>

            <div className="mt-4 flex items-end justify-center md:justify-start gap-3">
              <span className="text-5xl sm:text-6xl font-extrabold text-[#17341c] dark:text-emerald-400 font-sans">
                24°C
              </span>
              <span className="text-lg font-semibold text-[#805533] dark:text-emerald-300 pb-1">
                Partly Cloudy
              </span>
            </div>

            <div className="mt-2 flex gap-2 justify-center md:justify-start">
              <span className="bg-[#c8ecc8] text-[#03210b] dark:bg-emerald-500/20 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                H: 28°
              </span>
              <span className="bg-[#e3e3de] dark:bg-dark-700 text-[#424841] dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                L: 16°
              </span>
            </div>
          </div>

          <div className="z-10 w-32 h-32 md:w-44 md:h-44 flex items-center justify-center bg-[#f4f4ee] dark:bg-dark-900 rounded-full shadow-inner">
            <span
              className="material-symbols-outlined text-[72px] md:text-[100px] text-[#17341c] dark:text-emerald-400"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              partly_cloudy_day
            </span>
          </div>
        </section>

        {/* ── 24-Hour Horizontal Scroll ────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#1a1c19] dark:text-white">
            Hourly Forecast
          </h2>
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory scrollbar-none">
            {hourlyData.map((hour, idx) => (
              <div
                key={idx}
                className="snap-start shrink-0 w-20 bg-white dark:bg-dark-800 rounded-2xl shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] dark:shadow-none border border-[#e3e3de] dark:border-dark-700 p-3.5 flex flex-col items-center gap-2"
              >
                <span className="text-xs text-[#737971]">{hour.time}</span>
                <span
                  className={`material-symbols-outlined text-2xl ${
                    hour.isWarm
                      ? 'text-[#ff8c00] dark:text-amber-400'
                      : 'text-[#17341c] dark:text-emerald-400'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {hour.icon}
                </span>
                <span className="text-sm font-bold text-[#1a1c19] dark:text-white">
                  {hour.temp}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bento Grid: Field Conditions ─────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#1a1c19] dark:text-white">
            Field Conditions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Humidity */}
            <div className="bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] border border-[#e3e3de] dark:border-dark-700 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#424841] dark:text-slate-400 mb-2">
                <span className="material-symbols-outlined text-sm">humidity_percentage</span>
                <span>Humidity</span>
              </div>
              <div className="text-2xl font-bold text-[#17341c] dark:text-emerald-400 mt-2">65%</div>
              <div className="text-[11px] text-[#805533] dark:text-emerald-300 mt-1">Optimal for current crop</div>
            </div>

            {/* Chance of Rain */}
            <div className="bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] border border-[#e3e3de] dark:border-dark-700 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#424841] dark:text-slate-400 mb-2">
                <span className="material-symbols-outlined text-sm">water_drop</span>
                <span>Chance of Rain</span>
              </div>
              <div className="text-2xl font-bold text-[#17341c] dark:text-emerald-400 mt-2">10%</div>
              <div className="text-[11px] text-[#737971] mt-1">0.0 mm expected</div>
            </div>

            {/* Wind */}
            <div className="bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] border border-[#e3e3de] dark:border-dark-700 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#424841] dark:text-slate-400 mb-2">
                <span className="material-symbols-outlined text-sm">air</span>
                <span>Wind</span>
              </div>
              <div className="text-2xl font-bold text-[#17341c] dark:text-emerald-400 mt-2">12 km/h</div>
              <div className="text-[11px] text-[#737971] mt-1">SW Direction</div>
            </div>

            {/* UV Index */}
            <div className="bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] border border-[#e3e3de] dark:border-dark-700 p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#424841] dark:text-slate-400 mb-2">
                <span className="material-symbols-outlined text-sm">sunny</span>
                <span>UV Index</span>
              </div>
              <div className="text-2xl font-bold text-[#805533] dark:text-amber-400 mt-2">6 High</div>
              <div className="text-[11px] text-[#737971] mt-1">Protection needed</div>
            </div>
          </div>
        </section>

        {/* ── 7-Day Outlook List ───────────────────────────────────────────── */}
        <section className="bg-white dark:bg-dark-800 rounded-[24px] shadow-[0_4px_16px_0_rgba(23,52,28,0.06)] border border-[#e3e3de] dark:border-dark-700 p-6 space-y-3">
          <h2 className="text-lg font-bold text-[#1a1c19] dark:text-white mb-2">
            7-Day Outlook
          </h2>
          <div className="flex flex-col divide-y divide-[#f4f4ee] dark:divide-dark-700">
            {weeklyOutlook.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
                <div className="w-1/4 text-sm font-bold text-[#17341c] dark:text-emerald-400">
                  {row.day}
                </div>
                <div className="w-1/4 flex justify-center">
                  <span
                    className="material-symbols-outlined text-xl text-[#17341c] dark:text-emerald-400"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {row.icon}
                  </span>
                </div>
                <div className="w-1/4 text-center text-xs font-semibold text-[#424841] dark:text-slate-400">
                  {row.rainPct}
                </div>
                <div className="w-1/4 flex justify-end gap-2 text-sm font-semibold">
                  <span className="text-[#1a1c19] dark:text-white">{row.high}</span>
                  <span className="text-[#737971]">{row.low}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default WeatherForecastPage;
