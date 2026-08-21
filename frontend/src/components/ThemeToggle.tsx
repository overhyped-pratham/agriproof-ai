import { useEffect, useState } from 'react';
import { Sun, Moon, Terminal } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'cyberpunk';

const THEMES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: Terminal },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('app-theme') as ThemeMode) || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.id === theme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length].id;
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('app-theme', nextTheme);
  };

  const currentObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const Icon = currentObj.icon;

  return (
    <button
      onClick={cycleTheme}
      aria-label={`Toggle Theme. Current: ${currentObj.label}`}
      title={`Theme: ${currentObj.label} (Click to switch)`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-300 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white shadow-sm"
      style={{
        boxShadow: theme === 'cyberpunk' ? '0 0 10px rgba(0, 255, 65, 0.4)' : undefined,
        borderColor: theme === 'cyberpunk' ? '#00ff41' : undefined,
        color: theme === 'cyberpunk' ? '#00ff41' : undefined,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{currentObj.label}</span>
    </button>
  );
}
