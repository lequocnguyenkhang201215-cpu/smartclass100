import React, { useState } from 'react';
import {
  FolderArchive,
  Plus,
  FileText,
  Video,
  Download,
  Eye,
  Search,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dbService } from '../../services/db';
import { LearningResource } from '../../types';

export const ResourcesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [resources, setResources] = useState<LearningResource[]>(() => dbService.getResources());
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'PDF' | 'DOCX' | 'PPTX' | 'VIDEO'>('PDF');
  const [subject, setSubject] = useState('Toán học');
  const [gradeLevel, setGradeLevel] = useState('10');
  const [chapter, setChapter] = useState('Chương 1: Mệnh đề & Tập hợp');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    dbService.createResource({
      title,
      category,
      subject,
      gradeLevel,
      chapter,
      fileUrl: '#',
      fileSize: '4.2 MB',
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      isPublic: true,
    });

    setResources(dbService.getResources());
    setCreateModalOpen(false);
    setTitle('');
    showToast('Đã tải lên học liệu số thành công!', 'success');
  };

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho Học Liệu & Bài Giảng Số"
        description="Quản lý giáo án điện tử, bài giảng Slide, video minh họa và tài liệu PDF ôn thi."
        breadcrumbs={[{ label: 'Trang chủ', href: '/teacher/dashboard' }, { label: 'Học liệu' }]}
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tải lên học liệu mới
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học liệu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(res => (
          <div key={res.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {res.category} · Khối {res.gradeLevel}
                </span>
                <span className="text-xs text-slate-400 font-mono">{res.fileSize}</span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900">{res.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{res.chapter || res.subject}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {res.views} lượt xem
              </span>
              <button
                onClick={() => showToast('Đang tải file học liệu về thiết bị...', 'info')}
                className="font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Tải về
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal create resource */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tải lên tài liệu học tập mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên tài liệu *</label>
            <input
              type="text"
              placeholder="VD: Slide bài giảng Chương 1, Đề cương ôn tập..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Định dạng file</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="PDF">Tài liệu PDF</option>
                <option value="PPTX">Bài giảng PowerPoint (.pptx)</option>
                <option value="DOCX">Văn bản Word (.docx)</option>
                <option value="VIDEO">Video bài giảng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Môn học</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chương / Bài</label>
            <input
              type="text"
              value={chapter}
              onChange={e => setChapter(e.target.value)}
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
              Lưu học liệu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
