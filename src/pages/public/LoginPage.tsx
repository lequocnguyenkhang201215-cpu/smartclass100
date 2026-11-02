import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Phone,
  BookOpen,
  School,
  ShieldCheck,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { dbService } from '../../services/db';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { availableUsers, setCurrentUser, register, login } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('gv.nguyenhuong@smartclass.edu.vn');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('TEACHER');
  const [regPhone, setRegPhone] = useState('');
  const [regSubject, setRegSubject] = useState('Toán học');
  const [regClassId, setRegClassId] = useState('');
  const [regChildName, setRegChildName] = useState('');

  const classes = dbService.getClasses();

  const redirectToRole = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'STUDENT':
        navigate('/student/dashboard', { replace: true });
        break;
      case 'PARENT':
        navigate('/parent/dashboard', { replace: true });
        break;
      default:
        navigate('/teacher/dashboard', { replace: true });
        break;
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await login(loginEmail, loginPassword);
      showToast(`Chào mừng ${user.fullName} đã đăng nhập!`, 'success');
      redirectToRole(user.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng thử lại!');
      showToast(err.message || 'Đăng nhập thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (email: string) => {
    const user = availableUsers.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      showToast(`Đã chuyển sang tài khoản ${user.fullName}`, 'success');
      redirectToRole(user.role);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regFullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setIsLoading(true);

    try {
      const data: RegisterData = {
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        phone: regPhone.trim() || '0987654321',
        subjectSpecialty: regRole === 'TEACHER' ? regSubject : undefined,
        studentId: regRole === 'STUDENT' ? (regClassId || classes[0]?.id) : regChildName,
      };

      const newUser = await register(data);
      showToast('🎉 Đăng ký tài khoản thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        redirectToRole(newUser.role);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
      showToast(err.message || 'Đăng ký không thành công', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-slate-950">
      {/* Background ambient decorative glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-slate-950 mx-auto shadow-[0_0_25px_rgba(6,182,212,0.4)]">
          <Sparkles className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
          SMART CLASS PRO
        </h1>
        <p className="mt-1 text-xs text-cyan-400/90 font-medium tracking-wide">
          Hệ thống Quản lý Lớp học Số & Đồng hành Giáo dục Thông minh
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-[#0b1328] py-8 px-6 sm:px-10 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-black/60 relative">
          
          {/* Top Switcher Tabs: Đăng nhập vs Đăng ký */}
          <div className="grid grid-cols-2 p-1 bg-[#070d1e] rounded-xl border border-cyan-500/25 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký tài khoản
            </button>
          </div>

          {/* Global Alert / Error banner */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: FORM ĐĂNG NHẬP (LOGIN) */}
          {/* ========================================================= */}
          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Email tài khoản
                </label>
                <div className="mt-1.5 relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    placeholder="ví dụ: gv.nguyenhuong@smartclass.edu.vn"
                    className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast('Mẹo: Nhập bất kỳ mật khẩu nào từ 6 ký tự để kiểm tra đăng nhập.', 'info')}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="mt-1.5 relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    className="block w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Đang xử lý đăng nhập...' : 'Đăng nhập vào hệ thống'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">Chưa có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
                >
                  Đăng ký ngay bây giờ
                </button>
              </div>

              {/* 1-Click Fast Demo Accounts */}
              <div className="mt-6 pt-5 border-t border-cyan-500/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Đăng nhập nhanh mẫu (1-Click Login):
                  </p>
                  <span className="text-[11px] text-slate-400">{availableUsers.length} tài khoản</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleQuickSelect(user.email)}
                      type="button"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-cyan-500/20 bg-[#070d1e] hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={user.fullName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-cyan-500/40"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 ml-1.5 shrink-0">
                        {user.role === 'TEACHER' ? 'GV' : user.role === 'STUDENT' ? 'HS' : user.role === 'PARENT' ? 'PH' : 'AD'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* ========================================================= */
            /* TAB 2: FORM ĐĂNG KÝ TÀI KHOẢN (REGISTER) */
            /* ========================================================= */
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-2">
                  1. Bạn đăng ký tài khoản với vai trò gì?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'TEACHER', title: 'Giáo viên', icon: GraduationCap, sub: 'Dạy học & Quản lý' },
                    { id: 'STUDENT', title: 'Học sinh', icon: Users, sub: 'Học tập & Làm bài' },
                    { id: 'PARENT', title: 'Phụ huynh', icon: School, sub: 'Đồng hành con' },
                    { id: 'ADMIN', title: 'Admin', icon: ShieldCheck, sub: 'Quản trị viên' },
                  ].map(r => {
                    const Icon = r.icon;
                    const isSelected = regRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRegRole(r.id as UserRole)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] text-white'
                            : 'bg-[#070d1e] border-cyan-500/20 text-slate-300 hover:border-cyan-500/40 hover:bg-cyan-950/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <span className="text-xs font-bold truncate">{r.title}</span>
                        <span className="text-[10px] text-slate-400 truncate">{r.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Họ và tên đầy đủ <span className="text-rose-400">*</span>
                </label>
                <div className="mt-1.5 relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    required
                    placeholder="ví dụ: Cô Trần Thị Ngọc Anh"
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Email đăng ký <span className="text-rose-400">*</span>
                  </label>
                  <div className="mt-1.5 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                      placeholder="email@example.com"
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Số điện thoại
                  </label>
                  <div className="mt-1.5 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="0987 654 321"
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Role specific info */}
              {regRole === 'TEACHER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Môn học phụ trách giảng dạy
                  </label>
                  <div className="mt-1.5 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <select
                      value={regSubject}
                      onChange={e => setRegSubject(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all cursor-pointer"
                    >
                      <option value="Toán học">Toán học</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Lịch sử">Lịch sử</option>
                      <option value="Địa lý">Địa lý</option>
                      <option value="Tin học">Tin học</option>
                      <option value="GDCD">Giáo dục công dân</option>
                    </select>
                  </div>
                </div>
              )}

              {regRole === 'STUDENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Chọn lớp đang học
                  </label>
                  <div className="mt-1.5 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <select
                      value={regClassId}
                      onChange={e => setRegClassId(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all cursor-pointer"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          Lớp {c.name} - Khối {c.gradeLevel} (GV: {c.homeroomTeacherName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {regRole === 'PARENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Họ và tên học sinh (con của bạn)
                  </label>
                  <div className="mt-1.5 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                      <Users className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regChildName}
                      onChange={e => setRegChildName(e.target.value)}
                      placeholder="ví dụ: Nguyễn Hoàng Nam (Lớp 10A1)"
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="mt-1.5 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      className="block w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Xác nhận mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="mt-1.5 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="Nhập lại mật khẩu"
                      className="block w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#070c18] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký & Đăng nhập ngay'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
                >
                  Đăng nhập vào hệ thống
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
