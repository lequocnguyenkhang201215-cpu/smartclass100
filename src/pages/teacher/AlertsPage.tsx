import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  CheckSquare
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { SmartAlert, AlertStatus } from '../../types';

export const AlertsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<SmartAlert[]>(() => dbService.getAlerts());
  const [statusFilter, setStatusFilter] = useState<'ALL' | AlertStatus>('ALL');

  const [activeAlert, setActiveAlert] = useState<SmartAlert | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [newStatus, setNewStatus] = useState<AlertStatus>('RESOLVED');

  const filtered = alerts.filter(a => statusFilter === 'ALL' || a.status === statusFilter);

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlert) return;

    dbService.updateAlertStatus(activeAlert.id, newStatus, resolveNotes);
    setAlerts(dbService.getAlerts());
    showToast(`Đã cập nhật trạng thái cảnh báo thành "${newStatus}"!`, 'success');
    setActiveAlert(null);
    setResolveNotes('');
  };

  const getSeverityBadge = (sev: SmartAlert['severity']) => {
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (st: AlertStatus) => {
    switch (st) {
      case 'NEW':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REVIEWED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung tâm Cảnh báo Học tập Thông minh"
        description="Thuật toán tự động phát hiện học sinh vắng nhiều, chưa nộp bài hoặc tụt điểm số để can thiệp kịp thời."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Cảnh báo' }]}
      />

      {/* Filter Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Trạng thái:</span>
          {(['ALL', 'NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'Tất cả'
                : st === 'NEW'
                ? 'Mới'
                : st === 'REVIEWED'
                ? 'Đã xem'
                : st === 'IN_PROGRESS'
                ? 'Đang xử lý'
                : 'Đã giải quyết'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(alert => (
          <div
            key={alert.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${getStatusBadge(alert.status)}`}>
                    {alert.status}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{alert.className} · {alert.studentName}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{alert.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <strong className="text-rose-600 font-mono font-semibold">{alert.metrics}</strong>
                  {alert.resolvedNotes && (
                    <span className="text-slate-500 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Đã ghi nhận: {alert.resolvedNotes}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveAlert(alert);
                setNewStatus(alert.status === 'NEW' ? 'IN_PROGRESS' : 'RESOLVED');
                setResolveNotes(alert.resolvedNotes || '');
              }}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors shrink-0"
            >
              Cập nhật xử lý &rarr;
            </button>
          </div>
        ))}
      </div>

      {/* Modal: Process alert */}
      {activeAlert && (
        <Modal
          isOpen={Boolean(activeAlert)}
          onClose={() => setActiveAlert(null)}
          title={`Xử lý cảnh báo: ${activeAlert.studentName}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">{activeAlert.title}</p>
              <p className="text-slate-600 mt-1">{activeAlert.description}</p>
              <p className="text-rose-600 font-semibold mt-1 font-mono">{activeAlert.metrics}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Chuyển trạng thái</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as AlertStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              >
                <option value="REVIEWED">Đã xem (REVIEWED)</option>
                <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Ghi chú phương án xử lý</label>
              <textarea
                rows={3}
                placeholder="VD: Đã gọi điện cho phụ huynh, gia đình xin phép kèm cặp thêm..."
                value={resolveNotes}
                onChange={e => setResolveNotes(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Lưu tiến trình
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
