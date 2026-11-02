import {
  School,
  UserProfile,
  UserRole,
  AcademicYear,
  Subject,
  ClassRoom,
  Student,
  AttendanceRecord,
  ScheduleItem,
  Assignment,
  AssignmentSubmission,
  Quiz,
  GradeItem,
  BehaviorRecord,
  SmartAlert,
  Announcement,
  AuditLog,
  SystemSetting,
  LearningResource,
  Question,
  ExamSet
} from '../types';

import {
  SEED_SCHOOL,
  SEED_USERS,
  SEED_ACADEMIC_YEARS,
  SEED_SUBJECTS,
  SEED_CLASSES,
  SEED_STUDENTS,
  SEED_SCHEDULE,
  SEED_ASSIGNMENTS,
  SEED_SUBMISSIONS,
  SEED_QUIZZES,
  SEED_GRADES,
  SEED_ATTENDANCE,
  SEED_ALERTS,
  SEED_ANNOUNCEMENTS,
  SEED_BEHAVIORS,
  SEED_RESOURCES,
  SEED_AUDIT_LOGS,
  SEED_SYSTEM_SETTINGS
} from '../data/seedData';
import { SEED_QUESTIONS, SEED_EXAM_SETS } from '../data/questionBankSeed';

const STORAGE_KEYS = {
  SCHOOL: 'smartclass_school',
  USERS: 'smartclass_users',
  ACADEMIC_YEARS: 'smartclass_academic_years',
  SUBJECTS: 'smartclass_subjects',
  CLASSES: 'smartclass_classes',
  STUDENTS: 'smartclass_students',
  SCHEDULE: 'smartclass_schedule',
  ASSIGNMENTS: 'smartclass_assignments',
  SUBMISSIONS: 'smartclass_submissions',
  QUIZZES: 'smartclass_quizzes',
  GRADES: 'smartclass_grades',
  ATTENDANCE: 'smartclass_attendance',
  ALERTS: 'smartclass_alerts',
  ANNOUNCEMENTS: 'smartclass_announcements',
  BEHAVIORS: 'smartclass_behaviors',
  RESOURCES: 'smartclass_resources',
  AUDIT_LOGS: 'smartclass_audit_logs',
  SETTINGS: 'smartclass_settings',
  QUESTIONS: 'smartclass_questions',
  EXAM_SETS: 'smartclass_exam_sets',
};

// Generic storage read / write helper with fallback
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from storage, using fallback:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const dbService = {
  // Reset all to default seed data
  resetToDefaults: () => {
    saveToStorage(STORAGE_KEYS.SCHOOL, SEED_SCHOOL);
    saveToStorage(STORAGE_KEYS.USERS, SEED_USERS);
    saveToStorage(STORAGE_KEYS.ACADEMIC_YEARS, SEED_ACADEMIC_YEARS);
    saveToStorage(STORAGE_KEYS.SUBJECTS, SEED_SUBJECTS);
    saveToStorage(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    saveToStorage(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    saveToStorage(STORAGE_KEYS.SCHEDULE, SEED_SCHEDULE);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
    saveToStorage(STORAGE_KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
    saveToStorage(STORAGE_KEYS.QUIZZES, SEED_QUIZZES);
    saveToStorage(STORAGE_KEYS.GRADES, SEED_GRADES);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    saveToStorage(STORAGE_KEYS.ALERTS, SEED_ALERTS);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
    saveToStorage(STORAGE_KEYS.BEHAVIORS, SEED_BEHAVIORS);
    saveToStorage(STORAGE_KEYS.RESOURCES, SEED_RESOURCES);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    saveToStorage(STORAGE_KEYS.SETTINGS, SEED_SYSTEM_SETTINGS);
  },

  // === SCHOOL & SYSTEM ===
  getSchool: (): School => getFromStorage(STORAGE_KEYS.SCHOOL, SEED_SCHOOL),
  getSystemSettings: (): SystemSetting => getFromStorage(STORAGE_KEYS.SETTINGS, SEED_SYSTEM_SETTINGS),
  updateSystemSettings: (settings: Partial<SystemSetting>): SystemSetting => {
    const current = dbService.getSystemSettings();
    const updated = { ...current, ...settings };
    saveToStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // === USERS ===
  getUsers: (): UserProfile[] => getFromStorage(STORAGE_KEYS.USERS, SEED_USERS),
  getUserById: (id: string): UserProfile | undefined => {
    return dbService.getUsers().find(u => u.id === id);
  },
  getUserByEmail: (email: string): UserProfile | undefined => {
    return dbService.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  createUser: (userData: {
    fullName: string;
    email: string;
    role: UserRole;
    phone?: string;
    subjectSpecialty?: string;
    studentId?: string;
    avatarUrl?: string;
    schoolId?: string;
  }): UserProfile => {
    const list = dbService.getUsers();
    const existing = list.find(u => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (existing) {
      throw new Error('Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập!');
    }

    const defaultAvatars: Record<UserRole, string> = {
      TEACHER: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      STUDENT: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      PARENT: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      ADMIN: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    };

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: userData.email.trim().toLowerCase(),
      fullName: userData.fullName.trim(),
      role: userData.role,
      avatarUrl: userData.avatarUrl || defaultAvatars[userData.role],
      phone: userData.phone || '0987654321',
      schoolId: userData.schoolId || 'sch-01',
      subjectSpecialty: userData.subjectSpecialty,
      studentId: userData.studentId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    list.unshift(newUser);
    saveToStorage(STORAGE_KEYS.USERS, list);

    if (userData.role === 'STUDENT') {
      const classes = dbService.getClasses();
      const targetClass = classes.find(c => c.id === userData.studentId) || classes[0];
      if (targetClass) {
        dbService.createStudent({
          studentCode: `HS${Math.floor(100000 + Math.random() * 900000)}`,
          fullName: userData.fullName.trim(),
          gender: 'NAM',
          dateOfBirth: '2008-05-15',
          classId: targetClass.id,
          className: targetClass.name,
          rewardPoints: 100,
          attendanceRate: 100,
          gpa: 8.0,
          schoolId: 'sch-01',
          status: 'STUDYING',
        });
      }
    }

    return newUser;
  },

  // === CLASSES ===
  getClasses: (teacherId?: string): ClassRoom[] => {
    const raw = getFromStorage<ClassRoom[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    const classes = raw.map(c => {
      let desc = c.description || '';
      // If description repeats "Khối" and "Phòng", replace with clean note
      if (desc.toLowerCase().includes('khối') && desc.toLowerCase().includes('phòng')) {
        desc = c.gradeLevel === '10' ? 'Chuyên Ban Tự Nhiên' : c.gradeLevel === '11' ? 'Nâng cao Giải tích' : 'Ôn thi Tốt nghiệp THPT';
      }
      return {
        ...c,
        description: desc,
      };
    });
    if (!teacherId) return classes;
    return classes.filter(c => c.homeroomTeacherId === teacherId);
  },
  getClassById: (id: string): ClassRoom | undefined => {
    return dbService.getClasses().find(c => c.id === id);
  },
  createClass: (classData: Omit<ClassRoom, 'id' | 'createdAt' | 'studentCount'>): ClassRoom => {
    const list = dbService.getClasses();
    const newClass: ClassRoom = {
      ...classData,
      id: `cls-${Date.now()}`,
      studentCount: 0,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newClass);
    saveToStorage(STORAGE_KEYS.CLASSES, list);
    dbService.logAudit({
      actorId: classData.homeroomTeacherId,
      actorName: classData.homeroomTeacherName,
      actorRole: 'TEACHER',
      action: 'CREATE_CLASS',
      entityType: 'CLASS',
      entityId: newClass.id,
      description: `Tạo mới lớp học ${newClass.name} (Phòng: ${newClass.roomNumber})`,
    });
    return newClass;
  },
  updateClass: (id: string, updates: Partial<ClassRoom>): ClassRoom => {
    const list = dbService.getClasses();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Class not found');
    list[index] = { ...list[index], ...updates };
    saveToStorage(STORAGE_KEYS.CLASSES, list);
    return list[index];
  },
  archiveClass: (id: string): boolean => {
    const list = dbService.getClasses();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) return false;
    list[index].isArchived = !list[index].isArchived;
    saveToStorage(STORAGE_KEYS.CLASSES, list);
    return true;
  },
  deleteClass: (id: string): boolean => {
    const list = dbService.getClasses().filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.CLASSES, list);
    return true;
  },

  // === STUDENTS ===
  getStudents: (classId?: string): Student[] => {
    let students = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    if (!students || students.length < SEED_STUDENTS.length) {
      students = SEED_STUDENTS;
      saveToStorage(STORAGE_KEYS.STUDENTS, students);
    }
    if (!classId) return students;
    return students.filter(s => s.classId === classId);
  },
  getStudentById: (id: string): Student | undefined => {
    return dbService.getStudents().find(s => s.id === id);
  },
  createStudent: (data: Omit<Student, 'id' | 'createdAt'>): Student => {
    const list = dbService.getStudents();
    const newStudent: Student = {
      ...data,
      id: `stu-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.push(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, list);
    // Update student count in class
    if (data.classId) {
      const cls = dbService.getClassById(data.classId);
      if (cls) {
        dbService.updateClass(cls.id, { studentCount: cls.studentCount + 1 });
      }
    }
    return newStudent;
  },
  updateStudent: (id: string, updates: Partial<Student>): Student => {
    const list = dbService.getStudents();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    list[index] = { ...list[index], ...updates };
    saveToStorage(STORAGE_KEYS.STUDENTS, list);
    return list[index];
  },
  deleteStudent: (id: string): boolean => {
    const list = dbService.getStudents();
    const target = list.find(s => s.id === id);
    if (target && target.classId) {
      const cls = dbService.getClassById(target.classId);
      if (cls && cls.studentCount > 0) {
        dbService.updateClass(cls.id, { studentCount: cls.studentCount - 1 });
      }
    }
    const filtered = list.filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.STUDENTS, filtered);
    return true;
  },
  importStudentsBatch: (studentsToAdd: Omit<Student, 'id' | 'createdAt'>[]): number => {
    const current = dbService.getStudents();
    const timestamp = Date.now();
    const added = studentsToAdd.map((s, idx) => ({
      ...s,
      id: `stu-${timestamp}-${idx}`,
      createdAt: new Date().toISOString(),
    }));
    const updated = [...current, ...added];
    saveToStorage(STORAGE_KEYS.STUDENTS, updated);
    return added.length;
  },

  // === ATTENDANCE ===
  getAttendance: (classId: string, date: string, period?: number): AttendanceRecord[] => {
    const list = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    return list.filter(r => r.classId === classId && r.date === date && (!period || r.period === period));
  },
  saveAttendance: (records: AttendanceRecord[]): void => {
    const list = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    // Replace or insert
    const map = new Map<string, AttendanceRecord>();
    list.forEach(r => map.set(`${r.studentId}_${r.date}_${r.period}`, r));
    records.forEach(r => map.set(`${r.studentId}_${r.date}_${r.period}`, r));
    const merged = Array.from(map.values());
    saveToStorage(STORAGE_KEYS.ATTENDANCE, merged);
  },
  getAllAttendanceRecords: (): AttendanceRecord[] => {
    return getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
  },

  // === SCHEDULE ===
  getSchedule: (classId?: string): ScheduleItem[] => {
    const list = getFromStorage<ScheduleItem[]>(STORAGE_KEYS.SCHEDULE, SEED_SCHEDULE);
    if (!classId) return list;
    return list.filter(s => s.classId === classId);
  },

  // === ASSIGNMENTS & SUBMISSIONS ===
  getAssignments: (classId?: string): Assignment[] => {
    const list = getFromStorage<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
    if (!classId) return list;
    return list.filter(a => a.classId === classId);
  },
  getAssignmentById: (id: string): Assignment | undefined => {
    return dbService.getAssignments().find(a => a.id === id);
  },
  createAssignment: (data: Omit<Assignment, 'id' | 'createdAt' | 'submittedCount' | 'gradedCount'>): Assignment => {
    const list = dbService.getAssignments();
    const newAsg: Assignment = {
      ...data,
      id: `asg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      submittedCount: 0,
      gradedCount: 0,
      totalStudents: 32,
    };
    list.unshift(newAsg);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, list);
    return newAsg;
  },
  updateAssignment: (id: string, updates: Partial<Assignment>): Assignment => {
    const list = dbService.getAssignments();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Assignment not found');
    list[index] = { ...list[index], ...updates };
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, list);
    return list[index];
  },
  deleteAssignment: (id: string): boolean => {
    const list = dbService.getAssignments().filter(a => a.id !== id);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, list);
    return true;
  },
  getSubmissions: (assignmentId: string): AssignmentSubmission[] => {
    const list = getFromStorage<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
    return list.filter(s => s.assignmentId === assignmentId);
  },
  gradeSubmission: (submissionId: string, score: number, feedback: string, teacherId: string): AssignmentSubmission => {
    const list = getFromStorage<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
    const index = list.findIndex(s => s.id === submissionId);
    if (index === -1) throw new Error('Submission not found');
    list[index] = {
      ...list[index],
      score,
      feedback,
      status: 'GRADED',
      gradedAt: new Date().toISOString(),
      gradedByTeacherId: teacherId,
    };
    saveToStorage(STORAGE_KEYS.SUBMISSIONS, list);
    return list[index];
  },

  // === QUIZZES ===
  getQuizzes: (classId?: string): Quiz[] => {
    const list = getFromStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, SEED_QUIZZES);
    if (!classId) return list;
    return list.filter(q => q.classId === classId);
  },
  getQuizById: (id: string): Quiz | undefined => {
    return dbService.getQuizzes().find(q => q.id === id);
  },
  createQuiz: (quizData: Omit<Quiz, 'id' | 'createdAt'>): Quiz => {
    const list = dbService.getQuizzes();
    const newQuiz: Quiz = {
      ...quizData,
      id: `quiz-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newQuiz);
    saveToStorage(STORAGE_KEYS.QUIZZES, list);
    return newQuiz;
  },

  // === GRADES ===
  getGrades: (classId: string, semester?: 'HK1' | 'HK2'): GradeItem[] => {
    const list = getFromStorage<GradeItem[]>(STORAGE_KEYS.GRADES, SEED_GRADES);
    return list.filter(g => g.classId === classId && (!semester || g.semester === semester));
  },
  updateGrades: (updatedGrades: GradeItem[]): void => {
    const list = getFromStorage<GradeItem[]>(STORAGE_KEYS.GRADES, SEED_GRADES);
    const map = new Map<string, GradeItem>();
    list.forEach(g => map.set(g.id, g));
    updatedGrades.forEach(g => {
      // Recalculate average
      const allTX = [...g.oralScores, ...g.quizScores];
      const sumTX = allTX.reduce((a, b) => a + b, 0);
      const countTX = allTX.length || 1;
      const avgTX = sumTX / countTX;
      const gk = g.midtermScore ?? avgTX;
      const ck = g.finalScore ?? avgTX;
      // Weighting: TX x 1 + GK x 2 + CK x 3 / (countTX + 5)
      const avg = ((sumTX + gk * 2 + ck * 3) / (allTX.length + 5));
      g.averageScore = Number(avg.toFixed(1));
      g.updatedAt = new Date().toISOString();
      map.set(g.id, g);
    });
    saveToStorage(STORAGE_KEYS.GRADES, Array.from(map.values()));
  },

  // === BEHAVIORS & REWARDS ===
  getBehaviors: (classId?: string, studentId?: string): BehaviorRecord[] => {
    const list = getFromStorage<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIORS, SEED_BEHAVIORS);
    return list.filter(b => (!classId || b.classId === classId) && (!studentId || b.studentId === studentId));
  },
  addBehavior: (record: Omit<BehaviorRecord, 'id' | 'createdAt'>): BehaviorRecord => {
    const list = dbService.getBehaviors();
    const newRec: BehaviorRecord = {
      ...record,
      id: `beh-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRec);
    saveToStorage(STORAGE_KEYS.BEHAVIORS, list);

    // Update student rewardPoints
    const stu = dbService.getStudentById(record.studentId);
    if (stu) {
      dbService.updateStudent(stu.id, { rewardPoints: (stu.rewardPoints || 0) + record.pointsDelta });
    }
    return newRec;
  },

  // === SMART ALERTS ===
  getAlerts: (): SmartAlert[] => {
    return getFromStorage<SmartAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  },
  updateAlertStatus: (id: string, status: SmartAlert['status'], resolvedNotes?: string): SmartAlert => {
    const list = dbService.getAlerts();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Alert not found');
    list[index] = {
      ...list[index],
      status,
      ...(resolvedNotes ? { resolvedNotes, resolvedAt: new Date().toISOString() } : {}),
    };
    saveToStorage(STORAGE_KEYS.ALERTS, list);
    return list[index];
  },

  // === ANNOUNCEMENTS ===
  getAnnouncements: (): Announcement[] => {
    return getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
  },
  createAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'readByCount'>): Announcement => {
    const list = dbService.getAnnouncements();
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
      readByCount: 0,
    };
    list.unshift(newAnn);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
    return newAnn;
  },

  // === LEARNING RESOURCES ===
  getResources: (): LearningResource[] => {
    return getFromStorage<LearningResource[]>(STORAGE_KEYS.RESOURCES, SEED_RESOURCES);
  },
  createResource: (data: Omit<LearningResource, 'id' | 'createdAt' | 'views'>): LearningResource => {
    const list = dbService.getResources();
    const newRes: LearningResource = {
      ...data,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
      views: 0,
    };
    list.unshift(newRes);
    saveToStorage(STORAGE_KEYS.RESOURCES, list);
    return newRes;
  },

  // === AUDIT LOGS ===
  getAuditLogs: (): AuditLog[] => {
    return getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  },
  logAudit: (log: Omit<AuditLog, 'id' | 'createdAt'>): void => {
    const list = dbService.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newLog);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, list.slice(0, 100)); // retain latest 100
  },

  // === QUESTION BANK ===
  getQuestions: (filter?: {
    subject?: string;
    gradeLevel?: string;
    textbook?: string;
    difficulty?: string;
    type?: string;
    status?: string;
    search?: string;
  }): Question[] => {
    let list = getFromStorage<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    if (!filter) return list;

    return list.filter(q => {
      if (filter.subject && filter.subject !== 'ALL' && q.subject !== filter.subject) return false;
      if (filter.gradeLevel && filter.gradeLevel !== 'ALL' && q.gradeLevel !== filter.gradeLevel) return false;
      if (filter.textbook && filter.textbook !== 'ALL' && q.textbook !== filter.textbook) return false;
      if (filter.difficulty && filter.difficulty !== 'ALL' && q.difficulty !== filter.difficulty) return false;
      if (filter.type && filter.type !== 'ALL' && q.type !== filter.type) return false;
      if (filter.status && filter.status !== 'ALL' && q.status !== filter.status) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matchPrompt = q.prompt.toLowerCase().includes(s);
        const matchCode = q.code ? q.code.toLowerCase().includes(s) : false;
        const matchTags = q.tags ? q.tags.some(t => t.toLowerCase().includes(s)) : false;
        const matchChapter = q.chapter ? q.chapter.toLowerCase().includes(s) : false;
        if (!matchPrompt && !matchCode && !matchTags && !matchChapter) return false;
      }
      return true;
    });
  },

  getQuestionById: (id: string): Question | undefined => {
    return dbService.getQuestions().find(q => q.id === id);
  },

  createQuestion: (data: Omit<Question, 'id' | 'createdAt'>): Question => {
    const list = dbService.getQuestions();
    const timestamp = Date.now();
    const newQuestion: Question = {
      ...data,
      id: `q-${timestamp}`,
      code: data.code || `CH-${timestamp.toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: data.status || 'APPROVED',
    };
    list.unshift(newQuestion);
    saveToStorage(STORAGE_KEYS.QUESTIONS, list);
    return newQuestion;
  },

  updateQuestion: (id: string, updates: Partial<Question>): Question | undefined => {
    const list = dbService.getQuestions();
    const index = list.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.QUESTIONS, list);
    return list[index];
  },

  deleteQuestion: (id: string): boolean => {
    const list = dbService.getQuestions();
    const filtered = list.filter(q => q.id !== id);
    if (filtered.length === list.length) return false;
    saveToStorage(STORAGE_KEYS.QUESTIONS, filtered);
    return true;
  },

  duplicateQuestion: (id: string): Question | undefined => {
    const target = dbService.getQuestionById(id);
    if (!target) return undefined;
    const duplicated: Omit<Question, 'id' | 'createdAt'> = {
      ...target,
      code: `${target.code || 'CH'}-BAN-SAO`,
      prompt: `[Bản sao] ${target.prompt}`,
      status: 'DRAFT',
    };
    return dbService.createQuestion(duplicated);
  },

  importQuestionsBatch: (questionsToAdd: Omit<Question, 'id'>[]): number => {
    const list = dbService.getQuestions();
    const timestamp = Date.now();
    const newItems: Question[] = questionsToAdd.map((q, idx) => ({
      ...q,
      id: `q-${timestamp}-${idx}`,
      code: q.code || `CH-IMP-${(timestamp + idx).toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: q.status || 'APPROVED',
    }));
    const updated = [...newItems, ...list];
    saveToStorage(STORAGE_KEYS.QUESTIONS, updated);
    return newItems.length;
  },

  // === EXAM SETS ===
  getExamSets: (): ExamSet[] => {
    return getFromStorage<ExamSet[]>(STORAGE_KEYS.EXAM_SETS, SEED_EXAM_SETS);
  },

  getExamSetById: (id: string): ExamSet | undefined => {
    return dbService.getExamSets().find(e => e.id === id);
  },

  createExamSet: (data: Omit<ExamSet, 'id' | 'createdAt'>): ExamSet => {
    const list = dbService.getExamSets();
    const newExam: ExamSet = {
      ...data,
      id: `exam-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newExam);
    saveToStorage(STORAGE_KEYS.EXAM_SETS, list);
    return newExam;
  },

  deleteExamSet: (id: string): boolean => {
    const list = dbService.getExamSets();
    const filtered = list.filter(e => e.id !== id);
    if (filtered.length === list.length) return false;
    saveToStorage(STORAGE_KEYS.EXAM_SETS, filtered);
    return true;
  },
};
