import React, { useState } from 'react';
import {
  Award,
  Plus,
  ThumbsUp,
  AlertCircle,
  Calendar,
  Search
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { BehaviorRecord } from '../../types';

export const BehaviorPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const classes = dbService.getClasses(currentUser.id);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'cls-10a1');
  const students = dbService.getStudents(selectedClassId);

  const [behaviors, setBehaviors] = useState<BehaviorRecord[]>(() =>
    dbService.getBehaviors(selectedClassId)
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || '');
  const [type, setType] = useState<'POSITIVE' | 'NEEDS_IMPROVEMENT'>('POSITIVE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsDelta, setPointsDelta] = useState(5);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find(s => s.id === targetStudentId);
    if (!stu || !title.trim()) return;

    dbService.addBehavior({
      studentId: stu.id,
      studentName: stu.fullName,
      classId: selectedClassId,
      teacherId: currentUser.id,
      teacherName: currentUser.fullName,
      type,
      title,
      description,
      pointsDelta: type === 'POSITIVE' ? Math.abs(pointsDelta) : -Math.abs(pointsDelta),
      date: new Date().toISOString().split('T')[0],
    });

    setBehaviors(dbService.getBehaviors(selectedClassId));
    setAddModalOpen(false);
    setTitle('');
    setDescription('');
    showToast(`Đã ghi nhận điểm hành vi cho học sinh ${stu.fullName}!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hành vi & Thi đua Lớp học"
        description="Biểu dương sự tiến bộ, cộng điểm thi đua và nhắc nhở nề nếp kỷ luật."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Thi đua' }]}
        actions={
          <button
            onClick={() => {
              setTargetStudentId(students[0]?.id || '');
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Ghi nhận hành vi mới
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">Chọn lớp:</label>
          <select
            value={selectedClassId}
            onChange={e => {
              setSelectedClassId(e.target.value);
              setBehaviors(dbService.getBehaviors(e.target.value));
            }}
            className="text-xs font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Dòng sự kiện hành vi & thành tích ({behaviors.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100 p-2">
          {behaviors.map(b => (
            <div key={b.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 rounded-lg">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    b.type === 'POSITIVE'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {b.type === 'POSITIVE' ? (
                    <ThumbsUp className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{b.studentName}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.2 rounded font-mono ${
                        b.type === 'POSITIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {b.pointsDelta > 0 ? `+${b.pointsDelta}` : b.pointsDelta} điểm
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1">{b.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{b.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Giáo viên: {b.teacherName}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono shrink-0">{b.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add record */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Ghi nhận nề nếp / thành tích học sinh"
        maxWidth="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chọn học sinh</label>
            <select
              value={targetStudentId}
              onChange={e => setTargetStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="POSITIVE">Biểu dương (+ Điểm)</option>
                <option value="NEEDS_IMPROVEMENT">Nhắc nhở (- Điểm)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điểm cộng/trừ</label>
              <input
                type="number"
                value={pointsDelta}
                onChange={e => setPointsDelta(Number(e.target.value))}
                min={1}
                max={50}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề ghi nhận *</label>
            <input
              type="text"
              placeholder="VD: Tích cực phát biểu xây dựng bài, Quên vở bài tập..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chi tiết nhận xét</label>
            <textarea
              rows={3}
              placeholder="Ghi chú chi tiết cho học sinh và phụ huynh..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Lưu ghi nhận
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
