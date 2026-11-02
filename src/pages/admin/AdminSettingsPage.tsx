import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Database,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(() => dbService.getSystemSettings());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSystemSettings(settings);
    showToast('Đã lưu cấu hình hệ thống thành công!', 'success');
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ cơ sở dữ liệu mẫu ban đầu?')) {
      dbService.resetToDefaults();
      setSettings(dbService.getSystemSettings());
      showToast('Đã khôi phục dữ liệu mẫu thành công!', 'info');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Cấu Hình Hệ Thống & Sao Lưu"
        description="Quản lý tham số vận hành trường học, ngưỡng cảnh báo và khôi phục dữ liệu."
        breadcrumbs={[{ label: 'Trang chủ', href: '/admin/dashboard' }, { label: 'Cài đặt' }]}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Tên đơn vị trường học</label>
            <input
              type="text"
              value={settings.schoolName}
              onChange={e => setSettings({ ...settings, schoolName: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Năm học hiện tại</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={e => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Học kỳ hiện tại</label>
              <select
                value={settings.currentSemester}
                onChange={e => setSettings({ ...settings, currentSemester: e.target.value as any })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-bold"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Ngưỡng cảnh báo vắng (số buổi)
              </label>
              <input
                type="number"
                value={settings.attendanceNotificationThreshold}
                onChange={e =>
                  setSettings({ ...settings, attendanceNotificationThreshold: Number(e.target.value) })
                }
                min={1}
                max={10}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Điểm sàn đạt môn (Thang 10)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.passingGrade}
                onChange={e => setSettings({ ...settings, passingGrade: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl"
            >
              <RotateCcw className="w-4 h-4" />
              Reset dữ liệu mẫu ban đầu
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              Lưu cấu hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
