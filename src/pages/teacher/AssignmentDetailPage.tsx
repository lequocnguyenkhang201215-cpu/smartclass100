import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Save,
  FileText
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { AssignmentSubmission } from '../../types';

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const assignment = dbService.getAssignmentById(id || '') || dbService.getAssignments()[0];
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() =>
    dbService.getSubmissions(assignment.id)
  );

  const [activeGradingSub, setActiveGradingSub] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(9);
  const [gradeFeedback, setGradeFeedback] = useState('');

  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setActiveGradingSub(sub);
    setGradeScore(sub.score ?? 8.5);
    setGradeFeedback(sub.feedback ?? '');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGradingSub) return;

    dbService.gradeSubmission(activeGradingSub.id, gradeScore, gradeFeedback, currentUser.id);
    setSubmissions(dbService.getSubmissions(assignment.id));
    // update parent assignment graded count
    dbService.updateAssignment(assignment.id, {
      gradedCount: (assignment.gradedCount || 0) + 1,
    });

    showToast(`Đã chấm điểm cho học sinh ${activeGradingSub.studentName}!`, 'success');
    setActiveGradingSub(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description={`Lớp: ${assignment.className} · Hạn chót: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')} · Thang điểm ${assignment.maxScore}`}
        breadcrumbs={[
          { label: 'Trang chủ', href: '/teacher/dashboard' },
          { label: 'Bài tập', href: '/teacher/assignments' },
          { label: 'Chi tiết & Chấm bài' },
        ]}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Đề bài</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{assignment.description}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Danh sách bài nộp ({submissions.length})
          </h3>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Học Sinh</th>
              <th className="px-4 py-3">Thời Gian Nộp</th>
              <th className="px-4 py-3">Trạng Thái</th>
              <th className="px-4 py-3">Điểm Số</th>
              <th className="px-4 py-3">Nhận Xét Của Giáo Viên</th>
              <th className="px-4 py-3 text-right">Chấm Bài</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-900">{sub.studentName}</td>
                <td className="px-4 py-3 font-mono text-slate-500">
                  {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                      sub.status === 'GRADED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {sub.status === 'GRADED' ? 'Đã chấm' : 'Đã nộp'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-slate-900 tabular-nums">
                  {sub.score !== undefined ? `${sub.score} / ${assignment.maxScore}` : 'Chưa chấm'}
                </td>
                <td className="px-4 py-3 text-slate-600 italic">{sub.feedback || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleOpenGradeModal(sub)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs transition-colors"
                  >
                    {sub.status === 'GRADED' ? 'Sửa điểm' : 'Chấm điểm'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grade modal */}
      {activeGradingSub && (
        <Modal
          isOpen={Boolean(activeGradingSub)}
          onClose={() => setActiveGradingSub(null)}
          title={`Chấm bài: ${activeGradingSub.studentName}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Nội dung học sinh nộp:</span>
              <p className="mt-1 text-slate-600 italic">{activeGradingSub.content || 'Nộp file đính kèm bài làm.'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Điểm số (Thang 10) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max={assignment.maxScore}
                value={gradeScore}
                onChange={e => setGradeScore(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Lời nhận xét / Góp ý</label>
              <textarea
                rows={3}
                placeholder="VD: Bài làm trình bày tốt, cần chú ý bước kết luận..."
                value={gradeFeedback}
                onChange={e => setGradeFeedback(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveGradingSub(null)}
                className="px-4 py-2 text-xs text-slate-600 border border-slate-300 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Lưu điểm số
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
