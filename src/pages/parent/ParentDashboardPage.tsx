import React, { useState } from 'react';
import {
  Users,
  CalendarCheck,
  BarChart2,
  BookOpen,
  Award,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

export const ParentDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const linkedIds = currentUser.linkedStudentIds || ['stu-10a1-01', 'stu-10a2-05'];
  const allStudents = dbService.getStudents();
  const myChildren = allStudents.filter(s => linkedIds.includes(s.id));

  const [activeChildId, setActiveChildId] = useState<string>(myChildren[0]?.id || 'stu-10a1-01');
  const activeChild = myChildren.find(c => c.id === activeChildId) || myChildren[0];

  const assignments = dbService.getAssignments(activeChild?.classId);
  const attendanceToday = dbService
    .getAllAttendanceRecords()
    .filter(a => a.studentId === activeChild?.id && a.date === '2026-10-11');
  const grades = dbService
    .getGrades(activeChild?.classId || 'cls-10a1', 'HK1')
    .find(g => g.studentId === activeChild?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sổ Liên Lạc Điện Tử"
        description="Đồng hành cùng con trong học tập, nắm bắt chuyên cần, kết quả thi và nhận xét của thầy cô."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Đang theo dõi con:</span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
              {myChildren.map(child => (
                <button
                  key={child.id}
                  onClick={() => setActiveChildId(child.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeChild?.id === child.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {child.fullName} ({child.className})
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Child Status Hero Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xl shrink-0">
            {activeChild?.seatNumber || 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{activeChild?.fullName}</h2>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                Lớp {activeChild?.className}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mã học sinh: <strong className="font-mono">{activeChild?.studentCode}</strong> · GVCN: Cô Nguyễn Thị Mai Hương
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast('Mở hộp thoại nhắn tin với Giáo viên chủ nhiệm...', 'info')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <MessageCircle className="w-4 h-4" />
          Liên hệ Giáo viên chủ nhiệm
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Điểm Trung Bình"
          value={activeChild?.gpa || 8.9}
          subtitle="Xếp loại: Giỏi"
          icon={BarChart2}
          color="blue"
        />
        <StatCard
          title="Điểm Thi Đua"
          value={`${activeChild?.rewardPoints || 125} đ`}
          subtitle="Biểu dương: Tổ trưởng gương mẫu"
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Tỷ Lệ Chuyên Cần"
          value={`${activeChild?.attendanceRate || 98.4}%`}
          subtitle="Hôm nay: Có mặt đầy đủ"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Bài Tập Về Nhà"
          value={`${assignments.length} bài`}
          subtitle="Đã hoàn thành 100%"
          icon={BookOpen}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance details today */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Tình hình điểm danh gần nhất
          </h3>
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
            <p className="font-bold text-emerald-900">Trạng thái: Có mặt tại lớp đúng giờ</p>
            <p className="text-emerald-700">Ngày: 11/10/2026 · Tiết 1 Chào cờ & Tiết 2 Toán</p>
            <p className="text-emerald-600 font-mono text-[11px]">Được ghi nhận bởi: Cô Nguyễn Thị Mai Hương</p>
          </div>
        </div>

        {/* Grades snapshot */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Điểm số môn Toán gần đây</h3>
          {grades ? (
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Điểm Miệng:</span>
                <strong className="font-mono">{grades.oralScores.join(', ')}</strong>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Kiểm tra 15 phút:</span>
                <strong className="font-mono">{grades.quizScores.join(', ')}</strong>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Điểm Giữa kỳ:</span>
                <strong className="font-mono font-bold text-slate-900">{grades.midtermScore}</strong>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Lời phê của giáo viên:</span>
                <span className="text-slate-700 italic">{grades.note || 'Học sinh tiếp thu bài rất nhanh.'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Đang cập nhật bảng điểm...</p>
          )}
        </div>
      </div>
    </div>
  );
};
