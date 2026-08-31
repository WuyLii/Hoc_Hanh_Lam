import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage, ChatConversation, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import { compressImageForAI } from '../utils/imageCompressor';
import {
  Sparkles,
  Send,
  Volume2,
  BookmarkPlus,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  History,
  Languages,
  BookOpen,
  MessageSquare,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';

export const AiChatboxView: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    addVocabulary,
    chatHistory,
    saveChatConversation,
    deleteChatConversation,
    clearChatHistory,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => `chat_${Date.now()}`
  );
  const [responseLength, setResponseLength] = useState<'short' | 'long'>('long');
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const defaultWelcomeMsg: ChatMessage = {
    id: 'msg_welcome',
    sender: 'ai',
    text: `Xin chào ${currentUser.ten}! Tôi là Gia sư AI ngôn ngữ cá nhân của bạn cho ${currentLangInfo.name} (${currentLangInfo.nativeName}).\n\nBạn có thể yêu cầu tôi:\n• Dịch trôi chảy các câu/đoạn văn\n• Giải thích ngữ nghĩa từ & phân tích ngữ pháp chi tiết\n• Tải ảnh sách/bài tập (OCR) để giải đáp bài tập lập tức\n• Nhập vai luyện hội thoại thực tế`,
    timestamp: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([defaultWelcomeMsg]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<string | null>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load active conversation when selecting from history
  const handleSelectConversation = (conv: ChatConversation) => {
    setActiveConversationId(conv.chat_id);
    setMessages(conv.messages && conv.messages.length > 0 ? conv.messages : [defaultWelcomeMsg]);
    setShowHistorySidebar(false);
  };

  const handleStartNewChat = () => {
    const newId = `chat_${Date.now()}`;
    setActiveConversationId(newId);
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'ai',
        text: `Chào mừng buổi học mới! Bạn muốn Gia sư AI hỗ trợ dịch thuật, giải thích ngữ pháp hay đọc ảnh từ vựng hôm nay?`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowHistorySidebar(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChatConversation(chatId);
    if (activeConversationId === chatId) {
      handleStartNewChat();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const messageToSend = overrideText !== undefined ? overrideText : inputText;

    if ((!messageToSend.trim() && !attachedImageBase64) || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: messageToSend.trim(),
      timestamp: new Date().toISOString(),
      image_url: attachedImageBase64 || undefined,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    const currentImg = attachedImageBase64;
    setAttachedImageBase64(null);
    setImageError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          message: userMsg.text,
          imageBase64: currentImg,
          responseLength,
          messages: updatedMessages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
            image_url: m.image_url,
          })),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể kết nối với Gia sư AI.');
      }

      const data = await response.json();
      const aiReply: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Gia sư AI đã ghi nhận. Bạn có muốn hỏi thêm gì không?',
        timestamp: new Date().toISOString(),
        suggested_words: data.suggestedWords || [],
      };

      const finalMessages = [...updatedMessages, aiReply];
      setMessages(finalMessages);

      // Save conversation to persistent state
      saveChatConversation({
        chat_id: activeConversationId,
        user_id: currentUser.user_id,
        tieu_de: userMsg.text.slice(0, 35) || 'Hỏi đáp Gia sư AI',
        ngon_ngu: currentLanguage,
        created_at: new Date().toISOString(),
        messages: finalMessages,
      });
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: `⚠️ Lỗi từ Gia sư AI: ${err.message || 'Hệ thống đang bận'}. Bạn vui lòng bấm nút gửi để thử lại nhé!`,
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedMessages, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Vui lòng chọn tập tin hình ảnh (PNG, JPG, WEBP).');
      return;
    }

    setImageError(null);
    try {
      // Tự động tối ưu hoá kích thước & dung lượng ảnh (Max 1280px, JPEG 0.75) để AI đọc chữ OCR mượt mà & chính xác nhất
      const compressedBase64 = await compressImageForAI(file, 1280, 0.75);
      setAttachedImageBase64(compressedBase64);
    } catch (err) {
      console.error('Lỗi khi nén ảnh:', err);
      setImageError('Lỗi khi nén và xử lý ảnh. Vui lòng thử lại.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveSuggestedWord = (item: { word: string; meaning: string; phonetic?: string }) => {
    addVocabulary({
      tu: item.word,
      nghia: item.meaning,
      phien_am: item.phonetic || '',
      loai_tu: 'Từ vựng',
      cap_do: 'Gia sư AI',
      chu_de: 'Tư vấn AI',
      ngon_ngu: currentLanguage,
    });
    setSavedWordsMap((prev) => ({ ...prev, [item.word]: true }));
  };

  const quickPrompts = [
    { label: '🔤 Dịch & giải thích nghĩa', prompt: 'Hãy dịch câu/từ sau sang tiếng Việt chuẩn tự nhiên và giải thích chi tiết nghĩa:' },
    { label: '📖 Phân tích ngữ pháp', prompt: 'Hãy phân tích cấu trúc ngữ pháp từng thành phần trong câu sau:' },
    { label: '💬 Luyện hội thoại giao tiếp', prompt: 'Hãy đóng vai bạn bè trò chuyện ngắn với tôi bằng ' + currentLangInfo.name + ' về chủ đề hàng ngày:' },
    { label: '📷 Đọc chữ từ ảnh', prompt: 'Hãy đọc toàn bộ văn bản trong ảnh (OCR), dịch sang tiếng Việt và liệt kê các từ vựng nổi bật:' },
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex bg-white border-2 border-[#1A1A1A] editorial-shadow overflow-hidden relative">
      {/* Chat History Drawer / Sidebar */}
      {showHistorySidebar && (
        <div className="absolute inset-y-0 left-0 z-30 w-72 sm:w-80 bg-[#F9F7F2] border-r-2 border-[#1A1A1A] flex flex-col shadow-2xl">
          <div className="p-4 border-b-2 border-[#1A1A1A] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 font-serif font-black text-sm">
              <History className="w-4 h-4 text-[#1A1A1A]" />
              <span>LỊCH SỬ HỎI ĐÁP</span>
            </div>
            <button
              onClick={() => setShowHistorySidebar(false)}
              className="p-1 hover:bg-stone-200 border border-[#1A1A1A]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-[#1A1A1A]/10">
            <button
              onClick={handleStartNewChat}
              className="w-full py-2.5 px-3 bg-[#1A1A1A] text-[#F9F7F2] font-mono text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition border border-[#1A1A1A]"
            >
              <Plus className="w-4 h-4" />
              <span>ĐOẠN CHAT MỚI</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.length === 0 ? (
              <div className="text-center py-10 text-stone-500 font-mono text-xs">
                Chưa có lịch sử trò chuyện.
              </div>
            ) : (
              chatHistory.map((conv) => {
                const isActive = conv.chat_id === activeConversationId;
                return (
                  <div
                    key={conv.chat_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 border text-left cursor-pointer transition flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-white border-2 border-[#1A1A1A] editorial-shadow-sm'
                        : 'bg-stone-100 hover:bg-white border-stone-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-bold text-xs text-[#1A1A1A] truncate">
                        {conv.tieu_de || 'Hỏi đáp ngôn ngữ'}
                      </p>
                      <p className="text-[10px] font-mono text-stone-600 mt-1">
                        {new Date(conv.created_at).toLocaleDateString('vi-VN')} • {conv.messages?.length || 0} tin nhắn
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteChat(e, conv.chat_id)}
                      className="p-1 text-stone-600 hover:text-red-700 hover:bg-red-50 transition border border-transparent hover:border-red-200"
                      title="Xoá đoạn chat này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {chatHistory.length > 0 && (
            <div className="p-3 border-t-2 border-[#1A1A1A] bg-white">
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xoá toàn bộ lịch sử trò chuyện?')) {
                    clearChatHistory();
                    handleStartNewChat();
                  }
                }}
                className="w-full py-2 px-3 border border-red-300 bg-red-50 text-red-800 text-xs font-mono font-bold hover:bg-red-100 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>XOÁ TOÀN BỘ LỊCH SỬ</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#1A1A1A] bg-[#F9F7F2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="p-2 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition flex items-center gap-1.5 font-mono text-xs font-bold"
              title="Xem lịch sử trò chuyện"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">LỊCH SỬ</span>
            </button>

            <div className="w-9 h-9 border border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] flex items-center justify-center font-serif font-black text-sm">
              AI
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-black text-base text-[#1A1A1A]">
                  Gia sư AI cá nhân — {currentLangInfo.name}
                </h2>
                <span className="text-sm">{currentLangInfo.flag}</span>
              </div>
              <p className="text-[10px] font-mono text-stone-600 uppercase tracking-wider">
                Động cơ Gemini 3.7 Flash • Nhận diện OCR hình ảnh • Trợ lý học tập thực thụ
              </p>
            </div>
          </div>

          {/* Controls: Short vs Long Answer Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-stone-600 uppercase">Chế độ trả lời:</span>
            <div className="flex border border-[#1A1A1A] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setResponseLength('short')}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold transition ${
                  responseLength === 'short'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Trả lời ngắn gọn, đi thẳng vào ý chính"
              >
                ⚡ Ngắn
              </button>
              <button
                type="button"
                onClick={() => setResponseLength('long')}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold transition ${
                  responseLength === 'long'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
                title="Giải thích chi tiết toàn vẹn, phân tích ngữ pháp, ví dụ sâu"
              >
                📚 Chi tiết
              </button>
            </div>
          </div>
        </div>

        {/* Quick prompt bar */}
        <div className="px-4 py-2 border-b border-[#1A1A1A]/15 bg-stone-50 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-mono font-bold text-stone-600 shrink-0">Gợi ý nhanh:</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(qp.prompt + ' ');
              }}
              className="px-2.5 py-1 border border-[#1A1A1A]/30 bg-white hover:bg-[#1A1A1A] hover:text-white transition whitespace-nowrap font-serif text-[11px]"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#F9F7F2]">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`max-w-3xl p-5 border-2 border-[#1A1A1A] space-y-3 ${
                    isAi
                      ? 'bg-white text-[#1A1A1A] editorial-shadow-sm'
                      : 'bg-[#1A1A1A] text-[#F9F7F2]'
                  }`}
                >
                  {/* Attached Image preview in message */}
                  {msg.image_url && (
                    <div className="mb-3 border border-[#1A1A1A] bg-stone-100 p-1">
                      <img
                        src={msg.image_url}
                        alt="Hình ảnh đính kèm"
                        className="max-h-72 object-contain mx-auto"
                      />
                    </div>
                  )}

                  {/* Message content */}
                  <div className="whitespace-pre-wrap font-serif text-sm sm:text-base leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Audio reader & Vocab suggestion badges */}
                  {isAi && (
                    <div className="pt-3 border-t border-[#1A1A1A]/15 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <button
                        onClick={() => ttsService.speak(msg.text, currentLanguage)}
                        className="flex items-center gap-1.5 text-stone-600 hover:text-[#1A1A1A] transition"
                        title="Nghe giọng phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        <span className="font-bold">NGHE PHÁT ÂM</span>
                      </button>

                      {msg.suggested_words && msg.suggested_words.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {msg.suggested_words.map((item, wIdx) => {
                            const isSaved = savedWordsMap[item.word];
                            return (
                              <button
                                key={wIdx}
                                disabled={isSaved}
                                onClick={() => handleSaveSuggestedWord(item)}
                                className={`px-2 py-0.5 border text-[10px] font-mono uppercase font-bold transition flex items-center gap-1 ${
                                  isSaved
                                    ? 'bg-emerald-100 border-emerald-800 text-emerald-900'
                                    : 'bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white border-[#1A1A1A] text-[#1A1A1A]'
                                }`}
                              >
                                <span>{item.word}</span>
                                <span className="opacity-75">({item.meaning})</span>
                                {isSaved ? (
                                  <Check className="w-3 h-3 text-emerald-800 ml-0.5" />
                                ) : (
                                  <BookmarkPlus className="w-3 h-3 ml-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="p-4 bg-white border-2 border-[#1A1A1A] text-xs font-mono flex items-center gap-2 font-bold editorial-shadow-sm">
                <Sparkles className="w-4 h-4 animate-spin text-[#1A1A1A]" />
                <span>GIA SƯ AI ĐANG PHÂN TÍCH & SOẠN CÂU TRẢ LỜI ({responseLength === 'short' ? 'NGẮN GỌN' : 'CHI TIẾT'})...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t-2 border-[#1A1A1A] bg-white space-y-3">
          {imageError && (
            <div className="p-2 border border-red-400 bg-red-50 text-red-800 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{imageError}</span>
            </div>
          )}

          {/* Attached Image Bar */}
          {attachedImageBase64 && (
            <div className="flex items-center gap-3 p-2 border border-[#1A1A1A] bg-[#F9F7F2]">
              <img
                src={attachedImageBase64}
                alt="Ảnh đính kèm"
                className="w-14 h-14 object-cover border border-[#1A1A1A]"
              />
              <div className="flex-1">
                <p className="font-mono text-xs font-bold text-[#1A1A1A] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Đã đính kèm ảnh (Chế độ OCR / Đọc ảnh AI)</span>
                </p>
                <p className="text-[10px] font-mono text-stone-600">
                  AI sẽ tự động quét toàn bộ chữ trong ảnh và giải thích chi tiết.
                </p>
              </div>
              <button
                onClick={() => setAttachedImageBase64(null)}
                className="p-1 border border-[#1A1A1A] bg-white hover:bg-red-600 hover:text-white transition"
                title="Hủy chọn ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 border-2 border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white transition flex items-center justify-center shrink-0"
              title="Tải ảnh sách giáo khoa, bài tập để AI đọc OCR"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Hỏi Gia sư AI (Ví dụ: "Dịch giúp tôi...", "Giải thích ngữ pháp...", "Đọc ảnh này")...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#F9F7F2] border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs sm:text-sm font-serif focus:bg-white focus:outline-none"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputText.trim() && !attachedImageBase64)}
              className="px-5 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 transition flex items-center justify-center shrink-0 font-mono font-bold text-xs gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">GỬI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
