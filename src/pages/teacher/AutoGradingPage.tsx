import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ScanLine,
  Upload,
  Camera,
  FileCheck,
  BarChart3,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Check,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

interface GradedPaper {
  id: string;
  studentCode: string;
  studentName: string;
  className: string;
  testTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  gradedAt: string;
  confidence: number;
  status: 'SUCCESS' | 'REVIEW_NEEDED';
  wrongAnswers: number[];
}

export const AutoGradingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const classes = dbService.getClasses();
  const quizzes = dbService.getQuizzes();
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedQuiz, setSelectedQuiz] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [detailModalItem, setDetailModalItem] = useState<GradedPaper | null>(null);

  // Mock list of graded papers
  const [gradedPapers, setGradedPapers] = useState<GradedPaper[]>([
    {
      id: 'gp-01',
      studentCode: 'HS-1001',
      studentName: 'Nguyễn Văn An',
      className: '10A1',
      testTitle: 'Kiểm tra 15p Giải tích - Mệnh đề',
      score: 9.5,
      correctCount: 19,
      totalQuestions: 20,
      gradedAt: '10 phút trước',
      confidence: 99.2,
      status: 'SUCCESS',
      wrongAnswers: [14],
    },
    {
      id: 'gp-02',
      studentCode: 'HS-1002',
      studentName: 'Trần Thị Bình',
      className: '10A1',
      testTitle: 'Kiểm tra 15p Giải tích - Mệnh đề',
      score: 8.0,
      correctCount: 16,
      totalQuestions: 20,
      gradedAt: '12 phút trước',
      confidence: 98.5,
      status: 'SUCCESS',
      wrongAnswers: [4, 9, 14, 18],
    },
    {
      id: 'gp-03',
      studentCode: 'HS-1003',
      studentName: 'Lê Hoàng Cường',
      className: '10A1',
      testTitle: 'Kiểm tra 15p Giải tích - Mệnh đề',
      score: 6.5,
      correctCount: 13,
      totalQuestions: 20,
      gradedAt: '15 phút trước',
      confidence: 92.0,
      status: 'REVIEW_NEEDED',
      wrongAnswers: [2, 5, 8, 11, 14, 17, 20],
    },
    {
      id: 'gp-04',
      studentCode: 'HS-1004',
      studentName: 'Phạm Thị Dung',
      className: '10A2',
      testTitle: 'Đại số 10 - Ôn tập học kỳ 1',
      score: 10.0,
      correctCount: 20,
      totalQuestions: 20,
      gradedAt: '1 giờ trước',
      confidence: 99.8,
      status: 'SUCCESS',
      wrongAnswers: [],
    },
    {
      id: 'gp-05',
      studentCode: 'HS-1005',
      studentName: 'Vũ Đức Em',
      className: '10A2',
      testTitle: 'Đại số 10 - Ôn tập học kỳ 1',
      score: 7.5,
      correctCount: 15,
      totalQuestions: 20,
      gradedAt: '2 giờ trước',
      confidence: 97.4,
      status: 'SUCCESS',
      wrongAnswers: [3, 7, 12, 16, 19],
    },
  ]);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanModalOpen(false);
      showToast('Đã quét và chấm tự động thành công 24 phiếu thi trắc nghiệm!', 'success');
    }, 1500);
  };

  const filtered = gradedPapers.filter(p => {
    const matchClass = selectedClass === 'ALL' || p.className === selectedClass;
    const matchSearch =
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      p.testTitle.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  const avgScore = (
    gradedPapers.reduce((sum, p) => sum + p.score, 0) / (gradedPapers.length || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chấm bài tự động"
        description="Hệ thống chấm trắc nghiệm tự động OMR qua camera quét bài, chấm đề thi trực tuyến và phân tích phổ điểm thông minh."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Chấm bài tự động' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScanModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
            >
              <ScanLine className="w-4 h-4" />
              Quét phiếu trắc nghiệm (OMR)
            </button>
            <button
              onClick={() => showToast('Mở tải lên tệp bài làm quét từ máy scan (PDF/Zip)...', 'info')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/50 text-cyan-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              Tải tệp bài quét
            </button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0a1122] border border-emerald-500/35 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">ĐÃ CHẤM TỰ ĐỘNG</div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{gradedPapers.length} bài</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400/70" />
        </div>

        <div className="bg-[#0a1122] border border-cyan-500/35 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">ĐIỂM TRUNG BÌNH</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">{avgScore}/10</div>
          </div>
          <BarChart3 className="w-6 h-6 text-cyan-400/70" />
        </div>

        <div className="bg-[#0a1122] border border-amber-500/35 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">CẦN XEM LẠI</div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
              {gradedPapers.filter(p => p.status === 'REVIEW_NEEDED').length} bài
            </div>
          </div>
          <AlertCircle className="w-6 h-6 text-amber-400/70" />
        </div>

        <div className="bg-[#0a1122] border border-purple-500/35 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">ĐỘ CHÍNH XÁC AI</div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-0.5">99.4%</div>
          </div>
          <Sparkles className="w-6 h-6 text-purple-400/70" />
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/60" />
            <input
              type="text"
              placeholder="Tìm theo học sinh, mã HS, đề thi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-cyan-100 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
            />
          </div>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="text-xs border border-cyan-500/30 rounded-xl px-3 py-2 bg-[#0c162b] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classes.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Hiển thị <strong className="text-cyan-300 font-bold font-mono">{filtered.length}</strong> bài nộp
        </div>
      </div>

      {/* Graded Papers Table */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-14">STT</th>
                <th className="px-4 py-3.5">Học Sinh</th>
                <th className="px-4 py-3.5">Lớp</th>
                <th className="px-4 py-3.5">Đề Kiểm Tra</th>
                <th className="px-4 py-3.5">Số Câu Đúng</th>
                <th className="px-4 py-3.5">Điểm Tự Động</th>
                <th className="px-4 py-3.5">Độ Tin Cậy AI</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/15 text-slate-200">
              {filtered.map((p, idx) => (
                <tr key={p.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-bold text-white">
                    {p.studentName}
                    <div className="text-[11px] font-mono text-cyan-400/80 font-normal">{p.studentCode}</div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-300">{p.className}</td>
                  <td className="px-4 py-3.5 text-slate-200 font-medium">{p.testTitle}</td>
                  <td className="px-4 py-3.5 font-mono text-cyan-300 font-bold">
                    {p.correctCount}/{p.totalQuestions}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-sm font-bold">
                    <span className={p.score >= 8 ? 'text-emerald-400' : p.score >= 5 ? 'text-amber-400' : 'text-rose-400'}>
                      {p.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                    {p.confidence}%
                  </td>
                  <td className="px-4 py-3.5">
                    {p.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        <Check className="w-3 h-3" /> Hoàn tất
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" /> Cần phúc khảo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setDetailModalItem(p)}
                      className="px-2.5 py-1 text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      Xem phiếu chấm
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Quét phiếu chấm OMR */}
      {scanModalOpen && (
        <Modal
          isOpen={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          title="Quét Phiếu Trắc Nghiệm Tự Động (OMR)"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed border-cyan-500/40 rounded-2xl bg-[#060a14] text-center flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-cyan-400 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-white mb-1">Đặt phiếu trắc nghiệm trước Camera hoặc tải ảnh</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Hệ thống tự động canh 4 góc định vị, nhận diện mã đề, số báo danh và các đáp án tô chì.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSimulateScan}
                  disabled={isScanning}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  {isScanning ? 'Đang nhận diện & chấm...' : 'Bắt đầu quét chấm ngay'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#0c162b] border border-cyan-500/20 rounded-xl text-xs text-slate-300 space-y-1">
              <div className="font-bold text-cyan-300">Chuẩn hỗ trợ:</div>
              <div>• Phiếu 20 câu, 40 câu, 50 câu, 100 câu tiêu chuẩn Bộ GD&ĐT</div>
              <div>• Tự động đảo đề và so khớp ma trận đáp án từ Ngân hàng đề thi</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailModalItem && (
        <Modal
          isOpen={Boolean(detailModalItem)}
          onClose={() => setDetailModalItem(null)}
          title={`Phiếu chấm chi tiết - ${detailModalItem.studentName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-[#0c162b] border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="text-white font-bold text-sm">{detailModalItem.studentName}</div>
                <div className="text-slate-400 font-mono mt-0.5">Mã HS: {detailModalItem.studentCode} · Lớp {detailModalItem.className}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-emerald-400">{detailModalItem.score.toFixed(1)} <span className="text-xs text-slate-400">/ 10</span></div>
                <div className="text-xs text-cyan-300">Đúng {detailModalItem.correctCount}/{detailModalItem.totalQuestions} câu</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-cyan-300 mb-2 uppercase">Các câu làm sai cần lưu ý:</h4>
              {detailModalItem.wrongAnswers.length === 0 ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                  Tuyệt vời! Học sinh trả lời đúng tất cả 20/20 câu hỏi.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detailModalItem.wrongAnswers.map(qNum => (
                    <span key={qNum} className="px-3 py-1 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-lg font-mono">
                      Câu {qNum} (Sai)
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-cyan-500/20 flex justify-end gap-2">
              <button
                onClick={() => {
                  showToast('Đã lưu kết quả phúc khảo điểm thành công!', 'success');
                  setDetailModalItem(null);
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Xác nhận & Cập nhật vào sổ điểm
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
