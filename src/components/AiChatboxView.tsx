import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage, ChatConversation, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import {
  Sparkles,
  Send,
  Volume2,
  BookmarkPlus,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export const AiChatboxView: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    addVocabulary,
    chatHistory,
    saveChatConversation,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeConversationId, setActiveConversationId] = useState<string>(() => `chat_${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Xin chào ${currentUser.ten}! Tôi là Gia sư ngôn ngữ AI đồng hành cùng bạn học ${currentLangInfo.name} (${currentLangInfo.nativeName}).\n\nBạn có thể hỏi tôi về cấu trúc ngữ pháp phức tạp, nguồn gốc từ vựng, cách đặt câu, hoặc đính kèm ảnh sách giáo khoa để được giải thích chi tiết ngay lập tức.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImageBase64) || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      image_url: attachedImageBase64 || undefined,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setAttachedImageBase64(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          message: userMsg.text,
          imageBase64: userMsg.image_url,
          history: updatedMessages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (!response.ok) throw new Error('Không thể kết nối đến máy chủ AI');

      const data = await response.json();
      const aiReply: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Xin lỗi, bạn có thể diễn đạt lại câu hỏi được không?',
        timestamp: new Date().toISOString(),
        suggested_words: data.suggestedWords || [],
      };

      const finalMessages = [...updatedMessages, aiReply];
      setMessages(finalMessages);

      // Save conversation
      saveChatConversation({
        chat_id: activeConversationId,
        user_id: currentUser.user_id,
        tieu_de: userMsg.text.slice(0, 40) || 'Hỏi đáp ngôn ngữ',
        ngon_ngu: currentLanguage,
        created_at: new Date().toISOString(),
        messages: finalMessages,
      });
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: 'Lỗi khi xử lý câu hỏi: ' + (err.message || 'Lỗi hệ thống'),
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedMessages, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setAttachedImageBase64(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveSuggestedWord = (item: { word: string; meaning: string; phonetic?: string }) => {
    addVocabulary({
      tu: item.word,
      nghia: item.meaning,
      phien_am: item.phonetic || '',
      loai_tu: 'Từ vựng',
      cap_do: 'Cốt lõi',
      chu_de: 'Tư vấn AI',
      ngon_ngu: currentLanguage,
    });
    setSavedWordsMap((prev) => ({ ...prev, [item.word]: true }));
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-14rem)] flex flex-col bg-white border-2 border-[#1A1A1A] editorial-shadow overflow-hidden">
      {/* Editorial Chat Header */}
      <div className="p-4 sm:p-6 border-b-2 border-[#1A1A1A] bg-[#F9F7F2] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] flex items-center justify-center font-serif font-black text-lg">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-black text-lg text-[#1A1A1A]">
                Gia sư ngôn ngữ — {currentLangInfo.name}
              </h2>
              <span className="text-sm">{currentLangInfo.flag}</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-600">
              Động cơ Gemini 3.7 Flash • Nhận diện văn bản qua ảnh OCR
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-bold">
          TRỰC TUYẾN
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#F9F7F2]">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-2xl p-5 border-2 border-[#1A1A1A] space-y-3 ${
                  isAi
                    ? 'bg-white text-[#1A1A1A] editorial-shadow-sm'
                    : 'bg-[#1A1A1A] text-[#F9F7F2]'
                }`}
              >
                {/* Attached Image */}
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="Ảnh đính kèm"
                    className="max-h-56 object-cover border border-[#1A1A1A] mb-2"
                  />
                )}

                <div className="whitespace-pre-wrap font-serif text-sm sm:text-base leading-relaxed">
                  {msg.text}
                </div>

                {/* AI Audio button & Suggested Words */}
                {isAi && (
                  <div className="pt-3 border-t border-[#1A1A1A]/15 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <button
                      onClick={() => ttsService.speak(msg.text, currentLanguage)}
                      className="flex items-center gap-1 text-stone-600 hover:text-[#1A1A1A] transition"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>NGHE ĐỌC</span>
                    </button>

                    {/* Suggested vocab badges */}
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
                              <span className="opacity-70">({item.meaning})</span>
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
            <div className="p-4 bg-white border-2 border-[#1A1A1A] text-xs font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-[#1A1A1A]" />
              <span>GIA SƯ AI ĐANG SOẠN CÂU TRẢ LỜI...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t-2 border-[#1A1A1A] bg-white">
        {/* Attached image preview */}
        {attachedImageBase64 && (
          <div className="relative inline-block mb-3">
            <img
              src={attachedImageBase64}
              alt="Xem trước"
              className="w-16 h-16 object-cover border-2 border-[#1A1A1A]"
            />
            <button
              onClick={() => setAttachedImageBase64(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-[#1A1A1A] text-white text-xs flex items-center justify-center font-bold"
            >
              ×
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
            className="p-3 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white transition"
            title="Đính kèm ảnh sách / tài liệu"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={`Hỏi bằng tiếng ${currentLangInfo.name} hoặc tiếng Việt...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#F9F7F2] border border-[#1A1A1A] text-[#1A1A1A] text-xs sm:text-sm font-serif focus:bg-white focus:outline-none"
          />

          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !attachedImageBase64)}
            className="px-5 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
