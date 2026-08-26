import React, { useState, useEffect, useRef } from 'react';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import confetti from 'canvas-confetti';
import { ChevronLeft, Volume2, Keyboard } from 'lucide-react';

interface TypingPracticeGameProps {
  words: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

export const TypingPracticeGame: React.FC<TypingPracticeGameProps> = ({
  words,
  language,
  onFinish,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    setTypedText('');
    if (!startTime) setStartTime(Date.now());
    inputRef.current?.focus();
  }, [currentIndex, words]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedText(val);

    if (val.trim() === currentWord.tu.trim()) {
      ttsService.speak(currentWord.tu, language);
      setCorrectCount((c) => c + 1);

      if (currentIndex + 1 < words.length) {
        setCurrentIndex((i) => i + 1);
        setTypedText('');
      } else {
        setIsCompleted(true);
        confetti({ particleCount: 90, spread: 60 });
        const timeTakenSec = startTime ? (Date.now() - startTime) / 1000 : 30;
        const speedBonus = Math.max(50, Math.round(500 - timeTakenSec * 5));
        onFinish(words.length, words.length, words.length * 20 + speedBonus);
      }
    }
  };

  if (!words || words.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <p className="text-xs font-mono text-stone-600">Cần có từ vựng để luyện gõ phím phản xạ.</p>
        <button onClick={onExit} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
          THOÁT
        </button>
      </div>
    );
  }

  if (isCompleted) {
    const timeTakenSec = startTime ? Math.round((Date.now() - startTime) / 1000) : 30;
    const wpm = Math.round((words.length / (timeTakenSec || 1)) * 60);

    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">HOÀN THÀNH LUYỆN GÕ PHẢN XẠ</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Kết quả luyện gõ</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">{wpm} WPM</div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Tốc độ gõ</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">{timeTakenSec}s</div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Thời gian hoàn thành</div>
          </div>
        </div>
        <button
          onClick={onExit}
          className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm"
        >
          QUAY LẠI TRUNG TÂM TRÒ CHƠI →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-xs font-mono uppercase font-bold text-stone-600 hover:text-[#1A1A1A]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>THOÁT</span>
        </button>

        <div className="text-xs font-mono font-bold text-[#1A1A1A]">
          TỪ {currentIndex + 1} / {words.length}
        </div>
      </div>

      {/* Target Word Display Card */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A]">
              {currentWord.loai_tu}
            </span>
            <button
              onClick={() => ttsService.speak(currentWord.tu, language)}
              className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-4xl sm:text-5xl font-serif font-black text-[#1A1A1A] tracking-tight">
            {currentWord.tu}
          </h2>

          {currentWord.phien_am && (
            <p className="text-base font-mono text-stone-600">{currentWord.phien_am}</p>
          )}

          <p className="text-sm font-serif italic text-stone-700">"{currentWord.nghia}"</p>
        </div>

        {/* Typing Input */}
        <div className="space-y-2 pt-4 border-t border-[#1A1A1A]/15">
          <input
            ref={inputRef}
            type="text"
            placeholder="Gõ chính xác các ký tự..."
            value={typedText}
            onChange={handleChange}
            className="w-full p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] font-mono text-xl text-center text-[#1A1A1A] focus:bg-white focus:outline-none"
            autoFocus
          />
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            Gõ nhanh và chính xác; hệ thống tự động chuyển từ khi nhập đúng hoàn toàn
          </p>
        </div>
      </div>
    </div>
  );
};
