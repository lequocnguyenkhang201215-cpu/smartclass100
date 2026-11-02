import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

export const CreateClassPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('10');
  const [subject, setSubject] = useState('Toán học');
  const [roomNumber, setRoomNumber] = useState('A201');
  const [description, setDescription] = useState('');
  const [colorTheme, setColorTheme] = useState('blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên lớp học!', 'error');
      return;
    }

    const created = dbService.createClass({
      name,
      gradeLevel,
      subject,
      academicYear: '2025 - 2026',
      roomNumber,
      homeroomTeacherId: currentUser.id,
      homeroomTeacherName: currentUser.fullName,
      description,
      inviteCode: `LQD${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      colorTheme,
      schoolId: currentUser.schoolId,
    });

    showToast(`Đã tạo thành công lớp ${created.name}!`, 'success');
    navigate(`/teacher/classes/${created.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Tạo lớp học mới"
        description="Khởi tạo không gian lớp học số với mã mời và sổ điểm đồng bộ."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/teacher/dashboard' },
          { label: 'Lớp học', href: '/teacher/classes' },
          { label: 'Tạo mới' },
        ]}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Tên lớp học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: 10A1 (Chuyên Toán), 11B3 (Toán - Tin)..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Khối lớp</label>
                <select
                  value={gradeLevel}
                  onChange={e => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Môn học phụ trách</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Phòng học</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="VD: A201, Phòng thí nghiệm Lý 1..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Màu đại diện lớp</label>
                <select
                  value={colorTheme}
                  onChange={e => setColorTheme(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blue">Xanh dương (Blue)</option>
                  <option value="indigo">Chàm (Indigo)</option>
                  <option value="emerald">Xanh lá (Emerald)</option>
                  <option value="amber">Hổ phách (Amber)</option>
                  <option value="rose">Hồng đào (Rose)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Mô tả và mục tiêu lớp học</label>
              <textarea
                rows={3}
                placeholder="Ghi chú về đặc thù lớp, danh sách ban cán sự, mục tiêu thi đua..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/teacher/classes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              Hoàn tất tạo lớp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
