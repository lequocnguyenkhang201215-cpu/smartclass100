import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple';
}

const colorMap = {
  blue: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
  emerald: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
  amber: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
  rose: 'text-rose-400 bg-rose-950/60 border-rose-500/40',
  indigo: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40',
  purple: 'text-purple-400 bg-purple-950/60 border-purple-500/40',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}) => {
  return (
    <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-5 shadow-xs hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider">{title}</span>
          <div className="mt-1 text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
            {value}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
              {trend && (
                <span className={`font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trend.value}
                </span>
              )}
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]} shrink-0 shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
