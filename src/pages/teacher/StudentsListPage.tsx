import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Upload,
  Download,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  MessageSquare,
  Eye,
  Pencil,
  Plus,
  X,
  Check,
  Award,
  Calendar,
  GraduationCap,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Student } from '../../types';

const AVATAR_FALLBACKS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
];

export const StudentsListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const classes = dbService.getClasses();
  const [activeTab, setActiveTab] = useState<'students' | 'parents'>('students');
  // Combobox only lists specific classes, no "Tất cả các lớp", defaults to first class
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || 'cls-10a1');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>(() => dbService.getStudents());

  // Modal States
  const [student360, setStudent360] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  // Horizontal scroll container ref & states for table scrollbars (Top & Bottom)
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
    } else {
      const pct = Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100));
      setScrollProgress(pct);
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft < maxScroll - 2);
    }
  }, []);

  const handleScrollBy = (amount: number) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleScrollToProgress = (pct: number) => {
    if (tableContainerRef.current) {
      const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
      tableContainerRef.current.scrollTo({ left: (pct / 100) * maxScroll, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollState();
    }, 80);
    const el = tableContainerRef.current;
    if (!el) return () => clearTimeout(timer);
    const handleScroll = () => updateScrollState();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [selectedClassId, searchQuery, activeTab, updateScrollState]);

  // New Student Form State
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: '',
    studentCode: '',
    gender: 'NAM' as 'NAM' | 'NỮ',
    classId: selectedClassId,
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    phone: '',
    address: 'Đà Nẵng',
  });

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Filtering strictly by the selected class (no "ALL" option)
  const filtered = students.filter(s => {
    const matchClass = s.classId === selectedClassId;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchClass;
    const matchSearch =
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      (s.parentName && s.parentName.toLowerCase().includes(q)) ||
      (s.parentPhone && s.parentPhone.includes(q));
    return matchClass && matchSearch;
  });

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      dbService.deleteStudent(deleteTarget.id);
      setStudents(dbService.getStudents());
      showToast(`Đã xóa học sinh ${deleteTarget.fullName}`, 'info');
      setDeleteTarget(null);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      dbService.updateStudent(editingStudent.id, {
        fullName: editingStudent.fullName,
        studentCode: editingStudent.studentCode,
        gender: editingStudent.gender,
        classId: editingStudent.classId,
        className: classes.find(c => c.id === editingStudent.classId)?.name || editingStudent.className,
        phone: editingStudent.phone,
        address: editingStudent.address,
        parentName: editingStudent.parentName,
        parentPhone: editingStudent.parentPhone,
        parentEmail: editingStudent.parentEmail,
      });
      setStudents(dbService.getStudents());
      showToast(`Cập nhật thông tin học sinh ${editingStudent.fullName} thành công!`, 'success');
      setEditingStudent(null);
    } catch (error) {
      showToast('Có lỗi xảy ra khi lưu thông tin học sinh!', 'error');
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim()) {
      showToast('Vui lòng nhập họ và tên học sinh', 'error');
      return;
    }

    const targetClass = classes.find(c => c.id === newStudentForm.classId) || selectedClass;
    const nextCode = newStudentForm.studentCode.trim() || `HS2024-${String(students.length + 1).padStart(3, '0')}`;

    try {
      const created = dbService.createStudent({
        fullName: newStudentForm.fullName.trim(),
        studentCode: nextCode,
        gender: newStudentForm.gender,
        dateOfBirth: '2010-01-01',
        classId: targetClass.id,
        className: targetClass.name,
        groupNumber: 1,
        seatNumber: filtered.length + 1,
        status: 'STUDYING',
        rewardPoints: 100,
        attendanceRate: 100,
        gpa: 8.0,
        address: newStudentForm.address,
        phone: newStudentForm.phone,
        parentName: newStudentForm.parentName,
        parentPhone: newStudentForm.parentPhone,
        parentEmail: newStudentForm.parentEmail,
        avatarUrl: AVATAR_FALLBACKS[students.length % AVATAR_FALLBACKS.length],
        schoolId: 'sch-01',
      });

      setStudents(dbService.getStudents());
      showToast(`Đã thêm mới học sinh ${created.fullName} thành công!`, 'success');
      setIsAddModalOpen(false);
      setNewStudentForm({
        fullName: '',
        studentCode: '',
        gender: 'NAM',
        classId: selectedClassId,
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        phone: '',
        address: 'Đà Nẵng',
      });
    } catch (error) {
      showToast('Không thể tạo mới học sinh, vui lòng thử lại', 'error');
    }
  };

  const getParentRelationship = (s: Student, idx: number) => {
    if (s.parentName) {
      if (s.parentName.startsWith('Bà') || s.parentName.includes('Loan') || s.parentName.includes('Mai') || s.parentName.includes('Lan') || s.parentName.includes('Yến')) {
        return 'Mẹ';
      }
    }
    return idx % 4 === 3 ? 'Mẹ' : 'Bố';
  };

  const getParentFallbackName = (s: Student, idx: number) => {
    if (s.parentName) return s.parentName;
    const lastName = s.fullName.split(' ').slice(-1)[0];
    return idx % 2 === 0 ? `Trần Văn Kiên (Bố em ${lastName})` : `Nguyễn Thị Loan (Mẹ em ${lastName})`;
  };

  const getParentFallbackPhone = (s: Student, idx: number) => {
    if (s.parentPhone) return s.parentPhone;
    return `0913 ${(556000 + idx * 111).toString().slice(0, 3)} ${(777000 + idx * 222).toString().slice(0, 3)}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Học sinh"
        description="Tra cứu hồ sơ 360°, theo dõi quá trình học tập và liên kết thông tin phụ huynh học sinh."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Học sinh' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewStudentForm(prev => ({
                  ...prev,
                  classId: selectedClassId,
                  studentCode: `HS2024-${String(students.length + 1).padStart(3, '0')}`
                }));
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm học sinh
            </button>
            <button
              onClick={() => showToast('Đang xuất danh sách học sinh file Excel...', 'info')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/50 text-cyan-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Xuất Excel
            </button>
            <button
              onClick={() => showToast('Mở trình nhập khẩu file Excel/CSV...', 'info')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/50 text-cyan-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              Import Excel
            </button>
          </div>
        }
      />

      {/* Tabs navigation */}
      <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-1">
        <button
          onClick={() => setActiveTab('students')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-[#0c162b] text-slate-400 hover:text-white border border-cyan-500/20'
          }`}
        >
          <Users className="w-4 h-4" />
          Danh sách học sinh
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
            activeTab === 'students' ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-950 text-cyan-300'
          }`}>
            {filtered.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('parents')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'parents'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-[#0c162b] text-slate-400 hover:text-white border border-cyan-500/20'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Thông tin phụ huynh
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
            activeTab === 'parents' ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-950 text-cyan-300'
          }`}>
            {filtered.length}
          </span>
        </button>
      </div>

      {/* Filter ribbon - Only specific classes in combobox, no 'Tất cả các lớp' */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/60" />
            <input
              type="text"
              placeholder="Tìm tên học sinh, mã HS, tên phụ huynh, SĐT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-cyan-100 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Lớp học:</span>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="text-xs border border-cyan-500/30 rounded-xl px-3 py-2 bg-[#0c162b] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer font-medium"
            >
              {classes.map(c => {
                const count = students.filter(s => s.classId === c.id).length || c.studentCount || 0;
                return (
                  <option key={c.id} value={c.id} className="bg-[#0a1122] text-white py-1">
                    Lớp {c.name} ({count} HS)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>
            Hiển thị <strong className="text-cyan-300 font-bold font-mono">{filtered.length}</strong> {activeTab === 'students' ? 'học sinh' : 'phụ huynh'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="font-semibold text-cyan-400">{selectedClass?.name || '10A1'}</span>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH HỌC SINH */}
      {/* 
        Yêu cầu người dùng:
        1. Làm cho thanh cuộn to ra, kéo mượt mà
        2. Bỏ hai nút trái / phải đi
        3. Cột THAO TÁC không kéo (cố định ở mép phải - sticky right-0), còn các cột khác thì vẫn kéo
      */}
      {activeTab === 'students' && (
        <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.06)]">
          {/* HEADER CỦA BẢNG VỚI THANH CUỘN NGANG LỚN (Đã bỏ 2 nút trái/phải, kéo mượt mà) */}
          <div className="p-3.5 px-4 bg-[#080e1c] border-b border-cyan-500/20 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span className="text-sm">Danh sách học sinh ({filtered.length} học sinh)</span>
            </div>

            {/* THANH CUỘN NGANG TO & KÉO MƯỢT MÀ */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <span className="whitespace-nowrap font-semibold">Cuộn ngang:</span>
              </div>

              {/* Slider track lớn, kéo siêu mượt */}
              <div className="relative w-48 sm:w-72 md:w-80 h-5 flex items-center group/slider">
                {/* Visual Track */}
                <div className="w-full h-3.5 bg-[#060c18] border border-cyan-500/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.max(10, scrollProgress)}%` }}
                  />
                </div>

                {/* Glowing Thumb Indicator */}
                <div
                  className="absolute pointer-events-none top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-300 border-2 border-[#060c18] shadow-[0_0_12px_rgba(6,182,212,1)] transition-transform group-hover/slider:scale-125"
                  style={{ left: `calc(${scrollProgress}% - 10px)` }}
                />

                {/* Native Range Input for instantaneous 60fps drag */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scrollProgress}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setScrollProgress(val);
                    if (tableContainerRef.current) {
                      const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
                      tableContainerRef.current.scrollLeft = (val / 100) * maxScroll;
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                  title="Kéo thanh cuộn ngang để xem các cột thông tin"
                />
              </div>

              <span className="font-mono text-cyan-400 text-xs font-bold bg-[#0c162b] px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                {Math.round(scrollProgress)}%
              </span>
            </div>
          </div>

          {/* VÙNG CHỨA BẢNG VỚI THANH CUỘN NGANG TỰ ĐỘNG */}
          <div
            ref={tableContainerRef}
            className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#080e1c] [&::-webkit-scrollbar-thumb]:bg-cyan-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <table className="w-full min-w-[1240px] text-left text-xs">
              <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-3.5 py-3.5 w-14 text-center">STT</th>
                  <th className="px-3.5 py-3.5 min-w-[220px]">HỌC SINH</th>
                  <th className="px-3.5 py-3.5 min-w-[150px]">MÃ HỌC SINH</th>
                  <th className="px-3.5 py-3.5 min-w-[110px]">GIỚI TÍNH</th>
                  <th className="px-3.5 py-3.5 min-w-[260px]">PHỤ HUYNH LIÊN HỆ</th>
                  <th className="px-3.5 py-3.5 min-w-[130px]">ĐIỂM TB</th>
                  <th className="px-3.5 py-3.5 min-w-[140px]">CHUYÊN CẦN</th>
                  {/* CỘT THAO TÁC CỐ ĐỊNH (STICKY RIGHT-0) - KHÔNG BỊ KÉO KHI CUỘN */}
                  <th className="px-3.5 py-3.5 min-w-[145px] text-center sticky right-0 z-20 bg-[#060a14] border-l border-cyan-500/30 shadow-[-8px_0_16px_rgba(0,0,0,0.6)]">
                    THAO TÁC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy học sinh nào trong lớp {selectedClass?.name || ''} phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, idx) => {
                    const parentName = getParentFallbackName(s, idx);
                    const parentPhone = getParentFallbackPhone(s, idx);
                    const relationship = getParentRelationship(s, idx);
                    const avatarSrc = s.avatarUrl || AVATAR_FALLBACKS[idx % AVATAR_FALLBACKS.length];
                    const gpa = (s.gpa && s.gpa > 0) ? s.gpa : Number((8.1 + ((idx * 3.7) % 1.8)).toFixed(1));
                    const attendance = (s.attendanceRate && s.attendanceRate > 0) ? s.attendanceRate : Number((95.5 + ((idx * 4.3) % 4.5)).toFixed(1));

                    return (
                      <tr key={s.id} className="hover:bg-cyan-950/15 transition-colors group">
                        {/* STT - Kéo cuộn bình thường, Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle w-14 text-center">
                          <div className="w-full h-full min-h-[48px] px-2 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center justify-center font-mono text-slate-400 font-medium cursor-pointer">
                            {idx + 1}
                          </div>
                        </td>

                        {/* HỌC SINH - Kéo cuộn bình thường, Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div 
                            onClick={() => setStudent360(s)}
                            className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center gap-3 cursor-pointer group/cell"
                            title="Bấm để xem hồ sơ học sinh 360°"
                          >
                            <img
                              src={avatarSrc}
                              alt={s.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-cyan-500/30 shrink-0 shadow-xs group-hover/cell:border-cyan-400"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName)}&background=0e7490&color=fff`;
                              }}
                            />
                            <div>
                              <span
                                className="font-bold text-white group-hover/cell:text-cyan-300 transition-colors text-left block"
                              >
                                {s.fullName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* MÃ HỌC SINH - Kéo cuộn bình thường, Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div 
                            onClick={() => {
                              navigator.clipboard?.writeText(s.studentCode);
                              showToast(`Đã sao chép mã ${s.studentCode}!`, 'info');
                            }}
                            className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all font-mono text-cyan-400 font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer"
                            title="Bấm để sao chép mã"
                          >
                            {s.studentCode}
                          </div>
                        </td>

                        {/* GIỚI TÍNH - Kéo cuộn bình thường, Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle text-slate-300 capitalize">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center cursor-pointer">
                            {s.gender === 'NAM' ? 'Nam' : s.gender === 'NỮ' ? 'Nữ' : s.gender}
                          </div>
                        </td>

                        {/* PHỤ HUYNH LIÊN HỆ - Kéo cuộn bình thường, Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center gap-2 flex-wrap cursor-pointer">
                            <span className="font-semibold text-white">{parentName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              relationship === 'Mẹ'
                                ? 'bg-pink-950/70 text-pink-300 border-pink-500/30'
                                : 'bg-blue-950/70 text-blue-300 border-blue-500/30'
                            }`}>
                              {relationship}
                            </span>
                            <a
                              href={`tel:${parentPhone}`}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="font-mono text-cyan-400 hover:text-cyan-300 hover:underline text-[11px]"
                              title="Bấm để gọi"
                            >
                              {parentPhone}
                            </a>
                          </div>
                        </td>

                        {/* ĐIỂM TB - Kéo cuộn bình thường, Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle whitespace-nowrap">
                          <div 
                            onClick={() => setStudent360(s)}
                            className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center gap-2 cursor-pointer"
                            title="Xem bảng điểm chi tiết"
                          >
                            <span className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-xs border ${
                              gpa >= 9.0
                                ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                                : gpa >= 8.0
                                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                                : 'bg-blue-950/70 text-blue-300 border-blue-500/40'
                            }`}>
                              {gpa.toFixed(1)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {gpa >= 9.0 ? 'Xuất sắc' : gpa >= 8.0 ? 'Giỏi' : 'Khá'}
                            </span>
                          </div>
                        </td>

                        {/* CHUYÊN CẦN - Kéo cuộn bình thường, Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle whitespace-nowrap">
                          <div 
                            onClick={() => setStudent360(s)}
                            className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center gap-2 cursor-pointer"
                            title="Xem tỷ lệ chuyên cần"
                          >
                            <span className={`px-2 py-0.5 rounded-md font-mono font-semibold text-xs border ${
                              attendance >= 98
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                                : attendance >= 95
                                ? 'bg-teal-950/70 text-teal-300 border-teal-500/40'
                                : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                            }`}>
                              {attendance}%
                            </span>
                            <span className="text-[11px] text-emerald-400/80">
                              {attendance >= 98 ? 'Tốt' : 'Đạt'}
                            </span>
                          </div>
                        </td>

                        {/* THAO TÁC - CỐ ĐỊNH KHÔNG KÉO (STICKY RIGHT-0) */}
                        <td className="p-1 h-[60px] align-middle text-center sticky right-0 z-10 bg-[#0a1122] group-hover:bg-[#0d1b32] border-l border-cyan-500/20 shadow-[-8px_0_16px_rgba(0,0,0,0.6)]">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center justify-center gap-1.5">
                            {/* Nút 1: Xem chi tiết hồ sơ */}
                            <button
                              type="button"
                              onClick={() => setStudent360(s)}
                              className="p-2 rounded-xl bg-[#0c162b] border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all cursor-pointer shadow-2xs"
                              title="Xem chi tiết hồ sơ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Nút 2: Chỉnh sửa thông tin */}
                            <button
                              type="button"
                              onClick={() => setEditingStudent({ ...s })}
                              className="p-2 rounded-xl bg-[#0c162b] border border-cyan-500/30 text-slate-300 hover:text-blue-300 hover:border-blue-400 hover:bg-blue-950/60 transition-all cursor-pointer shadow-2xs"
                              title="Chỉnh sửa thông tin"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Nút 3: Xóa học sinh */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(s)}
                              className="p-2 rounded-xl bg-[#0c162b] border border-rose-500/30 text-slate-300 hover:text-rose-400 hover:border-rose-400 hover:bg-rose-950/60 transition-all cursor-pointer shadow-2xs"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* THANH CUỘN NGANG PHÍA DƯỚI BẢNG (To ra, kéo mượt mà, đã bỏ các nút bấm) */}
          <div className="p-3.5 px-4 bg-[#080e1c] border-t border-cyan-500/20 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-medium text-cyan-300">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">Thanh cuộn bảng:</span>
              </div>
              <span className="font-mono text-cyan-400 font-bold bg-[#0c162b] px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                {Math.round(scrollProgress)}%
              </span>
              <span className="text-slate-500 hidden sm:inline">• Kéo thanh trượt để xem các cột thông tin bên phải (cột Thao tác được giữ cố định)</span>
            </div>

            {/* Slider track lớn và mượt mà ở dưới */}
            <div className="relative w-full sm:w-80 md:w-96 h-5 flex items-center group/slider">
              {/* Visual Background Track */}
              <div className="w-full h-3.5 bg-[#060c18] border border-cyan-500/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.max(10, scrollProgress)}%` }}
                />
              </div>

              {/* Visual Glowing Thumb Indicator */}
              <div
                className="absolute pointer-events-none top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-300 border-2 border-[#060c18] shadow-[0_0_12px_rgba(6,182,212,1)] transition-transform group-hover/slider:scale-125"
                style={{ left: `calc(${scrollProgress}% - 10px)` }}
              />

              {/* Native Range Input for instantaneous 60fps drag */}
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={scrollProgress}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setScrollProgress(val);
                  if (tableContainerRef.current) {
                    const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
                    tableContainerRef.current.scrollLeft = (val / 100) * maxScroll;
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                title="Kéo sang trái / phải để cuộn bảng mượt mà"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THÔNG TIN PHỤ HUYNH */}
      {activeTab === 'parents' && (
        <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.06)]">
          <div className="p-3.5 px-4 bg-[#080e1c] border-b border-cyan-500/20 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span className="text-sm">Danh bạ liên lạc phụ huynh học sinh ({filtered.length} phụ huynh)</span>
            </div>

            {/* THANH CUỘN NGANG TO & KÉO MƯỢT MÀ */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <span className="whitespace-nowrap font-semibold">Cuộn ngang:</span>
              </div>

              {/* Slider track lớn */}
              <div className="relative w-48 sm:w-72 md:w-80 h-5 flex items-center group/slider">
                <div className="w-full h-3.5 bg-[#060c18] border border-cyan-500/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.max(10, scrollProgress)}%` }}
                  />
                </div>
                <div
                  className="absolute pointer-events-none top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-300 border-2 border-[#060c18] shadow-[0_0_12px_rgba(6,182,212,1)] transition-transform group-hover/slider:scale-125"
                  style={{ left: `calc(${scrollProgress}% - 10px)` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scrollProgress}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setScrollProgress(val);
                    if (tableContainerRef.current) {
                      const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
                      tableContainerRef.current.scrollLeft = (val / 100) * maxScroll;
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                  title="Kéo thanh cuộn ngang để xem các cột thông tin"
                />
              </div>

              <span className="font-mono text-cyan-400 text-xs font-bold bg-[#0c162b] px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                {Math.round(scrollProgress)}%
              </span>
            </div>
          </div>

          <div
            ref={tableContainerRef}
            className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#080e1c] [&::-webkit-scrollbar-thumb]:bg-cyan-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <table className="w-full min-w-[1200px] text-left text-xs">
              <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-14 text-center">STT</th>
                  <th className="px-4 py-3.5 min-w-[200px]">HỌC SINH</th>
                  <th className="px-4 py-3.5 min-w-[140px]">MÃ HỌC SINH</th>
                  <th className="px-4 py-3.5 min-w-[190px]">HỌ TÊN PHỤ HUYNH</th>
                  <th className="px-4 py-3.5 min-w-[110px]">QUAN HỆ</th>
                  <th className="px-4 py-3.5 min-w-[150px]">SỐ ĐIỆN THOẠI</th>
                  <th className="px-4 py-3.5 min-w-[200px]">EMAIL PHỤ HUYNH</th>
                  {/* CỘT LIÊN LẠC CỐ ĐỊNH (STICKY RIGHT-0) */}
                  <th className="px-4 py-3.5 min-w-[150px] text-right sticky right-0 z-20 bg-[#060a14] border-l border-cyan-500/30 shadow-[-8px_0_16px_rgba(0,0,0,0.6)]">
                    LIÊN LẠC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-200">
                {filtered.map((s, idx) => {
                  const parentName = getParentFallbackName(s, idx);
                  const parentPhone = getParentFallbackPhone(s, idx);
                  const relationship = getParentRelationship(s, idx);
                  const parentEmail = s.parentEmail || `ph.${s.studentCode.toLowerCase()}@smartclass.edu.vn`;
                  const avatarSrc = s.avatarUrl || AVATAR_FALLBACKS[idx % AVATAR_FALLBACKS.length];

                    return (
                      <tr key={s.id} className="hover:bg-cyan-950/15 transition-colors group">
                        {/* STT - Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle w-14 text-center">
                          <div className="w-full h-full min-h-[48px] px-2 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center justify-center font-mono text-slate-400 cursor-pointer">
                            {idx + 1}
                          </div>
                        </td>

                        {/* HỌC SINH - Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div 
                            onClick={() => setStudent360(s)}
                            className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center gap-2.5 cursor-pointer group/cell"
                            title="Xem chi tiết học sinh"
                          >
                            <img
                              src={avatarSrc}
                              alt={s.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-cyan-500/30 shrink-0 group-hover/cell:border-cyan-400"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName)}&background=0e7490&color=fff`;
                              }}
                            />
                            <span
                              className="font-bold text-white group-hover/cell:text-cyan-300 transition-colors text-left"
                            >
                              {s.fullName}
                            </span>
                          </div>
                        </td>

                        {/* MÃ HỌC SINH - Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div 
                            onClick={() => {
                              navigator.clipboard?.writeText(s.studentCode);
                              showToast(`Đã sao chép mã ${s.studentCode}!`, 'info');
                            }}
                            className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all font-mono text-cyan-400 font-semibold flex items-center cursor-pointer"
                            title="Bấm để sao chép mã"
                          >
                            {s.studentCode}
                          </div>
                        </td>

                        {/* HỌ TÊN PHỤ HUYNH - Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all font-semibold text-white flex items-center cursor-pointer">
                            {parentName}
                          </div>
                        </td>

                        {/* QUAN HỆ - Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center cursor-pointer">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              relationship === 'Mẹ' ? 'bg-pink-950/60 text-pink-300 border border-pink-500/30' : 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                            }`}>
                              {relationship}
                            </span>
                          </div>
                        </td>

                        {/* SỐ ĐIỆN THOẠI - Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center cursor-pointer">
                            <a
                              href={`tel:${parentPhone}`}
                              className="hover:underline flex items-center gap-1.5 font-mono text-cyan-300 font-bold"
                            >
                              <Phone className="w-3.5 h-3.5 text-cyan-400" />
                              {parentPhone}
                            </a>
                          </div>
                        </td>

                        {/* EMAIL PHỤ HUYNH - Full cell highlight */}
                        <td className="p-1 h-[60px] align-middle">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all font-mono text-slate-400 flex items-center cursor-pointer">
                            {parentEmail}
                          </div>
                        </td>

                        {/* LIÊN LẠC - CỐ ĐỊNH KHÔNG KÉO (STICKY RIGHT-0) */}
                        <td className="p-1 h-[60px] align-middle text-right sticky right-0 z-10 bg-[#0a1122] group-hover:bg-[#0d1b32] border-l border-cyan-500/20 shadow-[-8px_0_16px_rgba(0,0,0,0.6)]">
                          <div className="w-full h-full min-h-[48px] px-3.5 py-2 rounded-xl border border-transparent hover:border-cyan-400/80 hover:bg-[#0d2238] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => showToast(`Đang kết nối cuộc gọi tới PH ${parentName} (${parentPhone})`, 'info')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 rounded-xl transition-all cursor-pointer shadow-2xs"
                              title="Gọi điện cho phụ huynh"
                            >
                              <Phone className="w-3 h-3" />
                              Gọi
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast(`Mở hộp thoại gửi tin nhắn tới PH ${parentName}`, 'info')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950 rounded-xl transition-all cursor-pointer shadow-2xs"
                              title="Nhắn tin"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Nhắn
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>

          {/* THANH CUỘN NGANG PHÍA DƯỚI BẢNG (To ra, kéo mượt mà) */}
          <div className="p-3.5 px-4 bg-[#080e1c] border-t border-cyan-500/20 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-medium text-cyan-300">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">Thanh cuộn bảng:</span>
              </div>
              <span className="font-mono text-cyan-400 font-bold bg-[#0c162b] px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                {Math.round(scrollProgress)}%
              </span>
              <span className="text-slate-500 hidden sm:inline">• Kéo thanh trượt để xem thông tin phụ huynh (cột Liên lạc được giữ cố định)</span>
            </div>

            <div className="relative w-full sm:w-80 md:w-96 h-5 flex items-center group/slider">
              <div className="w-full h-3.5 bg-[#060c18] border border-cyan-500/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.max(10, scrollProgress)}%` }}
                />
              </div>
              <div
                className="absolute pointer-events-none top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-300 border-2 border-[#060c18] shadow-[0_0_12px_rgba(6,182,212,1)] transition-transform group-hover/slider:scale-125"
                style={{ left: `calc(${scrollProgress}% - 10px)` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={scrollProgress}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setScrollProgress(val);
                  if (tableContainerRef.current) {
                    const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
                    tableContainerRef.current.scrollLeft = (val / 100) * maxScroll;
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                title="Kéo sang trái / phải để cuộn bảng mượt mà"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: XEM CHI TIẾT HỒ SƠ 360° (Nút Eye) */}
      {student360 && (
        <Modal
          isOpen={Boolean(student360)}
          onClose={() => setStudent360(null)}
          title={`Hồ sơ học sinh - ${student360.fullName}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Header banner info */}
            <div className="flex items-center gap-4 pb-4 border-b border-cyan-500/20">
              <img
                src={student360.avatarUrl || AVATAR_FALLBACKS[0]}
                alt={student360.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student360.fullName)}&background=0e7490&color=fff`;
                }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{student360.fullName}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {student360.studentCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>Lớp: <strong className="text-white">{student360.className}</strong></span>
                  <span>·</span>
                  <span>Giới tính: <strong className="text-white">{student360.gender === 'NAM' ? 'Nam' : 'Nữ'}</strong></span>
                  <span>·</span>
                  <span>Ngày sinh: <strong className="text-white">{student360.dateOfBirth || '2010-04-12'}</strong></span>
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    {student360.rewardPoints || 120} điểm thi đua
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    Điểm TB: {student360.gpa || 8.9}
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    Chuyên cần: {student360.attendanceRate || 98.4}%
                  </span>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#0c162b] border border-cyan-500/20 rounded-xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Địa chỉ thường trú:
                </span>
                <strong className="text-slate-100 block text-xs font-medium">{student360.address || 'Hải Châu, Đà Nẵng'}</strong>
              </div>

              <div className="p-3.5 bg-[#0c162b] border border-cyan-500/20 rounded-xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  Số điện thoại học sinh:
                </span>
                <strong className="text-cyan-300 font-mono block text-xs font-bold">{student360.phone || '0933112233'}</strong>
              </div>

              <div className="p-3.5 bg-[#0c162b] border border-cyan-500/20 rounded-xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Họ tên Phụ huynh:
                </span>
                <strong className="text-slate-100 block text-xs font-medium">{student360.parentName || 'Nguyễn Văn Hùng'}</strong>
              </div>

              <div className="p-3.5 bg-[#0c162b] border border-cyan-500/20 rounded-xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  SĐT Phụ huynh:
                </span>
                <strong className="text-cyan-300 font-mono block text-xs font-bold">{student360.parentPhone || '0913 556 777'}</strong>
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => {
                  setEditingStudent({ ...student360 });
                  setStudent360(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c162b] hover:bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setStudent360(null)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CHỈNH SỬA THÔNG TIN HỌC SINH (Nút Pencil) */}
      {editingStudent && (
        <Modal
          isOpen={Boolean(editingStudent)}
          onClose={() => setEditingStudent(null)}
          title={`Chỉnh sửa học sinh: ${editingStudent.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={e => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Mã học sinh *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.studentCode}
                  onChange={e => setEditingStudent({ ...editingStudent, studentCode: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-cyan-300 font-mono font-semibold focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Giới tính</label>
                <select
                  value={editingStudent.gender}
                  onChange={e => setEditingStudent({ ...editingStudent, gender: e.target.value as 'NAM' | 'NỮ' })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="NAM">Nam</option>
                  <option value="NỮ">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Lớp học</label>
                <select
                  value={editingStudent.classId}
                  onChange={e => {
                    const c = classes.find(cls => cls.id === e.target.value);
                    setEditingStudent({
                      ...editingStudent,
                      classId: e.target.value,
                      className: c?.name || editingStudent.className
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Lớp {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Số điện thoại học sinh</label>
                <input
                  type="text"
                  value={editingStudent.phone || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  placeholder="09xx xxx xxx"
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={editingStudent.address || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  placeholder="Quận/Huyện, TP"
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-500/20">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide mb-2.5">
                Thông tin phụ huynh liên hệ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    value={editingStudent.parentName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Số điện thoại phụ huynh</label>
                  <input
                    type="text"
                    value={editingStudent.parentPhone || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                    placeholder="0913 556 777"
                    className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-cyan-300 font-mono font-semibold focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 bg-[#0c162b] hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Lưu thay đổi
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: THÊM HỌC SINH MỚI */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Thêm học sinh mới vào lớp"
          maxWidth="md"
        >
          <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={newStudentForm.fullName}
                  onChange={e => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Mã học sinh</label>
                <input
                  type="text"
                  placeholder="Tự động tạo mã nếu để trống"
                  value={newStudentForm.studentCode}
                  onChange={e => setNewStudentForm({ ...newStudentForm, studentCode: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-cyan-300 font-mono font-semibold focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Giới tính</label>
                <select
                  value={newStudentForm.gender}
                  onChange={e => setNewStudentForm({ ...newStudentForm, gender: e.target.value as 'NAM' | 'NỮ' })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="NAM">Nam</option>
                  <option value="NỮ">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Lớp học</label>
                <select
                  value={newStudentForm.classId}
                  onChange={e => setNewStudentForm({ ...newStudentForm, classId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Lớp {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="09xx xxx xxx"
                  value={newStudentForm.phone}
                  onChange={e => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  placeholder="Quận/Huyện, TP"
                  value={newStudentForm.address}
                  onChange={e => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-500/20">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide mb-2.5">
                Thông tin phụ huynh
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn ..."
                    value={newStudentForm.parentName}
                    onChange={e => setNewStudentForm({ ...newStudentForm, parentName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Số điện thoại phụ huynh</label>
                  <input
                    type="text"
                    placeholder="0913 xxx xxx"
                    value={newStudentForm.parentPhone}
                    onChange={e => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-cyan-300 font-mono font-semibold focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-[#0c162b] hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Thêm vào lớp
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete dialog (Nút Trash2) */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa học sinh"
        message={`Bạn có chắc chắn muốn xóa học sinh "${deleteTarget?.fullName}" (${deleteTarget?.studentCode}) khỏi hệ thống? Dữ liệu điểm danh và kết quả bài tập liên quan cũng sẽ được cập nhật.`}
        confirmLabel="Xác nhận xóa"
        isDestructive={true}
      />
    </div>
  );
};
