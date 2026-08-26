import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleplayScenario, RoleplayMessage, LANGUAGES } from '../types';
import { INITIAL_ROLEPLAY_SCENARIOS } from '../data/seedData';
import { ttsService } from '../services/ttsService';
import {
  Volume2,
  Mic,
  Send,
  ArrowRight,
  Smile,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';

export const RoleplayView: React.FC = () => {
  const { currentLanguage, currentUser, addStudyTime } = useApp();
  const currentLangInfo = LANGUAGES[currentLanguage];

  const scenarios = INITIAL_ROLEPLAY_SCENARIOS.filter((s) => s.ngon_ngu === currentLanguage);

  const [activeScenario, setActiveScenario] = useState<RoleplayScenario | null>(null);
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [userText, setUserText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startScenario = (sc: RoleplayScenario) => {
    setActiveScenario(sc);
    const initialAiMsg: RoleplayMessage = {
      id: `rp_${Date.now()}`,
      sender: 'ai',
      text: sc.starter_line,
      translation: 'Hello! Let us begin our dialogue.',
      timestamp: new Date().toISOString(),
    };
    setMessages([initialAiMsg]);
    ttsService.speak(sc.starter_line, currentLanguage);
  };

  const handleSendResponse = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading || !activeScenario) return;

    const userMsg: RoleplayMessage = {
      id: `rp_u_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setUserText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          scenarioContext: `${activeScenario.tieu_de}: ${activeScenario.boi_canh}`,
          userRole: activeScenario.vai_tro_nguoi_dung,
          aiRole: activeScenario.vai_tro_ai,
          message: textToSend.trim(),
          history: updated.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate dialogue response');

      const data = await response.json();
      const aiReply: RoleplayMessage = {
        id: `rp_ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Understood.',
        translation: data.translation,
        feedback: data.feedback,
        suggested_replies: data.suggestedReplies || [],
        timestamp: new Date().toISOString(),
      };

      setMessages([...updated, aiReply]);
      ttsService.speak(aiReply.text, currentLanguage);
      addStudyTime(1, 20);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      ttsService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      ttsService.startListening(
        currentLanguage,
        (transcript) => {
          setUserText(transcript);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  if (activeScenario) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Scenario Header */}
        <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500">
              TÌNH HUỐNG ĐÓNG VAI
            </span>
            <h2 className="text-2xl font-serif font-black text-[#1A1A1A]">{activeScenario.tieu_de}</h2>
            <p className="text-xs font-serif italic text-stone-600 mt-1">
              Vai của bạn: <strong>{activeScenario.vai_tro_nguoi_dung}</strong> | Vai AI: <strong>{activeScenario.vai_tro_ai}</strong>
            </p>
          </div>

          <button
            onClick={() => setActiveScenario(null)}
            className="px-3.5 py-1.5 border border-[#1A1A1A] bg-white hover:bg-stone-200 text-xs font-mono font-bold uppercase text-[#1A1A1A]"
          >
            ← THOÁT HỘI THOẠI
          </button>
        </div>

        {/* Dialogue Stream */}
        <div className="p-6 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-6 min-h-[350px]">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div key={m.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-xl p-5 border-2 border-[#1A1A1A] space-y-2 ${
                    isAi ? 'bg-white text-[#1A1A1A] editorial-shadow-sm' : 'bg-[#1A1A1A] text-[#F9F7F2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-serif text-base font-bold leading-snug">{m.text}</p>
                    {isAi && (
                      <button
                        onClick={() => ttsService.speak(m.text, currentLanguage)}
                        className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition shrink-0"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {m.translation && (
                    <p className="text-xs font-mono text-stone-600 border-t border-[#1A1A1A]/10 pt-1.5">
                      → {m.translation}
                    </p>
                  )}

                  {/* AI Feedback & Grammar notes */}
                  {m.feedback && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-800 text-amber-900 text-[11px] font-mono">
                      <strong>Nhận xét AI:</strong> {m.feedback}
                    </div>
                  )}
                </div>

                {/* Suggested prompt replies */}
                {isAi && m.suggested_replies && m.suggested_replies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-xl">
                    {m.suggested_replies.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendResponse(sug)}
                        className="px-2.5 py-1 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[10px] font-serif transition"
                      >
                        "{sug}"
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="p-3 bg-white border border-[#1A1A1A] text-xs font-mono animate-pulse">
              Đối tác AI đang suy nghĩ câu trả lời...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-2 border-[#1A1A1A] flex items-center gap-2">
          <button
            onClick={handleVoiceInput}
            className={`p-3 border-2 border-[#1A1A1A] ${
              isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#F9F7F2] hover:bg-stone-200'
            }`}
            title="Nhập bằng giọng nói"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={`Nói hoặc trả lời với vai trò ${activeScenario.vai_tro_nguoi_dung}...`}
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendResponse(userText)}
            className="flex-1 px-4 py-3 bg-[#F9F7F2] border border-[#1A1A1A] font-serif text-sm text-[#1A1A1A] focus:bg-white focus:outline-none"
          />

          <button
            onClick={() => handleSendResponse(userText)}
            disabled={!userText.trim() || isLoading}
            className="px-5 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
              Mô phỏng hội thoại AI
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              Đàm thoại tình huống thực tế 1-1
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Đóng vai tình huống — {currentLangInfo.name}
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Luyện tập giao tiếp thực tế với nhận xét và sửa lỗi ngữ pháp tức thì từ AI.
          </p>
        </div>
      </div>

      {/* Scenario Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm hover:editorial-shadow transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
                <span className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-[9px] font-mono font-bold uppercase text-[#1A1A1A]">
                  {sc.cap_do}
                </span>
                <span className="text-xs font-mono text-stone-500 uppercase">
                  {sc.vai_tro_ai} ↔ {sc.vai_tro_nguoi_dung}
                </span>
              </div>

              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">{sc.tieu_de}</h3>
              <p className="text-xs font-serif text-stone-700 leading-relaxed">{sc.boi_canh}</p>

              <div className="p-3 bg-[#F9F7F2] border-l-2 border-[#1A1A1A] text-xs font-serif italic text-stone-800">
                Câu mở đầu: "{sc.starter_line}"
              </div>
            </div>

            <button
              onClick={() => startScenario(sc)}
              className="mt-6 w-full py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <span>VÀO ĐỐI THOẠI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
