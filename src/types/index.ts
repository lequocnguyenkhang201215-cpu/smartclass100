export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  academicYearCurrent: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  schoolId: string;
  subjectSpecialty?: string; // For teachers
  studentId?: string; // For students or linked parent child
  linkedStudentIds?: string[]; // For parents with multiple children
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2025 - 2026"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  schoolId: string;
}

export interface GradeLevel {
  id: string;
  name: string; // e.g. "Khối 10", "Khối 11", "Khối 12"
  order: number;
}

export interface Subject {
  id: string;
  name: string; // e.g. "Toán học", "Ngữ văn", "Tiếng Anh", "Vật lý"
  code: string;
  gradeLevelId?: string;
  creditHours?: number;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "10A1", "12A3"
  gradeLevel: string; // "10", "11", "12"
  subject?: string;
  academicYear: string;
  roomNumber: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  studentCount: number;
  description?: string;
  inviteCode: string;
  colorTheme: string; // e.g. "blue", "indigo", "emerald", "amber", "rose"
  isArchived?: boolean;
  schoolId: string;
  createdAt: string;
}

export interface Student {
  id: string;
  studentCode: string; // "HS20260101"
  fullName: string;
  gender: 'NAM' | 'NỮ';
  dateOfBirth: string;
  classId: string;
  className: string;
  groupNumber?: number; // Tổ 1, Tổ 2...
  seatNumber?: number; // STT
  avatarUrl?: string;
  status: 'STUDYING' | 'LEAVE' | 'SUSPENDED';
  address?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentId?: string;
  rewardPoints: number; // Điểm thi đua / tích luỹ
  attendanceRate: number; // Percentage e.g. 98.5
  gpa: number; // e.g. 8.4
  schoolId: string;
  createdAt: string;
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  linkedStudents: {
    studentId: string;
    studentName: string;
    className: string;
    relationship: 'Bố' | 'Mẹ' | 'Người giám hộ';
  }[];
  schoolId: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED' | 'LATE' | 'EARLY_LEAVE';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  seatNumber?: number;
  date: string; // YYYY-MM-DD
  period: number; // Tiết 1 - 5
  status: AttendanceStatus;
  note?: string;
  recordedByTeacherId: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  dayOfWeek: 2 | 3 | 4 | 5 | 6 | 7 | 8; // 2=Thứ 2 ... 8=Chủ nhật
  period: number; // 1 to 10
  startTime: string; // "07:00"
  endTime: string; // "07:45"
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
  notes?: string;
}

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT_REQUIRED';

export interface Assignment {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  dueDate: string; // ISO string
  maxScore: number;
  attachments?: { name: string; url: string; size: string }[];
  target: 'ALL' | 'GROUP' | 'INDIVIDUAL';
  targetIds?: string[];
  status: AssignmentStatus;
  createdAt: string;
  submittedCount?: number;
  gradedCount?: number;
  totalStudents?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: SubmissionStatus;
  content?: string;
  attachments?: { name: string; url: string; size: string }[];
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedByTeacherId?: string;
}

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'MATCHING';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type QuestionStatus = 'DRAFT' | 'PENDING' | 'APPROVED';
export type QuestionShareScope = 'PRIVATE' | 'DEPARTMENT' | 'SCHOOL' | 'PUBLIC';

export interface Question {
  id: string;
  code?: string; // Mã câu hỏi ví dụ: TOAN10-NB-001
  subject: string;
  gradeLevel: string;
  textbook?: string; // 'Cánh Diều' | 'Kết Nối Tri Thức' | 'Chân Trời Sáng Tạo'
  chapter?: string;
  lesson?: string;
  type: QuestionType;
  prompt: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  subStatements?: { id: string; text: string; isCorrect: boolean }[]; // Dạng Đúng/Sai 4 ý chuẩn 2025
  matchingPairs?: { id: string; left: string; right: string }[]; // Dạng nối cặp
  correctAnswerText?: string;
  explanation?: string;
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  imageUrl?: string;
  tags: string[];
  status?: QuestionStatus;
  authorId?: string;
  authorName?: string;
  shareScope?: QuestionShareScope;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamSet {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  textbook?: string;
  durationMinutes: number;
  totalPoints: number;
  questionCount: number;
  questions: Question[];
  matrix?: {
    easy: number;
    medium: number;
    hard: number;
    veryHard: number;
  };
  authorName?: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  durationMinutes: number;
  openTime: string;
  closeTime: string;
  questions: Question[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts: number;
  isPublished: boolean;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  startedAt: string;
  submittedAt: string;
  answers: { questionId: string; answer: string | string[] }[];
}

export interface LearningResource {
  id: string;
  title: string;
  category: 'PDF' | 'DOCX' | 'PPTX' | 'VIDEO' | 'LINK';
  gradeLevel: string;
  subject: string;
  chapter?: string;
  lesson?: string;
  fileUrl: string;
  fileSize?: string;
  authorId: string;
  authorName: string;
  classIds?: string[]; // classes that can access
  isPublic: boolean;
  views: number;
  createdAt: string;
}

export interface GradeItem {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  subject: string;
  semester: 'HK1' | 'HK2';
  oralScores: number[]; // Điểm miệng / thường xuyên (TX)
  quizScores: number[]; // Điểm 15 phút
  midtermScore?: number; // Điểm giữa kỳ (GK)
  finalScore?: number; // Điểm cuối kỳ (CK)
  averageScore?: number; // Điểm trung bình môn
  note?: string;
  updatedAt: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  type: 'POSITIVE' | 'NEEDS_IMPROVEMENT';
  title: string;
  description: string;
  pointsDelta: number; // e.g. +5 or -2
  date: string;
  createdAt: string;
}

export interface RewardItem {
  id: string;
  studentId: string;
  studentName: string;
  badgeName: string;
  badgeIcon: string;
  reason: string;
  awardedBy: string;
  awardedAt: string;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED';

export interface SmartAlert {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: 'ATTENDANCE' | 'ACADEMIC' | 'HOMEWORK' | 'BEHAVIOR';
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  metrics: string; // e.g. "Vắng 4 buổi liên tiếp", "Điểm Toán < 4.0"
  createdAt: string;
  resolvedAt?: string;
  resolvedNotes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: UserRole;
  targetRole: 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';
  targetClassIds?: string[];
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  readByCount: number;
  attachments?: { name: string; url: string }[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string; // e.g. "UPDATE_GRADE", "DELETE_STUDENT", "TAKE_ATTENDANCE"
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  schoolName: string;
  academicYear: string;
  currentSemester: 'HK1' | 'HK2';
  allowParentMessaging: boolean;
  allowStudentSelfEnroll: boolean;
  attendanceNotificationThreshold: number; // absent days to trigger alert
  passingGrade: number; // e.g. 5.0
  systemVersion: string;
}
