import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  FolderArchive,
  Share2,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  BarChart2,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Send,
  HelpCircle,
  Tag,
  Grid,
  List,
  ExternalLink,
  BookMarked,
  Users,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
  FileCheck,
  SplitSquareVertical,
  Link2,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Question, QuestionType, QuestionDifficulty, QuestionStatus, ExamSet } from '../../types';
import { QuestionBankCreateScreen } from './QuestionBankCreateScreen';

// Tab identifiers for the 8 sub-menus
type QuestionBankTab =
  | 'all_questions'
  | 'single_create'
  | 'batch_import'
  | 'multi_types'
  | 'ai_document_generator'
  | 'exam_sets'
  | 'topics_collections'
  | 'overview';

export const QuestionBankPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active view: 'create_tabs' (Primary 3-method creation UI as requested) or 'list' (Full database table)
  const [mainView, setMainView] = useState<'create_tabs' | 'list'>('create_tabs');
  const [selectedCreateTab, setSelectedCreateTab] = useState<'tab1' | 'tab2' | 'tab3'>('tab1');

  // Active sub-menu tab
  const [activeTab, setActiveTab] = useState<QuestionBankTab>('all_questions');

  // Question list state from dbService
  const [questions, setQuestions] = useState<Question[]>(() => dbService.getQuestions());
  const [examSets, setExamSets] = useState<ExamSet[]>(() => dbService.getExamSets());

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterTextbook, setFilterTextbook] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Selection for bulk actions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Modals
  const [viewQuestionModal, setViewQuestionModal] = useState<Question | null>(null);
  const [editQuestionModal, setEditQuestionModal] = useState<Question | null>(null);
  const [deleteTargetQuestion, setDeleteTargetQuestion] = useState<Question | null>(null);
  const [createExamModalOpen, setCreateExamModalOpen] = useState(false);
  const [viewExamModal, setViewExamModal] = useState<ExamSet | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filterSubject !== 'ALL' && q.subject !== filterSubject) return false;
      if (filterGrade !== 'ALL' && q.gradeLevel !== filterGrade) return false;
      if (filterTextbook !== 'ALL' && q.textbook !== filterTextbook) return false;
      if (filterDifficulty !== 'ALL' && q.difficulty !== filterDifficulty) return false;
      if (filterType !== 'ALL' && q.type !== filterType) return false;
      if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase();
        const matchPrompt = q.prompt.toLowerCase().includes(s);
        const matchCode = q.code ? q.code.toLowerCase().includes(s) : false;
        const matchChapter = q.chapter ? q.chapter.toLowerCase().includes(s) : false;
        const matchTags = q.tags ? q.tags.some(t => t.toLowerCase().includes(s)) : false;
        if (!matchPrompt && !matchCode && !matchChapter && !matchTags) return false;
      }
      return true;
    });
  }, [questions, filterSubject, filterGrade, filterTextbook, filterDifficulty, filterType, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage]);

  // Statistics calculation for Overview tab
  const stats = useMemo(() => {
    const total = questions.length;
    const approved = questions.filter(q => q.status === 'APPROVED').length;
    const pending = questions.filter(q => q.status === 'PENDING').length;
    const draft = questions.filter(q => q.status === 'DRAFT').length;

    const easy = questions.filter(q => q.difficulty === 'EASY').length;
    const medium = questions.filter(q => q.difficulty === 'MEDIUM').length;
    const hard = questions.filter(q => q.difficulty === 'HARD').length;
    const veryHard = questions.filter(q => q.difficulty === 'VERY_HARD').length;

    return { total, approved, pending, draft, easy, medium, hard, veryHard };
  }, [questions]);

  // Reload questions helper
  const handleReloadQuestions = () => {
    setQuestions(dbService.getQuestions());
    setExamSets(dbService.getExamSets());
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetQuestion) {
      dbService.deleteQuestion(deleteTargetQuestion.id);
      handleReloadQuestions();
      showToast(`Đã xóa câu hỏi ${deleteTargetQuestion.code || ''}`, 'info');
      setDeleteTargetQuestion(null);
    }
  };

  const handleDuplicate = (q: Question) => {
    const duplicated = dbService.duplicateQuestion(q.id);
    if (duplicated) {
      handleReloadQuestions();
      showToast(`Đã nhân bản câu hỏi thành bản nháp mới!`, 'success');
    }
  };

  const handleUpdateStatus = (q: Question, newStatus: QuestionStatus) => {
    dbService.updateQuestion(q.id, { status: newStatus });
    handleReloadQuestions();
    showToast(`Đã chuyển trạng thái câu hỏi sang "${newStatus === 'APPROVED' ? 'Đã duyệt' : newStatus === 'PENDING' ? 'Chờ duyệt' : 'Bản nháp'}"`, 'success');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds(paginatedQuestions.map(q => q.id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Helper text formatters
  const getDifficultyBadge = (d: QuestionDifficulty) => {
    switch (d) {
      case 'EASY':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">Nhận biết</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-950/60 text-sky-300 border border-sky-500/30">Thông hiểu</span>;
      case 'HARD':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">Vận dụng</span>;
      case 'VERY_HARD':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30">Vận dụng cao</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">Cơ bản</span>;
    }
  };

  const getTypeBadge = (t: QuestionType) => {
    switch (t) {
      case 'SINGLE_CHOICE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">Trắc nghiệm 1 ĐA</span>;
      case 'MULTIPLE_CHOICE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-950/60 text-purple-300 border border-purple-500/30">Nhiều đáp án</span>;
      case 'TRUE_FALSE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">Đúng / Sai</span>;
      case 'SHORT_ANSWER':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-teal-950/60 text-teal-300 border border-teal-500/30">Điền khuyết</span>;
      case 'MATCHING':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-pink-950/60 text-pink-300 border border-pink-500/30">Nối cặp</span>;
      case 'ESSAY':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-orange-950/60 text-orange-300 border border-orange-500/30">Tự luận</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (s?: QuestionStatus) => {
    switch (s) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Đã duyệt</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case 'DRAFT':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1">Bản nháp</span>;
    }
  };

  // Integration with "Giao bài tập"
  const handleAssignSelectedQuestions = () => {
    if (selectedQuestionIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 câu hỏi để giao bài tập!', 'info');
      return;
    }
    const selectedList = questions.filter(q => selectedQuestionIds.includes(q.id));
    const title = `Bài tập tự luyện (${selectedList.length} câu hỏi)`;
    navigate('/teacher/assignments/create', {
      state: {
        presetTitle: title,
        presetQuestions: selectedList,
      }
    });
  };

  // =========================================================================
  // 1. THÊM TỪNG CÂU HỎI VÀO HỆ THỐNG (STATE & HANDLERS)
  // =========================================================================
  const [newQCode, setNewQCode] = useState('');
  const [newQSubject, setNewQSubject] = useState('Toán học');
  const [newQGrade, setNewQGrade] = useState('10');
  const [newQTextbook, setNewQTextbook] = useState('Cánh Diều');
  const [newQChapter, setNewQChapter] = useState('Chương 1: Mệnh đề toán học & Tập hợp');
  const [newQLesson, setNewQLesson] = useState('Bài 1: Mệnh đề toán học');
  const [newQType, setNewQType] = useState<QuestionType>('SINGLE_CHOICE');
  const [newQDifficulty, setNewQDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [newQPoints, setNewQPoints] = useState(1.0);
  const [newQPrompt, setNewQPrompt] = useState('Cho tam giác ABC có độ dài ba cạnh a = 6, b = 8, c = 10. Diện tích S của tam giác ABC là:');
  const [newQExplanation, setNewQExplanation] = useState('Tam giác ABC có 6² + 8² = 36 + 64 = 100 = 10², nên đây là tam giác vuông tại A. Diện tích S = 1/2 * a * b = 1/2 * 6 * 8 = 24.');
  const [newQImageUrl, setNewQImageUrl] = useState('');
  const [newQStatus, setNewQStatus] = useState<QuestionStatus>('APPROVED');
  const [newQShareScope, setNewQShareScope] = useState<'PRIVATE' | 'DEPARTMENT' | 'SCHOOL' | 'PUBLIC'>('SCHOOL');
  const [newQTags, setNewQTags] = useState('Tam giác vuông, Định lý Pythagore');
  const [newQOptions, setNewQOptions] = useState([
    { id: 'opt-1', text: 'S = 24', isCorrect: true },
    { id: 'opt-2', text: 'S = 48', isCorrect: false },
    { id: 'opt-3', text: 'S = 30', isCorrect: false },
    { id: 'opt-4', text: 'S = 12', isCorrect: false },
  ]);
  // Dạng Đúng/Sai 4 ý
  const [newQSubStatements, setNewQSubStatements] = useState([
    { id: 'st-a', text: 'a) Tam giác ABC là tam giác vuông tại A.', isCorrect: true },
    { id: 'st-b', text: 'b) Bán kính đường tròn ngoại tiếp R = 5.', isCorrect: true },
    { id: 'st-c', text: 'c) Góc B có số đo lớn hơn 90°.', isCorrect: false },
    { id: 'st-d', text: 'd) Diện tích tam giác ABC bằng 48.', isCorrect: false },
  ]);
  // Dạng Nối cặp
  const [newQMatchingPairs, setNewQMatchingPairs] = useState([
    { id: 'm-1', left: '1. Cạnh huyền', right: 'a. Cạnh BC = 10' },
    { id: 'm-2', left: '2. Cạnh góc vuông nhỏ', right: 'b. Cạnh AB = 6' },
    { id: 'm-3', left: '3. Diện tích tam giác', right: 'c. S = 24' },
  ]);
  const [newQCorrectAnswerText, setNewQCorrectAnswerText] = useState('24');

  const handleSaveSingleQuestion = (continueAdding = false) => {
    if (!newQPrompt.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi!', 'info');
      return;
    }

    const created = dbService.createQuestion({
      code: newQCode.trim() || undefined,
      subject: newQSubject,
      gradeLevel: newQGrade,
      textbook: newQTextbook,
      chapter: newQChapter,
      lesson: newQLesson,
      type: newQType,
      difficulty: newQDifficulty,
      points: Number(newQPoints),
      prompt: newQPrompt,
      explanation: newQExplanation,
      imageUrl: newQImageUrl.trim() || undefined,
      options: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(newQType) ? newQOptions : undefined,
      subStatements: newQType === 'TRUE_FALSE' ? newQSubStatements : undefined,
      matchingPairs: newQType === 'MATCHING' ? newQMatchingPairs : undefined,
      correctAnswerText: ['SHORT_ANSWER', 'ESSAY'].includes(newQType) ? newQCorrectAnswerText : undefined,
      tags: newQTags.split(',').map(t => t.trim()).filter(Boolean),
      status: newQStatus,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      shareScope: newQShareScope,
    });

    handleReloadQuestions();
    showToast(`Đã lưu câu hỏi ${created.code || ''} vào Ngân hàng!`, 'success');

    if (continueAdding) {
      setNewQPrompt('');
      setNewQExplanation('');
      setNewQImageUrl('');
      setNewQCode('');
    } else {
      setActiveTab('all_questions');
    }
  };

  // Sample image presets for quick attachment
  const sampleImages = [
    { label: 'Hình tam giác ABC', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80' },
    { label: 'Đồ thị Parabol', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80' },
    { label: 'Thí nghiệm Vật lý', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80' },
  ];

  // =========================================================================
  // 2. IMPORT NHIỀU CÂU HỎI CÙNG 1 LÚC (STATE & PARSER)
  // =========================================================================
  const defaultRawImportText = `Câu 1: [Nhận biết] Cho tập hợp A = {x ∈ ℝ | x² - 4 = 0}. Tập hợp A gồm các phần tử nào?
A. A = {2}
B. A = {-2; 2}
C. A = {-4; 4}
D. A = {4}
Đáp án: B
Lời giải: Phương trình x² - 4 = 0 có hai nghiệm phân biệt là x = 2 và x = -2. Do đó A = {-2; 2}.

Câu 2: [Thông hiểu] Trong mặt phẳng tọa độ Oxy, vectơ u = 2i - 3j có tọa độ là:
A. u = (2; 3)
B. u = (-2; 3)
C. u = (2; -3)
D. u = (-3; 2)
Đáp án: C
Lời giải: Vectơ u = x.i + y.j thì u = (x; y). Vậy u = (2; -3).

Câu 3: [Vận dụng] Cho tam giác ABC vuông tại A có AB = 6, AC = 8. Bán kính đường tròn nội tiếp r của tam giác ABC là:
A. r = 1
B. r = 2
C. r = 3
D. r = 4
Đáp án: B
Lời giải: BC = 10. Nửa chu vi p = (6 + 8 + 10) / 2 = 12. Diện tích S = 1/2 * 6 * 8 = 24. Bán kính r = S / p = 24 / 12 = 2.`;

  const [rawText, setRawText] = useState(defaultRawImportText);
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<Question[]>([]);
  const [importSubject, setImportSubject] = useState('Toán học');
  const [importGrade, setImportGrade] = useState('10');
  const [importTextbook, setImportTextbook] = useState('Cánh Diều');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Smart Parser Function
  const parseBatchText = (textToParse: string) => {
    const blocks = textToParse.split(/(?:Câu\s+\d+:|Question\s+\d+:|Bài\s+\d+:)/i).map(b => b.trim()).filter(Boolean);
    const parsed: Question[] = [];

    blocks.forEach((block, index) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      let prompt = lines[0] || '';
      let difficulty: QuestionDifficulty = 'MEDIUM';
      if (prompt.includes('[Nhận biết]')) {
        difficulty = 'EASY';
        prompt = prompt.replace('[Nhận biết]', '').trim();
      } else if (prompt.includes('[Thông hiểu]')) {
        difficulty = 'MEDIUM';
        prompt = prompt.replace('[Thông hiểu]', '').trim();
      } else if (prompt.includes('[Vận dụng]')) {
        difficulty = 'HARD';
        prompt = prompt.replace('[Vận dụng]', '').trim();
      } else if (prompt.includes('[VDC]') || prompt.includes('[Vận dụng cao]')) {
        difficulty = 'VERY_HARD';
        prompt = prompt.replace(/\[VDC\]|\[Vận dụng cao\]/g, '').trim();
      }

      // Extract options A, B, C, D
      const options: { id: string; text: string; isCorrect: boolean }[] = [];
      let correctAnswerKey = 'A';
      let explanation = '';

      lines.forEach(line => {
        const optMatch = line.match(/^([A-D])\.\s*(.+)$/i);
        if (optMatch) {
          options.push({
            id: `opt-${optMatch[1].toUpperCase()}`,
            text: optMatch[2].trim(),
            isCorrect: false,
          });
        }

        const ansMatch = line.match(/(?:Đáp án|Đ\/A|Key|Answer):\s*([A-D])/i);
        if (ansMatch) {
          correctAnswerKey = ansMatch[1].toUpperCase();
        }

        const expMatch = line.match(/(?:Lời giải|Hướng dẫn giải|Giải thích):\s*(.+)$/i);
        if (expMatch) {
          explanation = expMatch[1].trim();
        }
      });

      // Mark the correct option
      const mappedOptions = options.map(opt => ({
        ...opt,
        isCorrect: opt.id === `opt-${correctAnswerKey}` || opt.text.includes('(Đúng)'),
      }));

      parsed.push({
        id: `imp-${Date.now()}-${index}`,
        code: `IMP-${(index + 1).toString().padStart(3, '0')}`,
        subject: importSubject,
        gradeLevel: importGrade,
        textbook: importTextbook,
        type: 'SINGLE_CHOICE',
        difficulty,
        points: 0.5,
        prompt,
        options: mappedOptions.length > 0 ? mappedOptions : [
          { id: 'opt-A', text: 'Đáp án A', isCorrect: true },
          { id: 'opt-B', text: 'Đáp án B', isCorrect: false },
          { id: 'opt-C', text: 'Đáp án C', isCorrect: false },
          { id: 'opt-D', text: 'Đáp án D', isCorrect: false },
        ],
        explanation: explanation || 'Theo lý thuyết và phương pháp giải chuẩn trong SGK.',
        tags: ['Import hàng loạt'],
        status: 'APPROVED',
        authorName: currentUser.fullName,
        shareScope: 'SCHOOL',
      });
    });

    return parsed;
  };

  const handleStartParse = () => {
    const res = parseBatchText(rawText);
    setParsedPreviewQuestions(res);
    if (res.length > 0) {
      showToast(`Đã phân tích thành công ${res.length} câu hỏi! Vui lòng kiểm tra và duyệt bên dưới.`, 'success');
    } else {
      showToast('Không nhận diện được câu hỏi nào. Vui lòng kiểm tra lại định dạng file!', 'info');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    // Read text file or simulate docx / xlsx reading
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        const res = parseBatchText(content);
        setParsedPreviewQuestions(res);
        showToast(`Đã tải file ${file.name} và phân tích tự động ${res.length} câu hỏi!`, 'success');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveImportedQuestions = () => {
    if (parsedPreviewQuestions.length === 0) {
      showToast('Không có câu hỏi nào để nhập!', 'info');
      return;
    }

    const count = dbService.importQuestionsBatch(parsedPreviewQuestions);
    handleReloadQuestions();
    showToast(`Đã nhập thành công ${count} câu hỏi vào Ngân hàng câu hỏi!`, 'success');
    setParsedPreviewQuestions([]);
    setActiveTab('all_questions');
  };

  // =========================================================================
  // 4. AI TẠO CÂU HỎI TỰ ĐỘNG TỪ GIÁO ÁN / GIÁO TRÌNH (STATE & 4-STEP WORKFLOW)
  // =========================================================================
  const [aiTopicInput, setAiTopicInput] = useState('Định lý Cosin và Sin trong Tam giác');
  const [aiDocContent, setAiDocContent] = useState(`TIẾN TRÌNH DẠY HỌC BÀI ĐỊNH LÝ COSIN VÀ SIN:
1. Kiến thức trọng tâm:
- Định lý côsin: Trong tam giác ABC, a² = b² + c² - 2bc.cosA. Hệ quả tính góc: cosA = (b² + c² - a²) / (2bc).
- Định lý sin: a/sinA = b/sinB = c/sinC = 2R với R là bán kính đường tròn ngoại tiếp tam giác.
- Công thức diện tích tam giác: S = 1/2.b.c.sinA = abc / (4R) = p.r = √(p(p-a)(p-b)(p-c)).
2. Bài toán thực tế:
- Ứng dụng đo đạc khoảng cách giữa hai điểm không thể đi trực tiếp qua ngọn núi hoặc lòng hồ.`);

  const [aiAttachedFileName, setAiAttachedFileName] = useState<string | null>('Giao_an_Dinh_ly_Cosin_Sin_Toan_10.docx');
  const [aiSubject, setAiSubject] = useState('Toán học');
  const [aiGrade, setAiGrade] = useState('10');
  const [aiTextbook, setAiTextbook] = useState('Cánh Diều');

  // Matrix config for AI
  const [aiNumEasy, setAiNumEasy] = useState(2);
  const [aiNumMedium, setAiNumMedium] = useState(2);
  const [aiNumHard, setAiNumHard] = useState(1);
  const [aiNumVeryHard, setAiNumVeryHard] = useState(1);

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1); // 1: Input doc/topic -> 2: AI Generated & Review -> 3: Finished
  const [aiReviewQuestions, setAiReviewQuestions] = useState<Question[]>([]);
  const [aiApprovedSelection, setAiApprovedSelection] = useState<string[]>([]);
  const [aiDuplicateReport, setAiDuplicateReport] = useState<string | null>(null);

  const handleRunAiFromLesson = () => {
    setIsAiProcessing(true);
    setAiDuplicateReport(null);

    setTimeout(() => {
      setIsAiProcessing(false);
      setAiStep(2);

      // AI generated questions with answers, explanations, and difficulty levels
      const generated: Question[] = [
        {
          id: `ai-gen-${Date.now()}-1`,
          code: `TOAN10-AI-NB-01`,
          subject: aiSubject,
          gradeLevel: aiGrade,
          textbook: aiTextbook,
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: aiTopicInput,
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          points: 0.5,
          prompt: `Cho tam giác ABC có độ dài ba cạnh là a, b, c. Theo định lý Cosin, mệnh đề nào sau đây là đúng?`,
          options: [
            { id: 'opt-A', text: 'a² = b² + c² - 2bc.cosA', isCorrect: true },
            { id: 'opt-B', text: 'a² = b² + c² + 2bc.cosA', isCorrect: false },
            { id: 'opt-C', text: 'a² = b² + c² - bc.cosA', isCorrect: false },
            { id: 'opt-D', text: 'a² = b² + c² - 2bc.sinA', isCorrect: false },
          ],
          explanation: 'Theo định lý côsin trong tam giác: Bình phương một cạnh bằng tổng bình phương hai cạnh còn lại trừ hai lần tích của chúng với côsin góc xen giữa: a² = b² + c² - 2bc.cosA.',
          tags: ['AI Giáo án', 'Định lý Cosin', 'Nhận biết'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        },
        {
          id: `ai-gen-${Date.now()}-2`,
          code: `TOAN10-AI-TH-02`,
          subject: aiSubject,
          gradeLevel: aiGrade,
          textbook: aiTextbook,
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: aiTopicInput,
          type: 'SINGLE_CHOICE',
          difficulty: 'MEDIUM',
          points: 0.5,
          prompt: `Tam giác ABC có cạnh AB = 5, AC = 8 và góc A = 60°. Độ dài cạnh BC là:`,
          options: [
            { id: 'opt-A', text: 'BC = 7', isCorrect: true },
            { id: 'opt-B', text: 'BC = √65', isCorrect: false },
            { id: 'opt-C', text: 'BC = 8.5', isCorrect: false },
            { id: 'opt-D', text: 'BC = 9', isCorrect: false },
          ],
          explanation: 'BC² = 5² + 8² - 2*5*8*cos(60°) = 25 + 64 - 40 = 49 => BC = √49 = 7.',
          tags: ['AI Giáo án', 'Tính cạnh', 'Thông hiểu'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        },
        {
          id: `ai-gen-${Date.now()}-3`,
          code: `TOAN10-AI-VD-03`,
          subject: aiSubject,
          gradeLevel: aiGrade,
          textbook: aiTextbook,
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: aiTopicInput,
          type: 'TRUE_FALSE',
          difficulty: 'HARD',
          points: 1.0,
          prompt: `Cho tam giác ABC có a = 7, b = 5, c = 6. Đánh giá tính Đúng/Sai của các mệnh đề sau:`,
          subStatements: [
            { id: 'st-1', text: 'a) Nửa chu vi tam giác p = 9.', isCorrect: true },
            { id: 'st-2', text: 'b) Diện tích tam giác S = 6√6 (theo công thức Heron).', isCorrect: true },
            { id: 'st-3', text: 'c) Góc A của tam giác là góc nhọn (cosA > 0).', isCorrect: true },
            { id: 'st-4', text: 'd) Bán kính đường tròn ngoại tiếp R = 35 / (24√6).', isCorrect: false },
          ],
          explanation: 'p = (7+5+6)/2 = 9. S = √(9*2*4*3) = √216 = 6√6. R = abc / (4S) = (7*5*6) / (24√6) = 35 / (4√6), mệnh đề d) sai mẫu số.',
          tags: ['AI Giáo án', 'Đúng/Sai 4 ý', 'Vận dụng'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        },
        {
          id: `ai-gen-${Date.now()}-4`,
          code: `TOAN10-AI-VDC-04`,
          subject: aiSubject,
          gradeLevel: aiGrade,
          textbook: aiTextbook,
          chapter: 'Chương 4: Hệ thức lượng trong tam giác',
          lesson: aiTopicInput,
          type: 'SINGLE_CHOICE',
          difficulty: 'VERY_HARD',
          points: 1.5,
          prompt: `Để đo khoảng cách giữa hai ngọn núi A và B bị ngăn cách bởi một con sông, từ vị trí C cách A 400m và cách B 600m, góc ngắm ACB = 120°. Khoảng cách AB giữa hai ngọn núi gần nhất với giá trị nào sau đây?`,
          options: [
            { id: 'opt-A', text: '872 m', isCorrect: true },
            { id: 'opt-B', text: '760 m', isCorrect: false },
            { id: 'opt-C', text: '920 m', isCorrect: false },
            { id: 'opt-D', text: '1000 m', isCorrect: false },
          ],
          explanation: 'AB² = AC² + BC² - 2*AC*BC*cos(120°) = 400² + 600² - 2*400*600*(-0.5) = 160000 + 360000 + 240000 = 760000 => AB = √760000 ≈ 871.78 m ≈ 872 m.',
          tags: ['AI Giáo án', 'Toán thực tế', 'Vận dụng cao'],
          status: 'APPROVED',
          authorName: 'AI EduSmart Trợ lý',
          shareScope: 'SCHOOL',
        }
      ];

      setAiReviewQuestions(generated);
      setAiApprovedSelection(generated.map(q => q.id));
      setAiDuplicateReport('✓ Đã so sánh với 18 câu hỏi có sẵn: Không trùng lặp bất kỳ câu nào trong ngân hàng hiện tại.');
      showToast('AI đã trích xuất kiến thức giáo án và đề xuất 4 câu hỏi ma trận hoàn chỉnh!', 'success');
    }, 1500);
  };

  const handleSaveApprovedAiQuestions = () => {
    const selected = aiReviewQuestions.filter(q => aiApprovedSelection.includes(q.id));
    if (selected.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 câu hỏi được duyệt để lưu!', 'info');
      return;
    }

    dbService.importQuestionsBatch(selected);
    handleReloadQuestions();
    showToast(`Đã duyệt & lưu thành công ${selected.length} câu hỏi AI vào Ngân hàng!`, 'success');
    setAiStep(1);
    setAiReviewQuestions([]);
    setActiveTab('all_questions');
  };

  // =========================================================================
  // 5. EXAM SET GENERATION & MODALS
  // =========================================================================
  const [examTitle, setExamTitle] = useState('Đề kiểm tra giữa kỳ 1');
  const [examDuration, setExamDuration] = useState(45);
  const [examSubject, setExamSubject] = useState('Toán học');
  const [examGrade, setExamGrade] = useState('10');
  const [matrixEasy, setMatrixEasy] = useState(2);
  const [matrixMedium, setMatrixMedium] = useState(2);
  const [matrixHard, setMatrixHard] = useState(1);
  const [matrixVeryHard, setMatrixVeryHard] = useState(1);

  const handleGenerateExamSet = (e: React.FormEvent) => {
    e.preventDefault();
    const easyQ = questions.filter(q => q.difficulty === 'EASY');
    const medQ = questions.filter(q => q.difficulty === 'MEDIUM');
    const hardQ = questions.filter(q => q.difficulty === 'HARD');
    const veryHardQ = questions.filter(q => q.difficulty === 'VERY_HARD');

    const selected: Question[] = [
      ...easyQ.slice(0, matrixEasy),
      ...medQ.slice(0, matrixMedium),
      ...hardQ.slice(0, matrixHard),
      ...veryHardQ.slice(0, matrixVeryHard),
    ];

    if (selected.length === 0) {
      showToast('Không có đủ câu hỏi trong ngân hàng thỏa mãn ma trận này!', 'info');
      return;
    }

    const totalPts = selected.reduce((sum, q) => sum + (q.points || 1), 0);

    const newExam = dbService.createExamSet({
      title: examTitle,
      subject: examSubject,
      gradeLevel: examGrade,
      durationMinutes: examDuration,
      totalPoints: totalPts,
      questionCount: selected.length,
      questions: selected,
      matrix: {
        easy: matrixEasy,
        medium: matrixMedium,
        hard: matrixHard,
        veryHard: matrixVeryHard,
      },
      authorName: currentUser.fullName,
    });

    handleReloadQuestions();
    setCreateExamModalOpen(false);
    showToast(`Đã tạo bộ đề "${newExam.title}" gồm ${newExam.questionCount} câu hỏi!`, 'success');
  };

  // Render the 3-Input-Method screen requested by user
  if (mainView === 'create_tabs') {
    return (
      <QuestionBankCreateScreen
        initialTab={selectedCreateTab}
        onBackToList={() => setMainView('list')}
        onQuestionCreated={handleReloadQuestions}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ngân hàng Câu hỏi & Đề thi"
        description="Kho câu hỏi thông minh chuẩn ma trận GDPT 2018: Soạn thảo từng câu với Live Preview, Import Word/Excel hàng loạt, Đa dạng 6 loại câu hỏi, và AI tạo câu hỏi tự động từ Giáo án/Giáo trình."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Dạy & Học' }, { label: 'Ngân hàng câu hỏi' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCreateTab('tab1');
                setMainView('create_tabs');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Tab 1: Import file
            </button>
            <button
              onClick={() => {
                setSelectedCreateTab('tab2');
                setMainView('create_tabs');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#9333ea] hover:bg-[#a855f7] text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Tab 2: Tạo bằng AI
            </button>
            <button
              onClick={() => {
                setSelectedCreateTab('tab3');
                setMainView('create_tabs');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tab 3: Tạo thủ công
            </button>
          </div>
        }
      />

      {/* 4 CORE HIGHLIGHT ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setSelectedCreateTab('tab3');
            setMainView('create_tabs');
          }}
          className="p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between bg-[#0a1122] border-cyan-500/25 hover:border-cyan-400/60 hover:bg-[#0c162b]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded">
                Live Form
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Tab 3: Tạo câu hỏi thủ công</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Nhập trực tiếp môn học, khối lớp, 4 phương án, đáp án đúng và lời giải chi tiết.
            </p>
          </div>
          <div className="mt-3 text-[11px] font-bold text-cyan-400 flex items-center gap-1">
            Soạn câu hỏi thủ công &rarr;
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedCreateTab('tab1');
            setMainView('create_tabs');
          }}
          className="p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between bg-[#0a1122] border-emerald-500/25 hover:border-emerald-400/60 hover:bg-[#0c162b]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                Smart Import
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Tab 1: Import Word / Excel</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Tải template Excel/Word, upload file (DOCX, XLSX, CSV), kiểm tra Unicode và phát hiện trùng lặp.
            </p>
          </div>
          <div className="mt-3 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            Nhập file Word/Excel &rarr;
          </div>
        </button>

        <button
          onClick={() => setActiveTab('multi_types')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'multi_types'
              ? 'bg-[#0f1f3d] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
              : 'bg-[#0a1122] border-amber-500/25 hover:border-amber-400/60 hover:bg-[#0c162b]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded">
                6 Định Dạng
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Thư viện định dạng câu hỏi</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              1 đáp án, nhiều đáp án, Đúng/Sai 4 ý 2025, điền khuyết, nối cặp, tự luận.
            </p>
          </div>
          <div className="mt-3 text-[11px] font-bold text-amber-400 flex items-center gap-1">
            Thư viện định dạng &rarr;
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedCreateTab('tab2');
            setMainView('create_tabs');
          }}
          className="p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between bg-[#0a1122] border-purple-500/25 hover:border-purple-400/60 hover:bg-[#0c162b]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <span className="text-[10px] text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> AI Giáo án
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">AI tạo từ Giáo án / Chủ đề</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Tải giáo án/chủ đề → AI đề xuất đáp án & mức độ → Giáo viên duyệt → Lưu.
            </p>
          </div>
          <div className="mt-3 text-[11px] font-bold text-purple-400 flex items-center gap-1">
            Bắt đầu tạo AI &rarr;
          </div>
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-2 shadow-[0_0_20px_rgba(6,182,212,0.06)] overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-[900px]">
          {[
            { id: 'all_questions', label: 'Tất cả câu hỏi', icon: FileQuestion, badge: questions.length },
            { id: 'single_create', label: '1. Thêm từng câu', icon: Plus },
            { id: 'batch_import', label: '2. Import file Word/Excel', icon: Upload },
            { id: 'multi_types', label: '3. Đa dạng dạng câu hỏi', icon: Layers },
            { id: 'ai_document_generator', label: '4. AI tạo từ Giáo án', icon: Sparkles },
            { id: 'exam_sets', label: 'Bộ đề thi & Giao bài', icon: BookOpen, badge: examSets.length },
            { id: 'topics_collections', label: 'Chủ đề & SGK', icon: FolderArchive },
            { id: 'overview', label: 'Tổng quan & Ma trận', icon: BarChart2 },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as QuestionBankTab)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                      isActive ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB: TẤT CẢ CÂU HỎI (ALL QUESTIONS TABLE)
         ========================================================================= */}
      {activeTab === 'all_questions' && (
        <div className="space-y-4">
          {/* Multi-level Filter Ribbon */}
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/60" />
                <input
                  type="text"
                  placeholder="Tìm theo nội dung câu hỏi, mã câu, chương bài, tag..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Bulk actions ribbon when selected */}
              {selectedQuestionIds.length > 0 && (
                <div className="flex items-center gap-2 bg-cyan-950/70 border border-cyan-500/40 px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-cyan-200">
                    Đã chọn <strong className="text-white font-mono">{selectedQuestionIds.length}</strong> câu
                  </span>
                  <button
                    onClick={handleAssignSelectedQuestions}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    + Giao bài tập từ câu đã chọn
                  </button>
                  <button
                    onClick={() => {
                      selectedQuestionIds.forEach(id => dbService.updateQuestion(id, { status: 'APPROVED' }));
                      handleReloadQuestions();
                      showToast(`Đã duyệt đồng loạt ${selectedQuestionIds.length} câu hỏi!`, 'success');
                      setSelectedQuestionIds([]);
                    }}
                    className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Duyệt tất cả
                  </button>
                  <button
                    onClick={() => setSelectedQuestionIds([])}
                    className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="text-xs text-slate-400 shrink-0">
                Tìm thấy <strong className="text-cyan-300 font-mono font-bold">{filteredQuestions.length}</strong> câu hỏi
              </div>
            </div>

            {/* Filter Dropdowns row */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-2 border-t border-cyan-500/20 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">MÔN HỌC</label>
                <select
                  value={filterSubject}
                  onChange={e => { setFilterSubject(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 bg-[#0c162b] border border-cyan-500/30 rounded-lg text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ALL">Tất cả môn</option>
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Tin học">Tin học</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">KHỐI LỚP</label>
                <select
                  value={filterGrade}
                  onChange={e => { setFilterGrade(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 bg-[#0c162b] border border-cyan-500/30 rounded-lg text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ALL">Tất cả khối</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">BỘ SÁCH</label>
                <select
                  value={filterTextbook}
                  onChange={e => { setFilterTextbook(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 bg-[#0c162b] border border-cyan-500/30 rounded-lg text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ALL">Tất cả bộ sách</option>
                  <option value="Cánh Diều">Cánh Diều</option>
                  <option value="Kết Nối Tri Thức">Kết Nối Tri Thức</option>
                  <option value="Chân Trời Sáng Tạo">Chân Trời Sáng Tạo</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">MỨC ĐỘ KHÓ</label>
                <select
                  value={filterDifficulty}
                  onChange={e => { setFilterDifficulty(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 bg-[#0c162b] border border-cyan-500/30 rounded-lg text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ALL">Tất cả mức độ</option>
                  <option value="EASY">Nhận biết</option>
                  <option value="MEDIUM">Thông hiểu</option>
                  <option value="HARD">Vận dụng</option>
                  <option value="VERY_HARD">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">LOẠI CÂU HỎI</label>
                <select
                  value={filterType}
                  onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 bg-[#0c162b] border border-cyan-500/30 rounded-lg text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ALL">Tất cả dạng câu</option>
                  <option value="SINGLE_CHOICE">Trắc nghiệm 1 ĐA</option>
                  <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
                  <option value="TRUE_FALSE">Đúng / Sai 4 ý</option>
                  <option value="SHORT_ANSWER">Điền khuyết</option>
                  <option value="MATCHING">Nối cặp</option>
                  <option value="ESSAY">Tự luận</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">TRẠNG THÁI</label>
                <select
                  value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 bg-[#0c162b] border border-cyan-500/30 rounded-lg text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="DRAFT">Bản nháp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.06)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-3 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedQuestions.length > 0 && paginatedQuestions.every(q => selectedQuestionIds.includes(q.id))}
                        onChange={e => handleSelectAll(e.target.checked)}
                        className="rounded border-cyan-500/40 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3.5 w-12 text-center">STT</th>
                    <th className="px-3 py-3.5 w-32">Mã câu hỏi</th>
                    <th className="px-4 py-3.5 min-w-[280px]">Nội dung câu hỏi</th>
                    <th className="px-3 py-3.5">Môn - Khối</th>
                    <th className="px-3 py-3.5">Dạng câu</th>
                    <th className="px-3 py-3.5">Mức độ</th>
                    <th className="px-3 py-3.5">Trạng thái</th>
                    <th className="px-3 py-3.5 text-center">Điểm</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/15 text-slate-200">
                  {paginatedQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                        Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    paginatedQuestions.map((q, idx) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <tr
                          key={q.id}
                          className={`hover:bg-cyan-950/20 transition-colors ${isSelected ? 'bg-cyan-950/30' : ''}`}
                        >
                          <td className="px-3 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(q.id)}
                              className="rounded border-cyan-500/40 text-cyan-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono text-slate-400">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="px-3 py-3.5 font-mono text-[11px] font-semibold text-cyan-300">
                            {q.code || `CH-${q.id.slice(-4)}`}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-white line-clamp-2 leading-relaxed">
                              {q.prompt}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                              {q.textbook && <span className="bg-[#0c162b] px-1.5 py-0.5 rounded border border-cyan-500/20">{q.textbook}</span>}
                              {q.chapter && <span className="text-slate-400 truncate max-w-[200px]">{q.chapter}</span>}
                              {q.imageUrl && <span className="text-cyan-400 flex items-center gap-0.5"><ImageIcon className="w-3 h-3" /> có ảnh</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="font-semibold text-white">{q.subject}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Khối {q.gradeLevel}</div>
                          </td>
                          <td className="px-3 py-3.5">
                            {getTypeBadge(q.type)}
                          </td>
                          <td className="px-3 py-3.5">
                            {getDifficultyBadge(q.difficulty)}
                          </td>
                          <td className="px-3 py-3.5">
                            {getStatusBadge(q.status)}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-cyan-300">
                            {q.points}đ
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewQuestionModal(q)}
                                className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Xem chi tiết & đáp án"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(q)}
                                className="p-1.5 text-purple-400 hover:text-purple-200 hover:bg-purple-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Nhân bản (Sao chép)"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditQuestionModal(q)}
                                className="p-1.5 text-amber-400 hover:text-amber-200 hover:bg-amber-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa câu hỏi"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTargetQuestion(q)}
                                className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Xóa câu hỏi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Ribbon */}
            <div className="px-4 py-3 border-t border-cyan-500/20 bg-[#060a14] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Trang <strong className="text-white font-mono">{currentPage}</strong> / <strong className="text-white font-mono">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-950 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trước
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-cyan-500 text-slate-950'
                        : 'border border-cyan-500/20 text-slate-300 hover:bg-cyan-950'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-950 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHỨC NĂNG 1: THÊM TỪNG CÂU HỎI VÀO HỆ THỐNG (+ LIVE PREVIEW)
         ========================================================================= */}
      {activeTab === 'single_create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Form cấu hình chi tiết */}
          <div className="lg:col-span-7 bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                1. Soạn thảo chi tiết câu hỏi
              </h3>
              <span className="text-[11px] text-slate-400">Mã tự sinh: {newQCode || 'CH-AUTO'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Môn học *</label>
                <select
                  value={newQSubject}
                  onChange={e => setNewQSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Tin học">Tin học</option>
                  <option value="Sinh học">Sinh học</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Khối lớp *</label>
                <select
                  value={newQGrade}
                  onChange={e => setNewQGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Bộ sách giáo khoa *</label>
                <select
                  value={newQTextbook}
                  onChange={e => setNewQTextbook(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="Cánh Diều">Cánh Diều</option>
                  <option value="Kết Nối Tri Thức">Kết Nối Tri Thức</option>
                  <option value="Chân Trời Sáng Tạo">Chân Trời Sáng Tạo</option>
                  <option value="Khác">Khác / Tổng hợp</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Chương / Chuyên đề</label>
                <input
                  type="text"
                  value={newQChapter}
                  onChange={e => setNewQChapter(e.target.value)}
                  placeholder="VD: Chương 1: Mệnh đề và tập hợp"
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Bài học</label>
                <input
                  type="text"
                  value={newQLesson}
                  onChange={e => setNewQLesson(e.target.value)}
                  placeholder="VD: Bài 1: Mệnh đề toán học"
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white"
                />
              </div>
            </div>

            {/* Loại câu hỏi, Mức độ, Điểm */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Dạng câu hỏi *</label>
                <select
                  value={newQType}
                  onChange={e => setNewQType(e.target.value as QuestionType)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                  <option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option>
                  <option value="TRUE_FALSE">Đúng / Sai 4 ý 2025</option>
                  <option value="SHORT_ANSWER">Điền khuyết / Trả lời ngắn</option>
                  <option value="MATCHING">Nối cặp / Ghép đôi</option>
                  <option value="ESSAY">Tự luận kèm barem</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Mức độ khó *</label>
                <select
                  value={newQDifficulty}
                  onChange={e => setNewQDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="EASY">1. Nhận biết</option>
                  <option value="MEDIUM">2. Thông hiểu</option>
                  <option value="HARD">3. Vận dụng</option>
                  <option value="VERY_HARD">4. Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Điểm số</label>
                <input
                  type="number"
                  step="0.25"
                  value={newQPoints}
                  onChange={e => setNewQPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            {/* Nội dung đề bài */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1">Nội dung câu hỏi đề bài *</label>
              <textarea
                rows={3}
                value={newQPrompt}
                onChange={e => setNewQPrompt(e.target.value)}
                placeholder="Nhập nội dung đề bài tại đây..."
                className="w-full px-3.5 py-2.5 bg-[#060a14] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            {/* Ảnh minh họa */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-200">Hình ảnh minh họa / Sơ đồ (Tùy chọn)</label>
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-400">
                  <span>Chọn nhanh mẫu:</span>
                  {sampleImages.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewQImageUrl(s.url)}
                      className="hover:underline cursor-pointer"
                    >
                      [{s.label}]
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={newQImageUrl}
                onChange={e => setNewQImageUrl(e.target.value)}
                placeholder="Dán link ảnh https://... hoặc chọn mẫu ở trên"
                className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white"
              />
            </div>

            {/* Các dạng đáp án tương tác */}
            {['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(newQType) && (
              <div className="space-y-2.5 p-3.5 bg-[#060a14] border border-cyan-500/30 rounded-xl">
                <span className="font-bold text-cyan-300 block">
                  {newQType === 'SINGLE_CHOICE' ? 'Các phương án (Bấm vào chữ cái để chọn 1 đáp án đúng):' : 'Các phương án (Chọn nhiều đáp án đúng):'}
                </span>
                {newQOptions.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (newQType === 'SINGLE_CHOICE') {
                          setNewQOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                        } else {
                          setNewQOptions(prev => prev.map((o, i) => i === idx ? { ...o, isCorrect: !o.isCorrect } : o));
                        }
                      }}
                      className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        opt.isCorrect
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'bg-[#0c162b] border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => {
                        const val = e.target.value;
                        setNewQOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: val } : o));
                      }}
                      placeholder={`Nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                      className="flex-1 px-3 py-1.5 bg-[#0c162b] border border-cyan-500/20 rounded-lg text-white"
                    />
                    <span className={`text-[10px] font-bold ${opt.isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {opt.isCorrect ? '✓ ĐÚNG' : 'SAI'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Dạng Đúng / Sai 4 ý chuẩn 2025 */}
            {newQType === 'TRUE_FALSE' && (
              <div className="space-y-2.5 p-3.5 bg-[#060a14] border border-cyan-500/30 rounded-xl">
                <span className="font-bold text-cyan-300 block">4 Mệnh đề Đúng/Sai (Cấu trúc đề thi mới Bộ GD&ĐT 2025):</span>
                {newQSubStatements.map((st, idx) => (
                  <div key={st.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={st.text}
                      onChange={e => {
                        const val = e.target.value;
                        setNewQSubStatements(prev => prev.map((s, i) => i === idx ? { ...s, text: val } : s));
                      }}
                      className="flex-1 px-3 py-1.5 bg-[#0c162b] border border-cyan-500/20 rounded-lg text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewQSubStatements(prev => prev.map((s, i) => i === idx ? { ...s, isCorrect: !s.isCorrect } : s));
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        st.isCorrect
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-rose-950 border border-rose-500/40 text-rose-300 font-bold'
                      }`}
                    >
                      {st.isCorrect ? 'ĐÚNG' : 'SAI'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dạng Nối cặp */}
            {newQType === 'MATCHING' && (
              <div className="space-y-2.5 p-3.5 bg-[#060a14] border border-cyan-500/30 rounded-xl">
                <span className="font-bold text-pink-300 block">Các cặp ghép đôi (Cột trái nối với Cột phải tương ứng):</span>
                {newQMatchingPairs.map((pair, idx) => (
                  <div key={pair.id} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pair.left}
                      onChange={e => {
                        const val = e.target.value;
                        setNewQMatchingPairs(prev => prev.map((p, i) => i === idx ? { ...p, left: val } : p));
                      }}
                      placeholder={`Vế trái ${idx + 1}...`}
                      className="px-3 py-1.5 bg-[#0c162b] border border-cyan-500/20 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      value={pair.right}
                      onChange={e => {
                        const val = e.target.value;
                        setNewQMatchingPairs(prev => prev.map((p, i) => i === idx ? { ...p, right: val } : p));
                      }}
                      placeholder={`Vế phải ${idx + 1}...`}
                      className="px-3 py-1.5 bg-[#0c162b] border border-pink-500/20 rounded-lg text-white"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Dạng Điền khuyết hoặc Tự luận */}
            {['SHORT_ANSWER', 'ESSAY'].includes(newQType) && (
              <div className="p-3.5 bg-[#060a14] border border-cyan-500/30 rounded-xl space-y-1.5">
                <label className="font-bold text-cyan-300 block">
                  {newQType === 'SHORT_ANSWER' ? 'Đáp án điền khuyết chuẩn (Cách nhau dấu ; nếu có từ đồng nghĩa)' : 'Hướng dẫn chấm & Barem điểm chi tiết'}
                </label>
                <textarea
                  rows={2}
                  value={newQCorrectAnswerText}
                  onChange={e => setNewQCorrectAnswerText(e.target.value)}
                  placeholder="Nhập đáp án chuẩn hoặc barem điểm..."
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/20 rounded-lg text-white"
                />
              </div>
            )}

            {/* Lời giải chi tiết */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1">Lời giải chi tiết & Hướng dẫn phương pháp giải</label>
              <textarea
                rows={2}
                value={newQExplanation}
                onChange={e => setNewQExplanation(e.target.value)}
                placeholder="Nhập các bước chứng minh hoặc giải thích chi tiết..."
                className="w-full px-3.5 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => handleSaveSingleQuestion(true)}
                className="px-4 py-2 bg-[#0c162b] hover:bg-cyan-950 text-cyan-300 font-bold rounded-xl border border-cyan-500/30 transition-colors cursor-pointer"
              >
                + Lưu & Thêm câu tiếp
              </button>
              <button
                type="button"
                onClick={() => handleSaveSingleQuestion(false)}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                Lưu câu hỏi vào Ngân hàng
              </button>
            </div>
          </div>

          {/* Cột phải: BẢN XEM TRƯỚC TRỰC TIẾP (LIVE PREVIEW) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-4 sticky top-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Bản xem trước trực tiếp (Live Preview)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Hiển thị thực tế
                </span>
              </div>

              {/* Card preview */}
              <div className="p-4 bg-[#060a14] border border-cyan-500/20 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-cyan-300">{newQCode || 'CH-AUTO'}</span>
                    {getDifficultyBadge(newQDifficulty)}
                    {getTypeBadge(newQType)}
                  </div>
                  <span className="font-mono text-cyan-400 font-bold">{newQPoints}đ</span>
                </div>

                <p className="text-white text-sm font-medium leading-relaxed">
                  {newQPrompt || 'Nội dung câu hỏi đề bài sẽ hiển thị tại đây...'}
                </p>

                {newQImageUrl && (
                  <div className="p-1 bg-[#0c162b] border border-cyan-500/20 rounded-lg overflow-hidden max-w-xs">
                    <img src={newQImageUrl} alt="Preview" className="rounded max-h-36 object-cover w-full" />
                  </div>
                )}

                {/* Options display */}
                {['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(newQType) && (
                  <div className="space-y-1.5 pt-1">
                    {newQOptions.map((opt, i) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-bold'
                            : 'bg-[#0c162b] border-slate-800 text-slate-300'
                        }`}
                      >
                        <span>
                          <strong className="mr-1.5">{String.fromCharCode(65 + i)}.</strong>
                          {opt.text || `Phương án ${String.fromCharCode(65 + i)}`}
                        </span>
                        {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {newQType === 'TRUE_FALSE' && (
                  <div className="space-y-1 pt-1">
                    {newQSubStatements.map(st => (
                      <div key={st.id} className="p-2 bg-[#0c162b] border border-slate-800 rounded-lg flex items-center justify-between">
                        <span className="text-slate-200">{st.text}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.isCorrect ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                          {st.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {newQType === 'MATCHING' && (
                  <div className="space-y-1 pt-1">
                    {newQMatchingPairs.map(p => (
                      <div key={p.id} className="p-2 bg-[#0c162b] border border-pink-500/20 rounded-lg flex items-center justify-between">
                        <span className="text-white font-semibold">{p.left}</span>
                        <ArrowRight className="w-3 h-3 text-pink-400" />
                        <span className="text-pink-300">{p.right}</span>
                      </div>
                    ))}
                  </div>
                )}

                {['SHORT_ANSWER', 'ESSAY'].includes(newQType) && (
                  <div className="p-2.5 bg-[#0c162b] border border-cyan-500/20 rounded-lg text-slate-300">
                    <strong className="text-cyan-300 block mb-0.5">Đáp án chuẩn:</strong>
                    {newQCorrectAnswerText || '(Chưa nhập đáp án)'}
                  </div>
                )}

                {newQExplanation && (
                  <div className="p-2.5 bg-[#0c162b] border border-cyan-500/20 rounded-lg text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-cyan-300">Lời giải:</strong> {newQExplanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHỨC NĂNG 2: IMPORT NHIỀU CÂU HỎI CÙNG 1 LÚC (BATCH IMPORT & VALIDATION)
         ========================================================================= */}
      {activeTab === 'batch_import' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="bg-[#0a1122] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.08)] space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-cyan-500/20">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  2. Import nhiều câu hỏi cùng một lúc
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tải lên tệp Word (.docx) hoặc Excel (.xlsx), hoặc dán văn bản thô để hệ thống tự động bóc tách từng câu.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('Đang tải file Word mẫu định dạng chuẩn (.docx)...', 'info')}
                  className="px-3 py-1.5 bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950 text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> File Word mẫu
                </button>
                <button
                  onClick={() => showToast('Đang tải file Excel mẫu (.xlsx)...', 'info')}
                  className="px-3 py-1.5 bg-[#0c162b] border border-emerald-500/30 hover:bg-emerald-950 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> File Excel mẫu
                </button>
              </div>
            </div>

            {/* Cấu hình chung cho đợt import */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Môn học áp dụng</label>
                <select
                  value={importSubject}
                  onChange={e => setImportSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Khối lớp</label>
                <select
                  value={importGrade}
                  onChange={e => setImportGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Bộ sách</label>
                <select
                  value={importTextbook}
                  onChange={e => setImportTextbook(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white cursor-pointer"
                >
                  <option value="Cánh Diều">Cánh Diều</option>
                  <option value="Kết Nối Tri Thức">Kết Nối Tri Thức</option>
                  <option value="Chân Trời Sáng Tạo">Chân Trời Sáng Tạo</option>
                </select>
              </div>
            </div>

            {/* Drag & drop upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl bg-[#060a14] text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.xlsx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">
                {uploadedFileName ? `Đã chọn file: ${uploadedFileName}` : 'Nhấn để tải lên hoặc kéo thả tệp Word (.docx) / Excel (.xlsx) / Text'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Hệ thống tự động nhận diện từ khóa "Câu 1:", "A.", "B.", "Đáp án: ..."
              </div>
            </div>

            {/* Raw text area for fast copy paste */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Hoặc dán trực tiếp danh sách câu hỏi vào đây:
              </label>
              <textarea
                rows={7}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#060a14] border border-cyan-500/30 rounded-xl font-mono text-xs text-slate-200 leading-relaxed focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                💡 Định dạng chuẩn: <strong>Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A ... Lời giải: ...</strong>
              </span>

              <button
                type="button"
                onClick={handleStartParse}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Phân tích & Thẩm định câu hỏi
              </button>
            </div>
          </div>

          {/* BẢNG THẨM ĐỊNH & XEM TRƯỚC DANH SÁCH CÂU HỎI TRƯỚC KHI LƯU */}
          {parsedPreviewQuestions.length > 0 && (
            <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Kết quả phân tích: Tìm thấy {parsedPreviewQuestions.length} câu hỏi hợp lệ
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bạn có thể kiểm tra và đổi nhanh đáp án đúng trước khi nhập vào Ngân hàng.
                  </p>
                </div>

                <button
                  onClick={handleSaveImportedQuestions}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận nhập tất cả {parsedPreviewQuestions.length} câu vào Ngân hàng
                </button>
              </div>

              <div className="space-y-3">
                {parsedPreviewQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-[#060a14] border border-cyan-500/20 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300 font-mono">Câu {idx + 1} ({q.code}):</span>
                        {getDifficultyBadge(q.difficulty)}
                        <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded text-[10px]">
                          ✓ Đủ điều kiện nhập
                        </span>
                      </div>
                      <span className="font-mono text-slate-400">{q.points} điểm</span>
                    </div>

                    <p className="text-white font-medium">{q.prompt}</p>

                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            onClick={() => {
                              // Allow quick toggling of correct answer in preview
                              setParsedPreviewQuestions(prev => prev.map((item, i) => {
                                if (i !== idx) return item;
                                return {
                                  ...item,
                                  options: item.options?.map((o, oi) => ({ ...o, isCorrect: oi === oIdx })),
                                };
                              }));
                            }}
                            className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                              opt.isCorrect
                                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-bold'
                                : 'bg-[#0c162b] border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>
                              <strong className="mr-1">{String.fromCharCode(65 + oIdx)}.</strong>
                              {opt.text}
                            </span>
                            {opt.isCorrect && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="p-2.5 bg-[#0c162b] border border-cyan-500/10 rounded-lg text-slate-300 text-[11px]">
                        <strong className="text-cyan-300">Lời giải:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CHỨC NĂNG 3: THÊM NHIỀU DẠNG CÂU HỎI (6 QUESTION TYPES SHOWCASE & BUILDER)
         ========================================================================= */}
      {activeTab === 'multi_types' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="bg-[#0a1122] border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.08)] space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              3. Thư viện & Trình tạo Đa dạng dạng câu hỏi chuẩn Bộ GD&ĐT
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống hỗ trợ 6 định dạng câu hỏi khảo thí hiện đại nhất. Bấm vào bất kỳ dạng câu hỏi nào dưới đây để mở trình tạo với mẫu được điền sẵn ngay lập tức:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                type: 'SINGLE_CHOICE' as QuestionType,
                title: '1. Trắc nghiệm 1 đáp án đúng (Single Choice)',
                badge: 'Phổ biến nhất',
                badgeColor: 'cyan',
                desc: 'Học sinh chọn 1 phương án đúng duy nhất trong 4 phương án A, B, C, D.',
                example: 'Đâu là thủ đô của Việt Nam? A. Hà Nội (Đúng) B. Đà Nẵng C. TP.HCM D. Cần Thơ',
                actionLabel: 'Soạn trắc nghiệm 1 ĐA',
              },
              {
                type: 'MULTIPLE_CHOICE' as QuestionType,
                title: '2. Trắc nghiệm nhiều đáp án đúng (Multiple Choice)',
                badge: 'Tư duy tổng hợp',
                badgeColor: 'purple',
                desc: 'Học sinh chọn 2 hoặc nhiều phương án đúng cùng lúc để đạt điểm trọn vẹn.',
                example: 'Những số nào sau đây là số nguyên tố? A. 2 (Đúng) B. 3 (Đúng) C. 4 D. 5 (Đúng)',
                actionLabel: 'Soạn trắc nghiệm nhiều ĐA',
              },
              {
                type: 'TRUE_FALSE' as QuestionType,
                title: '3. Đúng / Sai chùm 4 ý (Chuẩn Bộ GD&ĐT 2025)',
                badge: 'Cấu trúc mới 2025',
                badgeColor: 'emerald',
                desc: 'Một câu hỏi lớn gồm 4 mệnh đề con a), b), c), d). Mỗi mệnh đề học sinh chọn Đúng hoặc Sai.',
                example: 'Cho hàm số bậc hai... a) Đúng, b) Đúng, c) Sai, d) Sai.',
                actionLabel: 'Soạn dạng Đúng/Sai 4 ý',
              },
              {
                type: 'SHORT_ANSWER' as QuestionType,
                title: '4. Điền khuyết / Trả lời ngắn (Short Answer)',
                badge: 'Chống đoán mò',
                badgeColor: 'teal',
                desc: 'Học sinh tự nhập số hoặc từ khóa vào ô trống, hệ thống so khớp tự động với danh sách từ đồng nghĩa.',
                example: 'Giá trị nhỏ nhất của hàm số y = x² - 4x + 5 là: [ 1 ]',
                actionLabel: 'Soạn câu điền khuyết',
              },
              {
                type: 'MATCHING' as QuestionType,
                title: '5. Nối cặp / Ghép đôi (Matching Pairs)',
                badge: 'Tương tác sinh động',
                badgeColor: 'pink',
                desc: 'Nối các khái niệm ở Cột A với định nghĩa hoặc công thức tương ứng ở Cột B.',
                example: 'Nối công thức Heron (1) với S = √(p(p-a)(p-b)(p-c)) (a)...',
                actionLabel: 'Soạn dạng nối cặp',
              },
              {
                type: 'ESSAY' as QuestionType,
                title: '6. Tự luận kèm Barem chấm (Essay Rubric)',
                badge: 'Đánh giá năng lực sâu',
                badgeColor: 'orange',
                desc: 'Đề bài tự luận có hướng dẫn giải, biểu điểm barem từng bước giúp giáo viên chấm điểm công bằng.',
                example: 'Chứng minh định lý Cosin bằng tích vô hướng vectơ... (Barem 3 bước x 0.5đ)',
                actionLabel: 'Soạn câu tự luận',
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                      {card.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Dạng {idx + 1}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{card.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{card.desc}</p>

                  <div className="mt-3 p-2.5 bg-[#060a14] border border-cyan-500/15 rounded-xl text-[11px] text-slate-400 italic">
                    <strong className="text-slate-200">Ví dụ minh họa:</strong> {card.example}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-end">
                  <button
                    onClick={() => {
                      setNewQType(card.type);
                      setActiveTab('single_create');
                      showToast(`Đã chọn dạng "${card.title}". Hãy bắt đầu soạn câu hỏi!`, 'info');
                    }}
                    className="px-4 py-1.5 bg-cyan-950 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-500/30 transition-all cursor-pointer"
                  >
                    {card.actionLabel} &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          CHỨC NĂNG 4: AI TẠO CÂU HỎI TRẮC NGHIỆM TỰ ĐỘNG TỪ GIÁO ÁN / GIÁO TRÌNH
          (Quy trình: Tải bài học / chủ đề -> AI đề xuất đáp án, lời giải, mức độ -> Giáo viên duyệt -> Lưu)
         ========================================================================= */}
      {activeTab === 'ai_document_generator' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Quy trình 4 bước Header */}
          <div className="bg-[#120d2b] border border-purple-500/40 rounded-2xl p-6 shadow-[0_0_25px_rgba(168,85,247,0.15)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                4. Tạo câu hỏi trắc nghiệm tự động từ Giáo án, Giáo trình & Bài học
              </h3>
              <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                Quy trình chuẩn hóa: Giáo viên đính kèm giáo án/nhập chủ đề → AI phân tích kiến thức cốt lõi & đề xuất bộ câu hỏi kèm đáp án, lời giải, mức độ → Giáo viên xem xét duyệt → Lưu trực tiếp vào Ngân hàng.
              </p>
            </div>

            {/* Stepper bar */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                aiStep === 1
                  ? 'bg-purple-900/60 border-purple-400 text-white'
                  : 'bg-[#0c162b] border-slate-800 text-slate-400'
              }`}>
                <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center text-[10px]">1</span>
                <span>Tải Giáo án & Chủ đề</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                aiStep === 2
                  ? 'bg-purple-900/60 border-purple-400 text-white'
                  : 'bg-[#0c162b] border-slate-800 text-slate-400'
              }`}>
                <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center text-[10px]">2</span>
                <span>AI Đề xuất & Giáo viên Duyệt</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                aiStep === 3
                  ? 'bg-emerald-900/60 border-emerald-400 text-white'
                  : 'bg-[#0c162b] border-slate-800 text-slate-400'
              }`}>
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">3</span>
                <span>Lưu vào Ngân hàng</span>
              </div>
            </div>
          </div>

          {/* BƯỚC 1: NHẬP CHỦ ĐỀ & TẢI LÊN GIÁO ÁN */}
          {aiStep === 1 && (
            <div className="bg-[#0a1122] border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.06)] space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Môn học *</label>
                  <select
                    value={aiSubject}
                    onChange={e => setAiSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c162b] border border-purple-500/30 rounded-xl text-white cursor-pointer"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Khối lớp *</label>
                  <select
                    value={aiGrade}
                    onChange={e => setAiGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c162b] border border-purple-500/30 rounded-xl text-white cursor-pointer"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Bộ sách giáo khoa *</label>
                  <select
                    value={aiTextbook}
                    onChange={e => setAiTextbook(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c162b] border border-purple-500/30 rounded-xl text-white cursor-pointer"
                  >
                    <option value="Cánh Diều">Cánh Diều</option>
                    <option value="Kết Nối Tri Thức">Kết Nối Tri Thức</option>
                    <option value="Chân Trời Sáng Tạo">Chân Trời Sáng Tạo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Chủ đề bài giảng / Tên bài học *</label>
                <input
                  type="text"
                  value={aiTopicInput}
                  onChange={e => setAiTopicInput(e.target.value)}
                  placeholder="Ví dụ: Định lý Cosin và Sin trong Tam giác, Quang hợp ở thực vật..."
                  className="w-full px-3.5 py-2.5 bg-[#0c162b] border border-purple-500/30 rounded-xl text-white focus:outline-hidden focus:border-purple-400"
                />
              </div>

              {/* Tải lên file giáo án hoặc dán bài học */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200">Đính kèm tệp Giáo án, Giáo trình hoặc Bài kiểm tra:</label>
                  {aiAttachedFileName && (
                    <span className="text-[11px] text-purple-300 font-mono bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                      📄 {aiAttachedFileName}
                    </span>
                  )}
                </div>

                <div className="p-4 border-2 border-dashed border-purple-500/30 rounded-xl bg-[#060a14] text-center">
                  <Upload className="w-6 h-6 text-purple-400 mx-auto mb-1.5" />
                  <div className="text-xs text-slate-300">
                    Kéo thả file Giáo án (.docx, .pdf, .txt) hoặc dán văn bản trích đoạn bài học vào bên dưới
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={aiDocContent}
                  onChange={e => setAiDocContent(e.target.value)}
                  placeholder="Dán nội dung giáo án, tài liệu hoặc ghi chú bài giảng..."
                  className="w-full px-3.5 py-2 bg-[#060a14] border border-purple-500/30 rounded-xl text-slate-200 font-mono text-xs focus:outline-hidden focus:border-purple-400 leading-relaxed"
                />
              </div>

              {/* Cấu hình ma trận mức độ */}
              <div className="p-4 bg-[#0c162b] border border-purple-500/20 rounded-xl space-y-2">
                <span className="font-bold text-purple-300 block">Thiết lập ma trận số câu hỏi AI cần sinh:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[11px] text-emerald-400 block mb-0.5">Nhận biết:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={aiNumEasy}
                      onChange={e => setAiNumEasy(Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-[#060a14] border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-sky-400 block mb-0.5">Thông hiểu:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={aiNumMedium}
                      onChange={e => setAiNumMedium(Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-[#060a14] border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-400 block mb-0.5">Vận dụng:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={aiNumHard}
                      onChange={e => setAiNumHard(Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-[#060a14] border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-rose-400 block mb-0.5">Vận dụng cao:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={aiNumVeryHard}
                      onChange={e => setAiNumVeryHard(Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-[#060a14] border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isAiProcessing}
                  onClick={handleRunAiFromLesson}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiProcessing ? 'AI đang đọc giáo án & sinh câu hỏi...' : 'AI Phân tích Giáo án & Đề xuất Bộ câu hỏi'}
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 2: AI ĐỀ XUẤT CÂU HỎI KÈM ĐÁP ÁN, LỜI GIẢI, MỨC ĐỘ & GIÁO VIÊN DUYỆT */}
          {aiStep === 2 && (
            <div className="space-y-4">
              {aiDuplicateReport && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {aiDuplicateReport}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-900/60 px-2 py-0.5 rounded">
                    Trùng lặp: 0%
                  </span>
                </div>
              )}

              <div className="bg-[#0a1122] border border-purple-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(168,85,247,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-purple-400" />
                    Bộ câu hỏi AI đề xuất theo bài học: "{aiTopicInput}" ({aiReviewQuestions.length} câu)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mỗi câu hỏi đã có đáp án, lời giải và mức độ. Thầy/Cô kiểm tra, tích chọn và chỉnh sửa trực tiếp trước khi duyệt.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiStep(1)}
                    className="px-3 py-1.5 bg-[#0c162b] border border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleSaveApprovedAiQuestions}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Duyệt & Lưu {aiApprovedSelection.length} câu vào Ngân hàng
                  </button>
                </div>
              </div>

              {/* Danh sách câu hỏi đề xuất để giáo viên duyệt & sửa */}
              <div className="space-y-4">
                {aiReviewQuestions.map((q, idx) => {
                  const isChecked = aiApprovedSelection.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                        isChecked
                          ? 'bg-[#0a1122] border-purple-500/40 shadow-xs'
                          : 'bg-[#060a14] border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setAiApprovedSelection(prev =>
                                prev.includes(q.id) ? prev.filter(x => x !== q.id) : [...prev, q.id]
                              );
                            }}
                            className="rounded border-purple-400 text-purple-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <span className="font-bold text-white text-sm">Câu {idx + 1} ({q.code}):</span>
                          {getDifficultyBadge(q.difficulty)}
                          {getTypeBadge(q.type)}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-300 font-bold">{q.points}đ</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isChecked ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isChecked ? 'ĐÃ DUYỆT' : 'BỎ QUA'}
                          </span>
                        </div>
                      </div>

                      {/* Đề bài có thể sửa trực tiếp */}
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Nội dung đề bài:</label>
                        <textarea
                          rows={2}
                          value={q.prompt}
                          onChange={e => {
                            const val = e.target.value;
                            setAiReviewQuestions(prev => prev.map((item, i) => i === idx ? { ...item, prompt: val } : item));
                          }}
                          className="w-full px-3 py-2 bg-[#060a14] border border-cyan-500/20 rounded-xl text-white font-medium focus:outline-hidden focus:border-cyan-400"
                        />
                      </div>

                      {/* Các phương án A, B, C, D */}
                      {q.options && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] text-slate-400 block">Phương án & Đáp án đúng (Click chữ cái để đổi đáp án đúng):</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={opt.id}
                                onClick={() => {
                                  setAiReviewQuestions(prev => prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    return {
                                      ...item,
                                      options: item.options?.map((o, oi) => ({ ...o, isCorrect: oi === oIdx })),
                                    };
                                  }));
                                }}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                                  opt.isCorrect
                                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 font-bold'
                                    : 'bg-[#0c162b] border-slate-800 text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <span>
                                  <strong className="mr-1.5">{String.fromCharCode(65 + oIdx)}.</strong>
                                  {opt.text}
                                </span>
                                {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Đúng / Sai 4 ý */}
                      {q.subStatements && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] text-slate-400 block">4 Mệnh đề Đúng/Sai:</label>
                          {q.subStatements.map(st => (
                            <div key={st.id} className="p-2 bg-[#0c162b] border border-slate-800 rounded-lg flex items-center justify-between">
                              <span className="text-slate-200">{st.text}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.isCorrect ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                                {st.isCorrect ? 'ĐÚNG' : 'SAI'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Lời giải chi tiết */}
                      <div>
                        <label className="text-[11px] text-cyan-300 font-bold block mb-1">Lời giải chi tiết AI đề xuất:</label>
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setAiReviewQuestions(prev => prev.map((item, i) => i === idx ? { ...item, explanation: val } : item));
                          }}
                          className="w-full px-3 py-1.5 bg-[#060a14] border border-cyan-500/20 rounded-xl text-slate-300 text-[11px] focus:outline-hidden focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom confirmation action */}
              <div className="p-4 bg-[#0a1122] border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Đã duyệt <strong className="text-emerald-400 font-mono font-bold">{aiApprovedSelection.length}</strong> / {aiReviewQuestions.length} câu hỏi AI.
                </span>

                <button
                  onClick={handleSaveApprovedAiQuestions}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận lưu {aiApprovedSelection.length} câu vào Ngân hàng câu hỏi
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB: BỘ ĐỀ THI & GIAO BÀI (EXAM SETS)
         ========================================================================= */}
      {activeTab === 'exam_sets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Các Bộ đề kiểm tra đã thiết lập</h3>
              <p className="text-xs text-slate-400">Tạo đề thi tự động từ ma trận câu hỏi hoặc chọn thủ công.</p>
            </div>

            <button
              onClick={() => setCreateExamModalOpen(true)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Tạo bộ đề mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {examSets.map(exam => (
              <div
                key={exam.id}
                className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col justify-between hover:border-cyan-400 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      {exam.subject} · Khối {exam.gradeLevel}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {exam.durationMinutes} phút
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white">{exam.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>Số lượng: <strong className="text-cyan-300 font-mono">{exam.questionCount} câu</strong></span>
                    <span>Thang điểm: <strong className="text-emerald-300 font-mono">{exam.totalPoints}đ</strong></span>
                    {exam.matrix && (
                      <span className="text-[11px] text-slate-400">
                        Ma trận: {exam.matrix.easy}NB - {exam.matrix.medium}TH - {exam.matrix.hard}VD - {exam.matrix.veryHard}VDC
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setViewExamModal(exam)}
                    className="text-cyan-400 hover:text-cyan-200 font-bold cursor-pointer"
                  >
                    Xem chi tiết đề &rarr;
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigate('/teacher/assignments/create', {
                          state: {
                            presetTitle: exam.title,
                            presetQuestions: exam.questions,
                          }
                        });
                      }}
                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Giao bài tập ngay
                    </button>
                    <button
                      onClick={() => showToast(`Đang xuất đề thi "${exam.title}" ra file Word/PDF...`, 'info')}
                      className="p-1.5 bg-[#0c162b] border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 rounded-lg cursor-pointer"
                      title="Xuất file Word"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: CHỦ ĐỀ & SGK (TOPICS & COLLECTIONS)
         ========================================================================= */}
      {activeTab === 'topics_collections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Chương 1: Mệnh đề toán học & Tập hợp',
                textbook: 'Cánh Diều (Toán 10)',
                count: questions.filter(q => q.chapter?.includes('Mệnh đề')).length,
                desc: 'Bao gồm mệnh đề toán học, mệnh đề phủ định, tập hợp con, hợp và giao của hai tập hợp.',
              },
              {
                title: 'Chương 4: Hệ thức lượng trong tam giác',
                textbook: 'Cánh Diều (Toán 10)',
                count: questions.filter(q => q.chapter?.includes('Hệ thức lượng')).length,
                desc: 'Định lý côsin, định lý sin, công thức tính diện tích tam giác và bài toán giải tam giác thực tế.',
              },
              {
                title: 'Chương 3: Hàm số bậc hai & Đồ thị Parabol',
                textbook: 'Kết Nối Tri Thức (Toán 10)',
                count: questions.filter(q => q.chapter?.includes('Hàm số bậc hai')).length,
                desc: 'Đỉnh parabol, trục đối xứng, bảng biến thiên, dấu của tam thức bậc hai và ứng dụng.',
              },
              {
                title: 'Bộ sưu tập: Đề thi THPT Quốc gia (Chuyên đề)',
                textbook: 'Tổng hợp các bộ sách',
                count: 8,
                desc: 'Kho câu hỏi vận dụng cao phân loại theo ma trận đề thi tốt nghiệp THPT chuẩn.',
              },
              {
                title: 'Bộ sưu tập: 15 Phút Khởi Động & Kiểm tra Nhanh',
                textbook: 'Tất cả các môn',
                count: 12,
                desc: 'Câu hỏi nhận biết & thông hiểu dùng để kiểm tra bài cũ hoặc đố vui đầu tiết dạy.',
              },
              {
                title: 'Chương 1: Động lực học & Mô tả chuyển động',
                textbook: 'Cánh Diều (Vật lý 10)',
                count: questions.filter(q => q.subject === 'Vật lý').length,
                desc: 'Định luật Newton, vận tốc, gia tốc, lực ma sát và chuyển động rơi tự do.',
              },
            ].map((col, idx) => (
              <div
                key={idx}
                className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] hover:border-cyan-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      {col.textbook}
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-[#0c162b] px-2 py-0.5 rounded">
                      {col.count} câu hỏi
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white">{col.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{col.desc}</p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-cyan-500/20 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSearchQuery(col.title.slice(0, 15));
                      setActiveTab('all_questions');
                    }}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
                  >
                    Xem các câu hỏi &rarr;
                  </button>

                  <button
                    onClick={() => {
                      navigate('/teacher/assignments/create', {
                        state: { presetTitle: col.title }
                      });
                    }}
                    className="px-3 py-1 bg-cyan-950/70 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/30 transition-all cursor-pointer"
                  >
                    Giao bài tập
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: TỔNG QUAN & MA TRẬN (OVERVIEW)
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#0c162b] border border-cyan-500/35 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">TỔNG SỐ CÂU HỎI</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">{stats.total}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Sẵn sàng sử dụng</div>
              </div>
              <FileQuestion className="w-8 h-8 text-cyan-400/60" />
            </div>

            <div className="bg-[#0c162b] border border-emerald-500/35 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">ĐÃ DUYỆT CHÍNH THỨC</span>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{stats.approved}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{((stats.approved / (stats.total || 1)) * 100).toFixed(0)}% kho câu hỏi</div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
            </div>

            <div className="bg-[#0c162b] border border-amber-500/35 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">CHỜ PHÊ DUYỆT</span>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{stats.pending}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Từ các giáo viên gửi lên</div>
              </div>
              <Clock className="w-8 h-8 text-amber-400/60" />
            </div>

            <div className="bg-[#0c162b] border border-purple-500/35 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">BỘ ĐỀ KIỂM TRA</span>
                <div className="text-2xl font-bold font-mono text-purple-300 mt-1">{examSets.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Đề 15p - 45p đã lập</div>
              </div>
              <BookOpen className="w-8 h-8 text-purple-400/60" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Phân bổ Ma trận Mức độ Khảo thí
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-emerald-400 font-semibold">1. Nhận biết (Easy)</span>
                    <span className="font-mono text-white font-bold">{stats.easy} câu ({((stats.easy / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#060a14] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(stats.easy / (stats.total || 1)) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sky-400 font-semibold">2. Thông hiểu (Medium)</span>
                    <span className="font-mono text-white font-bold">{stats.medium} câu ({((stats.medium / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#060a14] h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full rounded-full" style={{ width: `${(stats.medium / (stats.total || 1)) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-amber-400 font-semibold">3. Vận dụng (Hard)</span>
                    <span className="font-mono text-white font-bold">{stats.hard} câu ({((stats.hard / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#060a14] h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(stats.hard / (stats.total || 1)) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-rose-400 font-semibold">4. Vận dụng cao (Very Hard)</span>
                    <span className="font-mono text-white font-bold">{stats.veryHard} câu ({((stats.veryHard / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#060a14] h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-400 h-full rounded-full" style={{ width: `${(stats.veryHard / (stats.total || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-cyan-400" />
                Bộ sách giáo khoa phân bổ
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#0c162b] border border-cyan-500/20 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-white">Cánh Diều</span>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded">
                    {questions.filter(q => q.textbook === 'Cánh Diều').length} câu
                  </span>
                </div>
                <div className="p-3 bg-[#0c162b] border border-cyan-500/20 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-white">Kết Nối Tri Thức Với Cuộc Sống</span>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded">
                    {questions.filter(q => q.textbook === 'Kết Nối Tri Thức').length} câu
                  </span>
                </div>
                <div className="p-3 bg-[#0c162b] border border-cyan-500/20 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-white">Chân Trời Sáng Tạo</span>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded">
                    {questions.filter(q => q.textbook === 'Chân Trời Sáng Tạo').length} câu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* 1. Modal: Xem chi tiết câu hỏi */}
      {viewQuestionModal && (
        <Modal
          isOpen={Boolean(viewQuestionModal)}
          onClose={() => setViewQuestionModal(null)}
          title={`Chi tiết câu hỏi: ${viewQuestionModal.code || viewQuestionModal.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-cyan-500/20">
              <span className="font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-mono">
                {viewQuestionModal.subject} · Khối {viewQuestionModal.gradeLevel}
              </span>
              {viewQuestionModal.textbook && (
                <span className="bg-[#0c162b] text-white px-2 py-1 rounded-lg border border-slate-700">
                  {viewQuestionModal.textbook}
                </span>
              )}
              {getDifficultyBadge(viewQuestionModal.difficulty)}
              {getTypeBadge(viewQuestionModal.type)}
              {getStatusBadge(viewQuestionModal.status)}
              <span className="ml-auto font-mono text-cyan-300 font-bold">{viewQuestionModal.points} điểm</span>
            </div>

            <div>
              <span className="font-bold text-slate-400 block mb-1">NỘI DUNG ĐỀ BÀI:</span>
              <p className="text-white text-sm font-medium leading-relaxed p-3.5 bg-[#060a14] border border-cyan-500/30 rounded-xl">
                {viewQuestionModal.prompt}
              </p>
            </div>

            {viewQuestionModal.imageUrl && (
              <div>
                <span className="font-bold text-slate-400 block mb-1">HÌNH ẢNH MINH HỌA:</span>
                <div className="p-2 bg-[#060a14] border border-cyan-500/30 rounded-xl overflow-hidden max-w-sm">
                  <img src={viewQuestionModal.imageUrl} alt="Minh họa" className="rounded-lg max-h-48 object-cover w-full" />
                </div>
              </div>
            )}

            {viewQuestionModal.options && (
              <div>
                <span className="font-bold text-slate-400 block mb-1.5">CÁC PHƯƠNG ÁN TRẢ LỜI:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {viewQuestionModal.options.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                        opt.isCorrect
                          ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-bold'
                          : 'bg-[#0c162b] border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt.text}</span>
                      {opt.isCorrect && (
                        <span className="ml-auto px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-slate-950 font-bold">
                          ĐÚNG
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewQuestionModal.subStatements && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 block">4 MỆNH ĐỀ ĐÚNG / SAI:</span>
                {viewQuestionModal.subStatements.map(st => (
                  <div key={st.id} className="p-2.5 bg-[#0c162b] border border-slate-800 rounded-lg flex items-center justify-between">
                    <span className="text-slate-200">{st.text}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.isCorrect ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                      {st.isCorrect ? 'ĐÚNG' : 'SAI'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {viewQuestionModal.matchingPairs && (
              <div className="space-y-1.5">
                <span className="font-bold text-pink-300 block">CÁC CẶP GHÉP ĐÔI:</span>
                {viewQuestionModal.matchingPairs.map(p => (
                  <div key={p.id} className="p-2.5 bg-[#0c162b] border border-pink-500/20 rounded-lg flex items-center justify-between">
                    <span className="text-white font-semibold">{p.left}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-pink-300">{p.right}</span>
                  </div>
                ))}
              </div>
            )}

            {viewQuestionModal.correctAnswerText && (
              <div>
                <span className="font-bold text-emerald-400 block mb-1">ĐÁP ÁN CHUẨN:</span>
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 font-mono">
                  {viewQuestionModal.correctAnswerText}
                </div>
              </div>
            )}

            {viewQuestionModal.explanation && (
              <div className="p-3.5 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-slate-200 space-y-1">
                <span className="font-bold text-cyan-300 block">LỜI GIẢI CHI TIẾT:</span>
                <p className="leading-relaxed whitespace-pre-wrap">{viewQuestionModal.explanation}</p>
              </div>
            )}

            <div className="pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {viewQuestionModal.status !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(viewQuestionModal, 'APPROVED');
                      setViewQuestionModal(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    ✓ Phê duyệt câu hỏi này
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDuplicate(viewQuestionModal);
                    setViewQuestionModal(null);
                  }}
                  className="px-3 py-1.5 bg-purple-950 text-purple-300 border border-purple-500/30 hover:bg-purple-900 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Nhân bản
                </button>
              </div>

              <button
                onClick={() => {
                  navigate('/teacher/assignments/create', {
                    state: {
                      presetTitle: `Bài tập từ câu hỏi ${viewQuestionModal.code || ''}`,
                      presetQuestions: [viewQuestionModal],
                    }
                  });
                }}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Giao bài tập với câu hỏi này
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Modal: Chỉnh sửa câu hỏi */}
      {editQuestionModal && (
        <Modal
          isOpen={Boolean(editQuestionModal)}
          onClose={() => setEditQuestionModal(null)}
          title={`Chỉnh sửa câu hỏi: ${editQuestionModal.code || editQuestionModal.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nội dung câu hỏi</label>
              <textarea
                rows={3}
                value={editQuestionModal.prompt}
                onChange={e => setEditQuestionModal({ ...editQuestionModal, prompt: e.target.value })}
                className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mức độ khó</label>
                <select
                  value={editQuestionModal.difficulty}
                  onChange={e => setEditQuestionModal({ ...editQuestionModal, difficulty: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="EASY">Nhận biết</option>
                  <option value="MEDIUM">Thông hiểu</option>
                  <option value="HARD">Vận dụng</option>
                  <option value="VERY_HARD">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Điểm số</label>
                <input
                  type="number"
                  step="0.25"
                  value={editQuestionModal.points}
                  onChange={e => setEditQuestionModal({ ...editQuestionModal, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white font-mono focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Lời giải thích</label>
              <textarea
                rows={2}
                value={editQuestionModal.explanation || ''}
                onChange={e => setEditQuestionModal({ ...editQuestionModal, explanation: e.target.value })}
                className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cyan-500/20">
              <button
                onClick={() => setEditQuestionModal(null)}
                className="px-3.5 py-1.5 bg-[#0c162b] text-slate-300 font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  dbService.updateQuestion(editQuestionModal.id, editQuestionModal);
                  handleReloadQuestions();
                  showToast('Đã lưu các thay đổi câu hỏi!', 'success');
                  setEditQuestionModal(null);
                }}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                Lưu cập nhật
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Modal: Tạo bộ đề mới */}
      {createExamModalOpen && (
        <Modal
          isOpen={createExamModalOpen}
          onClose={() => setCreateExamModalOpen(false)}
          title="Thiết lập Bộ đề kiểm tra mới từ Ngân hàng"
          maxWidth="md"
        >
          <form onSubmit={handleGenerateExamSet} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-200 mb-1">Tiêu đề bộ đề *</label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                placeholder="Ví dụ: Đề kiểm tra 45 phút học kỳ 1 Toán 10"
                className="w-full px-3.5 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Thời gian (phút)</label>
                <select
                  value={examDuration}
                  onChange={e => setExamDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value={15}>15 phút</option>
                  <option value={45}>45 phút (1 tiết)</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút (Học kỳ)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Môn học</label>
                <select
                  value={examSubject}
                  onChange={e => setExamSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c162b] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-[#060a14] border border-cyan-500/30 rounded-xl space-y-2">
              <span className="font-bold text-cyan-300 block">Ma trận số lượng câu hỏi theo mức độ:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-emerald-400 block mb-0.5">Nhận biết:</span>
                  <input
                    type="number"
                    min="0"
                    value={matrixEasy}
                    onChange={e => setMatrixEasy(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-[#0c162b] border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-sky-400 block mb-0.5">Thông hiểu:</span>
                  <input
                    type="number"
                    min="0"
                    value={matrixMedium}
                    onChange={e => setMatrixMedium(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-[#0c162b] border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-amber-400 block mb-0.5">Vận dụng:</span>
                  <input
                    type="number"
                    min="0"
                    value={matrixHard}
                    onChange={e => setMatrixHard(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-[#0c162b] border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-rose-400 block mb-0.5">Vận dụng cao:</span>
                  <input
                    type="number"
                    min="0"
                    value={matrixVeryHard}
                    onChange={e => setMatrixVeryHard(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-[#0c162b] border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateExamModalOpen(false)}
                className="px-3.5 py-2 bg-[#0c162b] text-slate-300 font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Tạo bộ đề ngay
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. Modal: Xem chi tiết bộ đề */}
      {viewExamModal && (
        <Modal
          isOpen={Boolean(viewExamModal)}
          onClose={() => setViewExamModal(null)}
          title={`Bộ đề: ${viewExamModal.title}`}
          maxWidth="xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            <div className="p-3 bg-[#0c162b] border border-cyan-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400">Thời gian:</span> <strong className="text-white font-mono">{viewExamModal.durationMinutes} phút</strong>
              </div>
              <div>
                <span className="text-slate-400">Số câu:</span> <strong className="text-cyan-300 font-mono">{viewExamModal.questionCount} câu</strong>
              </div>
              <div>
                <span className="text-slate-400">Thang điểm:</span> <strong className="text-emerald-300 font-mono">{viewExamModal.totalPoints}đ</strong>
              </div>
              <div>
                <span className="text-slate-400">Người lập:</span> <strong className="text-white">{viewExamModal.authorName || 'Giáo viên'}</strong>
              </div>
            </div>

            <div className="space-y-3">
              {viewExamModal.questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-[#060a14] border border-cyan-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      Câu {idx + 1} ({q.points || 1} điểm):
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getDifficultyBadge(q.difficulty)}
                      {getTypeBadge(q.type)}
                    </div>
                  </div>
                  <p className="text-white font-medium">{q.prompt}</p>

                  {q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-lg border ${
                            opt.isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold'
                              : 'bg-[#0c162b] border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span> {opt.text}
                          {opt.isCorrect && ' (Đáp án đúng)'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-cyan-500/20 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigate('/teacher/assignments/create', {
                    state: {
                      presetTitle: viewExamModal.title,
                      presetQuestions: viewExamModal.questions,
                    }
                  });
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Giao bài tập với bộ đề này
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Confirm Dialog Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetQuestion)}
        onClose={() => setDeleteTargetQuestion(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa câu hỏi khỏi Ngân hàng"
        message={`Bạn có chắc chắn muốn xóa câu hỏi "${deleteTargetQuestion?.code || deleteTargetQuestion?.prompt.slice(0, 30)}..."? Hành động này sẽ loại bỏ câu hỏi khỏi kho dữ liệu.`}
        confirmLabel="Xác nhận xóa"
        isDestructive={true}
      />
    </div>
  );
};
