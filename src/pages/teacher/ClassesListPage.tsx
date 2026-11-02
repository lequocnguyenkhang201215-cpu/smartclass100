import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Grid,
  List,
  QrCode,
  Users,
  Copy,
  Trash2,
  BookOpen,
  X,
  Edit3,
  ChevronRight,
  Home,
  ChevronDown,
  Pencil,
  Eye
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { ClassRoom } from '../../types';

export const ClassesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [classes, setClasses] = useState<ClassRoom[]>(() => dbService.getClasses(currentUser.id));
  const [activeMainTab, setActiveMainTab] = useState<'classes' | 'create'>('classes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [qrModalClass, setQrModalClass] = useState<ClassRoom | null>(null);
  const [deleteTargetClass, setDeleteTargetClass] = useState<ClassRoom | null>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('10');
  const [newSubject, setNewSubject] = useState('Toán học');
  const [newRoomNumber, setNewRoomNumber] = useState('A.306');
  const [newColorTheme, setNewColorTheme] = useState('blue');
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [newDescription, setNewDescription] = useState('');

  // Filtered list
  const filteredClasses = classes.filter(cls => {
    const matchSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGrade = gradeFilter === 'ALL' || cls.gradeLevel === gradeFilter;
    return matchSearch && matchGrade;
  });

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      showToast('Vui lòng nhập tên lớp học!', 'error');
      return;
    }

    const created = dbService.createClass({
      name: newClassName,
      gradeLevel: newGradeLevel,
      subject: newSubject,
      academicYear: academicYear,
      roomNumber: newRoomNumber || 'A.306',
      homeroomTeacherId: currentUser.id,
      homeroomTeacherName: currentUser.fullName || 'Cô Nguyễn Thị Mai',
      description: newDescription,
      inviteCode: `LQD${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      colorTheme: newColorTheme,
      schoolId: currentUser.schoolId,
    });

    setClasses(dbService.getClasses(currentUser.id));
    setCreateModalOpen(false);
    setActiveMainTab('classes');
    showToast(`Đã tạo thành công lớp ${created.name}!`, 'success');
    // reset
    setNewClassName('');
    setNewRoomNumber('A.306');
    setNewDescription('');
  };

  const handleDuplicateClass = (cls: ClassRoom) => {
    const duplicated = dbService.createClass({
      ...cls,
      name: `${cls.name} (Bản sao)`,
      inviteCode: `LQD${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    });
    setClasses(dbService.getClasses(currentUser.id));
    showToast(`Đã nhân bản lớp học thành ${duplicated.name}!`, 'success');
  };

  const handleArchiveClass = (cls: ClassRoom) => {
    dbService.archiveClass(cls.id);
    setClasses(dbService.getClasses(currentUser.id));
    showToast(`Đã ${cls.isArchived ? 'khôi phục' : 'lưu trữ'} lớp ${cls.name}`, 'info');
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetClass) {
      dbService.deleteClass(deleteTargetClass.id);
      setClasses(dbService.getClasses(currentUser.id));
      showToast(`Đã xóa lớp ${deleteTargetClass.name}!`, 'info');
      setDeleteTargetClass(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs matching screenshot */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 flex-wrap">
          <Link to="/teacher/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300">Lớp học</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white font-medium">Lớp của tôi</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 text-xs">Quản lý Lớp học</span>
        </div>

        <button
          onClick={() => setActiveMainTab('create')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl border border-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.3)] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          Thêm mới lớp
        </button>
      </div>

      {/* 2 Tabs: Lớp của tôi (4) & Thêm mới lớp */}
      <div className="flex items-center gap-8 border-b border-slate-800">
        <button
          onClick={() => setActiveMainTab('classes')}
          className={`flex items-center gap-2.5 pb-3.5 px-1 text-sm transition-all cursor-pointer border-b-2 ${
            activeMainTab === 'classes'
              ? 'border-cyan-400 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Lớp của tôi</span>
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#0c1a30] text-cyan-300 rounded-md border border-cyan-500/30">
            {classes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('create')}
          className={`flex items-center gap-2 pb-3.5 px-1 text-sm transition-all cursor-pointer border-b-2 ${
            activeMainTab === 'create'
              ? 'border-cyan-400 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mới lớp</span>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH LỚP CỦA TÔI */}
      {activeMainTab === 'classes' && (
        <div className="space-y-6">
          {/* Thanh tìm kiếm & bộ lọc */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input kéo dài */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên lớp, phòng, mã tham gia..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#060c18] border border-slate-700/80 focus:border-cyan-400 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Dropdown filter */}
              <select
                value={gradeFilter}
                onChange={e => setGradeFilter(e.target.value)}
                className="text-xs sm:text-sm border border-slate-700/80 rounded-xl px-3.5 py-2.5 bg-[#060c18] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer font-medium"
              >
                <option value="ALL">Tất cả 12 khối lớp</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>

              {/* View toggle */}
              <div className="flex items-center border border-slate-700/80 rounded-xl p-1 bg-[#060a14]">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Xem dạng lưới"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Xem dạng danh sách"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Classes Display */}
          {filteredClasses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Chưa tìm thấy lớp học phù hợp"
              description="Bạn có thể thử tìm từ khóa khác hoặc tạo một lớp học mới để bắt đầu giảng dạy."
              action={{
                label: 'Thêm mới lớp',
                onClick: () => setActiveMainTab('create'),
              }}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls, idx) => {
                // Color dots matching user screenshot: Blue, Purple, Green, Amber
                const dotColors = [
                  'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
                  'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
                  'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
                  'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
                ];
                const dotColor = dotColors[idx % dotColors.length];
                const displayName = cls.name.startsWith('Lớp') ? cls.name : `Lớp ${cls.name}`;

                return (
                  <div
                    key={cls.id}
                    onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                    className={`bg-[#08101e] border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all cursor-pointer group hover:border-cyan-400/70 ${
                      cls.isArchived
                        ? 'opacity-70 border-dashed border-slate-700'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Hàng 1: Dot màu + Tên lớp + Pill mã mời (QR & Copy) + Nút sửa & xóa */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                          <span
                            className="text-base sm:text-[17px] font-bold text-white group-hover:text-cyan-300 transition-colors truncate tracking-tight"
                            title={displayName}
                          >
                            {displayName}
                          </span>

                          {/* Pill mã tham gia có icon QR và icon Copy */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setQrModalClass(cls);
                            }}
                            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-cyan-200/90 bg-[#0c1a30] hover:bg-cyan-950/80 hover:border-cyan-400 px-2 py-0.5 rounded-md border border-cyan-500/25 shrink-0 transition-all cursor-pointer"
                            title="Xem mã QR & Sao chép"
                          >
                            <QrCode className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{cls.inviteCode}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard?.writeText(cls.inviteCode);
                                showToast(`Đã sao chép mã ${cls.inviteCode}!`, 'success');
                              }}
                              title="Sao chép mã"
                              className="text-slate-400 hover:text-white transition-colors ml-0.5 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Nút sửa (bút) & nút xóa (thùng rác) */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDuplicateClass(cls)}
                            title="Chỉnh sửa / Nhân bản lớp"
                            className="p-2 rounded-xl bg-[#0c162b] border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetClass(cls)}
                            title="Xóa lớp"
                            className="p-2 rounded-xl bg-[#0c162b] border border-rose-500/30 text-slate-300 hover:text-rose-400 hover:border-rose-400 hover:bg-rose-950/60 transition-all cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Hàng 2: Phòng: A.302 · Sĩ số: 32 HS · GVCN: Cô Nguyễn Thị Mai */}
                      <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all flex items-center gap-2 text-xs sm:text-[13px] text-slate-400 mt-2.5 truncate">
                        <span>
                          Phòng: <strong className="text-white font-medium">{cls.roomNumber}</strong>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span>
                          Sĩ số: <strong className="text-white font-medium">{cls.studentCount || 32} HS</strong>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="truncate">
                          GVCN: <strong className="text-white font-medium">{cls.homeroomTeacherName || 'Cô Mai Hương'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Hàng 3: Vào không gian làm việc chính > */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/90">
                      <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all flex items-center justify-between">
                        <span className="text-xs sm:text-[13px] font-semibold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
                          <span>Vào không gian làm việc chính</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 w-14">STT</th>
                      <th className="px-4 py-3.5">TÊN LỚP</th>
                      <th className="px-4 py-3.5">KHỐI / MÔN</th>
                      <th className="px-4 py-3.5">PHÒNG HỌC</th>
                      <th className="px-4 py-3.5">SĨ SỐ</th>
                      <th className="px-4 py-3.5">MÃ MỜI LỚP</th>
                      <th className="px-4 py-3.5">GVCN PHỤ TRÁCH</th>
                      <th className="px-4 py-3.5 text-center">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/15 text-slate-200">
                    {filteredClasses.map((cls, idx) => {
                      const dotColors = [
                        'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
                        'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
                        'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
                      ];
                      const dotColor = dotColors[idx % dotColors.length];
                      const displayName = cls.name.startsWith('Lớp') ? cls.name : `Lớp ${cls.name}`;

                      return (
                        <tr key={cls.id} className="hover:bg-cyan-950/20 transition-colors">
                          {/* STT */}
                          <td className="px-4 py-3 font-mono text-slate-400">
                            <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all inline-block cursor-pointer">
                              {idx + 1}
                            </div>
                          </td>

                          {/* TÊN LỚP */}
                          <td className="px-4 py-3">
                            <div
                              onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                              className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all flex items-center gap-2.5 cursor-pointer group/cell"
                            >
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                              <span className="font-bold text-white group-hover/cell:text-cyan-300 transition-colors">
                                {displayName}
                              </span>
                            </div>
                          </td>

                          {/* KHỐI / MÔN */}
                          <td className="px-4 py-3 text-slate-300">
                            <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all inline-block cursor-pointer">
                              Khối {cls.gradeLevel} · {cls.subject}
                            </div>
                          </td>

                          {/* PHÒNG HỌC */}
                          <td className="px-4 py-3 font-mono text-cyan-200">
                            <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all inline-block cursor-pointer">
                              {cls.roomNumber}
                            </div>
                          </td>

                          {/* SĨ SỐ */}
                          <td className="px-4 py-3 font-mono tabular-nums font-bold text-cyan-300">
                            <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all inline-block cursor-pointer">
                              {cls.studentCount || 32} HS
                            </div>
                          </td>

                          {/* MÃ MỜI LỚP */}
                          <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                            <div
                              onClick={() => {
                                navigator.clipboard?.writeText(cls.inviteCode);
                                showToast(`Đã sao chép mã mời ${cls.inviteCode}!`, 'info');
                              }}
                              className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all cursor-pointer inline-flex items-center gap-1.5"
                              title="Bấm để sao chép mã mời"
                            >
                              <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{cls.inviteCode}</span>
                            </div>
                          </td>

                          {/* GVCN */}
                          <td className="px-4 py-3 text-slate-300">
                            <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all inline-block cursor-pointer">
                              {cls.homeroomTeacherName || 'Cô Mai Hương'}
                            </div>
                          </td>

                          {/* THAO TÁC */}
                          <td className="px-4 py-3 text-center">
                            <div className="p-2 -m-1.5 rounded-lg border border-transparent hover:border-cyan-500/50 hover:bg-[#0e213b]/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.18)] transition-all inline-flex items-center justify-center gap-1.5">
                              {/* Nút 1: Vào lớp */}
                              <button
                                type="button"
                                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                                className="p-2 rounded-xl bg-[#0c162b] border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all cursor-pointer shadow-2xs"
                                title="Vào không gian lớp học"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Nút 2: Chỉnh sửa / Nhân bản */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateClass(cls)}
                                className="p-2 rounded-xl bg-[#0c162b] border border-cyan-500/30 text-slate-300 hover:text-blue-300 hover:border-blue-400 hover:bg-blue-950/60 transition-all cursor-pointer shadow-2xs"
                                title="Chỉnh sửa / Nhân bản lớp"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Nút 3: Xóa lớp */}
                              <button
                                type="button"
                                onClick={() => setDeleteTargetClass(cls)}
                                className="p-2 rounded-xl bg-[#0c162b] border border-rose-500/30 text-slate-300 hover:text-rose-400 hover:border-rose-400 hover:bg-rose-950/60 transition-all cursor-pointer shadow-2xs"
                                title="Xóa lớp học"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: THÊM MỚI LỚP (MATCHING USER SCREENSHOT) */}
      {activeMainTab === 'create' && (
        <div className="bg-[#070e1b] border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-4xl shadow-[0_0_25px_rgba(0,0,0,0.4)]">
          {/* Header matching screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Thiết lập Lớp học Mới
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Khai báo thông tin lớp học số, chỉ định giáo viên chủ nhiệm, phòng học và màu nhận diện
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="relative inline-flex items-center">
                <select
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-sky-950/40 hover:bg-sky-950/70 border border-sky-500/40 focus:border-sky-400 text-sky-400 text-xs sm:text-sm font-semibold rounded-lg font-mono focus:outline-hidden cursor-pointer transition-colors"
                  title="Chọn năm học"
                >
                  <option value="2023 - 2024" className="bg-[#070e1b] text-white">Năm học 2023 - 2024</option>
                  <option value="2024 - 2025" className="bg-[#070e1b] text-white">Năm học 2024 - 2025</option>
                  <option value="2025 - 2026" className="bg-[#070e1b] text-white">Năm học 2025 - 2026</option>
                  <option value="2026 - 2027" className="bg-[#070e1b] text-white">Năm học 2026 - 2027</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-sky-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateClass} className="space-y-6">
            {/* Tên lớp học * (Khoanh tròn 1) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-2">
                Tên lớp học <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 1A1, 5C, 6B2, 10A3, 12A1..."
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Tên lớp dùng để hiển thị trên sổ điểm, thời khóa biểu và cổng phụ huynh/học sinh.
              </p>
            </div>

            {/* Hàng 2 cột: Khối lớp (12 khối) (Khoanh tròn 2) + Phòng học (Khoanh tròn 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-2">
                  Khối lớp (12 khối)
                </label>
                <div className="relative">
                  <select
                    value={newGradeLevel}
                    onChange={e => setNewGradeLevel(e.target.value)}
                    className="w-full appearance-none px-4 py-3 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-white focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all cursor-pointer pr-10"
                  >
                    <option value="1">Khối 1 (Cấp Tiểu học)</option>
                    <option value="2">Khối 2 (Cấp Tiểu học)</option>
                    <option value="3">Khối 3 (Cấp Tiểu học)</option>
                    <option value="4">Khối 4 (Cấp Tiểu học)</option>
                    <option value="5">Khối 5 (Cấp Tiểu học)</option>
                    <option value="6">Khối 6 (Cấp THCS)</option>
                    <option value="7">Khối 7 (Cấp THCS)</option>
                    <option value="8">Khối 8 (Cấp THCS)</option>
                    <option value="9">Khối 9 (Cấp THCS)</option>
                    <option value="10">Khối 10 (Cấp THPT)</option>
                    <option value="11">Khối 11 (Cấp THPT)</option>
                    <option value="12">Khối 12 (Cấp THPT)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-2">
                  Phòng học
                </label>
                <input
                  type="text"
                  placeholder="A.306"
                  value={newRoomNumber}
                  onChange={e => setNewRoomNumber(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
                />
              </div>
            </div>

            {/* Giáo viên chủ nhiệm phụ trách */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-2">
                Giáo viên chủ nhiệm phụ trách
              </label>
              <input
                type="text"
                readOnly
                value={`${currentUser.fullName || 'Cô Nguyễn Thị Mai'} (Tài khoản hiện tại)`}
                className="w-full px-4 py-3 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-slate-200 select-none cursor-default focus:outline-hidden"
              />
            </div>

            {/* Màu sắc nhận diện lớp học */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-2.5">
                Màu sắc nhận diện lớp học
              </label>
              <div className="flex items-center gap-3.5">
                {[
                  { id: 'blue', color: '#3b82f6', label: 'Xanh dương' },
                  { id: 'purple', color: '#8b5cf6', label: 'Tím' },
                  { id: 'green', color: '#22c55e', label: 'Xanh lá' },
                  { id: 'amber', color: '#f59e0b', label: 'Vàng cam' },
                  { id: 'red', color: '#ef4444', label: 'Đỏ' },
                  { id: 'cyan', color: '#06b6d4', label: 'Xanh lam' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNewColorTheme(item.id)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-transform cursor-pointer hover:scale-105 ${
                      newColorTheme === item.id
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#070e1b] scale-105'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={item.label}
                  />
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => setActiveMainTab('classes')}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tạo lớp học ngay
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Class */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thiết lập Lớp học Mới"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateClass} className="space-y-5">
          {/* Tên lớp học * */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
              Tên lớp học <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 1A1, 5C, 6B2, 10A3, 12A1..."
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              Tên lớp dùng để hiển thị trên sổ điểm, thời khóa biểu và cổng phụ huynh/học sinh.
            </p>
          </div>

          {/* Row: Khối lớp + Phòng học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
                Khối lớp (12 khối)
              </label>
              <div className="relative">
                <select
                  value={newGradeLevel}
                  onChange={e => setNewGradeLevel(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-white focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all cursor-pointer pr-10"
                >
                  <option value="1">Khối 1 (Cấp Tiểu học)</option>
                  <option value="2">Khối 2 (Cấp Tiểu học)</option>
                  <option value="3">Khối 3 (Cấp Tiểu học)</option>
                  <option value="4">Khối 4 (Cấp Tiểu học)</option>
                  <option value="5">Khối 5 (Cấp Tiểu học)</option>
                  <option value="6">Khối 6 (Cấp THCS)</option>
                  <option value="7">Khối 7 (Cấp THCS)</option>
                  <option value="8">Khối 8 (Cấp THCS)</option>
                  <option value="9">Khối 9 (Cấp THCS)</option>
                  <option value="10">Khối 10 (Cấp THPT)</option>
                  <option value="11">Khối 11 (Cấp THPT)</option>
                  <option value="12">Khối 12 (Cấp THPT)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
                Phòng học
              </label>
              <input
                type="text"
                placeholder="A.306"
                value={newRoomNumber}
                onChange={e => setNewRoomNumber(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
              />
            </div>
          </div>

          {/* Giáo viên chủ nhiệm */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
              Giáo viên chủ nhiệm phụ trách
            </label>
            <input
              type="text"
              readOnly
              value={`${currentUser.fullName || 'Cô Nguyễn Thị Mai'} (Tài khoản hiện tại)`}
              className="w-full px-4 py-2.5 text-sm bg-[#040812] border border-slate-700/80 rounded-xl text-slate-200 select-none cursor-default focus:outline-hidden"
            />
          </div>

          {/* Màu sắc nhận diện */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-2">
              Màu sắc nhận diện lớp học
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: 'blue', color: '#3b82f6', label: 'Xanh dương' },
                { id: 'purple', color: '#8b5cf6', label: 'Tím' },
                { id: 'green', color: '#22c55e', label: 'Xanh lá' },
                { id: 'amber', color: '#f59e0b', label: 'Vàng cam' },
                { id: 'red', color: '#ef4444', label: 'Đỏ' },
                { id: 'cyan', color: '#06b6d4', label: 'Xanh lam' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNewColorTheme(item.id)}
                  className={`w-8 h-8 rounded-full transition-transform cursor-pointer hover:scale-105 ${
                    newColorTheme === item.id
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#070e1b] scale-105'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: item.color }}
                  title={item.label}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tạo lớp học ngay
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: QR Code */}
      {qrModalClass && (
        <Modal
          isOpen={Boolean(qrModalClass)}
          onClose={() => setQrModalClass(null)}
          title={`Mã tham gia lớp ${qrModalClass.name}`}
          maxWidth="sm"
        >
          <div className="text-center">
            <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-4 flex flex-col items-center justify-center border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>
            <p className="mt-4 text-xs text-slate-400">Mã mời học sinh tham gia:</p>
            <p className="text-3xl font-extrabold font-mono text-cyan-300 tracking-wider mt-1.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
              {qrModalClass.inviteCode}
            </p>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Học sinh có thể quét mã QR trên màn hình hoặc nhập mã mời để tự động vào lớp.
            </p>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetClass)}
        onClose={() => setDeleteTargetClass(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp "${deleteTargetClass?.name}"? Mọi dữ liệu liên quan đến học sinh và điểm danh có thể bị ảnh hưởng.`}
        confirmLabel="Xóa vĩnh viễn"
        isDestructive={true}
      />
    </div>
  );
};
