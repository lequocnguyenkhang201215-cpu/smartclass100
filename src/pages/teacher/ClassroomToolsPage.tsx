import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Play,
  RotateCcw,
  Users,
  Clock,
  Shuffle,
  Volume2,
  CheckCircle2,
  Award
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Student } from '../../types';

export const ClassroomToolsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const classes = dbService.getClasses(currentUser.id);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'cls-10a1');
  const students = dbService.getStudents(selectedClassId);

  const [activeTool, setActiveTool] = useState<'wheel' | 'random' | 'groups' | 'timer'>('wheel');

  // --- TOOL 1: LUCKY WHEEL & RANDOM PICKER ---
  const [pickedStudent, setPickedStudent] = useState<Student | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [calledHistory, setCalledHistory] = useState<Student[]>([]);
  const [avoidRepeats, setAvoidRepeats] = useState(true);

  const handlePickRandomStudent = () => {
    if (students.length === 0) return;
    setIsSpinning(true);
    setPickedStudent(null);

    const available = avoidRepeats
      ? students.filter(s => !calledHistory.some(c => c.id === s.id))
      : students;

    const pool = available.length > 0 ? available : students;

    // Simulate excitement spinning
    let counter = 0;
    const interval = setInterval(() => {
      const tempPick = pool[Math.floor(Math.random() * pool.length)];
      setPickedStudent(tempPick);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        const finalPick = pool[Math.floor(Math.random() * pool.length)];
        setPickedStudent(finalPick);
        setIsSpinning(false);
        setCalledHistory(prev => [finalPick, ...prev]);

        // Trigger confetti celebrations!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        showToast(`Chúc mừng học sinh ${finalPick.fullName}!`, 'success');
      }
    }, 100);
  };

  // --- TOOL 2: GROUP MAKER ---
  const [groupCount, setGroupCount] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState<Student[][]>([]);

  const handleCreateGroups = () => {
    if (students.length === 0) return;
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const groups: Student[][] = Array.from({ length: groupCount }, () => []);

    shuffled.forEach((s, idx) => {
      groups[idx % groupCount].push(s);
    });

    setGeneratedGroups(groups);
    showToast(`Đã chia lớp thành ${groupCount} nhóm ngẫu nhiên!`, 'success');
  };

  // --- TOOL 3: COUNTDOWN TIMER ---
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            showToast('Hết thời gian làm bài!', 'error');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Công cụ Lớp học Tương tác"
        description="Bộ công cụ trình chiếu trên bảng thông minh / máy chiếu giúp lớp học sôi nổi và hứng khởi."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Công cụ' }]}
        actions={
          <div className="flex items-center gap-2">
            <label className="text-xs text-cyan-400/80 font-semibold uppercase tracking-wider">Lớp:</label>
            <select
              value={selectedClassId}
              onChange={e => {
                setSelectedClassId(e.target.value);
                setCalledHistory([]);
                setPickedStudent(null);
              }}
              className="text-xs font-semibold border border-cyan-500/30 rounded-xl px-3 py-1.5 bg-[#0c162b] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0a1122]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Tool Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0a1122] border border-cyan-500/30 p-2 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.06)]">
        {[
          { id: 'wheel', label: 'Vòng quay may mắn / Gọi tên', icon: Sparkles },
          { id: 'groups', label: 'Chia nhóm tự động', icon: Users },
          { id: 'timer', label: 'Đồng hồ đếm ngược', icon: Clock },
        ].map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                  : 'text-slate-300 hover:text-white hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* TOOL 1: LUCKY WHEEL & RANDOM PICKER */}
      {activeTool === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col items-center justify-center min-h-[420px] text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-6">
              <Sparkles className="w-12 h-12 animate-pulse text-cyan-200" />
            </div>

            <div className="min-h-24 flex flex-col items-center justify-center mb-6">
              {pickedStudent ? (
                <div className="animate-in zoom-in-95 duration-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/40">
                    Người may mắn được gọi
                  </span>
                  <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
                    {pickedStudent.fullName}
                  </h2>
                  <p className="mt-1 text-sm text-cyan-400 font-mono">
                    Mã: {pickedStudent.studentCode} · STT {pickedStudent.seatNumber} · Tổ {pickedStudent.groupNumber}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-white">Sẵn sàng gọi ngẫu nhiên!</h3>
                  <p className="text-xs text-slate-400 mt-1">Danh sách lớp hiện có {students.length} học sinh</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={isSpinning || students.length === 0}
                onClick={handlePickRandomStudent}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-sm font-bold rounded-xl border border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.3)] transition-all transform active:scale-95 cursor-pointer"
              >
                <Shuffle className="w-5 h-5" />
                {isSpinning ? 'Đang quay...' : 'Bắt đầu gọi ngẫu nhiên'}
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                id="avoidRepeat"
                checked={avoidRepeats}
                onChange={e => setAvoidRepeats(e.target.checked)}
                className="rounded text-cyan-500 border-cyan-500/40 bg-[#0c162b] focus:ring-cyan-500"
              />
              <label htmlFor="avoidRepeat" className="cursor-pointer text-slate-300">
                Tránh gọi lặp lại (loại trừ học sinh đã được gọi trong tiết này)
              </label>
            </div>
          </div>

          {/* Called History */}
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Lịch sử đã gọi ({calledHistory.length})
              </h3>
              {calledHistory.length > 0 && (
                <button
                  onClick={() => setCalledHistory([])}
                  className="text-xs text-rose-400 font-medium hover:underline cursor-pointer"
                >
                  Xóa lịch sử
                </button>
              )}
            </div>

            {calledHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có lượt gọi nào.</p>
            ) : (
              <div className="divide-y divide-cyan-500/15 max-h-80 overflow-y-auto">
                {calledHistory.map((s, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {idx + 1}. {s.fullName}
                    </span>
                    <span className="text-cyan-400 font-mono text-[11px]">Tổ {s.groupNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOOL 2: GROUP MAKER */}
      {activeTool === 'groups' && (
        <div className="space-y-6">
          <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-white">Số lượng nhóm cần chia:</label>
              <select
                value={groupCount}
                onChange={e => setGroupCount(Number(e.target.value))}
                className="text-xs font-bold border border-cyan-500/30 rounded-xl px-3 py-1.5 bg-[#0c162b] text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
              >
                <option value={2} className="bg-[#0a1122]">2 nhóm</option>
                <option value={3} className="bg-[#0a1122]">3 nhóm</option>
                <option value={4} className="bg-[#0a1122]">4 nhóm</option>
                <option value={5} className="bg-[#0a1122]">5 nhóm</option>
                <option value={6} className="bg-[#0a1122]">6 nhóm</option>
                <option value={8} className="bg-[#0a1122]">8 nhóm</option>
              </select>
            </div>

            <button
              onClick={handleCreateGroups}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              Tiến hành chia nhóm ngẫu nhiên
            </button>
          </div>

          {generatedGroups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {generatedGroups.map((group, idx) => (
                <div key={idx} className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.06)]">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                    <h4 className="text-sm font-bold text-cyan-300">Nhóm {idx + 1}</h4>
                    <span className="text-[11px] text-cyan-400/80 font-mono font-medium">
                      {group.length} thành viên
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                    {group.map((m, mIdx) => (
                      <li key={m.id} className="flex items-center gap-2">
                        <span className="text-cyan-400/60 font-mono text-[10px]">{mIdx + 1}.</span>
                        <span className="font-medium text-white">{m.fullName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: COUNTDOWN TIMER */}
      {activeTool === 'timer' && (
        <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(6,182,212,0.06)] max-w-xl mx-auto text-center">
          <div className="text-6xl sm:text-7xl font-extrabold font-mono text-cyan-300 tracking-tight my-6 tabular-nums drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            {formatTimer(timerSeconds)}
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[
              { sec: 60, label: '1 phút' },
              { sec: 180, label: '3 phút' },
              { sec: 300, label: '5 phút' },
              { sec: 600, label: '10 phút' },
              { sec: 900, label: '15 phút' },
            ].map(p => (
              <button
                key={p.sec}
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(p.sec);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0c162b] border border-cyan-500/30 hover:bg-cyan-950/40 text-cyan-200 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`px-8 py-3 rounded-xl text-sm font-bold text-slate-950 transition-all shadow-xs cursor-pointer ${
                timerRunning
                  ? 'bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-emerald-400 hover:bg-emerald-300 border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {timerRunning ? 'Tạm dừng' : 'Bắt đầu đếm'}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(300);
              }}
              className="p-3 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 transition-colors cursor-pointer"
              title="Đặt lại"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
