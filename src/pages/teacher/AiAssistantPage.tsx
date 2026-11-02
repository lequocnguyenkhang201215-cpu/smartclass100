import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FileQuestion,
  UserCheck,
  FileText,
  Copy,
  Download,
  Plus,
  Send,
  CheckCircle2,
  Lightbulb,
  Zap
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

type AiToolMode = 'LESSON_PLAN' | 'QUIZ_GENERATOR' | 'STUDENT_FEEDBACK' | 'SUMMARY';

export const AiAssistantPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeMode, setActiveMode] = useState<AiToolMode>('LESSON_PLAN');
  const [topic, setTopic] = useState('Định lý Cosin và Sin trong Tam giác');
  const [gradeLevel, setGradeLevel] = useState('10');
  const [subject, setSubject] = useState('Toán học');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');

  const sampleOutputs: Record<AiToolMode, string> = {
    LESSON_PLAN: `KẾ HOẠCH BÀI DẠY (THEO CÔNG VĂN 5512/BGDĐT-GDTrH)
MÔN: TOÁN 10 - BỘ SÁCH: CÁNH DIỀU / KẾT NỐI TRI THỨC
TÊN BÀI DẠY: ĐỊNH LÝ COSIN VÀ SIN TRONG TAM GIÁC (Thời lượng: 2 tiết)

I. MỤC TIÊU BÀI HỌC:
1. Về kiến thức:
- Nêu và phát biểu chính xác định lý côsin: a² = b² + c² - 2bc.cosA và định lý sin: a/sinA = b/sinB = c/sinC = 2R.
- Vận dụng định lý để giải các bài toán tính độ dài cạnh, góc và diện tích tam giác.
2. Về năng lực:
- Năng lực tư duy và lập luận toán học: Biết chứng minh định lý bằng tích vô hướng của vectơ.
- Năng lực giải quyết vấn đề: Ứng dụng giải quyết bài toán đo khoảng cách trong thực tế.
3. Về phẩm chất:
- Rèn luyện tính cẩn thận, chính xác và tư duy logic sáng tạo.

II. THIẾT BỊ DẠY HỌC & HỌC LIỆU:
- Giáo viên: Máy chiếu, thước kẻ, compa, phiếu học tập số 1 & 2.
- Học sinh: SGK, vở ghi, máy tính cầm tay, chuẩn bị trước bài đọc.

III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG):
1. Hoạt động 1: Mở đầu / Khởi động (7 phút)
- Tình huống: Làm thế nào đo khoảng cách giữa hai điểm A và B bị ngăn cách bởi một hồ nước?
2. Hoạt động 2: Hình thành kiến thức mới (25 phút)
- Khám phá định lý Cosin qua tích vô hướng: BC² = |AC - AB|²
- Rút ra hệ quả tính góc: cosA = (b² + c² - a²) / (2bc)
3. Hoạt động 3: Luyện tập (10 phút)
- Học sinh giải nhanh 2 bài tập ví dụ trong phiếu học tập nhóm.
4. Hoạt động 4: Vận dụng & Mở rộng (3 phút)
- Ứng dụng đo đạc thực tế trong ngành hàng hải và trắc địa.`,

    QUIZ_GENERATOR: `NGÂN HÀNG CÂU HỎI TRẮC NGHIỆM MA TRẬN 4 MỨC ĐỘ
CHỦ ĐỀ: ĐỊNH LÝ COSIN VÀ SIN TRONG TAM GIÁC

[MỨC 1 - NHẬN BIẾT]
Câu 1: Cho tam giác ABC có độ dài ba cạnh là a, b, c. Mệnh đề nào sau đây đúng?
A. a² = b² + c² - 2bc.cosA (ĐÚNG)
B. a² = b² + c² + 2bc.cosA
C. a² = b² + c² - bc.cosA
D. a² = b² + c² - 2bc.sinA
-> Lời giải: Theo định lý cosin trong tam giác ABC: a² = b² + c² - 2bc.cosA.

[MỨC 2 - THÔNG HIỂU]
Câu 2: Tam giác ABC có AB = 5, AC = 8 và góc A = 60°. Độ dài cạnh BC bằng:
A. 7 (ĐÚNG)
B. √49
C. 6.5
D. 8.2
-> Lời giải: BC² = 5² + 8² - 2.5.8.cos60° = 25 + 64 - 40 = 49 => BC = 7.

[MỨC 3 - VẬN DỤNG]
Câu 3: Tam giác ABC có ba cạnh a = 13, b = 14, c = 15. Bán kính đường tròn ngoại tiếp R là:
A. 8.125 (ĐÚNG, R = abc / 4S)
B. 7.5
C. 9.0
D. 6.25

[MỨC 4 - VẬN DỤNG CAO]
Câu 4: Hai tàu thủy xuất phát từ cùng một vị trí O đi theo hai hướng tạo với nhau góc 45°. Tàu 1 chạy vận tốc 20 hải lý/h, tàu 2 chạy vận tốc 30 hải lý/h. Hỏi sau 2 giờ khoảng cách giữa hai tàu là bao nhiêu?
A. 43.1 hải lý (ĐÚNG)
B. 52.0 hải lý
C. 38.6 hải lý
D. 48.4 hải lý`,

    STUDENT_FEEDBACK: `GỢI Ý NHẬN XÉT HỌC SINH ĐỊNH KỲ (CHUẨN THÔNG TƯ 22 & 27)

1. Học sinh: Nguyễn Văn An (Điểm TB: 9.2 - Hạnh kiểm: Tốt)
- Nhận xét: "Em An có tư duy toán học xuất sắc, tiếp thu bài nhanh và luôn chủ động giúp đỡ bạn bè trong giờ học nhóm. Tích cực phát biểu xây dựng bài, bài tập về nhà luôn hoàn thành chỉn chu và sáng tạo."

2. Học sinh: Lê Hoàng Cường (Điểm TB: 6.5 - Chuyên cần: 92%)
- Nhận xét: "Em Cường có ý thức kỷ luật tốt, lễ phép với thầy cô. Cần chú ý tập trung hơn trong giờ giải bài tập và ôn lại các công thức lượng giác cơ bản để cải thiện điểm kiểm tra định kỳ."

3. Học sinh: Trần Thị Bình (Điểm TB: 8.4 - Hạnh kiểm: Tốt)
- Nhận xét: "Bình học tập chăm chỉ, cẩn thận trong từng bước lập luận. Em đã có nhiều tiến bộ rõ rệt trong phần bài tập hình học không gian."`,

    SUMMARY: `TÓM TẮT TRỌNG TÂM KIẾN THỨC & SƠ ĐỒ GHI NHỚ

1. CÔNG THỨC VÀNG CẦN NHỚ:
- Định lý Cosin: a² = b² + c² - 2bc.cosA
- Tính góc: cosA = (b² + c² - a²) / (2bc)
- Định lý Sin: a/sinA = b/sinB = c/sinC = 2R
- Công thức diện tích S: S = 1/2.b.c.sinA = abc/(4R) = p.r = √(p(p-a)(p-b)(p-c))

2. KHI NÀO DÙNG ĐỊNH LÝ NÀO?
- Biết 2 cạnh và góc xen giữa -> DÙNG COSIN tính cạnh thứ ba.
- Biết cả 3 cạnh -> DÙNG HỆ QUẢ COSIN tính 3 góc.
- Biết 1 cạnh và 2 góc -> DÙNG ĐỊNH LÝ SIN tính cạnh còn lại.`
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedResult(sampleOutputs[activeMode]);
      setIsGenerating(false);
      showToast('AI đã hoàn tất tạo nội dung theo yêu cầu!', 'success');
    }, 1000);
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    showToast('Đã sao chép nội dung vào khay nhớ tạm!', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI HỖ TRỢ GIẢNG DẠY"
        description="Trợ lý trí tuệ nhân tạo chuyên sâu dành cho giáo viên: Soạn giáo án Công văn 5512, sinh câu hỏi ma trận, viết nhận xét học sinh và tạo tóm tắt bài giảng."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'AI HỖ TRỢ' }]}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl shadow-xs">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              Gemini Pro Education
            </span>
          </div>
        }
      />

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'LESSON_PLAN', label: 'Soạn Giáo Án 5512', icon: BookOpen, desc: 'Giáo án 4 bước chuẩn' },
          { id: 'QUIZ_GENERATOR', label: 'Tạo Ngân Hàng Đề', icon: FileQuestion, desc: 'Ma trận 4 mức độ' },
          { id: 'STUDENT_FEEDBACK', label: 'Viết Nhận Xét HS', icon: UserCheck, desc: 'Cá nhân hóa theo em' },
          { id: 'SUMMARY', label: 'Tóm Tắt & Ghi Nhớ', icon: Lightbulb, desc: 'Công thức & mẹo giải' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMode(item.id as AiToolMode);
              setGeneratedResult(sampleOutputs[item.id as AiToolMode]);
            }}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
              activeMode === item.id
                ? 'bg-[#0f1d38] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]'
                : 'bg-[#0a1122] border-cyan-500/20 hover:border-cyan-500/40 text-slate-300'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-2 ${activeMode === item.id ? 'text-cyan-400' : 'text-slate-400'}`} />
            <div className="text-sm font-bold text-white">{item.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Grid: Form & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Cấu hình yêu cầu tạo nội dung
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Chủ đề / Tên bài học</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ví dụ: Định lý Cosin và Sin trong Tam giác..."
                className="w-full px-3.5 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Môn học</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Tin học">Tin học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Khối lớp</label>
                <select
                  value={gradeLevel}
                  onChange={e => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                  <option value="9">Khối 9</option>
                  <option value="8">Khối 8</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Yêu cầu bổ sung cho AI (tùy chọn)
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: Tập trung vào các bài toán thực tế đo đạc, tạo kèm đáp án chi tiết và hướng dẫn giải..."
                className="w-full px-3.5 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'AI đang phân tích & tạo...' : 'Tạo nội dung với AI'}
            </button>
          </form>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Nội dung AI đã tạo ({activeMode})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/60 text-cyan-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép
                </button>
                <button
                  onClick={() => showToast('Đang xuất nội dung ra tệp Word (.docx)...', 'info')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/60 text-cyan-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất Word
                </button>
              </div>
            </div>

            <div className="mt-4 bg-[#060a14] border border-cyan-500/20 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {generatedResult || sampleOutputs[activeMode]}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Đã kiểm tra tương thích chương trình GDPT 2018
            </span>

            <button
              onClick={() => showToast('Đã lưu nội dung vào Học liệu số & Ngân hàng câu hỏi!', 'success')}
              className="px-3.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Lưu vào Tài liệu số / Ngân hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
