import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage, ChatConversation, LANGUAGES, GameMode } from '../types';
import { SpeakButton } from './SpeakButton';
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
  Gamepad2,
  Compass,
  PlusCircle,
  ShieldAlert,
  Settings,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Hash,
  PenTool,
  FileCheck2,
  ToggleLeft,
  ToggleRight,
  Layers,
} from 'lucide-react';
import { AgentAction, ClientAppContextSummary, SupportedLanguage } from '../agent/types';
import { executeClientAction, VALID_GAME_MODES } from '../agent/actionRegistry';

interface ExtendedChatMessage extends ChatMessage {
  actions?: AgentAction[];
}

export const AiChatboxView: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    setLanguage,
    addVocabulary,
    toggleTodayFlashcard,
    chatHistory,
    saveChatConversation,
    deleteChatConversation,
    clearChatHistory,
    activeNav,
    setActiveNav,
    setSelectedGameMode,
    setSelectedDeckId,
    setSelectedLevelFilter,
    updateUser,
    vocabulary,
    currentLangVocabulary,
    currentLangDecks,
    decks,
    progressLogs,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cờ tính năng Tutor Agent (mặc định bật, cho phép tắt để lùi về gia sư cũ)
  const [tutorAgentEnabled, setTutorAgentEnabled] = useState<boolean>(() => {
    const envVal = import.meta.env.VITE_TUTOR_AGENT;
    if (envVal === 'off' || envVal === 'false') return false;
    const localVal = localStorage.getItem('POLYGLOT_TUTOR_AGENT');
    if (localVal === 'off') return false;
    return true;
  });

  const toggleTutorAgentFlag = () => {
    const nextVal = !tutorAgentEnabled;
    setTutorAgentEnabled(nextVal);
    localStorage.setItem('POLYGLOT_TUTOR_AGENT', nextVal ? 'on' : 'off');
  };

  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => `chat_${Date.now()}`
  );
  const [responseLength, setResponseLength] = useState<'short' | 'long'>('long');
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const defaultWelcomeMsg: ExtendedChatMessage = {
    id: 'msg_welcome',
    sender: 'ai',
    text: `Xin chào ${currentUser.ten}! Tôi là **Gia Sư AI Đa Nhiệm** đồng hành cùng bạn học môn **${currentLangInfo.name} (${currentLangInfo.nativeName})**.\n\nTôi vừa là chuyên gia ngôn ngữ, vừa có thể hỗ trợ bạn điều khiển học tập:\n• **Học thuật**: Dịch thoát ý, giải thích ngữ pháp sâu, phiên âm IPA/Romaja/Pinyin, OCR ảnh bài tập\n• **Lối tắt hành động**: Mở nhanh game, chuyển sổ từ vựng/ngữ pháp, xem tiến độ SRS hôm nay\n• **Lưu từ 1 chạm**: Thêm từ vựng mới vào sổ từ (kèm bước xác nhận an toàn)\n\nHãy nhập câu hỏi hoặc yêu cầu bất kỳ để bắt đầu nhé!`,
    timestamp: new Date().toISOString(),
    actions: [
      {
        id: 'act_init_srs',
        actionId: 'show_study_summary',
        tier: 'T0',
        label: 'Xem nhiệm vụ ôn tập hôm nay',
        description: 'Kiểm tra số từ đến hạn SRS và tiến độ trong ngày',
        params: {},
        status: 'pending',
      },
      {
        id: 'act_init_game',
        actionId: 'open_game',
        tier: 'T0',
        label: 'Chơi game Flashcard',
        description: 'Lật thẻ ghi nhớ từ vựng phản xạ nhanh',
        params: { mode: 'flashcard' },
        status: 'pending',
      },
    ],
  };

  const [messages, setMessages] = useState<ExtendedChatMessage[]>([defaultWelcomeMsg]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleStartNewChat = () => {
    setActiveConversationId(`chat_${Date.now()}`);
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'ai',
        text: `Chào mừng bạn đến với phiên học mới môn ${currentLangInfo.name}! Bạn muốn hỏi hoặc luyện tập phần nào hôm nay?`,
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

    const userMsg: ExtendedChatMessage = {
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

    const userMessageCount = updatedMessages.filter((m) => m.sender === 'user').length;

    const todayReviewsCount = currentLangVocabulary.filter(
      (v) => v.is_added_today_flashcard || (v.srs_next_review && new Date(v.srs_next_review) <= new Date())
    ).length;

    const streakDays = currentUser.streak || (progressLogs?.[0]?.streak ?? 0);

    // Chuẩn bị context summary gửi lên máy chủ
    const appContextSummary: ClientAppContextSummary = {
      currentNav: activeNav,
      currentLanguage: currentLanguage as SupportedLanguage,
      userLevel: currentUser.cap_do?.[currentLanguage],
      todayReviewsCount,
      totalWordsCount: currentLangVocabulary.length,
      streakDays,
      availableDecks: (currentLangDecks || decks)
        .filter((d) => !d.ngon_ngu || d.ngon_ngu === currentLanguage)
        .map((d) => ({ id: d.deck_id, name: d.ten_bo || d.ten_deck || 'Bộ từ' })),
      availableGameModes: VALID_GAME_MODES,
      availableLevels: ['A1 - Sơ cấp', 'A2 - Sơ cấp', 'B1 - Trung cấp', 'B2 - Trung cấp', 'C1 - Cao cấp', 'C2 - Thành thạo'],
    };

    try {
      let data: any = null;

      // NẾU CỜ BẬT: Thử gọi route nâng cấp /api/tutor/agent
      if (tutorAgentEnabled) {
        try {
          const response = await fetch('/api/tutor/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: currentLanguage,
              message: userMsg.text,
              imageBase64: currentImg,
              responseLength,
              turn: userMessageCount - 1,
              appContext: appContextSummary,
              messages: updatedMessages.map((m) => ({
                role: m.sender === 'user' ? 'user' : 'model',
                content: m.text,
                image_url: m.image_url,
              })),
            }),
          });

          if (response.ok) {
            const respText = await response.text();
            if (!respText.trim().startsWith('<')) {
              try {
                data = JSON.parse(respText);
              } catch {}
            }
          } else {
            console.warn('[AiChatboxView] Route /api/tutor/agent không phản hồi tốt, tự động lùi về /api/gemini/chat cũ');
          }
        } catch (subErr) {
          console.warn('[AiChatboxView] Lỗi kết nối /api/tutor/agent, tự động chuyển về fallback:', subErr);
        }
      }

      // NẾU CỜ TẮT HOẶC ROUTE MỚI LỖI: Tự động lùi về /api/gemini/chat cũ, người dùng không thấy gián đoạn
      if (!data) {
        const fallbackRes = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: currentLanguage,
            message: userMsg.text,
            imageBase64: currentImg,
            responseLength,
            turn: userMessageCount - 1,
            messages: updatedMessages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              content: m.text,
              image_url: m.image_url,
            })),
          }),
        });

        const fallbackText = await fallbackRes.text();
        if (fallbackText.trim().startsWith('<')) {
          throw new Error('Máy chủ trả về trang HTML (404/500) thay vì dữ liệu JSON.');
        }
        let fallbackJson: any = {};
        try {
          fallbackJson = JSON.parse(fallbackText);
        } catch (e) {
          throw new Error('Phản hồi từ máy chủ không phải JSON hợp lệ.');
        }

        if (!fallbackRes.ok) {
          throw new Error(fallbackJson.error || 'Không thể kết nối với Gia sư AI.');
        }

        data = fallbackJson;
      }

      const aiReply: ExtendedChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Gia sư AI đã ghi nhận. Bạn có muốn hỏi thêm gì không?',
        timestamp: new Date().toISOString(),
        tutor_info: data.tutorInfo,
        suggested_words: data.suggestedWords || [],
        actions: data.actions || [],
      };

      const finalMessages = [...updatedMessages, aiReply];
      setMessages(finalMessages);

      saveChatConversation({
        chat_id: activeConversationId,
        user_id: currentUser.user_id,
        chu_de: userMsg.text.slice(0, 35) || 'Hỏi đáp Gia sư AI',
        tieu_de: userMsg.text.slice(0, 35) || 'Hỏi đáp Gia sư AI',
        ngon_ngu: currentLanguage,
        created_at: new Date().toISOString(),
        cac_tin_nhan: finalMessages,
        messages: finalMessages,
      });
    } catch (err: any) {
      console.error(err);
      const errMsg: ExtendedChatMessage = {
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
      const compressedBase64 = await compressImageForAI(file, 1280, 0.75);
      setAttachedImageBase64(compressedBase64);
    } catch (err) {
      console.error('Lỗi khi nén ảnh:', err);
      setImageError('Lỗi khi nén và xử lý ảnh. Vui lòng thử lại.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveSuggestedWord = (item: { word: string; meaning: string; phonetic?: string; nghia_tieng_han?: string; nghia_tieng_anh?: string }) => {
    toggleTodayFlashcard({
      tu: item.word,
      nghia: item.meaning,
      phien_am: item.phonetic || '',
      nghia_tieng_han: item.nghia_tieng_han || '',
      nghia_tieng_anh: item.nghia_tieng_anh || '',
      loai_tu: 'Từ vựng',
      cap_do: 'Gia sư AI',
      chu_de: 'Tư vấn AI',
      ngon_ngu: currentLanguage,
      is_added_today_flashcard: true,
      added_to_today_flashcard_at: new Date().toISOString(),
      retention_level: 'chua_danh_gia',
    });
    setSavedWordsMap((prev) => ({ ...prev, [item.word]: true }));
    showToast(`Đã lưu "${item.word}" vào sổ từ vựng ôn tập!`);
  };

  // Thực thi action được chọn
  const handleRunAction = async (msgId: string, action: AgentAction) => {
    setExecutingActionId(action.id);
    const result = await executeClientAction(action, {
      setActiveNav,
      setSelectedGameMode,
      setSelectedDeckId,
      setSelectedLevelFilter,
      setLanguage,
      toggleTodayFlashcard,
      addVocabulary,
      updateUser,
      currentLanguage: currentLanguage as SupportedLanguage,
      vocabulary,
    });
    setExecutingActionId(null);

    // Cập nhật trạng thái của action trong tin nhắn
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.actions) return m;
        return {
          ...m,
          actions: m.actions.map((act) =>
            act.id === action.id
              ? ({
                  ...act,
                  status: result.success ? 'executed' : 'failed',
                  error: result.success ? undefined : result.message,
                } as AgentAction)
              : act
          ),
        };
      })
    );

    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleCancelAction = (msgId: string, actionId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.actions) return m;
        return {
          ...m,
          actions: m.actions.map((act) =>
            act.id === actionId
              ? ({ ...act, status: 'cancelled' } as AgentAction)
              : act
          ),
        };
      })
    );
  };

  const quickPrompts = [
    { label: '🔤 Dịch & giải thích nghĩa', prompt: 'Hãy dịch câu/từ sau sang tiếng Việt chuẩn tự nhiên và giải thích chi tiết nghĩa: ' },
    { label: '📖 Phân tích ngữ pháp', prompt: 'Hãy phân tích cấu trúc ngữ pháp từng thành phần trong câu sau: ' },
    { label: '💬 Luyện hội thoại giao tiếp', prompt: 'Hãy đóng vai bạn bè trò chuyện ngắn với tôi bằng ' + currentLangInfo.name + ' về chủ đề hàng ngày: ' },
    { label: '🎮 Chơi game ôn bài', prompt: 'Cho tôi chơi game lật thẻ flashcard ôn bài hôm nay' },
    { label: '📊 Xem tiến độ hôm nay', prompt: 'Hôm nay tôi cần ôn bao nhiêu từ vựng?' },
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex bg-white border-2 border-[#1A1A1A] editorial-shadow overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`absolute top-4 right-4 z-50 px-4 py-2.5 border-2 border-[#1A1A1A] font-mono text-xs font-bold shadow-[3px_3px_0px_#1c1917] flex items-center gap-2 transition-all animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-red-100 text-red-900 border-red-800'
              : 'bg-emerald-100 text-emerald-950 border-emerald-900'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

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
              <span>BẮT ĐẦU ĐOẠN CHAT MỚI</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-center font-serif italic text-xs text-stone-500 py-8">
                Chưa có lịch sử trò chuyện nào
              </p>
            ) : (
              chatHistory.map((conv) => (
                <div
                  key={conv.chat_id}
                  onClick={() => {
                    setActiveConversationId(conv.chat_id);
                    if (conv.messages && conv.messages.length > 0) {
                      setMessages(conv.messages);
                    }
                    setShowHistorySidebar(false);
                  }}
                  className={`p-2.5 border text-xs cursor-pointer flex items-center justify-between group transition ${
                    activeConversationId === conv.chat_id
                      ? 'bg-amber-100 border-[#1A1A1A] font-bold'
                      : 'bg-white border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="truncate font-serif text-[#1A1A1A]">
                      {conv.tieu_de || conv.chu_de || 'Phiên học Gia sư'}
                    </p>
                    <p className="text-[10px] font-mono text-stone-500">
                      {new Date(conv.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(e, conv.chat_id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-600 transition"
                    title="Xóa đoạn chat này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-[#F9F7F2] min-w-0 relative">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b-2 border-[#1A1A1A] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistorySidebar(true)}
              className="p-1.5 border border-[#1A1A1A] hover:bg-stone-100 flex items-center gap-1.5 text-xs font-mono font-bold"
              title="Mở lịch sử các đoạn chat"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">LỊCH SỬ</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-sm sm:text-base text-[#1A1A1A]">
                  GIA SƯ AI ĐA NHIỆM
                </span>
                <span className="px-1.5 py-0.5 border border-[#1A1A1A] bg-[#F9F7F2] text-[10px] font-mono font-bold uppercase">
                  {currentLangInfo.name}
                </span>
              </div>
              <p className="text-[11px] font-mono text-stone-600 hidden sm:block">
                Hỗ trợ học thuật chuyên sâu & Định tuyến tác vụ học tập tức thì
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Short / Long Mode Toggle */}
            <div className="flex items-center border border-[#1A1A1A] bg-[#F9F7F2] p-0.5">
              <button
                type="button"
                onClick={() => setResponseLength('short')}
                className={`px-2 py-1 text-[11px] font-mono font-bold transition ${
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
                className={`px-2 py-1 text-[11px] font-mono font-bold transition ${
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

                  {/* KHU VỰC ACTION CLIPS / ACTION CARDS CHO GIA SƯ AI */}
                  {isAi && msg.actions && msg.actions.length > 0 && (
                    <div className="pt-3 border-t border-[#1A1A1A]/15 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-stone-700">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Tác vụ hành động đề xuất ({msg.actions.length})</span>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {msg.actions.map((action) => {
                          const isExecuting = executingActionId === action.id;
                          const isExecuted = action.status === 'executed';
                          const isCancelled = action.status === 'cancelled';

                          // 1. T0 ACTION (Điều hướng & Đọc an toàn - Nút bấm 1 chạm)
                          if (action.tier === 'T0') {
                            return (
                              <button
                                key={action.id}
                                disabled={isExecuting || isExecuted}
                                onClick={() => handleRunAction(msg.id, action)}
                                className={`px-3 py-1.5 border-2 border-[#1A1A1A] text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                                  isExecuted
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-900 cursor-default'
                                    : 'bg-amber-50 hover:bg-amber-100 text-[#1A1A1A] shadow-[2px_2px_0px_#1c1917] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                                }`}
                                title={action.description}
                              >
                                {isExecuting ? (
                                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                ) : isExecuted ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                ) : action.actionId === 'open_game' ? (
                                  <Gamepad2 className="w-3.5 h-3.5 text-amber-800" />
                                ) : action.actionId === 'open_vocabulary' ? (
                                  <BookOpen className="w-3.5 h-3.5 text-blue-800" />
                                ) : action.actionId === 'set_language' ? (
                                  <Languages className="w-3.5 h-3.5 text-indigo-800" />
                                ) : action.actionId === 'show_study_summary' ? (
                                  <TrendingUp className="w-3.5 h-3.5 text-purple-800" />
                                ) : (
                                  <Compass className="w-3.5 h-3.5 text-stone-800" />
                                )}
                                <span>{action.label}</span>
                                {isExecuted && <span className="text-[10px] font-normal text-emerald-800">(Đã mở)</span>}
                              </button>
                            );
                          }

                          // 2. T1 ACTION (Ghi dữ liệu có thể hoàn tác - Yêu cầu xác nhận rõ ràng)
                          if (action.tier === 'T1') {
                            const p = action.params as any;
                            return (
                              <div
                                key={action.id}
                                className="w-full p-3 border-2 border-amber-900 bg-amber-50/70 text-[#1A1A1A] shadow-[3px_3px_0px_#1c1917] space-y-2 rounded-sm"
                              >
                                <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-900">
                                  <div className="flex items-center gap-1.5">
                                    <PlusCircle className="w-4 h-4 text-amber-800" />
                                    <span>YÊU CẦU XÁC NHẬN GHI DỮ LIỆU (TIER 1)</span>
                                  </div>
                                  <span className="text-[10px] px-1.5 py-0.5 border border-amber-800 bg-amber-100 font-bold uppercase">
                                    {action.actionId}
                                  </span>
                                </div>

                                {action.actionId === 'add_vocabulary' && (
                                  <div className="bg-white p-2.5 border border-[#1A1A1A] font-serif text-xs space-y-1">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-base font-bold font-serif text-[#1A1A1A]">
                                        {p.tu}
                                      </span>
                                      {p.phien_am && (
                                        <span className="font-mono text-stone-600 text-xs">
                                          [{p.phien_am}]
                                        </span>
                                      )}
                                      {p.tu_loai && (
                                        <span className="text-[10px] font-mono px-1 border border-stone-300 bg-stone-100 text-stone-700">
                                          {p.tu_loai}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-semibold text-stone-900">
                                      Nghĩa: {p.nghia}
                                    </p>
                                    {p.vi_du && (
                                      <p className="text-[11px] text-stone-700 italic border-l-2 border-amber-700 pl-2 mt-1">
                                        Ví dụ: "{p.vi_du}" {p.vi_du_dich && `— ${p.vi_du_dich}`}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {action.actionId === 'set_level' && (
                                  <div className="bg-white p-2.5 border border-[#1A1A1A] font-serif text-xs">
                                    <p>
                                      Cập nhật cấp độ ngôn ngữ{' '}
                                      <strong className="font-mono">
                                        {(p.language || '').toUpperCase()}
                                      </strong>{' '}
                                      thành: <strong className="text-amber-900">{p.level}</strong>
                                    </p>
                                  </div>
                                )}

                                {action.actionId === 'toggle_today_flashcard' && (
                                  <div className="bg-white p-2.5 border border-[#1A1A1A] font-serif text-xs">
                                    <p>Ghim từ <strong>{p.word || p.wordId}</strong> vào ôn tập trong ngày.</p>
                                  </div>
                                )}

                                {isExecuted ? (
                                  <div className="p-1.5 bg-emerald-100 border border-emerald-800 text-emerald-950 font-mono text-xs font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-700" />
                                    <span>Đã ghi dữ liệu thành công vào sổ từ!</span>
                                  </div>
                                ) : isCancelled ? (
                                  <div className="text-[11px] font-mono text-stone-500 italic">
                                    Đã bỏ qua thao tác này.
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      disabled={isExecuting}
                                      onClick={() => handleRunAction(msg.id, action)}
                                      className="px-3 py-1.5 bg-[#1A1A1A] text-white hover:bg-stone-800 font-mono text-xs font-bold flex items-center gap-1.5 transition border border-[#1A1A1A]"
                                    >
                                      {isExecuting ? (
                                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>Xác nhận ghi vào máy</span>
                                    </button>
                                    <button
                                      disabled={isExecuting}
                                      onClick={() => handleCancelAction(msg.id, action.id)}
                                      className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 font-mono text-xs font-bold transition border border-[#1A1A1A]"
                                    >
                                      Bỏ qua
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // 3. T2 ACTION (Cảnh báo nhạy cảm / Cấm tự động thực thi)
                          if (action.tier === 'T2') {
                            return (
                              <div
                                key={action.id}
                                className="w-full p-3 border-2 border-red-800 bg-red-50 text-red-950 shadow-[3px_3px_0px_#991b1b] space-y-2 rounded-sm"
                              >
                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-900">
                                  <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
                                  <span>BẢO VỆ DỮ LIỆU AN TOÀN (TIER 2 - KHÔNG TỰ THỰC THI)</span>
                                </div>
                                <p className="font-serif text-xs text-red-900">
                                  Để đảm bảo không mất mát dữ liệu do hiểu lầm, Gia sư AI không bao giờ tự ý xóa dữ liệu hoặc ghi đè đám mây. Bạn hãy tự tay thực hiện trong mục Cài đặt.
                                </p>
                                <button
                                  onClick={() => handleRunAction(msg.id, action)}
                                  className="px-3 py-1.5 bg-red-800 text-white hover:bg-red-900 font-mono text-xs font-bold flex items-center gap-1.5 transition border border-red-950"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  <span>Mở Trung tâm Cài đặt & Dữ liệu</span>
                                </button>
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Audio reader & Vocab suggestion badges */}
                  {isAi && (
                    <div className="pt-3 border-t border-[#1A1A1A]/15 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <SpeakButton
                        text={msg.text}
                        language={currentLanguage}
                        variant="ghost"
                        showLabel
                        label="NGHE PHÁT ÂM"
                        position="right"
                        buttonClassName="font-mono font-bold text-xs text-stone-600 hover:text-[#1A1A1A]"
                        title="Nhấn để phát âm 1x • Rê chuột hoặc giữ để chọn tốc độ"
                      />

                      {msg.suggested_words && msg.suggested_words.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {msg.suggested_words.map((item, wIdx) => {
                            const isSaved = savedWordsMap[item.word];
                            return (
                              <button
                                key={wIdx}
                                disabled={isSaved}
                                onClick={() => handleSaveSuggestedWord(item as any)}
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

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(qp.prompt)}
                className="px-2.5 py-1 border border-[#1A1A1A]/30 bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono whitespace-nowrap transition"
              >
                {qp.label}
              </button>
            ))}
          </div>

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
              placeholder={`Hỏi Gia sư AI (Ví dụ: "Dịch câu này...", "Mở game flashcard", "Thêm từ 사과 nghĩa là táo")...`}
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
