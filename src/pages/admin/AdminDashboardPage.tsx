import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School,
  Users,
  Layers,
  Shield,
  UserCheck,
  Settings,
  Server,
  Activity,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/db';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const school = dbService.getSchool();
  const users = dbService.getUsers();
  const classes = dbService.getClasses();
  const students = dbService.getStudents();
  const auditLogs = dbService.getAuditLogs();
  const settings = dbService.getSystemSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung Tâm Quản Trị Hệ Thống (Admin Console)"
        description={`Đơn vị quản lý: ${school.name} (${school.code}) · Phiên bản: ${settings.systemVersion}`}
        actions={
          <button
            onClick={() => navigate('/admin/settings')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Settings className="w-4 h-4" />
            Cấu hình hệ thống
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Trường / Cơ Sở"
          value={1}
          subtitle="THPT Chuyên Lê Quý Đôn"
          icon={School}
          color="purple"
        />
        <StatCard
          title="Tài Khoản Hoạt Động"
          value={users.length}
          subtitle="4 vai trò phân quyền"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Tổng Số Lớp Học"
          value={classes.length}
          subtitle="3 khối 10, 11, 12"
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="Hồ Sơ Học Sinh"
          value={students.length}
          subtitle="Đang theo học"
          icon={UserCheck}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nhật ký hoạt động bảo mật (Audit Logs)</h3>
              <p className="text-xs text-slate-500">Ghi lại toàn bộ hành động nhạy cảm trên hệ thống</p>
            </div>
            <button
              onClick={() => navigate('/admin/audit-logs')}
              className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
            >
              Xem chi tiết
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 6).map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {log.action}
                    </span>
                    <strong className="text-xs text-slate-900">{log.actorName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">({log.actorRole})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{log.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Admin Links (1 col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Nghiệp vụ quản trị</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/schools')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-bold text-slate-800"
              >
                <span>Thông tin trường học</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-bold text-slate-800"
              >
                <span>Quản lý tài khoản người dùng</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/admin/classes')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-bold text-slate-800"
              >
                <span>Quản lý phân công lớp học</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-bold text-slate-800"
              >
                <span>Sao lưu & Thiết lập bảo mật</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
