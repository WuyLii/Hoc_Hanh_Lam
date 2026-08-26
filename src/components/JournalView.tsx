import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { JournalEntry, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Volume2,
  BookmarkPlus,
  Send,
} from 'lucide-react';

export const JournalView: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    journalEntries,
    addJournalEntry,
    addVocabulary,
    addStudyTime,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];

  const [journalContent, setJournalContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<any | null>(null);

  const entriesForLang = journalEntries.filter((e) => e.ngon_ngu === currentLanguage);

  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/gemini/correct-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          content: journalContent.trim(),
        }),
      });

      if (!response.ok) throw new Error('Could not analyze journal entry');

      const feedbackData = await response.json();
      setLatestFeedback(feedbackData);

      addJournalEntry({
        user_id: currentUser.user_id,
        ngon_ngu: currentLanguage,
        ngay: new Date().toISOString().split('T')[0],
        noi_dung: journalContent.trim(),
        phan_hoi_ai: feedbackData,
      });

      confetti({ particleCount: 80, spread: 60 });
      addStudyTime(5, 50);
      setJournalContent('');
    } catch (err: any) {
      alert(err.message || 'Error processing journal feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUpgradedWord = (word: string, meaning: string) => {
    addVocabulary({
      tu: word,
      nghia: meaning,
      ngon_ngu: currentLanguage,
      chu_de: 'Từ vựng nhật ký nâng cao',
    });
    alert(`Đã thêm "${word}" vào kho từ vựng cá nhân.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
              Sổ tay viết nhật ký hàng ngày
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              Viết tự do & Tự động sửa lỗi ngữ pháp
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Nhật ký ngoại ngữ — {currentLangInfo.name}
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Viết suy nghĩ mỗi ngày. Gemini AI sẽ phân tích lỗi sai, gợi ý cách diễn đạt tự nhiên chuẩn bản xứ và nâng cao vốn từ.
          </p>
        </div>
      </div>

      {/* Journal Entry Form */}
      <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
            Viết bài nhật ký mới ({currentLangInfo.name})
          </span>
          <span className="text-xs font-mono text-stone-500">
            {new Date().toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <form onSubmit={handleSubmitJournal} className="space-y-4">
          <textarea
            rows={5}
            placeholder={`Soạn suy nghĩ của bạn bằng tiếng ${currentLangInfo.name} (kể về ngày hôm nay, quan điểm, tóm tắt sách)...`}
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            className="w-full p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] font-serif text-base text-[#1A1A1A] focus:bg-white focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !journalContent.trim()}
              className="px-6 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center gap-2"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'AI ĐANG CHẤM BÀI...' : 'GỬI BÀI ĐỂ AI CHẤM VÀ SỬA'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Latest Feedback Box */}
      {latestFeedback && (
        <div className="p-6 sm:p-8 bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3">
            <h3 className="font-serif font-black text-xl text-[#1A1A1A]">
              Báo cáo nhận xét và sửa lỗi từ AI
            </h3>
            <span className="text-xs font-mono bg-white px-2 py-0.5 border border-[#1A1A1A]">
              Điểm: {latestFeedback.diem || 85}/100
            </span>
          </div>

          <p className="font-serif text-sm text-[#1A1A1A]">{latestFeedback.tong_quan}</p>

          {/* Polished Native Version */}
          {latestFeedback.ban_sua_chuan && (
            <div className="p-4 bg-white border border-[#1A1A1A] space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A]">
                Bản sửa chuẩn theo cách diễn đạt bản xứ:
              </span>
              <p className="font-serif font-bold text-base text-[#1A1A1A]">
                "{latestFeedback.ban_sua_chuan}"
              </p>
            </div>
          )}

          {/* Upgraded Vocabulary suggestions */}
          {latestFeedback.tu_vung_nang_cao && latestFeedback.tu_vung_nang_cao.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#1A1A1A]/20">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-stone-600">
                Gợi ý từ vựng nâng cao nên dùng:
              </span>
              <div className="flex flex-wrap gap-2">
                {latestFeedback.tu_vung_nang_cao.map((v: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSaveUpgradedWord(v.tu || v.word, v.nghia || v.meaning)}
                    className="px-3 py-1.5 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition text-xs font-mono flex items-center gap-1.5"
                  >
                    <strong>{v.tu || v.word}</strong>
                    <span className="opacity-70">({v.nghia || v.meaning})</span>
                    <BookmarkPlus className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Entries Ledger */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
          Lịch sử các bài viết nhật ký ({entriesForLang.length})
        </h3>

        {entriesForLang.length === 0 ? (
          <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] text-xs font-mono text-stone-500">
            Chưa có bài nhật ký nào cho tiếng {currentLangInfo.name}.
          </div>
        ) : (
          <div className="space-y-4">
            {entriesForLang.map((entry) => (
              <div
                key={entry.entry_id}
                className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-mono text-stone-500 border-b border-[#1A1A1A]/10 pb-2">
                  <span>NGÀY: {entry.ngay}</span>
                  <button
                    onClick={() => ttsService.speak(entry.noi_dung, currentLanguage)}
                    className="flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>NGHE ĐỌC</span>
                  </button>
                </div>

                <p className="font-serif text-base text-[#1A1A1A] leading-relaxed">
                  "{entry.noi_dung}"
                </p>

                {entry.phan_hoi_ai?.ban_sua_chuan && (
                  <div className="p-3 bg-[#F9F7F2] border-l-2 border-[#1A1A1A] text-xs font-serif italic text-stone-800">
                    Bản sửa bản xứ: "{entry.phan_hoi_ai.ban_sua_chuan}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
