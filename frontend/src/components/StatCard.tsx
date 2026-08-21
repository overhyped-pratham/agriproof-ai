import { ReactNode } from 'react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'default';
  className?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, variant = 'default', className }: StatCardProps) {
  const variantStyles = {
    green: "text-success bg-success/10 border-success/20",
    yellow: "text-warning bg-warning/10 border-warning/20",
    red: "text-danger bg-danger/10 border-danger/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    default: "text-slate-300 bg-dark-700 border-dark-600"
  };

  const iconColorStyle = {
    green: "text-success",
    yellow: "text-warning",
    red: "text-danger",
    blue: "text-blue-500",
    default: "text-slate-400"
  };

  return (
    <div className={clsx("bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-sm", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-white">{value}</h4>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={clsx("p-3 rounded-lg border", variantStyles[variant])}>
          <div className={iconColorStyle[variant]}>{icon}</div>
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={clsx("font-medium", trend.value >= 0 ? "text-success" : "text-danger")}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-slate-500 ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
