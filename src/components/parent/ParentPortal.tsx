import React, { useState } from 'react';
import {
  HeartHandshake,
  Bell,
  MessageSquare,
  Award,
  CheckCircle,
  Clock,
  Send,
  Sparkles,
  AlertCircle,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ParentPortal: React.FC = () => {
  const {
    currentUser,
    students,
    notifications,
    feedbacks,
    addFeedback,
    replyFeedback,
    badges,
    triggerCelebration
  } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    currentUser.studentId || students[0]?.id || ''
  );
  const [parentMessage, setParentMessage] = useState('');
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentMessage.trim()) return;

    addFeedback(activeStudent.id, parentMessage.trim());
    setParentMessage('');
    triggerCelebration();
  };

  const handleTeacherReply = (fbId: string) => {
    const text = replyInput[fbId];
    if (!text || !text.trim()) return;
    replyFeedback(fbId, text.trim());
    setReplyInput(prev => ({ ...prev, [fbId]: '' }));
    triggerCelebration();
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-700/50 space-y-2 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-300 text-xs font-bold border border-white/20">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>SỔ LIÊN LẠC ĐIỆN TỬ & KẾT NỐI PHỤ HUYNH 3C1</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Cầu Nối Yêu Thương Giữa Cô Giáo Chủ Nhiệm & Gia Đình
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
          Cập nhật thông báo chính thức, theo dõi điểm danh hằng ngày, xem kết quả rèn luyện và trao đổi hai chiều
          vì sự tiến bộ của học sinh lớp 3C1.
        </p>

        {/* Demo indicator banner as requested */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Chế độ mô phỏng Sổ liên lạc 2 chiều bảo mật (Dữ liệu đang được lưu trữ tại máy khách)</span>
        </div>
      </div>

      {/* Student Selector (If Teacher or Multi-Child) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Đang xem thông tin của con:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold"
          >
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.stt}. {st.fullName} ({st.studentCode}) - Phụ huynh: {st.parentName}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500">
          GVCN: <span className="font-bold text-purple-700">Cô Đỗ Thị Hoà</span> • Lớp 3C1
        </div>
      </div>

      {/* Student Today Status Quick Cards */}
      {activeStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Chuyên cần hôm nay
            </span>
            <div className="text-lg font-extrabold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>
                {activeStudent.attendanceStatus === 'present'
                  ? 'Có mặt tại lớp'
                  : activeStudent.attendanceStatus === 'late'
                  ? 'Đi muộn'
                  : 'Nghỉ có phép'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Cập nhật lúc 07:45 sáng</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tiến độ học tập tổng thể
            </span>
            <div className="text-lg font-extrabold text-purple-700">
              {activeStudent.learningProgress}% hoàn thành
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full"
                style={{ width: `${activeStudent.learningProgress}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Huy hiệu danh dự đã nhận
            </span>
            <div className="text-lg font-extrabold text-amber-600 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{activeStudent.badges?.length || 0} huy hiệu tích cực</span>
            </div>
            <p className="text-[11px] text-slate-500">Được cô Hoà khen ngợi</p>
          </div>
        </div>
      )}

      {/* Official Announcements from Teacher */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>Thông báo mới nhất từ cô giáo chủ nhiệm Đỗ Thị Hoà</span>
          </h3>
          <span className="text-xs text-slate-400">{notifications.length} thông báo</span>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {n.isImportant && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                      Quan trọng
                    </span>
                  )}
                  {n.title}
                </span>
                <span className="text-[11px] text-slate-400">{n.date}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{n.content}</p>
              <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 italic">
                Người gửi: {n.sender}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-way Interactive Feedback between Parents and Teacher */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Trao đổi hai chiều: Phụ huynh ↔ Cô giáo Đỗ Thị Hoà</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Phụ huynh có thể nhắn tin xin phép nghỉ học, trao đổi về tình hình sức khỏe hoặc hỏi về bài học của con.
          </p>
        </div>

        {/* Send message form */}
        <form onSubmit={handleSendFeedback} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
          <label className="block text-xs font-bold text-blue-950">
            Gửi lời nhắn cho cô Đỗ Thị Hoà về học sinh {activeStudent.fullName}:
          </label>
          <textarea
            rows={3}
            value={parentMessage}
            onChange={(e) => setParentMessage(e.target.value)}
            placeholder="Kính gửi cô giáo, hôm nay cháu có biểu hiện..."
            className="w-full p-3 rounded-xl border border-blue-200 text-xs text-slate-900 bg-white"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!parentMessage.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi lời nhắn</span>
            </button>
          </div>
        </form>

        {/* Messages thread */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lịch sử trao đổi gần đây:
          </h4>

          {feedbacks.map((fb) => (
            <div key={fb.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              {/* Parent Message */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  PH
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {fb.parentName} (PH em {fb.studentName})
                    </span>
                    <span className="text-[10px] text-slate-400">{fb.sentAt}</span>
                  </div>
                  <p className="text-slate-700 mt-1 leading-relaxed">{fb.message}</p>
                </div>
              </div>

              {/* Teacher Reply */}
              {fb.teacherReply ? (
                <div className="ml-8 p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    GV
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">Cô Đỗ Thị Hoà (Phản hồi)</span>
                      <span className="text-[10px] text-purple-600">{fb.repliedAt}</span>
                    </div>
                    <p className="text-purple-800 mt-0.5 leading-relaxed">{fb.teacherReply}</p>
                  </div>
                </div>
              ) : currentUser.role === 'teacher' ? (
                <div className="ml-8 pt-2 space-y-2">
                  <input
                    type="text"
                    value={replyInput[fb.id] || ''}
                    onChange={(e) => setReplyInput({ ...replyInput, [fb.id]: e.target.value })}
                    placeholder="Cô Hoà nhập câu trả lời phụ huynh..."
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 text-xs bg-white"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleTeacherReply(fb.id)}
                      className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold"
                    >
                      Gửi phản hồi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ml-8 text-[11px] text-amber-600 italic">
                  Đang chờ cô giáo phản hồi...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
