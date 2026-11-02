import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[#0a1122] border border-dashed border-cyan-500/30 rounded-2xl">
      <div className="p-3.5 bg-cyan-950/60 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-3.5 shadow-2xs">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
