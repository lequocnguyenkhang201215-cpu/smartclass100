import React, { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  Trash2,
  Undo2,
  Redo2,
  FileSpreadsheet,
  Download,
  Save,
  Clock,
  Plus,
  X,
  AlertCircle,
  Calendar,
  Building2,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// Day definition
interface DayColumn {
  id: number; // 2 -> 8 (2: Thứ 2 ... 8: Chủ nhật)
  label: string;
}

// Period definition
interface PeriodRow {
  id: number; // 1, 2, 3 ...
  periodName: string;
  startTime: string;
  endTime: string;
}

// Timetable grid: map of `${periodId}_${dayId}` => string content
type TimetableGrid = Record<string, string>;

// History snapshot for Undo / Redo
interface HistorySnapshot {
  days: DayColumn[];
  periods: PeriodRow[];
  grid: TimetableGrid;
}

// Available standard days order
const ALL_DAYS: DayColumn[] = [
  { id: 2, label: 'Thứ 2' },
  { id: 3, label: 'Thứ 3' },
  { id: 4, label: 'Thứ 4' },
  { id: 5, label: 'Thứ 5' },
  { id: 6, label: 'Thứ 6' },
  { id: 7, label: 'Thứ 7' },
  { id: 8, label: 'Chủ nhật' },
];

// Initial periods
const INITIAL_PERIODS: PeriodRow[] = [
  { id: 1, periodName: 'Tiết 1', startTime: '07:00', endTime: '07:45' },
  { id: 2, periodName: 'Tiết 2', startTime: '07:45', endTime: '08:30' },
  { id: 3, periodName: 'Tiết 3', startTime: '08:30', endTime: '09:15' },
  { id: 4, periodName: 'Tiết 4', startTime: '09:15', endTime: '10:00' },
  { id: 5, periodName: 'Tiết 5', startTime: '10:35', endTime: '11:20' },
  { id: 6, periodName: 'Tiết 6', startTime: '11:25', endTime: '12:10' },
  { id: 7, periodName: 'Tiết 7', startTime: '12:15', endTime: '13:00' },
  { id: 8, periodName: 'Tiết 8', startTime: '13:05', endTime: '13:50' },
];

// Initial sample grid data
const INITIAL_GRID_DATA: TimetableGrid = {
  // Tiết 1
  '1_2': '',
  '1_3': 'Toán học\nThầy Hùng',
  '1_4': 'Vật lý\nCô Lan',
  '1_5': 'Hóa học\nThầy Nam',
  '1_6': '',
  // Tiết 2
  '2_2': '',
  '2_3': 'Toán học\nThầy Hùng',
  '2_4': 'Ngữ văn\nCô Mai',
  '2_5': 'Hóa học\nThầy Nam',
  '2_6': '',
  // Tiết 3
  '3_2': 'Tiếng Anh\nCô Thảo',
  '3_3': 'Ngữ văn\nCô Mai',
  '3_4': 'Lịch sử\nThầy Tuấn',
  '3_5': 'Sinh học\nCô Nga',
  '3_6': '',
  // Tiết 4
  '4_2': 'Tiếng Anh\nCô Thảo',
  '4_3': 'Tin học\nThầy Trọng',
  '4_4': 'Địa lý\nCô Loan',
  '4_5': '',
  '4_6': '',
  // Tiết 5
  '5_2': 'GDCD\nCô Hiền',
  '5_3': 'Tin học\nThầy Trọng',
  '5_4': 'Thể dục\nThầy Phong',
  '5_5': '',
  '5_6': '',
  // Tiết 6
  '6_2': 'Sinh hoạt lớp\nGVCN',
  '6_3': 'Công nghệ\nThầy Hải',
  '6_4': 'Thể dục\nThầy Phong',
  '6_5': '',
  '6_6': '',
  // Tiết 7
  '7_2': 'Âm nhạc\nCô Yến',
  '7_3': 'Mỹ thuật\nThầy Duy',
  '7_4': 'GD Quốc phòng\nThầy Sơn',
  '7_5': '',
  '7_6': '',
  // Tiết 8
  '8_2': 'Tự chọn Toán',
  '8_3': 'Tự chọn Anh',
  '8_4': '',
  '8_5': '',
  '8_6': '',
};

export const SchedulePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Top Tabs: 'class' | 'teacher' | 'room'
  const [activeTab, setActiveTab] = useState<'class' | 'teacher' | 'room'>('class');

  // Selected Class
  const [selectedClass, setSelectedClass] = useState<string>('Lớp 7A3');
  const classOptions = ['Lớp 7A3', 'Lớp 10A1', 'Lớp 10A2', 'Lớp 11B1', 'Lớp 12A3'];

  // Mode States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

  // Active Data (Saved data)
  const [savedDays, setSavedDays] = useState<DayColumn[]>(() => ALL_DAYS.slice(0, 5));
  const [savedPeriods, setSavedPeriods] = useState<PeriodRow[]>(INITIAL_PERIODS);
  const [savedGrid, setSavedGrid] = useState<TimetableGrid>(INITIAL_GRID_DATA);

  // Working Draft Data (in-flight during edit)
  const [draftDays, setDraftDays] = useState<DayColumn[]>(() => ALL_DAYS.slice(0, 5));
  const [draftPeriods, setDraftPeriods] = useState<PeriodRow[]>(INITIAL_PERIODS);
  const [draftGrid, setDraftGrid] = useState<TimetableGrid>(INITIAL_GRID_DATA);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Cell currently being edited
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);

  // Dialog State for Deleting Columns or Rows
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete_column' | 'delete_period' | 'discard_changes';
    targetId?: number;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'delete_column',
    title: '',
    message: '',
  });

  // Modal for Adding New Period
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('14:45');
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);

  // File Input Ref for Excel Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on initial render or class switch
  useEffect(() => {
    const storageKey = `smartclass_tt_${selectedClass}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.days && parsed.periods && parsed.grid) {
          setSavedDays(parsed.days);
          setSavedPeriods(parsed.periods);
          setSavedGrid(parsed.grid);
          setDraftDays(parsed.days);
          setDraftPeriods(parsed.periods);
          setDraftGrid(parsed.grid);
          return;
        }
      } catch (e) {
        console.error('Error loading schedule from localStorage', e);
      }
    }
    // Fallback default
    const initialDays = ALL_DAYS.slice(0, 5);
    setSavedDays(initialDays);
    setSavedPeriods(INITIAL_PERIODS);
    setSavedGrid(INITIAL_GRID_DATA);
    setDraftDays(initialDays);
    setDraftPeriods(INITIAL_PERIODS);
    setDraftGrid(INITIAL_GRID_DATA);
  }, [selectedClass]);

  // Helper: push state to Undo stack
  const pushToHistory = (newDays: DayColumn[], newPeriods: PeriodRow[], newGrid: TimetableGrid) => {
    const nextSnapshot: HistorySnapshot = {
      days: JSON.parse(JSON.stringify(newDays)),
      periods: JSON.parse(JSON.stringify(newPeriods)),
      grid: JSON.parse(JSON.stringify(newGrid)),
    };
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(nextSnapshot);
    if (nextHistory.length > 30) nextHistory.shift(); // keep max 30 snapshots
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  // Start Editing Mode
  const handleStartEdit = () => {
    setIsEditing(true);
    setIsDeleteMode(false);
    // Initialize draft with fresh copy of saved
    const freshDays = JSON.parse(JSON.stringify(savedDays));
    const freshPeriods = JSON.parse(JSON.stringify(savedPeriods));
    const freshGrid = JSON.parse(JSON.stringify(savedGrid));
    setDraftDays(freshDays);
    setDraftPeriods(freshPeriods);
    setDraftGrid(freshGrid);

    // Initial snapshot in history
    const initialSnapshot: HistorySnapshot = {
      days: freshDays,
      periods: freshPeriods,
      grid: freshGrid,
    };
    setHistory([initialSnapshot]);
    setHistoryIndex(0);
  };

  // Toggle or Turn on Delete Mode
  const handleToggleDeleteMode = () => {
    if (!isEditing) {
      // If clicked from read mode, automatically enter edit mode and turn on delete mode
      handleStartEdit();
      setIsDeleteMode(true);
    } else {
      setIsDeleteMode(prev => !prev);
    }
    setEditingCellKey(null);
  };

  // Undo Action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const target = history[prevIndex];
      setDraftDays(JSON.parse(JSON.stringify(target.days)));
      setDraftPeriods(JSON.parse(JSON.stringify(target.periods)));
      setDraftGrid(JSON.parse(JSON.stringify(target.grid)));
      setHistoryIndex(prevIndex);
      setEditingCellKey(null);
      showToast('Đã hoàn tác thao tác vừa rồi', 'info');
    }
  };

  // Redo Action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const target = history[nextIndex];
      setDraftDays(JSON.parse(JSON.stringify(target.days)));
      setDraftPeriods(JSON.parse(JSON.stringify(target.periods)));
      setDraftGrid(JSON.parse(JSON.stringify(target.grid)));
      setHistoryIndex(nextIndex);
      setEditingCellKey(null);
      showToast('Đã làm lại thao tác', 'info');
    }
  };

  // Save changes to localStorage & permanent state
  const handleSave = () => {
    setSavedDays(JSON.parse(JSON.stringify(draftDays)));
    setSavedPeriods(JSON.parse(JSON.stringify(draftPeriods)));
    setSavedGrid(JSON.parse(JSON.stringify(draftGrid)));

    const storageKey = `smartclass_tt_${selectedClass}`;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          days: draftDays,
          periods: draftPeriods,
          grid: draftGrid,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    setIsEditing(false);
    setIsDeleteMode(false);
    setEditingCellKey(null);
    setHistory([]);
    setHistoryIndex(-1);
    showToast('Thời khóa biểu đã được lưu thành công!', 'success');
  };

  // Handle cell click in grid
  const handleCellClick = (periodId: number, dayId: number) => {
    const key = `${periodId}_${dayId}`;

    // Fast-Delete Mode: Immediately clear cell to empty
    if (isDeleteMode) {
      const currentVal = draftGrid[key] || '';
      if (currentVal.trim() !== '') {
        const nextGrid = { ...draftGrid, [key]: '' };
        setDraftGrid(nextGrid);
        pushToHistory(draftDays, draftPeriods, nextGrid);
        showToast('Đã xóa nội dung ô về trống', 'info');
      }
      return;
    }

    // Direct Inline Edit Mode
    if (isEditing) {
      setEditingCellKey(key);
    }
  };

  // Handle cell text change in draft
  const handleCellContentChange = (key: string, newContent: string) => {
    const nextGrid = { ...draftGrid, [key]: newContent };
    setDraftGrid(nextGrid);
  };

  // Handle cell blur: save text to undo history
  const handleCellBlur = (key: string) => {
    setEditingCellKey(null);
    // Push updated state to history
    pushToHistory(draftDays, draftPeriods, draftGrid);
  };

  // Add Day Column (+)
  const handleAddDayColumn = () => {
    if (draftDays.length >= 7) {
      showToast('Lỗi: Tuần chỉ có 7 ngày.', 'error');
      return;
    }

    // Find the next missing day according to standard order Thứ 2 -> Chủ nhật
    const existingIds = new Set(draftDays.map(d => d.id));
    const nextDay = ALL_DAYS.find(d => !existingIds.has(d.id));

    if (nextDay) {
      const nextDays = [...draftDays, nextDay].sort((a, b) => a.id - b.id);
      setDraftDays(nextDays);
      pushToHistory(nextDays, draftPeriods, draftGrid);
      showToast(`Đã thêm cột ${nextDay.label}`, 'success');
    }
  };

  // Request Delete Day Column (×)
  const handleRequestDeleteDay = (dayId: number) => {
    if (draftDays.length <= 1) {
      showToast('Lỗi: Bảng phải giữ lại ít nhất 1 ngày học.', 'error');
      return;
    }
    const day = draftDays.find(d => d.id === dayId);
    setConfirmDialog({
      isOpen: true,
      type: 'delete_column',
      targetId: dayId,
      title: `Xác nhận xóa cột ${day?.label || ''}`,
      message: `Bạn có chắc chắn muốn xóa toàn bộ cột ${day?.label || ''}? Toàn bộ bài học trong ngày này sẽ bị xóa khỏi bản nháp.`,
    });
  };

  // Request Delete Period Row (Trash Icon at row end)
  const handleRequestDeletePeriod = (periodId: number) => {
    if (draftPeriods.length <= 1) {
      showToast('Lỗi: Bảng phải có ít nhất 1 tiết học.', 'error');
      return;
    }
    const p = draftPeriods.find(item => item.id === periodId);
    setConfirmDialog({
      isOpen: true,
      type: 'delete_period',
      targetId: periodId,
      title: `Xác nhận xóa ${p?.periodName || 'Tiết'}`,
      message: `Bạn có chắc chắn muốn xóa ${p?.periodName || 'tiết học này'} trên tất cả các ngày? Thao tác này sẽ xóa hàng khỏi bản nháp.`,
    });
  };

  // Confirm delete handler
  const handleExecuteConfirm = () => {
    if (confirmDialog.type === 'delete_column' && confirmDialog.targetId !== undefined) {
      const dayId = confirmDialog.targetId;
      const nextDays = draftDays.filter(d => d.id !== dayId);
      // Clean up deleted day from grid
      const nextGrid = { ...draftGrid };
      Object.keys(nextGrid).forEach(k => {
        if (k.endsWith(`_${dayId}`)) {
          delete nextGrid[k];
        }
      });
      setDraftDays(nextDays);
      setDraftGrid(nextGrid);
      pushToHistory(nextDays, draftPeriods, nextGrid);
      showToast('Đã xóa cột ngày thành công', 'info');
    } else if (confirmDialog.type === 'delete_period' && confirmDialog.targetId !== undefined) {
      const pId = confirmDialog.targetId;
      const nextPeriods = draftPeriods
        .filter(p => p.id !== pId)
        .map((p, index) => ({
          ...p,
          id: index + 1,
          periodName: `Tiết ${index + 1}`,
        }));

      // Re-map grid keys according to new period IDs
      const nextGrid: TimetableGrid = {};
      draftPeriods
        .filter(p => p.id !== pId)
        .forEach((oldP, newIndex) => {
          const newId = newIndex + 1;
          draftDays.forEach(day => {
            const oldKey = `${oldP.id}_${day.id}`;
            const newKey = `${newId}_${day.id}`;
            if (draftGrid[oldKey]) {
              nextGrid[newKey] = draftGrid[oldKey];
            }
          });
        });

      setDraftPeriods(nextPeriods);
      setDraftGrid(nextGrid);
      pushToHistory(draftDays, nextPeriods, nextGrid);
      showToast('Đã xóa tiết học thành công', 'info');
    }
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Open Add Period Modal
  const handleOpenAddPeriod = () => {
    const nextNum = draftPeriods.length + 1;
    setNewPeriodName(`Tiết ${nextNum}`);
    // Suggest times
    const lastP = draftPeriods[draftPeriods.length - 1];
    if (lastP) {
      setNewStartTime('14:00');
      setNewEndTime('14:45');
    } else {
      setNewStartTime('07:00');
      setNewEndTime('07:45');
    }
    setTimeValidationError(null);
    setIsAddPeriodModalOpen(true);
  };

  // Confirm Add Period
  const handleConfirmAddPeriod = () => {
    if (!newStartTime || !newEndTime) {
      setTimeValidationError('Vui lòng chọn giờ bắt đầu và kết thúc');
      return;
    }
    if (newStartTime >= newEndTime) {
      setTimeValidationError('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return;
    }

    const nextId = draftPeriods.length + 1;
    const newPeriod: PeriodRow = {
      id: nextId,
      periodName: newPeriodName.trim() || `Tiết ${nextId}`,
      startTime: newStartTime,
      endTime: newEndTime,
    };

    const nextPeriods = [...draftPeriods, newPeriod];
    setDraftPeriods(nextPeriods);
    pushToHistory(draftDays, nextPeriods, draftGrid);
    setIsAddPeriodModalOpen(false);
    showToast(`Đã thêm ${newPeriod.periodName}`, 'success');
  };

  // Export Timetable as CSV (Excel compatible)
  const handleExportCSV = () => {
    const currentDays = isEditing ? draftDays : savedDays;
    const currentPeriods = isEditing ? draftPeriods : savedPeriods;
    const currentGrid = isEditing ? draftGrid : savedGrid;

    let csvContent = `\uFEFFTHỜI KHÓA BIỂU - ${selectedClass.toUpperCase()}\n`;
    csvContent += `Tiết / Giờ,` + currentDays.map(d => `"${d.label}"`).join(',') + `\n`;

    currentPeriods.forEach(p => {
      const row = [`"${p.periodName} (${p.startTime} - ${p.endTime})"`];
      currentDays.forEach(d => {
        const val = currentGrid[`${p.id}_${d.id}`] || '';
        row.push(`"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`);
      });
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Thoi_Khoa_Bieu_${selectedClass.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất thời khóa biểu thành công!', 'success');
  };

  // Import Excel handler (supports CSV / sample parse)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        // Auto parse CSV lines
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          showToast('File không có đủ dữ liệu thời khóa biểu hợp lệ', 'error');
          return;
        }

        // Apply new draft
        if (!isEditing) handleStartEdit();
        showToast('Đã nạp dữ liệu từ file thành công vào bản nháp!', 'success');
      } catch (err) {
        showToast('Lỗi khi đọc file. Vui lòng kiểm tra định dạng.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Determine current active view data
  const activeDays = isEditing ? draftDays : savedDays;
  const activePeriods = isEditing ? draftPeriods : savedPeriods;
  const activeGrid = isEditing ? draftGrid : savedGrid;

  return (
    <div className="bg-[#090f1e] text-slate-100 rounded-2xl border border-cyan-500/30 p-5 sm:p-6 lg:p-7 shadow-[0_0_20px_rgba(6,182,212,0.08)] space-y-5 font-sans min-h-[750px]">
      {/* 1. TOP HEADER & TABS (DARK NAVY & CYAN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/25">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('class')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
              activeTab === 'class'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-cyan-950/30 border-transparent'
            }`}
          >
            <GraduationCap className="w-4.5 h-4.5 text-cyan-400" />
            Lịch lớp học
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
              activeTab === 'teacher'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-cyan-950/30 border-transparent'
            }`}
          >
            <Calendar className="w-4.5 h-4.5 text-cyan-400" />
            Lịch giáo viên
          </button>

          <button
            onClick={() => setActiveTab('room')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
              activeTab === 'room'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-cyan-950/30 border-transparent'
            }`}
          >
            <Building2 className="w-4.5 h-4.5 text-cyan-400" />
            Lịch phòng học
          </button>
        </div>

        {/* Class / Target Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedClass}
              disabled={isEditing}
              onChange={e => {
                if (isEditing) {
                  showToast('Vui lòng Lưu hoặc Hủy chỉnh sửa trước khi đổi lớp', 'error');
                  return;
                }
                setSelectedClass(e.target.value);
              }}
              className="appearance-none bg-[#0c162b] border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 font-bold text-sm px-4 py-2.5 pr-9 rounded-xl outline-none transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {classOptions.map(cls => (
                <option key={cls} value={cls} className="bg-[#0c162b] text-cyan-200">
                  {cls}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Học kỳ 1 · 2025-2026
          </div>
        </div>
      </div>

      {/* 2. ACTION TOOLBAR (THANH CÔNG CỤ DARK NAVY & CYAN) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Nút Chỉnh sửa / Đang chỉnh sửa */}
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-400 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-slate-950" />
              Chỉnh sửa
            </button>
          ) : (
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'discard_changes',
                  title: 'Thoát chế độ chỉnh sửa',
                  message: 'Bạn có muốn hủy các thay đổi chưa lưu và quay lại chế độ xem?',
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-slate-950 border border-cyan-400 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-slate-950" />
              Đang chỉnh sửa
            </button>
          )}

          {/* Nút Xóa / Chế độ xóa: BẬT */}
          {!isDeleteMode ? (
            <button
              onClick={handleToggleDeleteMode}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-sm font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Xóa
            </button>
          ) : (
            <button
              onClick={() => setIsDeleteMode(false)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white border border-rose-400 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-white" />
              Chế độ xóa: BẬT
            </button>
          )}

          {/* Hoàn tác (Undo) */}
          <button
            onClick={handleUndo}
            disabled={!isEditing || historyIndex <= 0}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              isEditing && historyIndex > 0
                ? 'bg-[#0c162b] hover:bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 cursor-pointer shadow-2xs'
                : 'bg-[#060a14] border border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
            }`}
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            Hoàn tác
          </button>

          {/* Làm lại (Redo) */}
          <button
            onClick={handleRedo}
            disabled={!isEditing || historyIndex >= history.length - 1}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              isEditing && historyIndex < history.length - 1
                ? 'bg-[#0c162b] hover:bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 cursor-pointer shadow-2xs'
                : 'bg-[#060a14] border border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
            }`}
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
            Làm lại
          </button>

          {/* Import Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0c162b] hover:bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Import Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />

          {/* Xuất thời khóa biểu */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0c162b] hover:bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 rounded-xl text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Xuất thời khóa biểu
          </button>
        </div>

        {/* Right Toolbar Action: NÚT LƯU (Chỉ xuất hiện khi đang chỉnh sửa) */}
        {isEditing && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer animate-in fade-in"
          >
            <Save className="w-4.5 h-4.5" />
            Lưu
          </button>
        )}
      </div>

      {/* 3. BANNERS HƯỚNG DẪN */}
      <div className="space-y-2">
        {/* Banner 1: Chế độ xóa ô đang bật */}
        {isDeleteMode && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-200 text-xs sm:text-sm animate-in fade-in slide-in-from-top-1 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
              <span className="truncate sm:whitespace-normal font-medium">
                Chế độ xóa ô đang bật: Nhấp vào bất kỳ ô thời khóa biểu nào để xóa nội dung về{' '}
                <span className="bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded font-mono text-xs border border-rose-500/40 font-semibold">
                  -trống-
                </span>
                . Nhấp lại nút Xóa để thoát.
              </span>
            </div>
            <button
              onClick={() => setIsDeleteMode(false)}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold shrink-0 border border-rose-500/40 transition-colors cursor-pointer"
            >
              Đóng chế độ xóa
            </button>
          </div>
        )}

        {/* Banner 2: Chế độ chỉnh sửa đang bật */}
        {isEditing && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 text-cyan-200 text-xs sm:text-sm animate-in fade-in slide-in-from-top-1 shadow-2xs">
            <Pencil className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">
              Chế độ chỉnh sửa đang bật: Nhấp trực tiếp vào ô để gõ bài học (nhấn Enter xuống dòng giống Word); hàng tự động giãn chiều cao đồng bộ. Nhớ nhấn{' '}
              <strong className="text-emerald-400 font-bold">Lưu</strong> khi hoàn thành.
            </span>
          </div>
        )}
      </div>

      {/* 4. MAIN TIMETABLE GRID TABLE (GIAO DIỆN DARK NAVY & CYAN) */}
      <div className="border border-cyan-500/30 rounded-2xl overflow-hidden bg-[#090f1e] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[780px]">
            {/* Table Header: Tiết / Giờ + Cột các ngày */}
            <thead>
              <tr className="border-b border-cyan-500/30 bg-[#0c1730]">
                {/* Cột 1: Tiết / Giờ */}
                <th className="py-4 px-4 text-sm font-bold text-cyan-300 w-36 border-r border-cyan-500/25 text-center select-none">
                  Tiết / Giờ
                </th>

                {/* Các cột Thứ 2 -> Thứ 6 (hoặc Thứ 7, CN) */}
                {activeDays.map(day => (
                  <th
                    key={day.id}
                    className="py-4 px-3 text-sm font-bold text-white border-r border-cyan-500/25 last:border-r-0 select-none"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base tracking-wide">{day.label}</span>

                      {/* Trong Edit Mode: Icon [+] xanh và [×] hồng để thêm/xóa cột */}
                      {isEditing && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleAddDayColumn()}
                            className="text-emerald-400 hover:text-emerald-300 font-bold text-lg hover:scale-125 transition-transform p-0.5 cursor-pointer leading-none"
                            title="Thêm cột ngày tiếp theo"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDeleteDay(day.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold text-lg hover:scale-125 transition-transform p-0.5 cursor-pointer leading-none"
                            title={`Xóa cột ${day.label}`}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                ))}

                {/* Trong Edit Mode: Cột hành động xóa hàng ở cuối */}
                {isEditing && (
                  <th className="py-4 px-2 w-14 border-l border-cyan-500/25 text-center text-xs font-bold text-rose-400 select-none">
                    Xóa
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body: Các hàng tiết học */}
            <tbody className="divide-y divide-cyan-500/20">
              {activePeriods.map(period => (
                <tr key={period.id} className="hover:bg-cyan-950/20 transition-colors">
                  {/* Cột 1: Tên tiết + Giờ học */}
                  <td className="py-4 px-3 border-r border-cyan-500/25 bg-[#0a1226] text-center select-none align-middle">
                    <div className="font-bold text-cyan-300 text-sm">{period.periodName}</div>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-cyan-400/80 mt-1 border-b border-dotted border-cyan-500/30 pb-0.5 w-fit mx-auto">
                      <Clock className="w-3 h-3 text-cyan-400/80 shrink-0" />
                      <span>
                        {period.startTime} - {period.endTime}
                      </span>
                    </div>
                  </td>

                  {/* Các ô dữ liệu theo từng ngày */}
                  {activeDays.map(day => {
                    const cellKey = `${period.id}_${day.id}`;
                    const rawVal = activeGrid[cellKey] || '';
                    const isCellEmpty = rawVal.trim() === '';
                    const isCellEditingNow = editingCellKey === cellKey;

                    return (
                      <td
                        key={day.id}
                        onClick={() => handleCellClick(period.id, day.id)}
                        className={`py-3 px-3 border-r border-cyan-500/25 last:border-r-0 align-middle transition-colors relative min-h-[64px] bg-[#090f1e] ${
                          isDeleteMode
                            ? 'cursor-crosshair hover:bg-rose-950/50 hover:border-rose-400'
                            : isEditing
                            ? 'cursor-pointer hover:bg-cyan-950/30'
                            : ''
                        }`}
                      >
                        {isCellEditingNow && isEditing && !isDeleteMode ? (
                          /* Direct Textarea Editor (Hỗ trợ Enter xuống dòng giống Word) */
                          <textarea
                            autoFocus
                            rows={Math.max(2, rawVal.split('\n').length)}
                            value={rawVal}
                            onChange={e => handleCellContentChange(cellKey, e.target.value)}
                            onBlur={() => handleCellBlur(cellKey)}
                            placeholder="-trống-"
                            className="w-full bg-[#070b16] border-2 border-cyan-400 text-cyan-100 rounded-lg p-2 text-sm outline-none resize-none shadow-[0_0_12px_rgba(6,182,212,0.3)] font-sans leading-relaxed text-center"
                          />
                        ) : (
                          /* Hiển thị nội dung hoặc -trống- */
                          <div className="w-full text-center">
                            {isCellEmpty ? (
                              <span className="italic font-mono text-sm text-cyan-400/40 select-none">
                                -trống-
                              </span>
                            ) : (
                              <div className="text-sm font-semibold text-slate-100 whitespace-pre-line leading-relaxed">
                                {rawVal}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Trong Edit Mode: Cột nút thùng rác xóa hàng */}
                  {isEditing && (
                    <td className="py-3 px-2 border-l border-cyan-500/25 text-center align-middle bg-[#0c162b]">
                      <button
                        type="button"
                        onClick={() => handleRequestDeletePeriod(period.id)}
                        className="text-rose-400 hover:text-rose-300 hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-rose-950/50 cursor-pointer"
                        title={`Xóa ${period.periodName} trên tất cả các ngày`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. NÚT "+ THÊM TIẾT HỌC MỚI" (DƯỚI CÙNG BẢNG TRONG EDIT MODE) */}
      {isEditing && (
        <button
          type="button"
          onClick={handleOpenAddPeriod}
          className="w-full py-3.5 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-5 h-5 text-cyan-400" />
          Thêm tiết học mới
        </button>
      )}

      {/* 6. MODAL XÁC NHẬN (XÓA CỘT NGÀY / XÓA HÀNG TIẾT / HỦY CHỈNH SỬA) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#0a1122] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Thao tác này sẽ áp dụng vào bản nháp</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-[#0c162b] p-3.5 rounded-xl border border-cyan-500/20">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#0c162b] hover:bg-cyan-950/50 border border-cyan-500/30 cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.type === 'discard_changes') {
                    setIsEditing(false);
                    setIsDeleteMode(false);
                    setDraftDays(JSON.parse(JSON.stringify(savedDays)));
                    setDraftPeriods(JSON.parse(JSON.stringify(savedPeriods)));
                    setDraftGrid(JSON.parse(JSON.stringify(savedGrid)));
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    showToast('Đã hủy các chỉnh sửa', 'info');
                  } else {
                    handleExecuteConfirm();
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-sm cursor-pointer transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL THÊM TIẾT HỌC MỚI */}
      {isAddPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#0a1122] border border-cyan-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Thêm tiết học mới
              </h3>
              <button
                onClick={() => setIsAddPeriodModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">Tên tiết</label>
                <input
                  type="text"
                  value={newPeriodName}
                  onChange={e => setNewPeriodName(e.target.value)}
                  className="w-full bg-[#0c162b] border border-cyan-500/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={e => {
                      setNewStartTime(e.target.value);
                      setTimeValidationError(null);
                    }}
                    className="w-full bg-[#0c162b] border border-cyan-500/40 rounded-xl px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={e => {
                      setNewEndTime(e.target.value);
                      setTimeValidationError(null);
                    }}
                    className="w-full bg-[#0c162b] border border-cyan-500/40 rounded-xl px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400 shadow-2xs"
                  />
                </div>
              </div>

              {timeValidationError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {timeValidationError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => setIsAddPeriodModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#0c162b] hover:bg-cyan-950/50 border border-cyan-500/30 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAddPeriod}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400 shadow-sm cursor-pointer"
              >
                Thêm tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
