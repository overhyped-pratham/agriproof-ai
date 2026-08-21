import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Satellite } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { to: '/', label: 'Orbital Command' },
  { to: '/register', label: 'Register Farm' },
  { to: '/farms', label: 'My Farms' },
  { to: '/ledger', label: 'Claim Ledger' },
  { to: '/insurer', label: 'Insurer Risk Pool' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.7)] transition-all duration-300 print:hidden no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-primary-500/20 border border-primary-400/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,163,255,0.4)]">
              <Satellite className="h-5 w-5 text-primary-400" />
            </div>
            <span className="font-headline-lg font-bold text-xl md:text-2xl tracking-wider text-white">
              AgriProof<span className="text-primary-400">.AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1 font-body-md text-sm">
            {NAV_LINKS.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={clsx(
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5',
                    isActive
                      ? 'text-primary-400 bg-white/10 border-b-2 border-primary-400 shadow-[0_0_15px_rgba(0,163,255,0.15)] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5',
                  )}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />}
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/register"
              className="neon-button px-4 py-2 rounded-lg font-label-caps text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <span>Initialize Farm</span>
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={clsx('md:hidden', isOpen ? 'block' : 'hidden')}>
        <div className="px-3 pt-2 pb-4 space-y-1 bg-black/90 backdrop-blur-2xl border-b border-white/10">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'block px-3 py-2 rounded-lg text-base font-medium transition-colors',
                location.pathname === to
                  ? 'bg-primary-500/20 text-primary-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5',
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="w-full neon-button py-2.5 rounded-lg font-label-caps text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Initialize Farm</span>
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
