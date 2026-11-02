import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, FileQuestion, BookOpen, Check } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Question } from '../../types';

interface LocationState {
  presetTitle?: string;
  presetQuestions?: Question[];
}

export const CreateAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const state = (location.state as LocationState) || {};
  const classes = dbService.getClasses(currentUser.id);

  const [classId, setClassId] = useState(classes[0]?.id || 'cls-10a1');
  const [title, setTitle] = useState(state.presetTitle || '');
  const [description, setDescription] = useState(() => {
    if (state.presetQuestions && state.presetQuestions.length > 0) {
      return `Nội dung gồm ${state.presetQuestions.length} câu hỏi được nạp từ Ngân hàng câu hỏi:\n\n` +
        state.presetQuestions.map((q, i) => `${i + 1}. [${q.code || 'CH'}] ${q.prompt}`).join('\n\n');
    }
    return '';
  });
  const [dueDate, setDueDate] = useState('2026-10-25T22:00');
  const [maxScore, setMaxScore] = useState(10);
  const [target, setTarget] = useState<'ALL' | 'GROUP'>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài tập!', 'error');
      return;
    }

    const targetClass = classes.find(c => c.id === classId) || classes[0];

    dbService.createAssignment({
      classId,
      className: targetClass?.name || '10A1',
      title,
      description,
      subject: targetClass?.subject || 'Toán học',
      teacherId: currentUser.id,
      teacherName: currentUser.fullName,
      dueDate: new Date(dueDate).toISOString(),
      maxScore,
      target,
      status: 'PUBLISHED',
    });

    showToast(`Đã giao bài tập thành công cho lớp ${targetClass.name}!`, 'success');
    navigate('/teacher/assignments');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Giao bài tập mới"
        description="Soạn thảo yêu cầu bài làm, thời hạn và đối tượng nhận bài tập từ Ngân hàng câu hỏi."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/teacher/dashboard' },
          { label: 'Bài tập', href: '/teacher/assignments' },
          { label: 'Giao bài mới' },
        ]}
      />

      {state.presetQuestions && state.presetQuestions.length > 0 && (
        <div className="p-4 bg-cyan-950/40 border border-cyan-500/35 rounded-2xl flex items-center gap-3">
          <FileQuestion className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="text-xs text-cyan-200">
            Đang tạo bài tập tích hợp từ <strong className="text-white font-mono">{state.presetQuestions.length} câu hỏi</strong> trong Ngân hàng câu hỏi.
          </div>
        </div>
      )}

      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_20px_rgba(6,182,212,0.06)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Lớp nhận bài tập</label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0a1122]">
                    {c.name} ({c.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Đối tượng giao</label>
              <select
                value={target}
                onChange={e => setTarget(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
              >
                <option value="ALL" className="bg-[#0a1122]">Toàn bộ lớp</option>
                <option value="GROUP" className="bg-[#0a1122]">Theo nhóm / Tổ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Tiêu đề bài tập <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Bài tập chuyên đề 3: Bất phương trình bậc hai..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">Nội dung chi tiết bài tập & Câu hỏi</label>
            <textarea
              rows={6}
              placeholder="Mô tả các câu hỏi, hướng dẫn nộp bài, định dạng file..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#060a14] border border-cyan-500/30 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 leading-relaxed font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Hạn nộp bài</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white font-mono focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Thang điểm tối đa</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxScore}
                onChange={e => setMaxScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white font-mono focus:outline-hidden focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#0c162b] border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Giao bài tập ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
