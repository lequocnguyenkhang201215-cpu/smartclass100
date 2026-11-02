import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Calendar,
  BookOpen,
  FileQuestion,
  FolderArchive,
  BarChart2,
  Award,
  AlertTriangle,
  Wrench,
  Bell,
  Settings,
  Shield,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  School,
  LogOut,
  Layers,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';
import { dbService } from '../services/db';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
}

interface NavSection {
  id: string;
  title: string;
  icon?: any;
  isStandalone?: boolean;
  href?: string;
  items?: NavItem[];
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, switchRole, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
    showToast('Đã đăng xuất thành công', 'info');
    navigate('/login', { replace: true });
  };

  // Collapsible module open/close state dictionary
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    class_management: true,
    teaching: true,
    tracking: true,
    tools: true,
    study: true,
    results: true,
    academic: true,
    attendance: true,
    school_management: true,
    users_security: true,
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: prev[sectionId] === undefined ? false : !prev[sectionId],
    }));
  };

  const announcements = dbService.getAnnouncements();
  const alerts = dbService.getAlerts().filter(a => a.status === 'NEW');

  // Teacher navigation grouped by modules
  const teacherSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Tổng quan',
      href: '/teacher/dashboard',
      icon: LayoutDashboard,
      isStandalone: true,
    },
    {
      id: 'class_management',
      title: 'Quản lý lớp học',
      icon: GraduationCap,
      items: [
        { label: 'Lớp của tôi', href: '/teacher/classes', icon: GraduationCap },
        { label: 'Học sinh', href: '/teacher/students', icon: Users },
        { label: 'Điểm danh', href: '/teacher/attendance', icon: CalendarCheck },
        { label: 'Thời khóa biểu', href: '/teacher/schedule', icon: Calendar },
      ],
    },
    {
      id: 'teaching',
      title: 'Dạy & Học',
      icon: BookOpen,
      items: [
        { label: 'Ngân hàng câu hỏi', href: '/teacher/quizzes', icon: FileQuestion },
        { label: 'Giao bài tập', href: '/teacher/assignments', icon: BookOpen },
        { label: 'Chấm bài tự động', href: '/teacher/auto-grading', icon: CheckCircle2 },
        { label: 'Tài liệu số', href: '/teacher/resources', icon: FolderArchive },
        { label: 'AI HỖ TRỢ', href: '/teacher/ai-assistant', icon: Sparkles },
      ],
    },
    {
      id: 'tracking',
      title: 'Theo dõi & Đánh giá',
      icon: BarChart2,
      items: [
        { label: 'Quản lý điểm', href: '/teacher/grades', icon: BarChart2 },
        { label: 'Hành vi & Thi đua', href: '/teacher/behavior', icon: Award },
        { label: 'Cảnh báo học tập', href: '/teacher/alerts', icon: AlertTriangle, badge: alerts.length },
      ],
    },
    {
      id: 'tools',
      title: 'Công cụ lớp học',
      icon: Wrench,
      items: [
        { label: 'Vòng quay & Gọi tên', href: '/teacher/tools', icon: Sparkles },
      ],
    },
    {
      id: 'announcements',
      title: 'Thông báo',
      href: '/teacher/announcements',
      icon: Bell,
      isStandalone: true,
    },
  ];

  // Student navigation grouped by modules
  const studentSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Trang chủ',
      href: '/student/dashboard',
      icon: LayoutDashboard,
      isStandalone: true,
    },
    {
      id: 'study',
      title: 'Học tập & Nhiệm vụ',
      icon: BookOpen,
      items: [
        { label: 'Lịch học', href: '/student/schedule', icon: Calendar },
        { label: 'Bài tập về nhà', href: '/student/assignments', icon: BookOpen },
        { label: 'Kiểm tra & Quiz', href: '/student/quizzes', icon: FileQuestion },
        { label: 'Học liệu số', href: '/student/resources', icon: FolderArchive },
      ],
    },
    {
      id: 'results',
      title: 'Kết quả & Theo dõi',
      icon: BarChart2,
      items: [
        { label: 'Kết quả học tập', href: '/student/grades', icon: BarChart2 },
        { label: 'Chuyên cần', href: '/student/attendance', icon: CalendarCheck },
        { label: 'Thông báo', href: '/student/announcements', icon: Bell },
      ],
    },
  ];

  // Parent navigation grouped by modules
  const parentSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Tổng quan con',
      href: '/parent/dashboard',
      icon: LayoutDashboard,
      isStandalone: true,
    },
    {
      id: 'academic',
      title: 'Kết quả học tập',
      icon: BarChart2,
      items: [
        { label: 'Điểm số của con', href: '/parent/grades', icon: BarChart2 },
        { label: 'Bài tập về nhà', href: '/parent/assignments', icon: BookOpen },
      ],
    },
    {
      id: 'attendance',
      title: 'Chuyên cần & Lịch trình',
      icon: CalendarCheck,
      items: [
        { label: 'Chuyên cần & Điểm danh', href: '/parent/attendance', icon: CalendarCheck },
        { label: 'Lịch học tuần', href: '/parent/schedule', icon: Calendar },
        { label: 'Thông báo nhà trường', href: '/parent/announcements', icon: Bell },
      ],
    },
  ];

  // Admin navigation grouped by modules
  const adminSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Dashboard Hệ thống',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      isStandalone: true,
    },
    {
      id: 'school_management',
      title: 'Quản trị Trường & Lớp',
      icon: School,
      items: [
        { label: 'Quản lý Trường học', href: '/admin/schools', icon: School },
        { label: 'Lớp học & Khối', href: '/admin/classes', icon: Layers },
      ],
    },
    {
      id: 'users_security',
      title: 'Người dùng & Bảo mật',
      icon: Shield,
      items: [
        { label: 'Người dùng', href: '/admin/users', icon: Users },
        { label: 'Phân quyền & Vai trò', href: '/admin/roles', icon: Shield },
        { label: 'Nhật ký Hoạt động (Audit)', href: '/admin/audit-logs', icon: UserCheck },
      ],
    },
    {
      id: 'system',
      title: 'Cấu hình hệ thống',
      href: '/admin/settings',
      icon: Settings,
      isStandalone: true,
    },
  ];

  const currentSections =
    currentUser.role === 'ADMIN'
      ? adminSections
      : currentUser.role === 'STUDENT'
      ? studentSections
      : currentUser.role === 'PARENT'
      ? parentSections
      : teacherSections;

  const roleLabels: Record<UserRole, { label: string; color: string; prefix: string }> = {
    ADMIN: { label: 'Quản trị viên', color: 'bg-rose-950/60 text-rose-300 border-rose-500/40', prefix: '/admin/dashboard' },
    TEACHER: { label: 'Giáo viên', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40', prefix: '/teacher/dashboard' },
    STUDENT: { label: 'Học sinh', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40', prefix: '/student/dashboard' },
    PARENT: { label: 'Phụ huynh', color: 'bg-purple-950/60 text-purple-300 border-purple-500/40', prefix: '/parent/dashboard' },
  };

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
    navigate(roleLabels[role].prefix);
    setMobileMenuOpen(false);
  };

  // Render navigation section block
  const renderNavSection = (section: NavSection, isMobile: boolean = false) => {
    // If standalone link (e.g. Tổng quan, Thông báo)
    if (section.isStandalone && section.href) {
      const Icon = section.icon || LayoutDashboard;
      const isActive = location.pathname === section.href;
      return (
        <div key={section.id} className="mb-2">
          <Link
            to={section.href}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-semibold transition-all border ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-300 hover:text-white hover:bg-cyan-950/40 hover:border-cyan-500/30 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="truncate">{section.title}</span>
            </div>
          </Link>
        </div>
      );
    }

    // Module with sub-screens
    const isOpen = openSections[section.id] !== false;
    const Icon = section.icon || Layers;
    const isModuleActive = section.items?.some(
      item => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
    );

    return (
      <div key={section.id} className="mb-3">
        {/* Module Header Button: clicking toggles open/close */}
        <button
          type="button"
          onClick={() => toggleSection(section.id)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13.5px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer border ${
            isModuleActive
              ? 'text-cyan-300 bg-cyan-950/50 border-cyan-500/35 shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-cyan-950/30 border-transparent'
          }`}
          title={`Click để ${isOpen ? 'thu gọn' : 'mở rộng'} ${section.title}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Icon className={`w-5 h-5 shrink-0 ${isModuleActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="truncate">{section.title}</span>
          </div>
          <ChevronDown
            className={`w-4.5 h-4.5 text-cyan-400/80 shrink-0 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {/* Collapsible Children */}
        {isOpen && section.items && (
          <div className="mt-1.5 ml-4 pl-3.5 border-l-2 border-cyan-500/30 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {section.items.map(item => {
              const ItemIcon = item.icon;
              const isActive =
                location.pathname === item.href || location.pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => isMobile && setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-[14.5px] font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ItemIcon
                      className={`w-4.5 h-4.5 shrink-0 ${
                        isActive ? 'text-slate-950' : 'text-cyan-400/70'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                        isActive
                          ? 'bg-slate-950 text-cyan-300'
                          : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#070c18] text-slate-100 flex flex-col font-sans">
      {/* Top Demo Role Switcher Bar */}
      <aside aria-label="Demo Bar" className="bg-[#050811] text-slate-300 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between border-b border-cyan-500/20 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="font-semibold text-white tracking-wide">SMART CLASS PRO</span>
          <span className="hidden sm:inline text-cyan-400/70">· Nền tảng Quản lý Lớp học Thông minh</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-slate-400 mr-1 hidden md:inline">Chuyển vai trò test:</span>
          {(['TEACHER', 'STUDENT', 'PARENT', 'ADMIN'] as UserRole[]).map(r => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all border ${
                currentUser.role === r
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                  : 'bg-[#0c162b] text-slate-300 hover:bg-cyan-950/60 border-cyan-500/20'
              }`}
            >
              {r === 'TEACHER' ? 'Giáo viên' : r === 'STUDENT' ? 'Học sinh' : r === 'PARENT' ? 'Phụ huynh' : 'Admin'}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Desktop Sidebar (Thanh menu bên trái - Dark Navy viền Cyan) */}
        <aside className="hidden lg:flex flex-col w-72 h-full bg-[#090f1f] border-r border-cyan-500/25 shrink-0 select-none overflow-hidden z-20">
          {/* Brand header */}
          <div className="h-16 flex items-center px-6 border-b border-cyan-500/20 gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block leading-tight">
                SmartClass
              </span>
              <span className="text-[11px] text-cyan-400/80 font-medium">THPT Lê Quý Đôn</span>
            </div>
          </div>

          {/* Nav items with Collapsible Modules - CUỘN ĐỘC LẬP TÁCH BIỆT */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400/70">
              {currentUser.role === 'ADMIN'
                ? 'Quản trị hệ thống'
                : currentUser.role === 'STUDENT'
                ? 'Cổng học sinh'
                : currentUser.role === 'PARENT'
                ? 'Cổng phụ huynh'
                : 'Menu Giáo viên'}
            </div>

            {currentSections.map(section => renderNavSection(section, false))}
          </div>

          {/* User profile footer */}
          <div className="p-3 border-t border-cyan-500/20 bg-[#070c18] shrink-0">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c162c] border border-cyan-500/30 shadow-xs">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-cyan-500/40"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{currentUser.fullName}</p>
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border ${roleLabels[currentUser.role].color}`}>
                  {roleLabels[currentUser.role].label}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Màn hình chung - Dark Navy) */}
        <div className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-[#070c18]">
          {/* Top Header */}
          <header className="h-16 bg-[#090f1f] border-b border-cyan-500/25 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-cyan-950/40"
              >
                <Menu className="w-5 h-5 text-cyan-400" />
              </button>

              <div className="hidden sm:block">
                <span className="text-xs text-cyan-400/80 font-medium">Năm học 2025 - 2026 · Học kỳ 1</span>
              </div>
            </div>

            {/* Right Zone: Notifications & Profile */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {alerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#090f1f]" />
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#0c162c] border border-cyan-500/40 rounded-xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 text-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                      <span className="text-xs font-semibold text-white">Thông báo & Cảnh báo</span>
                      <span className="text-[11px] text-cyan-400 font-medium cursor-pointer hover:underline">Đánh dấu đã đọc</span>
                    </div>
                    <div className="divide-y divide-cyan-500/15 max-h-64 overflow-y-auto mt-2">
                      {alerts.slice(0, 3).map(a => (
                        <div key={a.id} className="py-2.5 text-xs">
                          <p className="font-semibold text-white">{a.title}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{a.description}</p>
                          <span className="text-[10px] text-rose-400 font-medium">{a.metrics}</span>
                        </div>
                      ))}
                      {announcements.slice(0, 2).map(ann => (
                        <div key={ann.id} className="py-2.5 text-xs">
                          <p className="font-medium text-slate-200">{ann.title}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{ann.authorName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-cyan-950/40 transition-colors border border-transparent hover:border-cyan-500/30"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-cyan-500/40"
                  />
                  <div className="hidden md:block text-left">
                    <span className="text-xs font-semibold text-white block leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[11px] text-cyan-400/80">{roleLabels[currentUser.role].label}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-cyan-400/80 hidden md:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0c162c] border border-cyan-500/40 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 text-slate-200">
                    <div className="px-4 py-2 border-b border-cyan-500/20">
                      <p className="text-xs font-semibold text-white">{currentUser.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Body - CUỘN ĐỘC LẬP TÁCH BIỆT VỚI THANH MENU */}
          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 bg-[#070c18]">
            <div className="max-w-7xl w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-xs bg-[#090f1f] text-slate-100 border-r border-cyan-500/30 h-full flex flex-col p-4 z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </div>
                <span className="font-bold text-white">SmartClass</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {currentSections.map(section => renderNavSection(section, true))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
