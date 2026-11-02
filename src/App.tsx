import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { RoleGuard } from './components/auth/RoleGuard';

// Public pages
import { LoginPage } from './pages/public/LoginPage';
import { ForbiddenPage } from './pages/public/ForbiddenPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Teacher pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { ClassesListPage } from './pages/teacher/ClassesListPage';
import { CreateClassPage } from './pages/teacher/CreateClassPage';
import { ClassDetailPage } from './pages/teacher/ClassDetailPage';
import { StudentsListPage } from './pages/teacher/StudentsListPage';
import { AttendancePage } from './pages/teacher/AttendancePage';
import { SchedulePage } from './pages/teacher/SchedulePage';
import { AssignmentsPage } from './pages/teacher/AssignmentsPage';
import { CreateAssignmentPage } from './pages/teacher/CreateAssignmentPage';
import { AssignmentDetailPage } from './pages/teacher/AssignmentDetailPage';
import { QuizzesPage } from './pages/teacher/QuizzesPage';
import { ResourcesPage } from './pages/teacher/ResourcesPage';
import { AutoGradingPage } from './pages/teacher/AutoGradingPage';
import { AiAssistantPage } from './pages/teacher/AiAssistantPage';
import { GradesPage } from './pages/teacher/GradesPage';
import { BehaviorPage } from './pages/teacher/BehaviorPage';
import { AlertsPage } from './pages/teacher/AlertsPage';
import { ClassroomToolsPage } from './pages/teacher/ClassroomToolsPage';
import { AnnouncementsPage } from './pages/teacher/AnnouncementsPage';

// Student pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';

// Parent pages
import { ParentDashboardPage } from './pages/parent/ParentDashboardPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { useAuth } from './contexts/AuthContext';

// Dynamic root redirect based on auth state and role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  switch (currentUser.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />;
    case 'PARENT':
      return <Navigate to="/parent/dashboard" replace />;
    default:
      return <Navigate to="/teacher/dashboard" replace />;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage initialMode="login" />} />
            <Route path="/register" element={<LoginPage initialMode="register" />} />
            <Route path="/403" element={<ForbiddenPage />} />


            {/* TEACHER ROUTES */}
            <Route
              path="/teacher/*"
              element={
                <RoleGuard allowedRoles={['TEACHER', 'ADMIN']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<TeacherDashboardPage />} />
                      <Route path="classes" element={<ClassesListPage />} />
                      <Route path="classes/create" element={<CreateClassPage />} />
                      <Route path="classes/:id" element={<ClassDetailPage />} />
                      <Route path="students" element={<StudentsListPage />} />
                      <Route path="attendance" element={<AttendancePage />} />
                      <Route path="schedule" element={<SchedulePage />} />
                      <Route path="assignments" element={<AssignmentsPage />} />
                      <Route path="assignments/create" element={<CreateAssignmentPage />} />
                      <Route path="assignments/:id" element={<AssignmentDetailPage />} />
                      <Route path="quizzes" element={<QuizzesPage />} />
                      <Route path="question-bank" element={<QuizzesPage />} />
                      <Route path="auto-grading" element={<AutoGradingPage />} />
                      <Route path="resources" element={<ResourcesPage />} />
                      <Route path="ai-assistant" element={<AiAssistantPage />} />
                      <Route path="grades" element={<GradesPage />} />
                      <Route path="behavior" element={<BehaviorPage />} />
                      <Route path="alerts" element={<AlertsPage />} />
                      <Route path="tools" element={<ClassroomToolsPage />} />
                      <Route path="tools/*" element={<ClassroomToolsPage />} />
                      <Route path="announcements" element={<AnnouncementsPage />} />
                      <Route path="*" element={<TeacherDashboardPage />} />
                    </Routes>
                  </AppLayout>
                </RoleGuard>
              }
            />

            {/* STUDENT ROUTES */}
            <Route
              path="/student/*"
              element={
                <RoleGuard allowedRoles={['STUDENT', 'ADMIN']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<StudentDashboardPage />} />
                      <Route path="schedule" element={<SchedulePage />} />
                      <Route path="assignments" element={<StudentDashboardPage />} />
                      <Route path="quizzes" element={<QuizzesPage />} />
                      <Route path="resources" element={<ResourcesPage />} />
                      <Route path="grades" element={<GradesPage />} />
                      <Route path="attendance" element={<AttendancePage />} />
                      <Route path="announcements" element={<AnnouncementsPage />} />
                      <Route path="*" element={<StudentDashboardPage />} />
                    </Routes>
                  </AppLayout>
                </RoleGuard>
              }
            />

            {/* PARENT ROUTES */}
            <Route
              path="/parent/*"
              element={
                <RoleGuard allowedRoles={['PARENT', 'ADMIN']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<ParentDashboardPage />} />
                      <Route path="grades" element={<GradesPage />} />
                      <Route path="attendance" element={<AttendancePage />} />
                      <Route path="assignments" element={<AssignmentsPage />} />
                      <Route path="schedule" element={<SchedulePage />} />
                      <Route path="announcements" element={<AnnouncementsPage />} />
                      <Route path="*" element={<ParentDashboardPage />} />
                    </Routes>
                  </AppLayout>
                </RoleGuard>
              }
            />

            {/* ADMIN ROUTES */}
            <Route
              path="/admin/*"
              element={
                <RoleGuard allowedRoles={['ADMIN']}>
                  <AppLayout>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboardPage />} />
                      <Route path="schools" element={<AdminDashboardPage />} />
                      <Route path="classes" element={<ClassesListPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="roles" element={<AdminUsersPage />} />
                      <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                      <Route path="*" element={<AdminDashboardPage />} />
                    </Routes>
                  </AppLayout>
                </RoleGuard>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
