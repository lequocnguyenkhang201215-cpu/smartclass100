import React, { useState } from 'react';
import {
  CalendarCheck,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  History,
  Users
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { AttendanceStatus, AttendanceRecord } from '../../types';

export const AttendancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const classes = dbService.getClasses(currentUser.id);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'cls-10a1');
  const [date, setDate] = useState('2026-10-11');
  const [period, setPeriod] = useState(1);

  const students = dbService.getStudents(selectedClassId);

  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; note: string }>>(() => {
    const existing = dbService.getAttendance(selectedClassId, '2026-10-11', 1);
    const map: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(s => {
      const found = existing.find(e => e.studentId === s.id);
      map[s.id] = { status: found ? found.status : 'PRESENT', note: found?.note || '' };
    });
    return map;
  });

  // Re-sync when class changes
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const classStudents = dbService.getStudents(newClassId);
    const existing = dbService.getAttendance(newClassId, date, period);
    const map: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach(s => {
      const found = existing.find(e => e.studentId === s.id);
      map[s.id] = { status: found ? found.status : 'PRESENT', note: found?.note || '' };
    });
    setRecords(map);
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(s => {
      updated[s.id] = { status: 'PRESENT', note: '' };
    });
    setRecords(updated);
    showToast('Đã đánh dấu tất cả có mặt!', 'info');
  };

  const handleSave = () => {
    const recordsToSave: AttendanceRecord[] = students.map(s => {
      const entry = records[s.id] || { status: 'PRESENT', note: '' };
      return {
        id: `att-${s.id}-${date}-${period}`,
        classId: selectedClassId,
        studentId: s.id,
        studentName: s.fullName,
        seatNumber: s.seatNumber,
        date,
        period,
        status: entry.status,
        note: entry.note,
        recordedByTeacherId: currentUser.id,
        updatedAt: new Date().toISOString(),
      };
    });

    dbService.saveAttendance(recordsToSave);
    dbService.logAudit({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'TEACHER',
      action: 'TAKE_ATTENDANCE',
      entityType: 'ATTENDANCE',
      entityId: selectedClassId,
      description: `Lưu điểm danh ngày ${date} tiết ${period} lớp ${classes.find(c => c.id === selectedClassId)?.name}`,
    });

    showToast('Lưu điểm danh thành công!', 'success');
  };

  // Stats
  const presentCount = Object.values(records).filter(r => r.status === 'PRESENT').length;
  const lateCount = Object.values(records).filter(r => r.status === 'LATE').length;
  const excusedCount = Object.values(records).filter(r => r.status === 'ABSENT_EXCUSED').length;
  const unexcusedCount = Object.values(records).filter(r => r.status === 'ABSENT_UNEXCUSED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh Lớp học"
        description="Ghi nhận chuyên cần tức thời, tự động đồng bộ sang hồ sơ học sinh và phụ huynh."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Điểm danh' }]}
      />

      {/* Control Bar */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3.5">
          <div>
            <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Chọn lớp</label>
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              className="text-xs font-semibold border border-cyan-500/40 rounded-xl px-3.5 py-2 bg-[#0c162b] text-white focus:border-cyan-400 focus:outline-hidden cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0a1122] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Ngày</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-xs border border-cyan-500/40 rounded-xl px-3 py-2 bg-[#0c162b] text-cyan-100 font-mono focus:border-cyan-400 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Tiết dạy</label>
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
              className="text-xs font-semibold border border-cyan-500/40 rounded-xl px-3 py-2 bg-[#0c162b] text-white focus:border-cyan-400 focus:outline-hidden cursor-pointer"
            >
              <option value={1} className="bg-[#0a1122]">Tiết 1 (07:15 - 08:00)</option>
              <option value={2} className="bg-[#0a1122]">Tiết 2 (08:05 - 08:50)</option>
              <option value={3} className="bg-[#0a1122]">Tiết 3 (09:05 - 09:50)</option>
              <option value={4} className="bg-[#0a1122]">Tiết 4 (09:55 - 10:40)</option>
              <option value={5} className="bg-[#0a1122]">Tiết 5 (10:45 - 11:30)</option>
            </select>
          </div>

          <div className="self-end pb-0.5">
            <button
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              ✓ Tất cả có mặt
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Lưu điểm danh
          </button>
        </div>
      </div>

      {/* Summary KPI Strip - Bố trí 1 dòng gọn gàng */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#0c162b] border border-emerald-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <span className="text-xs font-bold text-emerald-400 tracking-wider">CÓ MẶT</span>
          <span className="text-xl font-bold font-mono text-emerald-300">{presentCount}</span>
        </div>
        <div className="bg-[#0c162b] border border-amber-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <span className="text-xs font-bold text-amber-400 tracking-wider">ĐI TRỄ</span>
          <span className="text-xl font-bold font-mono text-amber-300">{lateCount}</span>
        </div>
        <div className="bg-[#0c162b] border border-cyan-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <span className="text-xs font-bold text-cyan-400 tracking-wider">VẮNG CÓ PHÉP</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{excusedCount}</span>
        </div>
        <div className="bg-[#0c162b] border border-rose-500/35 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <span className="text-xs font-bold text-rose-400 tracking-wider">VẮNG KHÔNG PHÉP</span>
          <span className="text-xl font-bold font-mono text-rose-300">{unexcusedCount}</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-[#0a1122] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060a14] border-b border-cyan-500/30 text-cyan-300 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-16">STT</th>
                <th className="px-4 py-3.5">Học Sinh</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5">Ghi Chú Lý Do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/15 text-slate-200">
            {students.map((s, idx) => {
              const rec = records[s.id] || { status: 'PRESENT', note: '' };
              return (
                <tr key={s.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-slate-400">{s.seatNumber || idx + 1}</td>
                  <td className="px-4 py-3.5 font-bold text-white text-sm">{s.fullName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { val: 'PRESENT', label: 'Có mặt', color: 'emerald' },
                        { val: 'LATE', label: 'Đi trễ', color: 'orange' },
                        { val: 'ABSENT_EXCUSED', label: 'Có phép', color: 'amber' },
                        { val: 'ABSENT_UNEXCUSED', label: 'Không phép', color: 'rose' },
                      ].map(opt => {
                        const active = rec.status === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setRecords(prev => ({
                                ...prev,
                                [s.id]: { ...rec, status: opt.val as AttendanceStatus },
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? opt.color === 'emerald'
                                  ? 'bg-emerald-600 text-white border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                  : opt.color === 'orange'
                                  ? 'bg-orange-500 text-white border border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                                  : opt.color === 'amber'
                                  ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                  : 'bg-rose-600 text-white border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                                : 'bg-[#0c162b] text-slate-400 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <input
                      type="text"
                      placeholder="Lý do vắng / đi trễ..."
                      value={rec.note}
                      onChange={e => {
                        const note = e.target.value;
                        setRecords(prev => ({
                          ...prev,
                          [s.id]: { ...rec, note },
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs bg-[#0c162b] border border-cyan-500/30 rounded-xl text-cyan-100 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};
