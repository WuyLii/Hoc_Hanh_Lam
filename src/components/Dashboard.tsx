import React from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES, LanguageCode } from '../types';
import { LANGUAGE_LEVEL_MAP } from '../data/levelData';
import { getDueWords, categorizeRetention } from '../services/srsEngine';
import { ttsService } from '../services/ttsService';
import { SpeakButton } from './SpeakButton';
import {
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  Layers,
  Flame,
  Gamepad2,
  Smile,
  CheckCircle2,
  GraduationCap,
  Target,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    setCurrentLanguage,
    vocabulary,
    currentLangVocabulary,
    grammar,
    currentLangGrammar,
    setActiveNav,
    setSelectedGameMode,
    progressLogs,
    journalEntries,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];
  const dueWords = getDueWords(currentLangVocabulary);
  const { mastered, learning, difficult } = categorizeRetention(currentLangVocabulary);

  // Word of the Day (deterministic based on date)
  const todayIdx = new Date().getDate() % (currentLangVocabulary.length || 1);
  const wordOfTheDay = currentLangVocabulary[todayIdx] || currentLangVocabulary[0];

  // 28 days contribution heatmap
  const today = new Date();
  const past28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (27 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = progressLogs.find((p) => p.ngay === dateStr && p.user_id === currentUser.user_id);
    const minutes = log ? log.thoi_gian_hoc_phut : (i % 3 === 0 || i === 27 ? 15 + (i * 3) % 25 : 0);
    return { date: dateStr, minutes };
  });

  const startReviewSession = (mode: string = 'flashcard') => {
    setSelectedGameMode(mode);
    setActiveNav('games');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Main Showcase Box */}
      <div className="bg-[#F9F7F2] border-2 border-[#1A1A1A] editorial-shadow flex flex-col overflow-hidden">
        {/* Main Section: Word of the Day & Large Action Strip */}
        <section className="w-full border-b border-[#1A1A1A] flex flex-col justify-between bg-white">
          <div className="p-4 sm:p-8 lg:p-12 relative flex-1 flex flex-col justify-center">
            <div className="absolute top-4 left-4 sm:top-6 sm:left-8 text-[60px] sm:text-[120px] font-serif opacity-[0.04] select-none leading-none font-black pointer-events-none">
              MEMORY
            </div>

            {/* Word of the Day Tag */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6 relative z-10">
              <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] px-2.5 py-1 font-mono font-bold uppercase tracking-widest">
                Từ vựng hôm nay
              </span>
              <span className="text-xs font-sans italic text-stone-600 font-medium">
                {currentLangInfo.name} — {wordOfTheDay?.cap_do || 'Cốt lõi'}
              </span>
            </div>

            {/* Main Word Display */}
            {wordOfTheDay ? (
              <div className="relative z-10 space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  <h2 className="text-3xl sm:text-6xl lg:text-8xl font-serif font-black leading-none tracking-tighter text-[#1A1A1A] break-words max-w-full">
                    {wordOfTheDay.tu}
                  </h2>
                  <SpeakButton
                    text={wordOfTheDay.tu}
                    language={wordOfTheDay.ngon_ngu}
                    variant="card"
                    position="right"
                    buttonClassName="p-2.5 sm:p-3 shrink-0"
                    iconClassName="w-4 h-4 sm:w-5 sm:h-5"
                    title="Nhấn để phát âm 1x • Rê chuột hoặc giữ để chọn tốc độ"
                  />
                </div>

                <div className="flex flex-wrap gap-4 items-baseline text-[#1A1A1A]">
                  <span className="text-xl sm:text-2xl font-mono tracking-widest text-stone-700">
                    {wordOfTheDay.phien_am || ''}
                  </span>
                  <span className="text-lg sm:text-xl font-serif italic text-stone-500">
                    {wordOfTheDay.loai_tu || 'từ'}
                  </span>
                </div>

                <p className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] max-w-2xl leading-snug">
                  {wordOfTheDay.nghia}
                </p>

                {/* Example sentence in editorial paper box */}
                {wordOfTheDay.vi_du && (
                  <div className="mt-8 p-6 bg-[#F9F7F2] border border-[#1A1A1A] relative">
                    <div className="absolute -top-3 left-4 bg-white px-2 border border-[#1A1A1A] text-[9px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
                      Ví dụ ngữ cảnh thực tế
                    </div>
                    <p className="text-base sm:text-lg font-serif italic text-[#1A1A1A]">
                      "{wordOfTheDay.vi_du}"
                    </p>
                    {wordOfTheDay.vi_du_dich && (
                      <p className="text-xs font-mono text-stone-600 mt-2">
                        → {wordOfTheDay.vi_du_dich}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="font-serif italic text-stone-500">Chưa có từ vựng nào trong bộ thẻ này.</p>
            )}
          </div>

          {/* Bottom 4 Numbered Quick Actions Strip */}
          <div className="border-t border-[#1A1A1A] grid grid-cols-2 sm:grid-cols-4 bg-[#F9F7F2]">
            <button
              onClick={() => startReviewSession('flashcard')}
              className="flex flex-col items-center justify-center p-6 border-r border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] transition-colors group"
            >
              <span className="text-2xl sm:text-3xl mb-1 font-serif font-bold group-hover:text-amber-300">01</span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Thẻ ghi nhớ</span>
            </button>
            <button
              onClick={() => setActiveNav('mocktest')}
              className="flex flex-col items-center justify-center p-6 sm:border-r border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] transition-colors group"
            >
              <span className="text-2xl sm:text-3xl mb-1 font-serif font-bold group-hover:text-amber-300">02</span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Thi thử</span>
            </button>
            <button
              onClick={() => setActiveNav('grammar')}
              className="flex flex-col items-center justify-center p-6 border-r border-t sm:border-t-0 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] transition-colors group"
            >
              <span className="text-2xl sm:text-3xl mb-1 font-serif font-bold group-hover:text-amber-300">03</span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Ngữ pháp</span>
            </button>
            <button
              onClick={() => setActiveNav('aichat')}
              className="flex flex-col items-center justify-center p-6 border-t sm:border-t-0 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] transition-colors group"
            >
              <span className="text-2xl sm:text-3xl mb-1 font-serif font-bold group-hover:text-amber-300">04</span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Gia sư AI</span>
            </button>
          </div>
        </section>
      </div>


      {/* Target Language Switcher Cards (Tri-Lingual Matrix) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
          const info = LANGUAGES[code];
          const isSelected = code === currentLanguage;
          const langVocabCount = vocabulary.filter((w) => w.ngon_ngu === code).length;
          const langGrammarCount = grammar.filter((g) => g.ngon_ngu === code).length;

          return (
            <div
              key={code}
              onClick={() => setCurrentLanguage(code)}
              className={`p-6 border-2 border-[#1A1A1A] cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'bg-[#1A1A1A] text-[#F9F7F2] editorial-shadow'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#F3EFE6]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{info.flag}</span>
                  <div>
                    <h3 className="font-serif font-bold text-lg leading-tight">{info.name}</h3>
                    <p className={`text-xs font-mono ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                      {info.nativeName}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                  isSelected ? 'border-white text-white' : 'border-[#1A1A1A] text-[#1A1A1A]'
                }`}>
                  {code.toUpperCase()}
                </span>
              </div>

              <div className="mt-6 pt-3 border-t border-current/20 flex items-center justify-between text-xs font-mono">
                <span>{langVocabCount} Từ vựng • {langGrammarCount} Ngữ pháp</span>
                <span className="font-bold underline">{isSelected ? 'ĐANG CHỌN' : 'CHUYỂN SANG →'}</span>
              </div>
            </div>
          );
        })}
      </div>



      {/* Retention SM-2 Breakdown & Personal Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retention SM-2 Breakdown */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-4">
            <div>
              <h3 className="text-base font-serif font-black uppercase tracking-tight text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Ma trận ghi nhớ SRS (SuperMemo SM-2)</span>
              </h3>
              <p className="text-xs font-serif italic text-stone-600 mt-0.5">
                Phân bổ mức độ ghi nhớ theo thuật toán lặp lại ngắt quãng
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 bg-[#1A1A1A] text-white">
              Tổng số: {currentLangVocabulary.length} Từ
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-emerald-800 mb-1">
                <span>Đã thuộc</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#1A1A1A]">{mastered.length}</div>
              <p className="text-[10px] font-mono text-stone-500 mt-1">Hộp 4-5 • Dài hạn</p>
            </div>

            <div className="p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-indigo-800 mb-1">
                <span>Đang học</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#1A1A1A]">{learning.length}</div>
              <p className="text-[10px] font-mono text-stone-500 mt-1">Chu kỳ 1-4 ngày</p>
            </div>

            <div className="p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-rose-800 mb-1">
                <span>Cần ôn kỹ</span>
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#1A1A1A]">{difficult.length}</div>
              <p className="text-[10px] font-mono text-stone-500 mt-1">Thường sai / quên</p>
            </div>
          </div>

          {/* 8 SRS Games Launchpad */}
          <div className="pt-4 border-t border-[#1A1A1A]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
                Chế độ luyện tập SRS tương tác
              </h4>
              <button
                onClick={() => setActiveNav('games')}
                className="text-xs font-mono underline font-bold text-[#1A1A1A] hover:text-stone-600"
              >
                Tất cả 8 trò chơi →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'flashcard', name: 'Thẻ Flashcard', num: '01', icon: '🎴' },
                { id: 'multiple_choice', name: 'Trắc nghiệm 4 đáp án', num: '02', icon: '🎯' },
                { id: 'matching', name: 'Nối cặp từ', num: '03', icon: '🧩' },
                { id: 'fill_blank', name: 'Điền vào chỗ trống', num: '04', icon: '✏️' },
                { id: 'scramble', name: 'Sắp xếp chữ cái', num: '05', icon: '🧱' },
                { id: 'picture_guess', name: 'Đoán từ qua gợi ý', num: '06', icon: '🖼️' },
                { id: 'hangman', name: 'Treo cổ (Hangman)', num: '07', icon: '🎪' },
                { id: 'typing', name: 'Gõ nhanh phản xạ', num: '08', icon: '⌨️' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => startReviewSession(g.id)}
                  className="p-3 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] transition text-left group flex items-center justify-between"
                >
                  <div>
                    <span className="text-[9px] font-mono text-stone-500 group-hover:text-amber-300 block">
                      CHẾ ĐỘ {g.num}
                    </span>
                    <span className="text-xs font-serif font-bold">{g.name}</span>
                  </div>
                  <span className="text-lg">{g.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Personal Progress & AI Accelerators */}
        <div className="space-y-6">
          {/* Personal Mastery Status */}
          <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
                Mục tiêu học tập
              </h3>
              <span className="text-[9px] font-mono bg-amber-100 text-amber-900 border border-amber-800 px-2 py-0.5 font-bold">
                Chuỗi {currentUser.streak} ngày
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 border-2 border-[#1A1A1A] bg-[#F9F7F2] flex items-center justify-between">
                <div>
                  <p className="font-serif font-bold text-sm text-[#1A1A1A]">
                    Mục tiêu: {currentUser.muc_tieu[currentLanguage] || 'Thành thạo'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-600">
                    Cấp độ: {currentUser.cap_do[currentLanguage] || 'Cơ bản'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-indigo-900">
                    {currentUser.total_points || 0}
                  </span>
                  <span className="text-[9px] font-mono text-stone-500 block uppercase">ĐIỂM</span>
                </div>
              </div>

              <div className="p-3 border border-[#1A1A1A] bg-white flex items-center justify-between text-xs font-mono">
                <span className="text-stone-600">Mục tiêu hằng ngày</span>
                <span className="font-bold text-[#1A1A1A]">{currentUser.daily_target_minutes || 20} phút/ngày</span>
              </div>
            </div>
          </div>

          {/* AI Intelligence Shortcuts */}
          <div className="p-6 bg-[#F9F7F2] border-2 border-[#1A1A1A] editorial-shadow space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A] pb-2">
              Công cụ thông minh Gemini AI
            </h4>
            <button
              onClick={() => setActiveNav('aichat')}
              className="w-full flex items-center justify-between p-3 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition text-xs font-serif"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Gia sư AI giải đáp & sửa lỗi ngữ pháp</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveNav('stroke')}
              className="w-full flex items-center justify-between p-3 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition text-xs font-serif"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Hướng dẫn thứ tự nét chữ Hán tự & Hangul</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
