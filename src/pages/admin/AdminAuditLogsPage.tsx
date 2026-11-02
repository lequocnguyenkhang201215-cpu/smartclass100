import React from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

export const AdminAuditLogsPage: React.FC = () => {
  const { showToast } = useToast();
  const logs = dbService.getAuditLogs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật Ký Hoạt Động & Bảo Mật (Audit Logs)"
        description="Ghi nhận bất biến toàn bộ hành vi sửa/xóa điểm, điểm danh, đổi phân quyền và thao tác nhạy cảm."
        breadcrumbs={[{ label: 'Trang chủ', href: '/admin/dashboard' }, { label: 'Audit Logs' }]}
        actions={
          <button
            onClick={() => showToast('Đang trích xuất file Audit Log...', 'info')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất Nhật Ký
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Thời Điểm</th>
              <th className="px-4 py-3">Người Thực Hiện</th>
              <th className="px-4 py-3">Vai Trò</th>
              <th className="px-4 py-3">Hành Động (Action)</th>
              <th className="px-4 py-3">Đối Tượng (Entity)</th>
              <th className="px-4 py-3">Mô Tả Chi Tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-400">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">{log.actorName}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {log.actorRole}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-blue-600">{log.action}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{log.entityType}</td>
                <td className="px-4 py-3 text-slate-800">{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
