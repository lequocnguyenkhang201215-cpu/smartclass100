import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { AttendanceStatus } from '../../types';

interface StatusChipProps {
  status: AttendanceStatus | string;
  customLabel?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, customLabel }) => {
  switch (status) {
    case 'PRESENT':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {customLabel || 'Có mặt'}
        </span>
      );
    case 'ABSENT_EXCUSED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          {customLabel || 'Vắng có phép'}
        </span>
      );
    case 'ABSENT_UNEXCUSED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-lg">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          {customLabel || 'Vắng không phép'}
        </span>
      );
    case 'LATE':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-300 bg-orange-950/60 border border-orange-500/40 px-2.5 py-1 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          {customLabel || 'Đi trễ'}
        </span>
      );
    case 'EARLY_LEAVE':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          {customLabel || 'Về sớm'}
        </span>
      );
    case 'ACTIVE':
    case 'STUDYING':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {customLabel || 'Đang học'}
        </span>
      );
    case 'LEAVE':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {customLabel || 'Nghỉ học'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded-lg">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          {customLabel || status}
        </span>
      );
  }
};
