-- ====================================================================
-- SMART CLASS - QUẢN LÝ LỚP HỌC THÔNG MINH
-- POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS) & AUDIT LOGS
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SCHOOLS / ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    principal_name VARCHAR(100),
    academic_year_current VARCHAR(50) DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (RBAC Linked to auth.users)
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'STUDENT',
    avatar_url TEXT,
    phone VARCHAR(50),
    subject_specialty VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACADEMIC YEARS & SUBJECTS
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    credit_hours INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLASSES & ASSIGNMENTS TO TEACHERS
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    homeroom_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    color_theme VARCHAR(50) DEFAULT 'blue',
    description TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDENTS & CLASS ENROLLMENT
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('NAM', 'NỮ')),
    date_of_birth DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    group_number INT DEFAULT 1,
    seat_number INT,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'STUDYING',
    reward_points INT DEFAULT 0,
    address TEXT,
    phone VARCHAR(50),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PARENTS & RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    parent_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Bố/Mẹ',
    is_primary_contact BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, parent_user_id)
);

-- 8. ATTENDANCE SESSIONS & RECORDS
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period INT NOT NULL CHECK (period BETWEEN 1 AND 10),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED', 'LATE', 'EARLY_LEAVE')),
    note TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date, period)
);

-- 9. ASSIGNMENTS & SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    due_date TIMESTAMPTZ NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 10.0,
    target VARCHAR(20) DEFAULT 'ALL',
    target_ids JSONB,
    attachments JSONB,
    status VARCHAR(20) DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'SUBMITTED',
    content TEXT,
    attachments JSONB,
    score NUMERIC(5,2),
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES public.profiles(id),
    UNIQUE(assignment_id, student_id)
);

-- 10. QUIZZES & QUESTIONS
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    duration_minutes INT DEFAULT 45,
    open_time TIMESTAMPTZ,
    close_time TIMESTAMPTZ,
    shuffle_questions BOOLEAN DEFAULT true,
    shuffle_options BOOLEAN DEFAULT true,
    max_attempts INT DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    total_points NUMERIC(5,2) NOT NULL,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    answers JSONB
);

-- 11. GRADEBOOK
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    semester VARCHAR(10) DEFAULT 'HK1',
    oral_scores JSONB DEFAULT '[]'::jsonb,
    quiz_scores JSONB DEFAULT '[]'::jsonb,
    midterm_score NUMERIC(4,2),
    final_score NUMERIC(4,2),
    average_score NUMERIC(4,2),
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject, semester)
);

-- 12. BEHAVIOR, REWARDS & SMART ALERTS
CREATE TABLE IF NOT EXISTS public.behavior_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('POSITIVE', 'NEEDS_IMPROVEMENT')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_delta INT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.smart_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metrics TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_notes TEXT
);

-- 13. ANNOUNCEMENTS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(20) DEFAULT 'ALL',
    target_class_ids JSONB,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    read_by_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions to check role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ADMIN: Full Access
CREATE POLICY admin_all ON public.schools FOR ALL USING (public.current_user_role() = 'ADMIN');
CREATE POLICY admin_profiles ON public.profiles FOR ALL USING (public.current_user_role() = 'ADMIN');
CREATE POLICY admin_classes ON public.classes FOR ALL USING (public.current_user_role() = 'ADMIN');
CREATE POLICY admin_students ON public.students FOR ALL USING (public.current_user_role() = 'ADMIN');
CREATE POLICY admin_attendance ON public.attendance_records FOR ALL USING (public.current_user_role() = 'ADMIN');
CREATE POLICY admin_grades ON public.grades FOR ALL USING (public.current_user_role() = 'ADMIN');

-- TEACHER: Access Assigned Classes
CREATE POLICY teacher_select_classes ON public.classes FOR SELECT
USING (homeroom_teacher_id = auth.uid() OR public.current_user_role() = 'ADMIN');

CREATE POLICY teacher_modify_classes ON public.classes FOR UPDATE
USING (homeroom_teacher_id = auth.uid() OR public.current_user_role() = 'ADMIN');

CREATE POLICY teacher_attendance ON public.attendance_records FOR ALL
USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = attendance_records.class_id AND (classes.homeroom_teacher_id = auth.uid() OR public.current_user_role() = 'ADMIN')));

CREATE POLICY teacher_grades ON public.grades FOR ALL
USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = grades.class_id AND (classes.homeroom_teacher_id = auth.uid() OR public.current_user_role() = 'ADMIN')));

-- STUDENT: Read Own Profile & Own Records
CREATE POLICY student_own_grades ON public.grades FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY student_own_attendance ON public.attendance_records FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- PARENT: Read Linked Children Records
CREATE POLICY parent_children_grades ON public.grades FOR SELECT
USING (student_id IN (SELECT student_id FROM public.student_parents WHERE parent_user_id = auth.uid()));

CREATE POLICY parent_children_attendance ON public.attendance_records FOR SELECT
USING (student_id IN (SELECT student_id FROM public.student_parents WHERE parent_user_id = auth.uid()));
