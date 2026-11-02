import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  Clock,
  BookOpen,
  AlertTriangle,
  GraduationCap,
  Plus,
  Play,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileQuestion,
  Bell,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Compass,
  Wand2,
  Save,
  Check,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

export const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // AI Soạn bài modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState('Toán học 10');
  const [aiTopic, setAiTopic] = useState('Bất phương trình bậc nhất hai ẩn');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);

  const classes = dbService.getClasses(currentUser.id);
  const students = dbService.getStudents();
  const teacherStudents = students.filter(s => classes.some(c => c.id === s.classId));
  const alerts = dbService.getAlerts().filter(a => a.status === 'NEW');
  const assignments = dbService.getAssignments().filter(a => a.teacherId === currentUser.id);
  const schedule = dbService.getSchedule();
  const attendanceToday = dbService.getAllAttendanceRecords().filter(a => a.date === '2026-10-11');

  // Stats calculation
  const totalStudentsCount = teacherStudents.length || 90;
  const presentCount = attendanceToday.filter(a => a.status === 'PRESENT').length || 86;
  const lateCount = attendanceToday.filter(a => a.status === 'LATE').length || 2;
  const absentCount = attendanceToday.filter(a => a.status === 'ABSENT_EXCUSED' || a.status === 'ABSENT_UNEXCUSED').length || 2;
  const pendingGradingCount = assignments.reduce((acc, a) => acc + ((a.submittedCount || 0) - (a.gradedCount || 0)), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chào ngày mới, ${currentUser.fullName}!`}
        description="Chào mừng bạn đến với trung tâm điều hành lớp học số Smart Class Pro."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/teacher/classes/create')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Tạo lớp học mới
            </button>
            <button
              onClick={() => navigate('/teacher/tools')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/50 text-cyan-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Công cụ lớp học
            </button>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Tổng học sinh"
          value={totalStudentsCount}
          subtitle="trên 3 lớp phụ trách"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Có mặt hôm nay"
          value={presentCount}
          subtitle="tỷ lệ 95.5%"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Vắng / Đi trễ"
          value={`${absentCount} vắng / ${lateCount} trễ`}
          subtitle="đã cập nhật tiết 1"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Bài chưa chấm"
          value={pendingGradingCount}
          subtitle="cần phản hồi"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Cảnh báo cần xử lý"
          value={alerts.length}
          subtitle="học tập & chuyên cần"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* TÁC VỤ NHANH THƯỜNG DÙNG - HÀNG NGANG (DARK NAVY & CYAN) */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/20">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Tác vụ nhanh thường dùng
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Các lối tắt nghiệp vụ sư phạm thường xuyên sử dụng
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 rounded-full">
            6 tác vụ
          </span>
        </div>

        {/* Horizontal row of actions (hàng ngang) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {/* 1. Thời khóa biểu */}
          <button
            onClick={() => navigate('/teacher/schedule')}
            className="flex flex-col justify-between p-4 rounded-xl border border-cyan-500/30 bg-[#0c162b] hover:bg-cyan-950/40 hover:border-cyan-400 hover:shadow-[0_8px_20px_rgba(6,182,212,0.2)] hover:-translate-y-1 transition-all duration-200 group cursor-pointer text-left h-full min-h-[145px]"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:scale-105 transition-all duration-200 shadow-2xs">
                <Calendar className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Thời khóa biểu
              </div>
              <div className="text-[11.5px] text-slate-400 font-normal line-clamp-2 mt-1 leading-snug">
                Xem & cập nhật lịch giảng dạy
              </div>
            </div>
          </button>

          {/* 2. Điểm danh */}
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="flex flex-col justify-between p-4 rounded-xl border border-emerald-500/30 bg-[#0c162b] hover:bg-emerald-950/40 hover:border-emerald-400 hover:shadow-[0_8px_20px_rgba(16,185,129,0.2)] hover:-translate-y-1 transition-all duration-200 group cursor-pointer text-left h-full min-h-[145px]"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:scale-105 transition-all duration-200 shadow-2xs">
                <ClipboardCheck className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400/50 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Điểm danh
              </div>
              <div className="text-[11.5px] text-slate-400 font-normal line-clamp-2 mt-1 leading-snug">
                Sĩ số & chuyên cần lớp học
              </div>
            </div>
          </button>

          {/* 3. Giao bài tập */}
          <button
            onClick={() => navigate('/teacher/assignments/create')}
            className="flex flex-col justify-between p-4 rounded-xl border border-purple-500/30 bg-[#0c162b] hover:bg-purple-950/40 hover:border-purple-400 hover:shadow-[0_8px_20px_rgba(168,85,247,0.2)] hover:-translate-y-1 transition-all duration-200 group cursor-pointer text-left h-full min-h-[145px]"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="w-11 h-11 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:text-slate-950 group-hover:scale-105 transition-all duration-200 shadow-2xs">
                <FileText className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400/50 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Giao bài tập
              </div>
              <div className="text-[11.5px] text-slate-400 font-normal line-clamp-2 mt-1 leading-snug">
                Tạo trắc nghiệm & tự luận
              </div>
            </div>
          </button>

          {/* 4. Nhập sổ điểm */}
          <button
            onClick={() => navigate('/teacher/grades')}
            className="flex flex-col justify-between p-4 rounded-xl border border-teal-500/30 bg-[#0c162b] hover:bg-teal-950/40 hover:border-teal-400 hover:shadow-[0_8px_20px_rgba(20,184,166,0.2)] hover:-translate-y-1 transition-all duration-200 group cursor-pointer text-left h-full min-h-[145px]"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="w-11 h-11 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-slate-950 group-hover:scale-105 transition-all duration-200 shadow-2xs">
                <TrendingUp className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <ChevronRight className="w-4 h-4 text-teal-400/50 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                Nhập sổ điểm
              </div>
              <div className="text-[11.5px] text-slate-400 font-normal line-clamp-2 mt-1 leading-snug">
                Điểm định kỳ & đánh giá
              </div>
            </div>
          </button>

          {/* 5. Vòng quay lớp */}
          <button
            onClick={() => navigate('/teacher/tools')}
            className="flex flex-col justify-between p-4 rounded-xl border border-amber-500/30 bg-[#0c162b] hover:bg-amber-950/40 hover:border-amber-400 hover:shadow-[0_8px_20px_rgba(245,158,11,0.2)] hover:-translate-y-1 transition-all duration-200 group cursor-pointer text-left h-full min-h-[145px]"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="w-11 h-11 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:scale-105 transition-all duration-200 shadow-2xs">
                <Compass className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400/50 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Vòng quay lớp
              </div>
              <div className="text-[11.5px] text-slate-400 font-normal line-clamp-2 mt-1 leading-snug">
                Gọi tên ngẫu nhiên vui nhộn
              </div>
            </div>
          </button>

          {/* 6. AI Soạn bài */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex flex-col justify-between p-4 rounded-xl border border-cyan-400/40 bg-gradient-to-br from-[#0c162b] to-[#082f49]/80 hover:border-cyan-300 hover:shadow-[0_8px_25px_rgba(6,182,212,0.25)] hover:-translate-y-1 transition-all duration-200 group cursor-pointer text-left h-full min-h-[145px]"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-950/90 text-cyan-400 border border-cyan-400/40 flex items-center justify-center shrink-0 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:scale-105 transition-all duration-200 shadow-2xs">
                <Sparkles className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                AI
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                AI Soạn bài
              </div>
              <div className="text-[11.5px] text-slate-400 font-normal line-clamp-2 mt-1 leading-snug">
                Soạn giáo án & câu hỏi
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* PHẦN 1: LỚP HỌC ĐANG PHỤ TRÁCH (4) - DARK NAVY & CYAN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Lớp học đang phụ trách (4)
          </h2>
          <Link
            to="/teacher/classes"
            className="text-sm sm:text-base font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors group"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {classes.map(cls => (
            <div
              key={cls.id}
              onClick={() => navigate(`/teacher/classes/${cls.id}`)}
              className="bg-[#0a1122] rounded-2xl p-5 border border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-500/30">
                    {cls.subject || 'Toán học'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-200 bg-[#0c162b] px-2 py-0.5 rounded border border-cyan-500/20">
                    P. {cls.roomNumber}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-cyan-300 transition-colors">
                  {cls.name}
                </h3>

                <p className="text-xs text-slate-300">
                  GVCN: <span className="font-medium text-white">{cls.homeroomTeacherName || 'Cô Mai Hương'}</span>
                </p>

                {/* Tổng quan chỉ số trong thẻ */}
                <div className="mt-3 p-2 rounded-xl bg-[#060c18] border border-cyan-500/20 grid grid-cols-3 gap-1 text-center divide-x divide-cyan-500/10">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sĩ số</span>
                    <strong className="text-xs font-bold font-mono text-cyan-300 block">{cls.studentCount || 32} HS</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Chuyên cần</span>
                    <strong className="text-xs font-bold font-mono text-emerald-400 block">98%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Điểm TB</span>
                    <strong className="text-xs font-bold font-mono text-amber-400 block">8.4</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-cyan-500/15 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-400">Khối {cls.gradeLevel}</span>
                <span className="font-mono text-[11px] text-cyan-400/80">{cls.inviteCode}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PHẦN 2 & 3: THỜI KHÓA BIỂU HÔM NAY VÀ CẢNH BÁO THÔNG MINH - DARK NAVY & CYAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pt-2">
        {/* LỊCH GIẢNG DẠY HÔM NAY */}
        <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Lịch giảng dạy hôm nay
                </h2>
              </div>
              <Link
                to="/teacher/schedule"
                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                Xem tuần
              </Link>
            </div>

            <div className="space-y-3.5">
              {/* Tiết 1-2: Vào lớp */}
              <div className="rounded-2xl border border-cyan-500/40 bg-[#0c162b] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-cyan-500/40 text-cyan-300 font-bold text-sm bg-cyan-950/50 shrink-0">
                    Tiết 1–2
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-bold text-white truncate">
                      Toán học · Lớp 10A1
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                      07:30 - 09:05 · Phòng A.302
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/teacher/classes/cls-10a1')}
                  className="px-5 sm:px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-colors shrink-0 cursor-pointer"
                >
                  Vào lớp
                </button>
              </div>

              {/* Tiết 4: Chưa bắt đầu */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#0c162b] p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm bg-slate-900/60 shrink-0">
                    Tiết 4
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-bold text-white truncate">
                      Toán học · Lớp 10A2
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                      10:15 - 11:00 · Phòng A.304
                    </p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-slate-500 font-medium shrink-0">
                  Chưa bắt đầu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CẢNH BÁO THÔNG MINH */}
        <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Cảnh báo thông minh
                </h2>
              </div>
              <span className="text-sm font-medium text-slate-400">
                3 việc cần làm
              </span>
            </div>

            <div className="space-y-3">
              {/* Cảnh báo 1: Đặng Tuấn Kiệt */}
              <div className="rounded-2xl border border-cyan-500/20 bg-[#0c162b] p-4 sm:p-5 hover:border-cyan-500/40 transition-all shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Đặng Tuấn Kiệt (10A1)
                  </h4>
                  <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-rose-950/70 text-rose-300 border border-rose-500/40 tracking-wide uppercase">
                    NGHIÊM TRỌNG
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Học sinh đã vắng 3 buổi trong tháng (1 buổi không phép). Tỷ lệ chuyên cần giảm xuống dưới 82%.
                </p>
              </div>

              {/* Cảnh báo 2: Lê Minh Khôi */}
              <div className="rounded-2xl border border-cyan-500/20 bg-[#0c162b] p-4 sm:p-5 hover:border-cyan-500/40 transition-all shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Lê Minh Khôi (10A1)
                  </h4>
                  <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/40 tracking-wide uppercase">
                    CẦN CHÚ Ý
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Điểm kiểm tra 15 phút và bài tập về nhà có xu hướng giảm so với học kỳ 1.
                </p>
              </div>

              {/* Cảnh báo 3: Đỗ Gia Huy */}
              <div className="rounded-2xl border border-cyan-500/20 bg-[#0c162b] p-4 sm:p-5 hover:border-cyan-500/40 transition-all shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Đỗ Gia Huy (10A1)
                  </h4>
                  <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/40 tracking-wide uppercase">
                    CẦN CHÚ Ý
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Học sinh chưa nộp bài tập Hàm số và bài tập Hệ phương trình.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/teacher/alerts"
            className="block w-full py-3.5 mt-4 border border-dashed border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white rounded-2xl text-center text-sm font-semibold transition-colors bg-[#0c162b] hover:bg-cyan-950/40 cursor-pointer"
          >
            Xem toàn bộ cảnh báo
          </Link>
        </div>
      </div>

      {/* MODAL: AI SOẠN BÀI & GIÁO ÁN THÔNG MINH */}
      {aiModalOpen && (
        <Modal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          title="AI Trợ Lý Soạn Bài & Tạo Câu Hỏi Thông Minh"
          maxWidth="xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">Môn học & Khối</label>
                <input
                  type="text"
                  value={aiSubject}
                  onChange={e => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/40 text-cyan-100 rounded-xl outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">Chủ đề / Tên bài học</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="VD: Bất phương trình bậc nhất hai ẩn..."
                  className="w-full px-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/40 text-cyan-100 rounded-xl outline-none focus:border-cyan-400 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  setIsGenerating(true);
                  setTimeout(() => {
                    setIsGenerating(false);
                    setAiGeneratedContent({
                      objectives: [
                        'Hiểu khái niệm bất phương trình bậc nhất hai ẩn x, y và biểu diễn hình học miền nghiệm.',
                        'Xác định được nửa mặt phẳng bờ là đường thẳng ax + by = c trên mặt phẳng tọa độ Oxy.',
                        'Vận dụng giải các bài toán tối ưu hóa chi phí sản xuất trong đời sống thực tế.',
                      ],
                      activities: [
                        { step: '1. Khởi động (5 phút)', desc: 'Tình huống thực tế: Bài toán chia vốn đầu tư nhập hai loại hàng A và B dưới mức ngân sách 50 triệu đồng.' },
                        { step: '2. Khám phá kiến thức (15 phút)', desc: 'Vẽ đường thẳng bờ d: ax + by = c. Thử điểm gốc O(0; 0) để xác định miền nghiệm thỏa mãn.' },
                        { step: '3. Luyện tập & Thảo luận (15 phút)', desc: 'Chia 4 tổ giải quyết 4 hệ bất phương trình theo phiếu học tập số 1.' },
                        { step: '4. Củng cố & Giao nhiệm vụ (10 phút)', desc: 'Học sinh tổng kết các bước giải trên bảng điện tử và nhận bài tập về nhà tuần 6.' },
                      ],
                      quizzes: [
                        {
                          q: 'Điểm nào sau đây thuộc miền nghiệm của bất phương trình 2x - y + 4 > 0?',
                          options: ['A. (0; 5)', 'B. (1; 1)', 'C. (-3; 0)', 'D. (0; 6)'],
                          ans: 'B. (1; 1) vì 2(1) - 1 + 4 = 5 > 0',
                        },
                        {
                          q: 'Miền nghiệm của bất phương trình x + y ≤ 2 có bờ là đường thẳng nào?',
                          options: ['A. x + y = 2', 'B. x - y = 2', 'C. y = 2x', 'D. x = 2'],
                          ans: 'A. Đường thẳng d: x + y = 2',
                        },
                      ],
                    });
                    showToast('AI đã hoàn thành soạn giáo án & câu hỏi mẫu!', 'success');
                  }, 800);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                {isGenerating ? 'AI đang phân tích & soạn thảo...' : 'Bắt đầu soạn bài với AI'}
              </button>
            </div>

            {aiGeneratedContent && (
              <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-[#0c162b] space-y-4 animate-in fade-in duration-200 text-xs text-slate-200">
                <div>
                  <h4 className="font-bold text-cyan-300 text-sm mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    I. Mục tiêu bài dạy ({aiTopic})
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    {aiGeneratedContent.objectives.map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-cyan-300 text-sm mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    II. Kế hoạch hoạt động trên lớp
                  </h4>
                  <div className="space-y-2">
                    {aiGeneratedContent.activities.map((act: any, i: number) => (
                      <div key={i} className="p-2.5 bg-[#0a1122] rounded-xl border border-cyan-500/20">
                        <strong className="text-white block">{act.step}</strong>
                        <p className="text-slate-400 mt-0.5">{act.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-cyan-300 text-sm mb-2 flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4 text-purple-400" />
                    III. Đề xuất câu hỏi kiểm tra nhanh
                  </h4>
                  <div className="space-y-2">
                    {aiGeneratedContent.quizzes.map((quiz: any, i: number) => (
                      <div key={i} className="p-2.5 bg-[#0a1122] rounded-xl border border-cyan-500/20">
                        <p className="font-semibold text-white">Câu {i + 1}: {quiz.q}</p>
                        <div className="grid grid-cols-2 gap-1 mt-1.5 text-slate-400 text-[11px]">
                          {quiz.options.map((opt: string, optI: number) => (
                            <span key={optI}>{opt}</span>
                          ))}
                        </div>
                        <p className="mt-1.5 text-emerald-300 font-medium text-[11px] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg w-fit">
                          Đáp án đúng: {quiz.ans}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      dbService.createResource({
                        title: `Giáo án AI: ${aiTopic}`,
                        category: 'DOCX',
                        gradeLevel: '10',
                        subject: aiSubject,
                        chapter: aiTopic,
                        fileUrl: '#',
                        fileSize: '1.8 MB',
                        authorId: currentUser.id,
                        authorName: currentUser.fullName,
                        isPublic: true,
                      });
                      showToast(`Đã lưu "${aiTopic}" vào Kho học liệu số!`, 'success');
                      setAiModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1122] border border-cyan-500/30 hover:bg-cyan-950/50 text-cyan-200 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-cyan-400" />
                    Lưu vào Kho học liệu
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiModalOpen(false);
                      navigate('/teacher/assignments/create');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
                  >
                    Giao thành bài tập lớp &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
