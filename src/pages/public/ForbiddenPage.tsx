import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const getHomePath = () => {
    switch (currentUser.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'STUDENT':
        return '/student/dashboard';
      case 'PARENT':
        return '/parent/dashboard';
      default:
        return '/teacher/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">403 - Quyền truy cập bị từ chối</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tài khoản của bạn ({currentUser.fullName} - {currentUser.role}) không có đặc quyền truy cập vào đường dẫn này.
        </p>
        <button
          onClick={() => navigate(getHomePath())}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ của tôi
        </button>
      </div>
    </div>
  );
};
