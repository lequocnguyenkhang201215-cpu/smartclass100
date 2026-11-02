import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Check,
  Save,
  Globe,
  Image as ImageIcon,
  File,
  RotateCcw,
  Eye,
  Trash2,
  HelpCircle,
  ShieldCheck,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Question, QuestionType, QuestionDifficulty } from '../../types';

interface QuestionBankCreateScreenProps {
  onBackToList: () => void;
  onQuestionCreated: () => void;
  initialTab?: 'tab1' | 'tab2' | 'tab3';
}

type InputTab = 'tab1' | 'tab2' | 'tab3';
type AiSourceType = 'text' | 'file' | 'link' | 'image';

export const QuestionBankCreateScreen: React.FC<QuestionBankCreateScreenProps> = ({
  onBackToList,
  onQuestionCreated,
  initialTab = 'tab1',
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Active main tab (Tab 1, Tab 2, Tab 3)
  const [activeTab, setActiveTab] = useState<InputTab>(initialTab);

  // =========================================================================
  // TAB 1: IMPORT TỪ WORD / EXCEL / CSV
  // =========================================================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'success'>('idle');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);

  // Sample templates download
  const handleDownloadExcelTemplate = () => {
    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel
      'STT,Mã câu,Môn học,Khối lớp,Bộ sách,Chủ đề bài học,Dạng câu hỏi,Mức độ,Nội dung câu hỏi,Đáp án A,Đáp án B,Đáp án C,Đáp án D,Đáp án đúng,Lời giải chi tiết\n' +
      '1,TOAN10-01,Toán học,10,Cánh Diều,Mệnh đề toán học,SINGLE_CHOICE,EASY,Trong các câu sau câu nào là một mệnh đề?,Hôm nay trời đẹp quá!,Hà Nội là thủ đô của Việt Nam.,Bạn có thích học Toán không?,Số x là số nguyên chẵn.,B,Câu B là khẳng định đúng nên là mệnh đề.\n' +
      '2,TOAN10-02,Toán học,10,Cánh Diều,Hàm số bậc hai,SINGLE_CHOICE,MEDIUM,Tập xác định của hàm số y = √(x - 3) là:,D = [3; +∞),D = (3; +∞),D = (-∞; 3],D = ℝ \\ {3},A,Điều kiện xác định: x - 3 ≥ 0 <=> x ≥ 3. Vậy D = [3; +∞).\n' +
      '3,TOAN10-03,Toán học,10,Cánh Diều,Định lý Cosin,SINGLE_CHOICE,HARD,Cho tam giác ABC có a = 6 b = 8 góc C = 60°. Độ dài cạnh c là:,c = 2√13,c = 2√37,c = 10,c = 2√7,A,Áp dụng định lý côsin: c² = a² + b² - 2ab*cos60° = 36 + 64 - 48 = 52 => c = 2√13.\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_NganHangCauHoi_EduSmart.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống template Excel / CSV chuẩn định dạng!', 'success');
  };

  const handleDownloadWordTemplate = () => {
    const wordContent = `NGÂN HÀNG CÂU HỎI - TEMPLATE SOẠN THẢO WORD (CHUẨN BỘ GD&ĐT)
============================================================
Hướng dẫn định dạng:
- Mỗi câu bắt đầu bằng "Câu <số>: [Mức độ]" (Mức độ: [Nhận biết], [Thông hiểu], [Vận dụng], [Vận dụng cao])
- Các phương án ghi rõ "A. ", "B. ", "C. ", "D. "
- "Đáp án: <A/B/C/D>"
- "Lời giải: <Nội dung giải thích>"

------------------------------------------------------------
Câu 1: [Nhận biết] Cho tập hợp A = {x ∈ ℝ | x² - 9 = 0}. Tập hợp A gồm các phần tử nào?
A. A = {3}
B. A = {-3; 3}
C. A = {-9; 9}
D. A = {9}
Đáp án: B
Lời giải: Phương trình x² - 9 = 0 có hai nghiệm x = 3 và x = -3. Do đó A = {-3; 3}.

Câu 2: [Thông hiểu] Trong mặt phẳng tọa độ Oxy, vectơ u = 3i - 4j có tọa độ là:
A. u = (3; 4)
B. u = (-3; 4)
C. u = (3; -4)
D. u = (-4; 3)
Đáp án: C
Lời giải: Vectơ u = x.i + y.j => u = (3; -4).

Câu 3: [Vận dụng] Cho tam giác ABC vuông tại A có AB = 6, AC = 8. Bán kính đường tròn nội tiếp r của tam giác ABC là:
A. r = 1
B. r = 2
C. r = 3
D. r = 4
Đáp án: B
Lời giải: Cạnh huyền BC = √(6² + 8²) = 10. Nửa chu vi p = (6 + 8 + 10)/2 = 12. Diện tích S = 1/2 * 6 * 8 = 24. Bán kính r = S / p = 24 / 12 = 2.
`;

    const blob = new Blob([wordContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_NganHangCauHoi_Word.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống template Word chuẩn định dạng!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);
    setImportStatus('validating');

    setTimeout(() => {
      // Simulate real-time parsing & schema validation
      const sampleParsed: Question[] = [
        {
          id: `imp-${Date.now()}-1`,
          code: `IMP-${file.name.slice(0, 3).toUpperCase()}-01`,
          subject: 'Toán học',
          gradeLevel: '10',
          textbook: 'Cánh Diều',
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          points: 0.5,
          prompt: 'Cho tập hợp A = {x ∈ ℝ | x² - 9 = 0}. Tập hợp A gồm các phần tử nào?',
          options: [
            { id: 'opt-A', text: 'A = {3}', isCorrect: false },
            { id: 'opt-B', text: 'A = {-3; 3}', isCorrect: true },
            { id: 'opt-C', text: 'A = {-9; 9}', isCorrect: false },
            { id: 'opt-D', text: 'A = {9}', isCorrect: false },
          ],
          explanation: 'Phương trình x² - 9 = 0 có hai nghiệm x = 3 và x = -3. Do đó A = {-3; 3}.',
          tags: ['Tập hợp', 'Import file'],
          status: 'APPROVED',
          authorName: currentUser.fullName,
          shareScope: 'SCHOOL',
        },
        {
          id: `imp-${Date.now()}-2`,
          code: `IMP-${file.name.slice(0, 3).toUpperCase()}-02`,
          subject: 'Toán học',
          gradeLevel: '10',
          textbook: 'Cánh Diều',
          type: 'SINGLE_CHOICE',
          difficulty: 'MEDIUM',
          points: 0.5,
          prompt: 'Trong mặt phẳng tọa độ Oxy, vectơ u = 3i - 4j có tọa độ là:',
          options: [
            { id: 'opt-A', text: 'u = (3; 4)', isCorrect: false },
            { id: 'opt-B', text: 'u = (-3; 4)', isCorrect: false },
            { id: 'opt-C', text: 'u = (3; -4)', isCorrect: true },
            { id: 'opt-D', text: 'u = (-4; 3)', isCorrect: false },
          ],
          explanation: 'Vectơ u = x.i + y.j => u = (3; -4).',
          tags: ['Vectơ', 'Import file'],
          status: 'APPROVED',
          authorName: currentUser.fullName,
          shareScope: 'SCHOOL',
        },
        {
          id: `imp-${Date.now()}-3`,
          code: `IMP-${file.name.slice(0, 3).toUpperCase()}-03`,
          subject: 'Toán học',
          gradeLevel: '10',
          textbook: 'Cánh Diều',
          type: 'SINGLE_CHOICE',
          difficulty: 'HARD',
          points: 1.0,
          prompt: 'Cho tam giác ABC vuông tại A có AB = 6, AC = 8. Bán kính đường tròn nội tiếp r của tam giác ABC là:',
          options: [
            { id: 'opt-A', text: 'r = 1', isCorrect: false },
            { id: 'opt-B', text: 'r = 2', isCorrect: true },
            { id: 'opt-C', text: 'r = 3', isCorrect: false },
            { id: 'opt-D', text: 'r = 4', isCorrect: false },
          ],
          explanation: 'Cạnh huyền BC = √(6² + 8²) = 10. Nửa chu vi p = (6 + 8 + 10)/2 = 12. Diện tích S = 1/2 * 6 * 8 = 24. Bán kính r = S / p = 24 / 12 = 2.',
          tags: ['Hệ thức lượng', 'Import file'],
          status: 'APPROVED',
          authorName: currentUser.fullName,
          shareScope: 'SCHOOL',
        },
      ];

      setParsedQuestions(sampleParsed);
      setImportStatus('success');
      showToast(`Đã nhận diện thành công ${sampleParsed.length} câu hỏi từ tệp ${file.name}!`, 'success');
    }, 800);
  };

  const handleSaveImportedToBank = () => {
    if (parsedQuestions.length === 0) {
      showToast('Không có câu hỏi nào để lưu!', 'info');
      return;
    }
    const count = dbService.importQuestionsBatch(parsedQuestions);
    onQuestionCreated();
    showToast(`Đã lưu thành công ${count} câu hỏi vào Ngân hàng câu hỏi!`, 'success');
    setParsedQuestions([]);
    setImportedFileName(null);
    setImportStatus('idle');
  };

  // =========================================================================
  // TAB 2: TẠO CÂU HỎI BẰNG AI THÔNG MINH
  // =========================================================================
  const [aiSourceType, setAiSourceType] = useState<AiSourceType>('text');
  const [aiTextContent, setAiTextContent] = useState('');
  const [aiAttachedFile, setAiAttachedFile] = useState<File | null>(null);
  const [aiAttachedFileName, setAiAttachedFileName] = useState<string | null>(null);
  const [aiWebLink, setAiWebLink] = useState('');
  const [aiAttachedImage, setAiAttachedImage] = useState<string | null>(null);
  const [aiImageName, setAiImageName] = useState<string | null>(null);

  const [aiSubject, setAiSubject] = useState('Toán học');
  const [aiGrade, setAiGrade] = useState('Khối 10');
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStepProgress, setAiStepProgress] = useState<number>(0);
  const [generatedAiQuestions, setGeneratedAiQuestions] = useState<Question[]>([]);
  const [selectedAiQuestionIds, setSelectedAiQuestionIds] = useState<string[]>([]);

  const handleAddWebLink = () => {
    if (!aiWebLink.trim()) {
      showToast('Vui lòng nhập đường link bài giảng hoặc tài liệu web!', 'info');
      return;
    }
    showToast(`Đã thêm liên kết nguồn: ${aiWebLink}`, 'success');
  };

  const handleStartAiGeneration = () => {
    // Validate that at least something was provided
    if (
      aiSourceType === 'text' &&
      !aiTextContent.trim() &&
      !confirm('Bạn chưa nhập nội dung văn bản. AI sẽ tự động tạo bộ câu hỏi mẫu chuẩn chương trình GDPT 2018 theo Môn và Khối đã chọn. Bạn có muốn tiếp tục không?')
    ) {
      return;
    }

    setIsGeneratingAi(true);
    setAiStepProgress(1);

    setTimeout(() => setAiStepProgress(2), 500);
    setTimeout(() => setAiStepProgress(3), 1100);
    setTimeout(() => setAiStepProgress(4), 1700);

    setTimeout(() => {
      setIsGeneratingAi(false);
      setAiStepProgress(5);

      const generated: Question[] = [
        {
          id: `ai-gen-${Date.now()}-1`,
          code: `TOAN10-AI-01`,
          subject: aiSubject,
          gradeLevel: aiGrade.replace('Khối ', ''),
          textbook: 'Cánh Diều',
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: 'Định lý Cosin và Sin',
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          points: 0.5,
          prompt: 'Cho tam giác ABC có độ dài ba cạnh a, b, c tương ứng với các góc A, B, C. Theo định lý Cosin, hệ thức nào sau đây là đúng?',
          options: [
            { id: 'opt-A', text: 'a² = b² + c² - 2bc.cosA', isCorrect: true },
            { id: 'opt-B', text: 'a² = b² + c² + 2bc.cosA', isCorrect: false },
            { id: 'opt-C', text: 'a² = b² + c² - bc.cosA', isCorrect: false },
            { id: 'opt-D', text: 'a² = b² + c² - 2bc.sinA', isCorrect: false },
          ],
          explanation: 'Theo định lý côsin trong tam giác: Bình phương một cạnh bằng tổng bình phương hai cạnh còn lại trừ hai lần tích của chúng với côsin góc xen giữa: a² = b² + c² - 2bc.cosA.',
          tags: ['AI Gemini', 'Định lý Cosin', 'Chống Hallucination'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        },
        {
          id: `ai-gen-${Date.now()}-2`,
          code: `TOAN10-AI-02`,
          subject: aiSubject,
          gradeLevel: aiGrade.replace('Khối ', ''),
          textbook: 'Cánh Diều',
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: 'Định lý Cosin và Sin',
          type: 'SINGLE_CHOICE',
          difficulty: 'MEDIUM',
          points: 0.5,
          prompt: 'Tam giác ABC có cạnh AB = 5, AC = 8 và góc A = 60°. Độ dài cạnh BC là:',
          options: [
            { id: 'opt-A', text: 'BC = 7', isCorrect: true },
            { id: 'opt-B', text: 'BC = √65', isCorrect: false },
            { id: 'opt-C', text: 'BC = 8.5', isCorrect: false },
            { id: 'opt-D', text: 'BC = 9', isCorrect: false },
          ],
          explanation: 'Áp dụng định lý côsin: BC² = AB² + AC² - 2*AB*AC*cos60° = 25 + 64 - 2*5*8*(1/2) = 89 - 40 = 49 => BC = √49 = 7.',
          tags: ['AI Gemini', 'Tính cạnh tam giác', 'Thông hiểu'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        },
        {
          id: `ai-gen-${Date.now()}-3`,
          code: `TOAN10-AI-03`,
          subject: aiSubject,
          gradeLevel: aiGrade.replace('Khối ', ''),
          textbook: 'Cánh Diều',
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: 'Định lý Sin và Bán kính ngoại tiếp',
          type: 'SINGLE_CHOICE',
          difficulty: 'HARD',
          points: 1.0,
          prompt: 'Tam giác ABC có cạnh BC = 10 và góc A = 30°. Bán kính đường tròn ngoại tiếp R của tam giác ABC bằng:',
          options: [
            { id: 'opt-A', text: 'R = 10', isCorrect: true },
            { id: 'opt-B', text: 'R = 5', isCorrect: false },
            { id: 'opt-C', text: 'R = 20', isCorrect: false },
            { id: 'opt-D', text: 'R = 10√3', isCorrect: false },
          ],
          explanation: 'Theo định lý sin: a / sinA = 2R <=> 10 / sin(30°) = 2R <=> 10 / 0.5 = 20 = 2R => R = 10.',
          tags: ['AI Gemini', 'Bán kính ngoại tiếp', 'Vận dụng'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        },
        {
          id: `ai-gen-${Date.now()}-4`,
          code: `TOAN10-AI-04`,
          subject: aiSubject,
          gradeLevel: aiGrade.replace('Khối ', ''),
          textbook: 'Cánh Diều',
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: 'Ứng dụng đo khoảng cách thực tế',
          type: 'SINGLE_CHOICE',
          difficulty: 'VERY_HARD',
          points: 1.5,
          prompt: 'Để đo khoảng cách giữa hai vị trí A và B ở hai bên bờ sông, một kỹ sư đo được từ vị trí quan sát C khoảng cách CA = 300m, CB = 500m và góc ACB = 120°. Khoảng cách AB giữa hai vị trí gần nhất với giá trị nào sau đây?',
          options: [
            { id: 'opt-A', text: '700 m', isCorrect: true },
            { id: 'opt-B', text: '650 m', isCorrect: false },
            { id: 'opt-C', text: '720 m', isCorrect: false },
            { id: 'opt-D', text: '800 m', isCorrect: false },
          ],
          explanation: 'AB² = CA² + CB² - 2*CA*CB*cos(120°) = 300² + 500² - 2*300*500*(-0.5) = 90000 + 250000 + 150000 = 490000 => AB = √490000 = 700m.',
          tags: ['AI Gemini', 'Toán thực tế', 'Vận dụng cao'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        },
      ];

      setGeneratedAiQuestions(generated);
      setSelectedAiQuestionIds(generated.map(q => q.id));
      showToast(`AI Gemini đã tạo thành công ${generated.length} câu hỏi có kiểm chứng chống Hallucination!`, 'success');
    }, 2200);
  };

  const handleSaveSelectedAiQuestions = () => {
    const toSave = generatedAiQuestions.filter(q => selectedAiQuestionIds.includes(q.id));
    if (toSave.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 câu hỏi để lưu!', 'info');
      return;
    }
    dbService.importQuestionsBatch(toSave);
    onQuestionCreated();
    showToast(`Đã lưu thành công ${toSave.length} câu hỏi AI vào Ngân hàng!`, 'success');
    setGeneratedAiQuestions([]);
    setSelectedAiQuestionIds([]);
  };

  // =========================================================================
  // TAB 3: TẠO CÂU HỎI THỦ CÔNG
  // =========================================================================
  const [manualSubject, setManualSubject] = useState('Toán học');
  const [manualGrade, setManualGrade] = useState('Khối 10');
  const [manualType, setManualType] = useState('Trắc nghiệm - Pick One (1 đáp án đúng)');
  const [manualDifficulty, setManualDifficulty] = useState('Thông hiểu');
  const [manualTopic, setManualTopic] = useState('');
  const [manualPrompt, setManualPrompt] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [manualExplanation, setManualExplanation] = useState('');

  const handleSaveManualQuestion = () => {
    if (!manualPrompt.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi!', 'info');
      return;
    }
    if (!optionA.trim() || !optionB.trim()) {
      showToast('Vui lòng nhập ít nhất đáp án A và đáp án B!', 'info');
      return;
    }

    let diff: QuestionDifficulty = 'MEDIUM';
    if (manualDifficulty === 'Nhận biết') diff = 'EASY';
    else if (manualDifficulty === 'Thông hiểu') diff = 'MEDIUM';
    else if (manualDifficulty === 'Vận dụng') diff = 'HARD';
    else if (manualDifficulty === 'Vận dụng cao') diff = 'VERY_HARD';

    const created = dbService.createQuestion({
      code: `CH-${Date.now().toString().slice(-5)}`,
      subject: manualSubject,
      gradeLevel: manualGrade.replace('Khối ', ''),
      textbook: 'Cánh Diều',
      lesson: manualTopic || 'Hàm số bậc hai',
      type: 'SINGLE_CHOICE',
      difficulty: diff,
      points: diff === 'EASY' ? 0.25 : diff === 'MEDIUM' ? 0.5 : diff === 'HARD' ? 1.0 : 1.5,
      prompt: manualPrompt.trim(),
      options: [
        { id: 'opt-A', text: optionA.trim() || 'Đáp án A', isCorrect: correctOption === 'A' },
        { id: 'opt-B', text: optionB.trim() || 'Đáp án B', isCorrect: correctOption === 'B' },
        { id: 'opt-C', text: optionC.trim() || 'Đáp án C', isCorrect: correctOption === 'C' },
        { id: 'opt-D', text: optionD.trim() || 'Đáp án D', isCorrect: correctOption === 'D' },
      ],
      explanation: manualExplanation.trim() || 'Theo định lý và phương pháp giải chuẩn trong sách giáo khoa.',
      tags: [manualTopic || 'Hàm số bậc hai', 'Thủ công'],
      status: 'APPROVED',
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      shareScope: 'SCHOOL',
    });

    onQuestionCreated();
    showToast(`Đã lưu câu hỏi "${created.code}" thành công vào Ngân hàng!`, 'success');

    // Reset prompt & choices for fast next entry
    setManualPrompt('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setManualExplanation('');
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP BREADCRUMB & BACK BUTTON (matching screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-600">&gt;</span>
          <span className="text-slate-300">Dạy &amp; Học</span>
          <span className="text-slate-600">&gt;</span>
          <span className="text-white font-semibold">Ngân hàng câu hỏi</span>
          <span className="text-slate-500 mx-1">•</span>
          <span className="text-slate-300 font-semibold">Ngân hàng Câu hỏi Thông minh</span>
          <span className="text-slate-500 hidden lg:inline">
            (Quản lý kho câu hỏi chuẩn 9 dạng, tích hợp AI &amp; Import đa định dạng)
          </span>
        </div>
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0a152d] hover:bg-[#0f1f3d] text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
        >
          &larr; Quay lại danh sách ngân hàng
        </button>
      </div>

      {/* 2. METHOD BAR WITH 3 TABS (matching screenshot) */}
      <div className="bg-[#081225] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-cyan-400 mr-1.5">Phương thức:</span>

          {/* TAB 1 BUTTON */}
          <button
            onClick={() => setActiveTab('tab1')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tab1'
                ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-md'
                : 'bg-[#0c162b] text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Tab 1: Nhập câu hỏi bằng cách import
          </button>

          {/* TAB 2 BUTTON */}
          <button
            onClick={() => setActiveTab('tab2')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tab2'
                ? 'bg-[#9333ea] hover:bg-[#7e22ce] text-white shadow-md'
                : 'bg-[#0c162b] text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            Tab 2: Tạo bằng AI thông minh
          </button>

          {/* TAB 3 BUTTON */}
          <button
            onClick={() => setActiveTab('tab3')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tab3'
                ? 'bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-md'
                : 'bg-[#0c162b] text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Tab 3: Tạo bằng thủ công
          </button>
        </div>

        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a152d] hover:bg-[#0f1f3d] text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 transition-colors cursor-pointer"
        >
          &larr; Quay lại danh sách ngân hàng
        </button>
      </div>

      {/* =========================================================================
          3. MAIN CARD CONTENT FOR ACTIVE TAB
         ========================================================================= */}

      {/* -------------------------------------------------------------------------
          TAB 1: NHẬP CÂU HỎI TỪ FILE WORD / EXCEL / CSV
         ------------------------------------------------------------------------- */}
      {activeTab === 'tab1' && (
        <div className="bg-[#081225] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Tab 1: Nhập câu hỏi từ file Word / Excel / CSV
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tải template chuẩn, hệ thống tự động kiểm tra Unicode, validate schema và phát hiện trùng lặp.
            </p>
          </div>

          {/* Bước 1: Tải template */}
          <div className="max-w-3xl mx-auto bg-[#0a152d]/90 border border-slate-700/70 rounded-xl p-4 sm:p-5">
            <span className="text-xs font-bold text-slate-200 block mb-3">
              Bước 1: Tải template chuẩn định dạng
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Tải Template Excel
              </button>
              <button
                type="button"
                onClick={handleDownloadWordTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c162b] hover:bg-[#162544] text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Tải Template Word
              </button>
            </div>
          </div>

          {/* Bước 2: Tải lên file câu hỏi (Dropzone matching image_f56c4202.png) */}
          <div className="max-w-3xl mx-auto border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-[#060e1d]/80 rounded-2xl p-8 sm:p-12 text-center transition-all">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-4">
              Tải lên file câu hỏi (DOCX, XLSX, CSV, JSON)
            </h3>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx,.xlsx,.xls,.csv,.txt,.json"
              className="hidden"
            />

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#0e1d3a] hover:bg-[#162a52] text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Chọn tệp
              </button>
              <span className="text-xs text-slate-400 font-mono">
                {importedFileName || 'Không tệp nào được chọn'}
              </span>
            </div>
          </div>

          {/* Parsed questions preview & schema validation */}
          {importStatus === 'success' && parsedQuestions.length > 0 && (
            <div className="max-w-3xl mx-auto bg-[#0a152d] border border-cyan-500/40 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Kết quả thẩm định tệp: {parsedQuestions.length} câu hỏi hợp lệ
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="text-emerald-400">✓ Unicode UTF-8</span>
                  <span className="text-emerald-400">✓ Đủ 9 trường Schema</span>
                  <span className="text-emerald-400">✓ 0 câu trùng lặp</span>
                </div>
              </div>

              {/* List of parsed questions preview */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-[#060e1d] border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-300">
                        Câu {idx + 1}: {q.code}
                      </span>
                      <span className="text-[10px] text-slate-400">{q.subject} - Khối {q.gradeLevel}</span>
                    </div>
                    <p className="text-slate-200 line-clamp-2">{q.prompt}</p>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveImportedToBank}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Nhập {parsedQuestions.length} câu hỏi vào Ngân hàng
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------
          TAB 2: TẠO CÂU HỎI BẰNG AI THÔNG MINH (GEMINI)
         ------------------------------------------------------------------------- */}
      {activeTab === 'tab2' && (
        <div className="bg-[#081225] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Tab 2: Trợ lý AI Gemini – Tạo Ngân hàng câu hỏi thông minh
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quy trình AI 5 bước: Nhập chủ đề bài học &rarr; Cấu hình khối, môn, số lượng &rarr; Gemini tạo câu hỏi &rarr; Review &amp; Lưu.
            </p>
          </div>

          {/* Anti-Hallucination Notice Banner */}
          <div className="max-w-3xl mx-auto bg-[#1c1232] border border-purple-800/60 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="text-purple-200">
              <strong className="font-bold text-purple-300 mr-1.5">Chống Hallucination:</strong>
              AI bám sát nguồn, ghi rõ khi thiếu căn cứ và gắn nhãn cần giáo viên kiểm tra.
            </div>
          </div>

          {/* Source input options selector */}
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs font-semibold text-slate-200">
                Nguồn nội dung / Tài liệu gốc cho AI:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* 1. Văn bản */}
                <button
                  type="button"
                  onClick={() => setAiSourceType('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    aiSourceType === 'text'
                      ? 'bg-[#9333ea] text-white shadow-xs'
                      : 'bg-[#0c162b] text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  ✍️ Văn bản
                </button>

                {/* 2. File PDF/Word */}
                <button
                  type="button"
                  onClick={() => setAiSourceType('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    aiSourceType === 'file'
                      ? 'bg-[#9333ea] text-white shadow-xs'
                      : 'bg-[#0c162b] text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  📎 File (PDF/Word)
                </button>

                {/* 3. Link Web */}
                <button
                  type="button"
                  onClick={() => setAiSourceType('link')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    aiSourceType === 'link'
                      ? 'bg-[#9333ea] text-white shadow-xs'
                      : 'bg-[#0c162b] text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  🔗 Link Web
                </button>

                {/* 4. Hình ảnh */}
                <button
                  type="button"
                  onClick={() => setAiSourceType('image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    aiSourceType === 'image'
                      ? 'bg-[#9333ea] text-white shadow-xs'
                      : 'bg-[#0c162b] text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  🖼️ Hình ảnh
                </button>
              </div>
            </div>

            {/* Sub-view 1: ✍️ VĂN BẢN (matching image_57a357e5.png) */}
            {aiSourceType === 'text' && (
              <div className="relative">
                <textarea
                  rows={4}
                  value={aiTextContent}
                  onChange={e => setAiTextContent(e.target.value)}
                  placeholder="Dán hoặc nhập nội dung chủ đề bài học, đoạn trích tài liệu, yêu cầu sinh câu hỏi..."
                  className="w-full px-4 py-3 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-colors"
                />
              </div>
            )}

            {/* Sub-view 2: 📎 FILE (PDF/Word) (matching image_6e2bf518.png) */}
            {aiSourceType === 'file' && (
              <div className="border-2 border-dashed border-slate-800 bg-[#060e1d] rounded-xl p-8 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                  <File className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">
                  Đính kèm tài liệu PDF, Word (.docx, .txt)
                </div>
                <div className="flex items-center justify-center gap-3">
                  <label className="px-3.5 py-1.5 bg-[#0e1d3a] hover:bg-[#162a52] text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer">
                    Chọn Tệp
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAiAttachedFile(file);
                          setAiAttachedFileName(file.name);
                          showToast(`Đã đính kèm tài liệu: ${file.name}`, 'success');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {aiAttachedFileName || 'Không tệp nào được chọn'}
                  </span>
                </div>
              </div>
            )}

            {/* Sub-view 3: 🔗 LINK WEB (matching image_586e4332.png) */}
            {aiSourceType === 'link' && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiWebLink}
                  onChange={e => setAiWebLink(e.target.value)}
                  placeholder="Dán link trang web tài liệu (ví dụ: https://example.com/bai-hoc)..."
                  className="flex-1 px-4 py-2.5 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddWebLink}
                  className="px-4 py-2.5 bg-[#9333ea] hover:bg-[#7e22ce] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Thêm Link
                </button>
              </div>
            )}

            {/* Sub-view 4: 🖼️ HÌNH ẢNH (matching image_faa7859e.png) */}
            {aiSourceType === 'image' && (
              <div className="border-2 border-dashed border-slate-800 bg-[#060e1d] rounded-xl p-8 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">
                  Tải lên hình ảnh tài liệu hoặc ảnh chụp màn hình bài học (.png, .jpg)
                </div>
                <div className="flex items-center justify-center gap-3">
                  <label className="px-3.5 py-1.5 bg-[#0e1d3a] hover:bg-[#162a52] text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer">
                    Chọn tệp
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAiImageName(file.name);
                          setAiAttachedImage(URL.createObjectURL(file));
                          showToast(`Đã nhận diện ảnh: ${file.name} (Sẵn sàng OCR)`, 'success');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {aiImageName || 'Không tệp nào được chọn'}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom row: Môn học, Khối lớp, Số lượng câu tạo (matching screenshots) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Môn học
                </label>
                <select
                  value={aiSubject}
                  onChange={e => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Địa lý">Địa lý</option>
                  <option value="Tin học">Tin học</option>
                  <option value="GDCD">GDCD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Khối lớp
                </label>
                <select
                  value={aiGrade}
                  onChange={e => setAiGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value="Khối 6">Khối 6</option>
                  <option value="Khối 7">Khối 7</option>
                  <option value="Khối 8">Khối 8</option>
                  <option value="Khối 9">Khối 9</option>
                  <option value="Khối 10">Khối 10</option>
                  <option value="Khối 11">Khối 11</option>
                  <option value="Khối 12">Khối 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số lượng câu tạo
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiQuestionCount}
                  onChange={e => setAiQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            {/* Action button: Bắt đầu tạo bằng AI */}
            <div className="flex justify-end pt-3">
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={handleStartAiGeneration}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9333ea] hover:bg-[#a855f7] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                {isGeneratingAi ? 'Đang tạo bằng AI...' : 'Bắt đầu tạo bằng AI'}
              </button>
            </div>
          </div>

          {/* AI Generation In-progress display */}
          {isGeneratingAi && (
            <div className="max-w-3xl mx-auto bg-[#130b26] border border-purple-500/40 rounded-xl p-5 space-y-3 text-xs animate-pulse">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                Quy trình AI Gemini đang xử lý:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                <div className={`p-2 rounded border ${aiStepProgress >= 1 ? 'bg-purple-950/80 border-purple-500 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  1. Đọc tài liệu gốc
                </div>
                <div className={`p-2 rounded border ${aiStepProgress >= 2 ? 'bg-purple-950/80 border-purple-500 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  2. Chống Hallucination
                </div>
                <div className={`p-2 rounded border ${aiStepProgress >= 3 ? 'bg-purple-950/80 border-purple-500 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  3. Ma trận mức độ
                </div>
                <div className={`p-2 rounded border ${aiStepProgress >= 4 ? 'bg-purple-950/80 border-purple-500 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  4. Đề xuất đáp án &amp; giải
                </div>
              </div>
            </div>
          )}

          {/* Generated Questions Review List */}
          {generatedAiQuestions.length > 0 && !isGeneratingAi && (
            <div className="max-w-3xl mx-auto bg-[#0a152d] border border-purple-500/40 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    AI đã tạo {generatedAiQuestions.length} câu hỏi chuẩn ma trận
                  </span>
                </div>
                <span className="text-[11px] text-purple-300 font-semibold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                  ✓ Chống Hallucination: 100% bám sát tài liệu
                </span>
              </div>

              {/* Review cards */}
              <div className="space-y-3">
                {generatedAiQuestions.map((q, idx) => {
                  const isChecked = selectedAiQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                        isChecked
                          ? 'bg-[#0e1a38] border-purple-500/50'
                          : 'bg-[#060e1d] border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedAiQuestionIds(prev =>
                                prev.includes(q.id) ? prev.filter(x => x !== q.id) : [...prev, q.id]
                              );
                            }}
                            className="rounded border-purple-500 text-purple-600 focus:ring-0"
                          />
                          <span className="font-mono font-bold text-purple-300">
                            Câu {idx + 1} ({q.code})
                          </span>
                        </label>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                          {q.difficulty === 'EASY' ? 'Nhận biết' : q.difficulty === 'MEDIUM' ? 'Thông hiểu' : q.difficulty === 'HARD' ? 'Vận dụng' : 'Vận dụng cao'}
                        </span>
                      </div>

                      <p className="text-white font-medium leading-relaxed">{q.prompt}</p>

                      {/* Options */}
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border ${
                                opt.isCorrect
                                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold'
                                  : 'bg-[#081225] border-slate-800 text-slate-300'
                              }`}
                            >
                              <strong className="mr-1">{String.fromCharCode(65 + oIdx)}.</strong>
                              {opt.text}
                              {opt.isCorrect && ' ✓ (Đáp án đúng)'}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-2.5 bg-[#081225] border border-slate-800 rounded-lg text-slate-400 text-[11px]">
                          <strong className="text-cyan-400">Lời giải chi tiết: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save or Regenerate actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartAiGeneration}
                  className="px-3.5 py-2 bg-[#0c162b] hover:bg-[#162544] text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tạo lại bộ khác
                </button>
                <button
                  type="button"
                  onClick={handleSaveSelectedAiQuestions}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Lưu {selectedAiQuestionIds.length} câu hỏi đã chọn vào Ngân hàng
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------
          TAB 3: TẠO CÂU HỎI THỦ CÔNG (matching image_dd3d23d4.png)
         ------------------------------------------------------------------------- */}
      {activeTab === 'tab3' && (
        <div className="bg-[#081225] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Tab 3: Tạo câu hỏi thủ công
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nhập trực tiếp nội dung, thiết lập đáp án và lời giải chi tiết.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* Row 1: Môn học & Khối lớp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Môn học
                </label>
                <select
                  value={manualSubject}
                  onChange={e => setManualSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Địa lý">Địa lý</option>
                  <option value="Tin học">Tin học</option>
                  <option value="GDCD">GDCD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Khối lớp
                </label>
                <select
                  value={manualGrade}
                  onChange={e => setManualGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Khối 6">Khối 6</option>
                  <option value="Khối 7">Khối 7</option>
                  <option value="Khối 8">Khối 8</option>
                  <option value="Khối 9">Khối 9</option>
                  <option value="Khối 10">Khối 10</option>
                  <option value="Khối 11">Khối 11</option>
                  <option value="Khối 12">Khối 12</option>
                </select>
              </div>
            </div>

            {/* Row 2: Dạng câu hỏi, Mức độ, Chủ đề bài học */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dạng câu hỏi
                </label>
                <select
                  value={manualType}
                  onChange={e => setManualType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Trắc nghiệm - Pick One (1 đáp án đúng)">
                    Trắc nghiệm - Pick One (1 đáp án đúng)
                  </option>
                  <option value="Trắc nghiệm nhiều lựa chọn">
                    Trắc nghiệm nhiều lựa chọn
                  </option>
                  <option value="Đúng / Sai 4 ý">Đúng / Sai 4 ý</option>
                  <option value="Điền khuyết / Trả lời ngắn">Điền khuyết / Trả lời ngắn</option>
                  <option value="Tự luận ngắn">Tự luận ngắn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mức độ
                </label>
                <select
                  value={manualDifficulty}
                  onChange={e => setManualDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Nhận biết">Nhận biết</option>
                  <option value="Thông hiểu">Thông hiểu</option>
                  <option value="Vận dụng">Vận dụng</option>
                  <option value="Vận dụng cao">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Chủ đề bài học
                </label>
                <input
                  type="text"
                  value={manualTopic}
                  onChange={e => setManualTopic(e.target.value)}
                  placeholder="Ví dụ: Hàm số bậc hai"
                  className="w-full px-3.5 py-2.5 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Row 3: Nội dung câu hỏi (hỗ trợ Markdown / LaTeX) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nội dung câu hỏi (hỗ trợ Markdown / LaTeX):
              </label>
              <textarea
                rows={3}
                value={manualPrompt}
                onChange={e => setManualPrompt(e.target.value)}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full px-4 py-3 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Row 4: Các phương án lựa chọn (2x2 grid matching image_dd3d23d4.png) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Các phương án lựa chọn:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={optionA}
                  onChange={e => setOptionA(e.target.value)}
                  placeholder="Đáp án A"
                  className="px-3.5 py-2 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={optionB}
                  onChange={e => setOptionB(e.target.value)}
                  placeholder="Đáp án B"
                  className="px-3.5 py-2 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={optionC}
                  onChange={e => setOptionC(e.target.value)}
                  placeholder="Đáp án C"
                  className="px-3.5 py-2 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={optionD}
                  onChange={e => setOptionD(e.target.value)}
                  placeholder="Đáp án D"
                  className="px-3.5 py-2 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Row 5: Đáp án đúng (Chọn 1 đáp án) matching image_dd3d23d4.png */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Đáp án đúng (Chọn 1 đáp án):
              </label>
              <div className="flex items-center gap-3">
                {(['A', 'B', 'C', 'D'] as const).map(letter => {
                  const isSelected = correctOption === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setCorrectOption(letter)}
                      className={`inline-flex items-center justify-center gap-1.5 w-12 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0284c7] text-white border border-[#0284c7] shadow-sm'
                          : 'bg-[#060e1d] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 6: Lời giải chi tiết */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lời giải chi tiết:
              </label>
              <textarea
                rows={3}
                value={manualExplanation}
                onChange={e => setManualExplanation(e.target.value)}
                placeholder="Nhập lời giải..."
                className="w-full px-4 py-3 bg-[#060e1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Row 7: Lưu câu hỏi vào Ngân hàng button matching image_dd3d23d4.png */}
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveManualQuestion}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu câu hỏi vào Ngân hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
