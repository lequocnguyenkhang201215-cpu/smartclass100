import React, { useState } from 'react';
import {
  BarChart2,
  Save,
  Download,
  Upload,
  Search,
  Filter
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { GradeItem } from '../../types';

export const GradesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const classes = dbService.getClasses(currentUser.id);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'cls-10a1');
  const [semester, setSemester] = useState<'HK1' | 'HK2'>('HK1');
  const [search, setSearch] = useState('');

  const [grades, setGrades] = useState<GradeItem[]>(() => {
    return dbService.getGrades(selectedClassId, semester);
  });

  const handleClassChange = (newId: string) => {
    setSelectedClassId(newId);
    setGrades(dbService.getGrades(newId, semester));
  };

  const handleSaveAll = () => {
    dbService.updateGrades(grades);
    dbService.logAudit({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'TEACHER',
      action: 'UPDATE_GRADE',
      entityType: 'GRADEBOOK',
      entityId: selectedClassId,
      description: `Cập nhật sổ điểm môn học lớp ${classes.find(c => c.id === selectedClassId)?.name} ${semester}`,
    });
    showToast('Lưu toàn bộ sổ điểm thành công!', 'success');
  };

  const filtered = grades.filter(g =>
    g.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Điểm & Sổ điểm Điện tử"
        description="Nhập điểm thường xuyên, giữa kỳ, cuối kỳ với tính toán điểm trung bình tự động theo quy chế."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Bảng điểm' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('Đang xuất sổ điểm file Excel...', 'info')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/40 text-cyan-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Xuất Excel
            </button>
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu sổ điểm
            </button>
          </div>
        }
      />

      {/* Control Bar */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider">Lớp học</label>
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              className="mt-1 text-xs font-semibold border border-cyan-500/30 rounded-xl px-3 py-1.5 bg-[#0c162b] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0a1122]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider">Học kỳ</label>
            <select
              value={semester}
              onChange={e => {
                const s = e.target.value as 'HK1' | 'HK2';
                setSemester(s);
                setGrades(dbService.getGrades(selectedClassId, s));
              }}
              className="mt-1 text-xs font-semibold border border-cyan-500/30 rounded-xl px-3 py-1.5 bg-[#0c162b] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              <option value="HK1" className="bg-[#0a1122]">Học kỳ 1</option>
              <option value="HK2" className="bg-[#0a1122]">Học kỳ 2</option>
            </select>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">STT</th>
                <th className="px-4 py-3.5">Họ và Tên Học Sinh</th>
                <th className="px-3 py-3.5 text-center">TX 1 (Miệng)</th>
                <th className="px-3 py-3.5 text-center">TX 2 (15p)</th>
                <th className="px-3 py-3.5 text-center">Giữa Kỳ (x2)</th>
                <th className="px-3 py-3.5 text-center">Cuối Kỳ (x3)</th>
                <th className="px-4 py-3.5 text-center">Điểm TB Môn</th>
                <th className="px-4 py-3.5">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/15 text-slate-200 font-mono">
              {filtered.map((g, idx) => (
                <tr key={g.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="px-4 py-3 text-cyan-400/70 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-sans font-bold text-white">{g.studentName}</td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={g.oralScores[0] ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const copy = [...grades];
                        copy[idx].oralScores[0] = val;
                        setGrades(copy);
                      }}
                      className="w-16 text-center border border-cyan-500/30 rounded-lg py-1 px-1 bg-[#0c162b] text-cyan-200 font-bold focus:border-cyan-400 focus:outline-hidden"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={g.quizScores[0] ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const copy = [...grades];
                        copy[idx].quizScores[0] = val;
                        setGrades(copy);
                      }}
                      className="w-16 text-center border border-cyan-500/30 rounded-lg py-1 px-1 bg-[#0c162b] text-cyan-200 font-bold focus:border-cyan-400 focus:outline-hidden"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={g.midtermScore ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const copy = [...grades];
                        copy[idx].midtermScore = val;
                        setGrades(copy);
                      }}
                      className="w-16 text-center border border-indigo-500/40 rounded-lg py-1 px-1 bg-[#0c162b] font-bold text-indigo-300 focus:border-indigo-400 focus:outline-hidden"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={g.finalScore ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const copy = [...grades];
                        copy[idx].finalScore = val;
                        setGrades(copy);
                      }}
                      className="w-16 text-center border border-purple-500/40 rounded-lg py-1 px-1 bg-[#0c162b] font-bold text-purple-300 focus:border-purple-400 focus:outline-hidden"
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-extrabold text-cyan-300 text-sm tabular-nums">
                    {g.averageScore ?? 8.0}
                  </td>
                  <td className="px-4 py-2.5 font-sans">
                    <input
                      type="text"
                      placeholder="Nhận xét..."
                      value={g.note || ''}
                      onChange={e => {
                        const copy = [...grades];
                        copy[idx].note = e.target.value;
                        setGrades(copy);
                      }}
                      className="w-full text-xs px-2.5 py-1 bg-[#0c162b] border border-cyan-500/30 rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-hidden"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
