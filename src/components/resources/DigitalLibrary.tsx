import React, { useState } from 'react';
import {
  FolderOpen,
  FileText,
  Video,
  Download,
  Plus,
  Filter,
  Sparkles,
  BookOpen,
  Music,
  ExternalLink,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LearningMaterial } from '../../types';

export const DigitalLibrary: React.FC = () => {
  const { materials, addMaterial, currentUser, triggerCelebration } = useApp();

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState<'english' | 'math' | 'vietnamese' | 'informatics'>('english');
  const [formType, setFormType] = useState<'pdf' | 'pptx' | 'docx' | 'video'>('pptx');
  const [formDesc, setFormDesc] = useState('');

  const filteredMaterials = materials.filter(m => {
    const matchSubject = subjectFilter === 'all' || m.subject === subjectFilter;
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSubject && matchType;
  });

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addMaterial({
      title: formTitle.trim(),
      type: formType,
      subject: formSubject,
      grade: 3,
      fileSize: '5.2 MB',
      url: '#',
      description: formDesc || 'Học liệu số hỗ trợ bài học lớp 3C1 trường Hoài Nhơn'
    });

    setFormTitle('');
    setFormDesc('');
    setIsUploadOpen(false);
    triggerCelebration();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-2">
            <FolderOpen className="w-3.5 h-3.5 text-purple-600" />
            <span>KHO HỌC LIỆU SỐ TIỂU HỌC 3C1</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Thư Viện Bài Giảng, Phiếu Bài Tập & Video Trực Quan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tài liệu đa định dạng (PowerPoint, Word, PDF, Video, Audio) phân loại theo môn học và khối lớp
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học liệu mới</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">Môn học:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
            >
              <option value="all">Tất cả ({materials.length})</option>
              <option value="english">Tiếng Anh</option>
              <option value="math">Toán học</option>
              <option value="vietnamese">Tiếng Việt</option>
              <option value="informatics">Tin học</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold">Định dạng:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="pptx">Bài giảng PowerPoint (.pptx)</option>
              <option value="docx">Phiếu bài tập Word (.docx)</option>
              <option value="pdf">Tài liệu PDF (.pdf)</option>
              <option value="video">Video bài giảng (.mp4)</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Lưu trữ bảo mật • Sẵn sàng tải về hoặc trình chiếu trên lớp
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMaterials.map((mat) => (
          <div
            key={mat.id}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    mat.type === 'pptx'
                      ? 'bg-orange-100 text-orange-700'
                      : mat.type === 'docx'
                      ? 'bg-blue-100 text-blue-700'
                      : mat.type === 'pdf'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {mat.type.toUpperCase()} • {mat.fileSize || '3.5 MB'}
                </span>

                <span className="text-[11px] text-slate-400">
                  Cập nhật: {mat.uploadedAt}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">{mat.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2">{mat.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-700 capitalize">
                Môn: {mat.subject === 'english' ? 'Tiếng Anh 3' : mat.subject === 'math' ? 'Toán 3' : mat.subject === 'vietnamese' ? 'Tiếng Việt 3' : 'Tin học 3'}
              </span>

              <button
                onClick={() => {
                  alert(`Đang mở học liệu số: "${mat.title}" để trình chiếu lớp 3C1.`);
                  triggerCelebration();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xem / Tải về</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Material Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              <span>Tải lên học liệu số mới</span>
            </h3>

            <form onSubmit={handleSaveMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên tài liệu / Bài giảng *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Bài giảng điện tử Tiếng Anh Unit 2..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Môn học</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  >
                    <option value="english">Tiếng Anh</option>
                    <option value="math">Toán học</option>
                    <option value="vietnamese">Tiếng Việt</option>
                    <option value="informatics">Tin học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Định dạng file</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  >
                    <option value="pptx">PowerPoint (.pptx)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="video">Video (.mp4)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Nêu tóm tắt mục tiêu bài học..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold shadow-md"
                >
                  Lưu vào thư viện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
