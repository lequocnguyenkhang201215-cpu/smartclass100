import React from 'react';
import { HelpCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">404 - Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-500">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang vị trí khác.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </button>
      </div>
    </div>
  );
};
