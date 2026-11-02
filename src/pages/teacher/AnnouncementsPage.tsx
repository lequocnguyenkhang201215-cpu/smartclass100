import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Send,
  Users,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { Announcement } from '../../types';

export const AnnouncementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    dbService.getAnnouncements()
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL');
  const [targetRole, setTargetRole] = useState<'ALL' | 'STUDENT' | 'PARENT'>('ALL');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    dbService.createAnnouncement({
      title,
      content,
      authorName: currentUser.fullName,
      authorRole: currentUser.role,
      targetRole,
      priority,
    });

    setAnnouncements(dbService.getAnnouncements());
    setCreateModalOpen(false);
    setTitle('');
    setContent('');
    showToast('Đã gửi thông báo thành công!', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông Báo & Giao Tiếp"
        description="Gửi thông báo toàn trường, khối, lớp học hoặc phụ huynh với xác nhận đã xem."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Thông báo' }]}
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tạo thông báo mới
          </button>
        }
      />

      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ann.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : ann.priority === 'IMPORTANT'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {ann.priority === 'URGENT' ? 'Khẩn cấp' : ann.priority === 'IMPORTANT' ? 'Quan trọng' : 'Thông thường'}
                </span>
                <span className="text-xs text-slate-500">Đối tượng: <strong>{ann.targetRole}</strong></span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <h3 className="mt-2 text-base font-bold text-slate-900">{ann.title}</h3>
            <p className="mt-1 text-xs text-slate-600 whitespace-pre-line leading-relaxed">{ann.content}</p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Người đăng: <strong>{ann.authorName}</strong></span>
              <span className="flex items-center gap-1 font-mono font-semibold text-blue-600">
                <Eye className="w-3.5 h-3.5" />
                {ann.readByCount} lượt đã xem
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create announcement */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Soạn thông báo mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề thông báo *</label>
            <input
              type="text"
              placeholder="VD: Nhắc nhở lịch kiểm tra định kỳ, Họp phụ huynh..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="NORMAL">Thông thường</option>
                <option value="IMPORTANT">Quan trọng</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Đối tượng nhận</label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="ALL">Toàn thể lớp / trường</option>
                <option value="STUDENT">Chỉ Học sinh</option>
                <option value="PARENT">Chỉ Phụ huynh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung thông báo *</label>
            <textarea
              rows={4}
              placeholder="Nhập nội dung đầy đủ..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Phát hành thông báo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
