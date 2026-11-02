import React, { useState } from 'react';
import {
  FileQuestion,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Quiz } from '../../types';
import { QuestionBankPage } from './QuestionBankPage';

export const QuizzesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // For TEACHER and ADMIN, show the full NGÂN HÀNG CÂU HỎI subsystem
  if (currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN') {
    return <QuestionBankPage />;
  }

  // Student quiz view
  const quizzes = dbService.getQuizzes();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bài kiểm tra & Quiz Trực tuyến"
        description="Làm bài kiểm tra 15 phút, 1 tiết theo thời gian thực có chấm điểm tự động."
        breadcrumbs={[{ label: 'Trang chủ', href: '/student/dashboard' }, { label: 'Kiểm tra' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                  {quiz.className} · {quiz.subject}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {quiz.durationMinutes} phút
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-white">{quiz.title}</h3>
              <p className="mt-1.5 text-xs text-slate-400">
                Gồm {quiz.questions.length} câu hỏi trắc nghiệm · Đảo câu: <strong className="text-cyan-300">{quiz.shuffleQuestions ? 'Bật' : 'Tắt'}</strong>
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-cyan-500/20 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Đang mở làm bài
              </span>
              <button
                onClick={() => setSelectedQuiz(quiz)}
                className="px-3.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl transition-all cursor-pointer"
              >
                Vào làm bài thi &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Detail Preview Modal */}
      {selectedQuiz && (
        <Modal
          isOpen={Boolean(selectedQuiz)}
          onClose={() => setSelectedQuiz(null)}
          title={`Đề thi: ${selectedQuiz.title}`}
          maxWidth="xl"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3.5 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-center justify-between">
              <span>Thời gian: <strong className="text-white font-bold">{selectedQuiz.durationMinutes} phút</strong></span>
              <span>Tổng số câu: <strong className="text-white font-bold">{selectedQuiz.questions.length} câu</strong></span>
              <span>Môn: <strong className="text-cyan-300 font-bold">{selectedQuiz.subject}</strong></span>
            </div>

            <div className="space-y-4">
              {selectedQuiz.questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">Câu {idx + 1}: ({q.points} điểm)</span>
                    <span className="text-[10px] font-semibold text-cyan-200 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm leading-relaxed">{q.prompt}</p>

                  {q.options && (
                    <div className="space-y-1.5 pt-1">
                      {q.options.map(opt => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                            opt.isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-[#0a1122] border-cyan-500/20 text-slate-200'
                          }`}
                        >
                          <span>{opt.text}</span>
                          {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.explanation && (
                    <p className="mt-2 text-[11px] text-slate-400 italic bg-[#0a1122] p-2.5 rounded-xl border border-cyan-500/20">
                      Giải thích: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-cyan-500/20 flex justify-end">
              <button
                onClick={() => {
                  showToast('Đã nộp bài kiểm tra thành công! Điểm số: 10/10.', 'success');
                  setSelectedQuiz(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Nộp bài kiểm tra
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
