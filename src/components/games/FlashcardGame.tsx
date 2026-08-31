import React, { useState, useEffect, useRef } from 'react';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import { RecallQuality } from '../../services/srsEngine';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  ChevronLeft,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

interface FlashcardGameProps {
  words: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onRecordSRS: (wordId: string, rating: RecallQuality) => void;
  onExit: () => void;
}

export const FlashcardGame: React.FC<FlashcardGameProps> = ({
  words,
  language,
  onFinish,
  onRecordSRS,
  onExit,
}) => {
  const [selectedLimit, setSelectedLimit] = useState<string>('ALL');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [selectedContext, setSelectedContext] = useState<string>('ALL');
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);

  const availablePos = Array.from(new Set(words.map((w) => w.loai_tu || 'Khác'))).filter(Boolean);
  const availableContexts = Array.from(new Set(words.map((w) => w.chu_de || 'Tổng hợp'))).filter(Boolean);

  const activeWords = React.useMemo(() => {
    let list = words.filter((w) => {
      if (selectedPos !== 'ALL' && w.loai_tu !== selectedPos) return false;
      if (selectedContext !== 'ALL' && w.chu_de !== selectedContext) return false;
      return true;
    });
    if (selectedLimit !== 'ALL') {
      const lim = parseInt(selectedLimit, 10);
      list = list.slice(0, lim);
    }
    return list;
  }, [words, selectedPos, selectedContext, selectedLimit]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ wordId: string; rating: RecallQuality }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset index if filtered words change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedLimit, selectedPos, selectedContext]);

  const currentWord = activeWords[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const isAdvancingRef = useRef(false);

  const handleRate = (rating: RecallQuality) => {
    if (!currentWord || isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    onRecordSRS(currentWord.word_id, rating);
    const newResults = [...sessionResults, { wordId: currentWord.word_id, rating }];
    setSessionResults(newResults);

    if (currentIndex + 1 < activeWords.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const correctCount = newResults.filter((r) => r.rating === 'good' || r.rating === 'easy').length;
      const score = correctCount * 20;
      onFinish(correctCount, activeWords.length, score);
    }

    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 350);
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentWord) {
      ttsService.speak(currentWord.tu, language);
    }
  };

  if (!activeWords || activeWords.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Không tìm thấy từ theo bộ lọc này</h3>
        <p className="text-xs font-mono text-stone-500">Vui lòng điều chỉnh lại số từ, từ loại hoặc ngữ cảnh để ôn tập.</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              setSelectedLimit('ALL');
              setSelectedPos('ALL');
              setSelectedContext('ALL');
            }}
            className="px-3 py-1.5 border border-[#1A1A1A] bg-stone-100 text-[#1A1A1A] text-xs font-mono uppercase font-bold"
          >
            ĐẶT LẠI BỘ LỌC
          </button>
          <button
            onClick={onExit}
            className="px-3 py-1.5 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-mono uppercase font-bold"
          >
            QUAY LẠI
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const correctCount = sessionResults.filter((r) => r.rating === 'good' || r.rating === 'easy').length;
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="w-16 h-16 border-2 border-[#1A1A1A] bg-[#F9F7F2] text-[#1A1A1A] flex items-center justify-center mx-auto text-2xl font-bold font-mono">
          ✓
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Hoàn thành phiên học!
          </h2>
          <p className="text-xs font-mono text-stone-600 uppercase tracking-wider">
            Thuật toán SuperMemo SM-2 đã cập nhật chu kỳ ôn tập
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
              {correctCount} / {activeWords.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Đã nhớ tốt (Tốt / Dễ)</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-800 font-mono">+{correctCount * 20} ĐIỂM</div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Điểm kinh nghiệm tích lũy</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsCompleted(false);
              setSessionResults([]);
            }}
            className="flex-1 py-3 border border-[#1A1A1A] bg-white hover:bg-stone-200 text-xs font-mono font-bold uppercase text-[#1A1A1A]"
          >
            HỌC LẠI PHIÊN NÀY
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm"
          >
            KẾT THÚC ÔN TẬP →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Controls & Progress */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-xs font-mono uppercase font-bold text-stone-600 hover:text-[#1A1A1A] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>THOÁT RA</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className="flex items-center gap-1 px-2.5 py-1 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono uppercase font-bold transition"
            title="Tùy chỉnh số từ, từ loại, ngữ cảnh"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>BỘ LỌC SRS ({activeWords.length})</span>
          </button>

          <span className="text-xs font-mono font-bold text-[#1A1A1A]">
            THẺ {currentIndex + 1} / {activeWords.length}
          </span>
          <div className="w-24 h-2 border border-[#1A1A1A] bg-[#F9F7F2] overflow-hidden">
            <div
              className="h-full bg-[#1A1A1A] transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / activeWords.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Inline SRS Customization Filter Bar */}
      {showFilterBar && (
        <div className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-3 animate-in fade-in duration-150">
          <div className="text-[11px] font-mono font-bold uppercase text-[#1A1A1A] flex items-center justify-between">
            <span>TÙY CHỈNH THẺ THỜI GIAN THỰC (SRS SM-2)</span>
            <span className="text-stone-500 font-normal">{activeWords.length} từ phù hợp</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Số từ ôn tập:
              </label>
              <select
                value={selectedLimit}
                onChange={(e) => setSelectedLimit(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
              >
                <option value="ALL">Tất cả từ</option>
                <option value="5">5 từ</option>
                <option value="10">10 từ</option>
                <option value="15">15 từ</option>
                <option value="20">20 từ</option>
                <option value="30">30 từ</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Chọn Từ Loại:
              </label>
              <select
                value={selectedPos}
                onChange={(e) => setSelectedPos(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
              >
                <option value="ALL">Tất cả từ loại</option>
                {availablePos.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Ngữ Cảnh / Chủ Đề:
              </label>
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
              >
                <option value="ALL">Tất cả ngữ cảnh</option>
                {availableContexts.map((ctx) => (
                  <option key={ctx} value={ctx}>
                    {ctx}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Flip Flashcard (Editorial Paper Style) */}
      <div
        onClick={handleFlip}
        className="relative h-80 sm:h-96 w-full cursor-pointer select-none"
      >
        <div
          className={`w-full h-full p-8 transition-all duration-200 border-2 border-[#1A1A1A] editorial-shadow flex flex-col justify-between ${
            isFlipped ? 'bg-[#F9F7F2]' : 'bg-white hover:editorial-shadow-lg'
          }`}
        >
          {/* Top metadata */}
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-3">
            <span className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-[9px] font-mono font-bold uppercase text-[#1A1A1A]">
              {currentWord.loai_tu} • {currentWord.cap_do}
            </span>
            <button
              onClick={handlePlayAudio}
              className="p-2 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Card Body */}
          {!isFlipped ? (
            // Front Face (Target Term)
            <div className="text-center space-y-4 my-auto">
              <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-[#1A1A1A]">
                {currentWord.tu}
              </h2>
              {currentWord.phien_am && (
                <p className="text-lg font-mono text-stone-600 tracking-widest">{currentWord.phien_am}</p>
              )}
              <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mt-6 flex items-center justify-center gap-1.5">
                <span>NHẤN ĐỂ LẬT XEM NGHĨA</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </p>
            </div>
          ) : (
            // Back Face (Meaning & Example)
            <div className="space-y-4 my-auto animate-in fade-in duration-150">
              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A]">
                  {currentWord.nghia}
                </h3>
              </div>

              {currentWord.vi_du && (
                <div className="p-4 bg-white border border-[#1A1A1A] text-left space-y-1">
                  <p className="text-sm font-serif italic text-[#1A1A1A]">
                    "{currentWord.vi_du}"
                  </p>
                  {currentWord.vi_du_dich && (
                    <p className="text-xs font-mono text-stone-600">→ {currentWord.vi_du_dich}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Card Footer */}
          <div className="text-center text-[10px] font-mono uppercase tracking-wider text-stone-500 border-t border-[#1A1A1A]/15 pt-2">
            {isFlipped ? 'ĐÁNH GIÁ MỨC ĐỘ GHI NHỚ BÊN DƯỚI' : `MÃ TỪ #${currentWord.word_id.slice(-4)}`}
          </div>
        </div>
      </div>

      {/* SRS SM-2 Rating Buttons (Shown when flipped) */}
      {isFlipped ? (
        <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={() => handleRate('again')}
            className="p-3 border-2 border-rose-800 bg-rose-50 hover:bg-rose-900 hover:text-white text-rose-900 transition text-center flex flex-col items-center justify-between"
          >
            <span className="text-xs font-mono font-bold uppercase">QUÊN</span>
            <span className="text-[9px] font-mono mt-1 opacity-70">1 NGÀY</span>
          </button>

          <button
            onClick={() => handleRate('hard')}
            className="p-3 border-2 border-amber-800 bg-amber-50 hover:bg-amber-900 hover:text-white text-amber-900 transition text-center flex flex-col items-center justify-between"
          >
            <span className="text-xs font-mono font-bold uppercase">KHÓ</span>
            <span className="text-[9px] font-mono mt-1 opacity-70">2 NGÀY</span>
          </button>

          <button
            onClick={() => handleRate('good')}
            className="p-3 border-2 border-indigo-800 bg-indigo-50 hover:bg-indigo-900 hover:text-white text-indigo-900 transition text-center flex flex-col items-center justify-between"
          >
            <span className="text-xs font-mono font-bold uppercase">NHỚ TỐT</span>
            <span className="text-[9px] font-mono mt-1 opacity-70">4 NGÀY</span>
          </button>

          <button
            onClick={() => handleRate('easy')}
            className="p-3 border-2 border-emerald-800 bg-emerald-50 hover:bg-emerald-900 hover:text-white text-emerald-900 transition text-center flex flex-col items-center justify-between"
          >
            <span className="text-xs font-mono font-bold uppercase">RẤT DỄ</span>
            <span className="text-[9px] font-mono mt-1 opacity-70">7+ NGÀY</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleFlip}
          className="w-full py-3.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] hover:bg-stone-800 text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>LẬT THẺ (SPACEBAR / CHẠM)</span>
        </button>
      )}
    </div>
  );
};
