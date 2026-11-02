import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  BarChart2,
  Award,
  Calendar,
  FileText,
  Plus,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  QrCode,
  Share2,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { ClassRoom, Student, AttendanceStatus, AttendanceRecord, GradeItem } from '../../types';

export const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const currentClass = dbService.getClassById(id || '') || dbService.getClasses()[0];
  const [activeTab, setActiveTab] = useState<
    'overview' | 'students' | 'attendance' | 'assignments' | 'grades' | 'behavior' | 'schedule' | 'reports'
  >('overview');

  // Students for this class
  const [students, setStudents] = useState<Student[]>(() => dbService.getStudents(currentClass.id));
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentFor360, setSelectedStudentFor360] = useState<Student | null>(null);

  // Attendance tab state
  const [attendanceDate, setAttendanceDate] = useState('2026-10-11');
  const [attendancePeriod, setAttendancePeriod] = useState(1);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: AttendanceStatus; note: string }>>(() => {
    const existing = dbService.getAttendance(currentClass.id, '2026-10-11', 1);
    const map: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(s => {
      const rec = existing.find(e => e.studentId === s.id);
      map[s.id] = {
        status: rec ? rec.status : 'PRESENT',
        note: rec?.note || '',
      };
    });
    return map;
  });

  // Gradebook tab state
  const [gradesList, setGradesList] = useState<GradeItem[]>(() => {
    let list = dbService.getGrades(currentClass.id, 'HK1');
    if (list.length === 0) {
      // Initialize with students
      list = students.map((s, idx) => ({
        id: `grd-${s.id}`,
        classId: currentClass.id,
        studentId: s.id,
        studentName: s.fullName,
        subject: currentClass.subject || 'Toán học',
        semester: 'HK1',
        oralScores: [8, 9],
        quizScores: [8.5, 9.0],
        midtermScore: 8.5,
        finalScore: 8.0,
        averageScore: 8.4,
        updatedAt: new Date().toISOString(),
      }));
    }
    return list;
  });

  // Assignments
  const assignments = dbService.getAssignments(currentClass.id);

  // Schedule
  const classSchedule = dbService.getSchedule(currentClass.id);

  // Behavior
  const behaviors = dbService.getBehaviors(currentClass.id);

  // Modals
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'NAM' | 'NỮ'>('NAM');
  const [newStudentDob, setNewStudentDob] = useState('2010-05-15');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');

  // Save Attendance Handler
  const handleSaveAttendance = () => {
    const recordsToSave: AttendanceRecord[] = students.map(s => {
      const entry = attendanceRecords[s.id] || { status: 'PRESENT', note: '' };
      return {
        id: `att-${s.id}-${attendanceDate}-${attendancePeriod}`,
        classId: currentClass.id,
        studentId: s.id,
        studentName: s.fullName,
        seatNumber: s.seatNumber,
        date: attendanceDate,
        period: attendancePeriod,
        status: entry.status,
        note: entry.note,
        recordedByTeacherId: currentUser.id,
        updatedAt: new Date().toISOString(),
      };
    });

    dbService.saveAttendance(recordsToSave);
    dbService.logAudit({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'TEACHER',
      action: 'TAKE_ATTENDANCE',
      entityType: 'ATTENDANCE',
      entityId: currentClass.id,
      description: `Lưu điểm danh ngày ${attendanceDate} tiết ${attendancePeriod} lớp ${currentClass.name}`,
    });

    showToast(`Đã lưu dữ liệu điểm danh lớp ${currentClass.name}!`, 'success');
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(s => {
      updated[s.id] = { status: 'PRESENT', note: '' };
    });
    setAttendanceRecords(updated);
    showToast('Đã đánh dấu tất cả có mặt!', 'info');
  };

  // Save Gradebook Handler
  const handleSaveGrades = () => {
    dbService.updateGrades(gradesList);
    showToast('Đã cập nhật bảng điểm môn học thành công!', 'success');
  };

  // Add student handler
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const created = dbService.createStudent({
      studentCode: `HS2025-${String(students.length + 1).padStart(3, '0')}`,
      fullName: newStudentName,
      gender: newStudentGender,
      dateOfBirth: newStudentDob,
      classId: currentClass.id,
      className: currentClass.name,
      seatNumber: students.length + 1,
      groupNumber: (students.length % 4) + 1,
      status: 'STUDYING',
      rewardPoints: 100,
      attendanceRate: 100,
      gpa: 8.0,
      parentPhone: newStudentParentPhone,
      schoolId: currentUser.schoolId,
    });

    setStudents(dbService.getStudents(currentClass.id));
    setAddStudentModalOpen(false);
    setNewStudentName('');
    showToast(`Đã thêm học sinh ${created.fullName} vào lớp!`, 'success');
  };

  // Filter students
  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentClass.name}
        description={`Môn: ${currentClass.subject} · Phòng: ${currentClass.roomNumber} · Sĩ số: ${currentClass.studentCount} học sinh`}
        breadcrumbs={[
          { label: 'Trang chủ', href: '/teacher/dashboard' },
          { label: 'Lớp học', href: '/teacher/classes' },
          { label: currentClass.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold bg-[#0c162b] text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/30">
              Mã lớp: {currentClass.inviteCode}
            </span>
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              Điểm danh ngay
            </button>
          </div>
        }
      />

      {/* Tabs navigation - Theo thiết kế mẫu */}
      <div className="border-b border-cyan-500/20 pb-3">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Tổng quan', icon: BarChart2 },
            { id: 'students', label: `Học sinh (${students.length || 12})`, icon: Users },
            { id: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
            { id: 'assignments', label: `Bài tập (${assignments.length || 3})`, icon: FileText },
            { id: 'grades', label: 'Sổ điểm', icon: TrendingUp },
            { id: 'behavior', label: 'Thi đua & Nề nếp', icon: Award },
            { id: 'schedule', label: 'Thời khóa biểu', icon: Calendar },
            { id: 'reports', label: 'Báo cáo', icon: BarChart2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0c1a30] border border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.18)]'
                    : 'bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-cyan-950/20'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: TỔNG QUAN (KHỚP HOÀN TOÀN HÌNH MẪU CỦA NGƯỜI DÙNG) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Lưới 4 thẻ thống kê đầu trang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Thẻ 1: Sĩ số lớp */}
            <div
              onClick={() => setActiveTab('students')}
              className="bg-[#0a1122] border border-cyan-500/25 hover:border-cyan-400 rounded-2xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_22px_rgba(6,182,212,0.18)] transition-all cursor-pointer group"
              title="Nhấn để xem danh sách học sinh"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Sĩ số lớp</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-white mt-3 tracking-tight">
                {students.length || 12}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Đủ điều kiện lên lớp
              </p>
            </div>

            {/* Thẻ 2: Chuyên cần hôm nay */}
            <div
              onClick={() => setActiveTab('attendance')}
              className="bg-[#0a1122] border border-cyan-500/25 hover:border-cyan-400 rounded-2xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_22px_rgba(6,182,212,0.18)] transition-all cursor-pointer group"
              title="Nhấn để mở sổ điểm danh"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Chuyên cần hôm nay</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-white mt-3 tracking-tight">
                10/{students.length || 12}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Vắng: 1 · Muộn: 1
              </p>
            </div>

            {/* Thẻ 3: Bài tập đang giao */}
            <div
              onClick={() => setActiveTab('assignments')}
              className="bg-[#0a1122] border border-cyan-500/25 hover:border-cyan-400 rounded-2xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_22px_rgba(6,182,212,0.18)] transition-all cursor-pointer group"
              title="Nhấn để xem danh sách bài tập"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Bài tập đang giao</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-white mt-3 tracking-tight">
                {assignments.length || 3}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                2 bài cần chấm
              </p>
            </div>

            {/* Thẻ 4: Điểm trung bình lớp */}
            <div
              onClick={() => setActiveTab('grades')}
              className="bg-[#0a1122] border border-cyan-500/25 hover:border-cyan-400 rounded-2xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_22px_rgba(6,182,212,0.18)] transition-all cursor-pointer group"
              title="Nhấn để mở sổ điểm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Điểm trung bình lớp</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-white mt-3 tracking-tight">
                8.4
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Môn Toán học kỳ 2
              </p>
            </div>
          </div>

          {/* Phần dưới 2 cột: Bài tập gần đây (trái) + Ban cán sự lớp (phải) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Cột trái: Bài tập gần đây của lớp */}
            <div className="lg:col-span-8 bg-[#0a1122] border border-cyan-500/25 rounded-2xl p-5 sm:p-6 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Bài tập gần đây của lớp
                </h3>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'asg-demo-1',
                    title: 'Bài tập Hàm số bậc hai và Ứng dụng thực tế',
                    dueDate: '26/2/2025',
                    submitted: 10,
                    total: students.length || 12,
                    status: 'Đang giao',
                  },
                  {
                    id: 'asg-demo-2',
                    title: 'Hệ phương trình bậc nhất ba ẩn và Ứng dụng',
                    dueDate: '3/3/2025',
                    submitted: 4,
                    total: students.length || 12,
                    status: 'Đang giao',
                  },
                  {
                    id: 'asg-demo-3',
                    title: 'Đề ôn tập giữa kỳ 2 – Khối 10',
                    dueDate: '11/3/2025',
                    submitted: 0,
                    total: students.length || 12,
                    status: 'Bản nháp',
                  },
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab('assignments')}
                    className="p-4 rounded-xl bg-[#0c162b]/70 border border-cyan-500/20 hover:border-cyan-400 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Hạn nộp: {item.dueDate} · Đã nộp: {item.submitted}/{item.total} HS
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-[#060a14] border border-slate-700/80 text-slate-200 text-xs font-medium rounded-lg shrink-0">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải: Ban cán sự lớp */}
            <div className="lg:col-span-4 bg-[#0a1122] border border-cyan-500/25 rounded-2xl p-5 sm:p-6 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Ban cán sự lớp {currentClass.name || '10A1'}
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'lead-1',
                    name: 'Trần Bảo Anh',
                    role: 'Lớp trưởng',
                    gpa: '9.5 ĐTB',
                    gpaColor: 'text-emerald-400',
                  },
                  {
                    id: 'lead-2',
                    name: 'Nguyễn Hoàng Nam',
                    role: 'Lớp phó học tập',
                    gpa: '8.7 ĐTB',
                    gpaColor: 'text-cyan-400',
                  },
                  {
                    id: 'lead-3',
                    name: 'Phạm Quỳnh Chi',
                    role: 'Lớp phó phong trào',
                    gpa: '9.1 ĐTB',
                    gpaColor: 'text-purple-400',
                  },
                ].map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      const matched = students.find(s => s.fullName === lead.name);
                      if (matched) {
                        setSelectedStudentFor360(matched);
                      } else if (students[0]) {
                        setSelectedStudentFor360({
                          ...students[0],
                          fullName: lead.name,
                          studentCode: `HS2025-00${lead.id.slice(-1)}`,
                          gpa: parseFloat(lead.gpa),
                        });
                      }
                    }}
                    className="p-4 rounded-xl bg-[#0c162b]/70 border border-cyan-500/20 hover:border-cyan-400 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                    title="Nhấn để xem Hồ sơ học sinh"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {lead.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {lead.role}
                      </p>
                    </div>

                    <span className={`text-xs font-bold font-mono ${lead.gpaColor} shrink-0`}>
                      {lead.gpa}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HỌC SINH */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã học sinh..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs bg-[#060a14] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm học sinh
              </button>
              <button
                onClick={() => navigate('/teacher/students/import')}
                className="px-3 py-1.5 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/50 text-cyan-200 text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Import Excel
              </button>
            </div>
          </div>

          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-14">STT</th>
                  <th className="px-4 py-3">Học Sinh</th>
                  <th className="px-4 py-3">Mã HS</th>
                  <th className="px-4 py-3">Tổ</th>
                  <th className="px-4 py-3">Điểm TB</th>
                  <th className="px-4 py-3">Chuyên Cần</th>
                  <th className="px-4 py-3 text-right">Hồ Sơ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-200">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{s.seatNumber || idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-white">
                      <button
                        onClick={() => setSelectedStudentFor360(s)}
                        className="text-left hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        {s.fullName}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-200">{s.studentCode}</td>
                    <td className="px-4 py-3 text-slate-300">Tổ {s.groupNumber || 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-cyan-300 tabular-nums">
                      {s.gpa || 8.0}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-emerald-400 font-bold">
                      {s.attendanceRate || 100}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedStudentFor360(s)}
                        className="px-2.5 py-1 text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Hồ sơ 360°
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ĐIỂM DANH */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Controls ribbon */}
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-cyan-300 uppercase">Ngày điểm danh</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="mt-0.5 text-xs border border-cyan-500/30 rounded-lg px-2.5 py-1.5 bg-[#060a14] text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-cyan-300 uppercase">Tiết dạy</label>
                <select
                  value={attendancePeriod}
                  onChange={e => setAttendancePeriod(Number(e.target.value))}
                  className="mt-0.5 text-xs border border-cyan-500/30 rounded-lg px-2.5 py-1.5 bg-[#060a14] text-white"
                >
                  <option value={1} className="bg-[#0c162b]">Tiết 1 (07:15 - 08:00)</option>
                  <option value={2} className="bg-[#0c162b]">Tiết 2 (08:05 - 08:50)</option>
                  <option value={3} className="bg-[#0c162b]">Tiết 3 (09:05 - 09:50)</option>
                  <option value={4} className="bg-[#0c162b]">Tiết 4 (09:55 - 10:40)</option>
                  <option value={5} className="bg-[#0c162b]">Tiết 5 (10:45 - 11:30)</option>
                </select>
              </div>

              <div className="self-end pb-0.5">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 rounded-lg transition-colors cursor-pointer"
                >
                  ✓ Đánh dấu tất cả có mặt
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu điểm danh
              </button>
            </div>
          </div>

          {/* Summary KPI Strip - 1 dòng gọn gàng */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#0a1122] border border-emerald-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-bold text-emerald-400 tracking-wider">CÓ MẶT</span>
              <span className="text-xl font-bold font-mono text-emerald-300">
                {Object.values(attendanceRecords).filter(r => r.status === 'PRESENT').length}
              </span>
            </div>
            <div className="bg-[#0a1122] border border-amber-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-bold text-amber-400 tracking-wider">ĐI TRỄ</span>
              <span className="text-xl font-bold font-mono text-amber-300">
                {Object.values(attendanceRecords).filter(r => r.status === 'LATE').length}
              </span>
            </div>
            <div className="bg-[#0a1122] border border-cyan-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-bold text-cyan-400 tracking-wider">VẮNG CÓ PHÉP</span>
              <span className="text-xl font-bold font-mono text-cyan-300">
                {Object.values(attendanceRecords).filter(r => r.status === 'ABSENT_EXCUSED').length}
              </span>
            </div>
            <div className="bg-[#0a1122] border border-rose-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-bold text-rose-400 tracking-wider">VẮNG KHÔNG PHÉP</span>
              <span className="text-xl font-bold font-mono text-rose-300">
                {Object.values(attendanceRecords).filter(r => r.status === 'ABSENT_UNEXCUSED').length}
              </span>
            </div>
          </div>

          {/* Attendance sheet */}
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Học Sinh</th>
                  <th className="px-4 py-3">Trạng Thái Điểm Danh</th>
                  <th className="px-4 py-3">Ghi Chú Lý Do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-200">
                {students.map((s, idx) => {
                  const currentRec = attendanceRecords[s.id] || { status: 'PRESENT', note: '' };
                  return (
                    <tr key={s.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">{s.seatNumber || idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-white">{s.fullName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { val: 'PRESENT', label: 'Có mặt', color: 'emerald' },
                            { val: 'LATE', label: 'Đi trễ', color: 'orange' },
                            { val: 'ABSENT_EXCUSED', label: 'Có phép', color: 'amber' },
                            { val: 'ABSENT_UNEXCUSED', label: 'Không phép', color: 'rose' },
                          ].map(opt => {
                            const isSelected = currentRec.status === opt.val;
                            return (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => {
                                  setAttendanceRecords(prev => ({
                                    ...prev,
                                    [s.id]: { ...currentRec, status: opt.val as AttendanceStatus },
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                                  isSelected
                                    ? opt.color === 'emerald'
                                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                      : opt.color === 'orange'
                                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                                      : opt.color === 'amber'
                                      ? 'bg-yellow-500 text-slate-950 shadow-xs'
                                      : 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-[#0c162b] text-slate-400 hover:text-white border border-cyan-500/20'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Nhập ghi chú nếu có..."
                          value={currentRec.note}
                          onChange={e => {
                            const noteVal = e.target.value;
                            setAttendanceRecords(prev => ({
                              ...prev,
                              [s.id]: { ...currentRec, note: noteVal },
                            }));
                          }}
                          className="w-full px-2.5 py-1 text-xs bg-[#060a14] border border-cyan-500/20 rounded-md text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TAB 4: BÀI TẬP */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Bài tập đã giao cho lớp {currentClass.name}</h3>
            <button
              onClick={() => navigate('/teacher/assignments/create')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Giao bài tập mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map(asg => (
              <div
                key={asg.id}
                onClick={() => navigate(`/teacher/assignments/${asg.id}`)}
                className="bg-[#0a1122] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-5 shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                    Thang điểm {asg.maxScore}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hạn: {new Date(asg.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{asg.title}</h4>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{asg.description}</p>
                <div className="mt-4 pt-3 border-t border-cyan-500/15 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Đã nộp: <strong className="text-cyan-300 font-mono">{asg.submittedCount || 0}</strong>/{students.length}
                  </span>
                  <span className="font-bold text-cyan-400 group-hover:underline flex items-center gap-1">
                    Xem bài nộp &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BẢNG ĐIỂM (GRADEBOOK) */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Sổ Điểm Điện Tử - {currentClass.subject}</h3>
              <p className="text-xs text-slate-400">Học kỳ 1 · Nhập trực tiếp các đầu điểm TX, GK, CK</p>
            </div>
            <button
              onClick={handleSaveGrades}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu bảng điểm
            </button>
          </div>

          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Học Sinh</th>
                  <th className="px-3 py-3 text-center">TX 1 (Miệng)</th>
                  <th className="px-3 py-3 text-center">TX 2 (15 phút)</th>
                  <th className="px-3 py-3 text-center">Giữa Kỳ (x2)</th>
                  <th className="px-3 py-3 text-center">Cuối Kỳ (x3)</th>
                  <th className="px-4 py-3 text-center">Điểm TB Môn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-200 font-mono">
                {gradesList.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-cyan-950/20">
                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-sans font-bold text-white">{g.studentName}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={g.oralScores[0] ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const copy = [...gradesList];
                          copy[idx].oralScores[0] = val;
                          setGradesList(copy);
                        }}
                        className="w-16 text-center border border-cyan-500/30 rounded py-1 px-1 bg-[#060a14] text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={g.quizScores[0] ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const copy = [...gradesList];
                          copy[idx].quizScores[0] = val;
                          setGradesList(copy);
                        }}
                        className="w-16 text-center border border-cyan-500/30 rounded py-1 px-1 bg-[#060a14] text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={g.midtermScore ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const copy = [...gradesList];
                          copy[idx].midtermScore = val;
                          setGradesList(copy);
                        }}
                        className="w-16 text-center border border-cyan-500/30 rounded py-1 px-1 bg-[#060a14] text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={g.finalScore ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const copy = [...gradesList];
                          copy[idx].finalScore = val;
                          setGradesList(copy);
                        }}
                        className="w-16 text-center border border-cyan-500/30 rounded py-1 px-1 bg-[#060a14] text-white"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-cyan-400 text-sm">
                      {g.averageScore ?? 8.0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: THI ĐUA & HÀNH VI */}
      {activeTab === 'behavior' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Tổ 1', 'Tổ 2', 'Tổ 3'].map((team, idx) => (
              <div key={team} className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-4 shadow-xs text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">{team}</span>
                <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {420 + idx * 35} đ
                </p>
                <span className="text-[11px] text-emerald-400 font-medium">Hạng {idx + 1} thi đua tuần</span>
              </div>
            ))}
          </div>

          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-white mb-3">Nhật ký biểu dương & nhắc nhở lớp</h3>
            <div className="divide-y divide-cyan-500/15">
              {behaviors.map(b => (
                <div key={b.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          b.type === 'POSITIVE'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-950/70 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {b.type === 'POSITIVE' ? `+${b.pointsDelta} điểm` : `${b.pointsDelta} điểm`}
                      </span>
                      <strong className="text-xs text-white">{b.studentName}</strong>
                    </div>
                    <p className="text-xs font-medium text-slate-200 mt-1">{b.title}</p>
                    <p className="text-xs text-slate-400">{b.description}</p>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono shrink-0">{b.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: THỜI KHÓA BIỂU */}
      {activeTab === 'schedule' && (
        <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-white mb-4">Thời khóa biểu lớp {currentClass.name}</h3>
          <div className="divide-y divide-cyan-500/15">
            {classSchedule.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-400 block">
                    {item.startTime} - {item.endTime} (Tiết {item.period})
                  </span>
                  <p className="text-sm font-semibold text-white mt-0.5">{item.subject}</p>
                  <p className="text-xs text-slate-400">Giáo viên: {item.teacherName} · Phòng {item.room}</p>
                </div>
                <span className="text-xs font-medium bg-[#060a14] border border-cyan-500/25 text-cyan-300 px-2.5 py-1 rounded">
                  Thứ {item.dayOfWeek}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: BÁO CÁO */}
      {activeTab === 'reports' && (
        <div className="bg-[#0a1122] border border-cyan-500/30 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
            <div>
              <h3 className="text-base font-bold text-white">Báo cáo Tổng hợp Lớp {currentClass.name}</h3>
              <p className="text-xs text-slate-400">Kỳ đánh giá: Học kỳ 1 Năm học 2025 - 2026</p>
            </div>
            <button
              onClick={() => showToast('Đang xuất báo cáo định dạng Excel...', 'info')}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              Xuất Báo Cáo Excel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#060a14] rounded-xl border border-cyan-500/25 text-center">
              <span className="text-xs text-slate-400">Học sinh Giỏi / Xuất sắc</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">68.7%</p>
            </div>
            <div className="p-4 bg-[#060a14] rounded-xl border border-cyan-500/25 text-center">
              <span className="text-xs text-slate-400">Tỷ lệ Chuyên cần Trung bình</span>
              <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">97.2%</p>
            </div>
            <div className="p-4 bg-[#060a14] rounded-xl border border-cyan-500/25 text-center">
              <span className="text-xs text-slate-400">Số bài tập đã hoàn thành</span>
              <p className="text-2xl font-bold font-mono text-cyan-300 mt-1">94%</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      <Modal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        title="Thêm học sinh mới vào lớp"
        maxWidth="md"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1">Họ và tên học sinh *</label>
            <input
              type="text"
              placeholder="VD: Nguyễn Văn An"
              value={newStudentName}
              onChange={e => setNewStudentName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-[#060a14] border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1">Giới tính</label>
              <select
                value={newStudentGender}
                onChange={e => setNewStudentGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-[#060a14] border border-cyan-500/30 rounded-lg text-white"
              >
                <option value="NAM" className="bg-[#0c162b]">Nam</option>
                <option value="NỮ" className="bg-[#0c162b]">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={newStudentDob}
                onChange={e => setNewStudentDob(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#060a14] border border-cyan-500/30 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1">Số điện thoại phụ huynh</label>
            <input
              type="tel"
              placeholder="0905..."
              value={newStudentParentPhone}
              onChange={e => setNewStudentParentPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#060a14] border border-cyan-500/30 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddStudentModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-lg shadow-xs cursor-pointer border border-cyan-400"
            >
              Lưu học sinh
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Student 360 Profile */}
      {selectedStudentFor360 && (
        <Modal
          isOpen={Boolean(selectedStudentFor360)}
          onClose={() => setSelectedStudentFor360(null)}
          title={`Hồ sơ 360°: ${selectedStudentFor360.fullName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-cyan-500/20">
              <div className="w-14 h-14 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center text-lg shrink-0">
                {selectedStudentFor360.seatNumber || 1}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedStudentFor360.fullName}</h3>
                <p className="text-xs text-slate-400">
                  Mã HS: <span className="font-mono text-cyan-300">{selectedStudentFor360.studentCode}</span> · Lớp {selectedStudentFor360.className} · Tổ {selectedStudentFor360.groupNumber}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusChip status={selectedStudentFor360.status} />
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {selectedStudentFor360.rewardPoints} điểm thi đua
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#060a14] rounded-lg border border-cyan-500/20">
                <span className="text-slate-400 block">Ngày sinh:</span>
                <strong className="text-white">{selectedStudentFor360.dateOfBirth}</strong>
              </div>
              <div className="p-3 bg-[#060a14] rounded-lg border border-cyan-500/20">
                <span className="text-slate-400 block">Tỷ lệ chuyên cần:</span>
                <strong className="text-emerald-400 font-mono">{selectedStudentFor360.attendanceRate}%</strong>
              </div>
              <div className="p-3 bg-[#060a14] rounded-lg border border-cyan-500/20">
                <span className="text-slate-400 block">Phụ huynh liên hệ:</span>
                <strong className="text-white">{selectedStudentFor360.parentName || 'Nguyễn Thành An'}</strong>
              </div>
              <div className="p-3 bg-[#060a14] rounded-lg border border-cyan-500/20">
                <span className="text-slate-400 block">Điện thoại phụ huynh:</span>
                <strong className="text-cyan-300 font-mono">{selectedStudentFor360.parentPhone || '0903556677'}</strong>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-cyan-300 mb-2">Nhật ký biểu dương & học tập</h4>
              <p className="text-xs text-slate-200 p-2.5 rounded bg-cyan-950/40 border border-cyan-500/30">
                Học sinh tích cực tham gia thảo luận nhóm, giải quyết tốt các bài toán thực tế.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
