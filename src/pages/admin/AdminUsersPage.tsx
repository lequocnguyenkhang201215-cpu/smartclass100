import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  CheckCircle2,
  Lock,
  Trash2
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { UserProfile, UserRole } from '../../types';

export const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>(() => dbService.getUsers());
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Tài Khoản & Người Dùng"
        description="Quản trị 4 nhóm tài khoản: Ban giám hiệu (Admin), Giáo viên, Học sinh và Phụ huynh."
        breadcrumbs={[{ label: 'Trang chủ', href: '/admin/dashboard' }, { label: 'Người dùng' }]}
        actions={
          <button
            onClick={() => showToast('Mở trình tạo tài khoản người dùng mới...', 'info')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Thêm tài khoản
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Học sinh</option>
            <option value="PARENT">Phụ huynh</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Tổng cộng <strong>{filtered.length}</strong> tài khoản
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Họ và Tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai Trò (Role)</th>
              <th className="px-4 py-3">Chuyên Môn / Liên Kết</th>
              <th className="px-4 py-3">Trạng Thái</th>
              <th className="px-4 py-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2.5">
                  <img
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={u.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <span>{u.fullName}</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : u.role === 'TEACHER'
                        ? 'bg-blue-100 text-blue-700'
                        : u.role === 'STUDENT'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.subjectSpecialty || (u.linkedStudentIds ? `${u.linkedStudentIds.length} con liên kết` : '-')}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Hoạt động
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => showToast(`Cập nhật quyền cho ${u.fullName}...`, 'info')}
                    className="text-xs font-semibold text-purple-600 hover:underline"
                  >
                    Phân quyền
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
