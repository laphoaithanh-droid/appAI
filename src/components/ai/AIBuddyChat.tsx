import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  RotateCcw,
  ShieldCheck,
  Languages,
  Calculator,
  BookOpen,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { geminiService, ChatMessage } from '../../services/geminiService';
import { speechService } from '../../services/speechService';
import { useApp } from '../../context/AppContext';

export const AIBuddyChat: React.FC = () => {
  const { currentUser, teacherInfo, aiLiveStatus, triggerCelebration } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Xin chào bạn nhỏ lớp 3C1! 👋 Mình là AI Buddy - Người bạn đồng hành thông minh của cô giáo Đỗ Thị Hoà đây! Hôm nay bạn muốn cùng mình học Tiếng Anh, giải đố Toán học, đọc Tiếng Việt hay tìm hiểu Tin học nào? ⭐`,
      timestamp: 'Vừa xong',
      options: [
        'Học từ vựng Tiếng Anh chủ đề Family',
        'Gợi ý cách giải bài toán rút về đơn vị',
        'Tìm hình ảnh so sánh trong câu thơ',
        'Nhắc lại vị trí 2 phím chuẩn F và J'
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Chung');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Call backend Gemini API via proxy service
    const history = messages.slice(-4).map(m => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      text: m.text
    }));

    const result = await geminiService.sendBuddyMessage(text, history, selectedSubject);

    setIsLoading(false);

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: result.text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      audioText: result.audioText
    };

    setMessages(prev => [...prev, aiMsg]);
    triggerCelebration();
  };

  const handleSpeakText = (text: string) => {
    // If text has significant English words, speak in English, else Vietnamese
    const isEn = text.toLowerCase().includes('hello') || text.toLowerCase().includes('english') || text.toLowerCase().includes('this is');
    speechService.speak(text, isEn ? 'en-US' : 'vi-VN', 0.9);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CHATBOT AI BUDDY – TRỢ LÝ HỌC TẬP THÂN THIỆN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Người Bạn Đồng Hành Song Ngữ Của Lớp 3C1
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100">
              Giải thích dễ hiểu, khuyến khích tư duy từng bước, không làm lộ đáp án và an toàn tuyệt đối cho học sinh.
            </p>
          </div>

          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 p-1 flex items-center justify-center shrink-0 shadow-lg">
            <div className="w-full h-full rounded-full bg-[#0B1428] flex items-center justify-center">
              <Bot className="w-8 h-8 text-emerald-300 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>

        {/* Safe AI rules guarantee */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 text-[11px] text-emerald-200">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bảo vệ quyền riêng tư học sinh</span>
          </span>
          <span>•</span>
          <span>Không thay thế giáo viên Đỗ Thị Hoà</span>
          <span>•</span>
          <span className="text-amber-300">
            {aiLiveStatus.hasKey ? 'Gemini 3.8 Flash' : 'Chế độ sư phạm tương tác'}
          </span>
        </div>
      </div>

      {/* Main Chatbox Frame */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[560px] overflow-hidden">
        {/* Chat Subject Switcher Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Môn học:</span>
            {['Chung', 'Tiếng Anh', 'Toán học', 'Tiếng Việt', 'Tin học'].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedSubject === sub
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setMessages([
                {
                  id: `rst-${Date.now()}`,
                  sender: 'ai',
                  text: 'Mình đã sẵn sàng cho một cuộc trò chuyện mới cùng bạn nhỏ lớp 3C1! Hãy chọn chủ đề hoặc đặt câu hỏi nhé! 🌟',
                  timestamp: 'Vừa xong'
                }
              ]);
            }}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Xóa làm mới đoạn hội thoại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[80%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs relative ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  <div className="flex items-center justify-between pt-1 mt-1 border-t border-current/10 text-[10px] opacity-75">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="hover:scale-110 transition-transform p-0.5 ml-2"
                        title="Nghe giọng đọc"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick suggestion bubbles if any */}
                {msg.options && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(opt)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors text-left"
                      >
                        💡 {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-300 shrink-0"
                />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-xs text-slate-500 italic flex items-center gap-2">
                <span>AI Buddy đang suy nghĩ để hướng dẫn bạn nhỏ...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Hỏi AI Buddy về Tiếng Anh, Toán, Tiếng Việt hoặc Tin học..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
