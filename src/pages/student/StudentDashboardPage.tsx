import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  FileQuestion,
  TrendingUp,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const student = dbService.getStudentById(currentUser.studentId || 'stu-10a1-01');
  const assignments = dbService.getAssignments('cls-10a1');
  const schedule = dbService.getSchedule('cls-10a1');
  const quizzes = dbService.getQuizzes('cls-10a1');
  const grades = dbService.getGrades('cls-10a1', 'HK1').find(g => g.studentId === student?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chào bạn, ${currentUser.fullName}!`}
        description={`Lớp: ${student?.className || '10A1'} · SBD/Mã HS: ${student?.studentCode || 'HS2025-001'} · Học kỳ 1`}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Điểm TB Tích Luỹ"
          value={student?.gpa || 8.9}
          subtitle="Học lực: Giỏi"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Điểm Thi Đua / Tích Luỹ"
          value={`${student?.rewardPoints || 125} đ`}
          subtitle="Top 3 toàn lớp"
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Tỷ Lệ Chuyên Cần"
          value={`${student?.attendanceRate || 98.4}%`}
          subtitle="Có mặt 100% tuần này"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Bài Tập Cần Làm"
          value={assignments.length}
          subtitle="1 bài sắp đến hạn"
          icon={BookOpen}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule & Assignments (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Lịch học hôm nay</h3>
              <span className="text-xs text-blue-600 font-medium">Thứ Hai · 11/10/2026</span>
            </div>

            <div className="divide-y divide-slate-100">
              {schedule.slice(0, 3).map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-center text-xs font-mono font-bold text-blue-600">
                      {item.startTime}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.subject}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.teacherName} · Phòng {item.room}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    Tiết {item.period}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments to do */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Bài tập & Nhiệm vụ về nhà</h3>
              <span className="text-xs text-slate-400">Nộp bài trực tuyến</span>
            </div>

            <div className="space-y-3">
              {assignments.map(asg => (
                <div key={asg.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.2 rounded">
                      {asg.subject}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{asg.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{asg.description}</p>
                    <p className="text-[11px] text-rose-600 font-mono font-medium mt-1">
                      Hạn nộp: {new Date(asg.dueDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button
                    onClick={() => showToast('Mở trình nộp bài tập của học sinh...', 'info')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shrink-0 shadow-xs"
                  >
                    Nộp bài
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quizzes & Grades */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Kiểm tra trắc nghiệm online</h3>
            {quizzes.map(q => (
              <div key={q.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <p className="text-xs font-bold text-slate-900">{q.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Thời gian: {q.durationMinutes} phút</p>
                <button
                  onClick={() => showToast('Bắt đầu làm bài kiểm tra trắc nghiệm!', 'success')}
                  className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Làm bài ngay
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Điểm số môn Toán gần đây</h3>
            {grades ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Điểm Miệng (TX1):</span>
                  <strong className="font-mono">{grades.oralScores.join(', ')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">15 Phút (TX2):</span>
                  <strong className="font-mono">{grades.quizScores.join(', ')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Giữa kỳ (GK):</span>
                  <strong className="font-mono">{grades.midtermScore}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Điểm TB môn:</span>
                  <strong className="font-mono text-blue-600 text-sm font-bold">{grades.averageScore}</strong>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Đang cập nhật bảng điểm...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
