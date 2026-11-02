import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Assignment } from '../../types';

export const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const classes = dbService.getClasses(currentUser.id);
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>(() => dbService.getAssignments());
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);

  const filtered = assignments.filter(a => {
    const matchClass = selectedClassId === 'ALL' || a.classId === selectedClassId;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  const handleDelete = () => {
    if (deleteTarget) {
      dbService.deleteAssignment(deleteTarget.id);
      setAssignments(dbService.getAssignments());
      showToast(`Đã xóa bài tập "${deleteTarget.title}"`, 'info');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Bài tập"
        description="Giao bài, theo dõi tiến độ nộp bài, chấm điểm và phản hồi học sinh."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Bài tập' }]}
        actions={
          <button
            onClick={() => navigate('/teacher/assignments/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Giao bài tập mới
          </button>
        }
      />

      {/* Filter Ribbon */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề bài tập..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="text-xs border border-cyan-500/30 rounded-xl px-3 py-2 bg-[#0c162b] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
          >
            <option value="ALL" className="bg-[#0a1122]">Tất cả các lớp</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0a1122]">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có bài tập nào"
          description="Bắt đầu giao bài tập đầu tiên cho học sinh để rèn luyện kỹ năng."
          action={{
            label: 'Giao bài tập ngay',
            onClick: () => navigate('/teacher/assignments/create'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(asg => (
            <div key={asg.id} className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">
                    Lớp {asg.className}
                  </span>
                  <button
                    onClick={() => setDeleteTarget(asg)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Xóa bài tập"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3
                  onClick={() => navigate(`/teacher/assignments/${asg.id}`)}
                  className="mt-3 text-base font-bold text-white cursor-pointer hover:text-cyan-300 transition-colors"
                >
                  {asg.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">{asg.description}</p>
                <div className="mt-3.5 text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hạn nộp: <strong className="text-cyan-200">{new Date(asg.dueDate).toLocaleDateString('vi-VN')}</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Đã nộp: <strong className="text-cyan-300 font-bold">{asg.submittedCount || 0}</strong>/{asg.totalStudents || 32}
                </span>
                <button
                  onClick={() => navigate(`/teacher/assignments/${asg.id}`)}
                  className="font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Chi tiết & Chấm bài &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa bài tập"
        message={`Bạn có chắc muốn xóa bài tập "${deleteTarget?.title}"?`}
        confirmLabel="Xóa"
        isDestructive={true}
      />
    </div>
  );
};
