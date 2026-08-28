import React, { useState, useEffect, useRef } from 'react';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import confetti from 'canvas-confetti';
import { ChevronLeft, Volume2, Timer, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TypingPracticeGameProps {
  words: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

const DEFAULT_TIME_PER_WORD = 10; // 10s per word

export const TypingPracticeGame: React.FC<TypingPracticeGameProps> = ({
  words,
  language,
  onFinish,
  onExit,
}) => {
  const [shuffledWords, setShuffledWords] = useState<VocabularyItem[]>(() =>
    [...words].sort(() => Math.random() - 0.5)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_PER_WORD);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSubmittedWithError, setIsSubmittedWithError] = useState(false);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentWord = shuffledWords[currentIndex];

  const restartGame = () => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setTypedText('');
    setTimeLeft(DEFAULT_TIME_PER_WORD);
    setIsTimerRunning(true);
    setIsSubmittedWithError(false);
    setIsTimeOut(false);
    setStartTime(Date.now());
    setCorrectCount(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [words]);

  // Countdown timer effect per word
  useEffect(() => {
    if (!isTimerRunning || isCompleted || !currentWord) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTimerRunning, isCompleted, currentWord]);

  // Reset round state when index changes
  useEffect(() => {
    setTypedText('');
    setTimeLeft(DEFAULT_TIME_PER_WORD);
    setIsTimerRunning(true);
    setIsSubmittedWithError(false);
    setIsTimeOut(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentIndex, shuffledWords]);

  const handleTimeout = () => {
    setIsTimerRunning(false);
    setIsTimeOut(true);
    setIsSubmittedWithError(true);
    if (currentWord) {
      ttsService.speak(currentWord.tu, language);
    }
  };

  const handleNextWord = () => {
    if (currentIndex + 1 < shuffledWords.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsCompleted(true);
      confetti({ particleCount: 90, spread: 60 });
      const timeTakenSec = Math.round((Date.now() - startTime) / 1000);
      const speedBonus = Math.max(50, Math.round(500 - timeTakenSec * 5));
      onFinish(correctCount, shuffledWords.length, correctCount * 30 + speedBonus);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTimerRunning && isSubmittedWithError) return;
    const val = e.target.value;
    setTypedText(val);

    // If perfectly typed
    if (val.trim() === currentWord.tu.trim()) {
      setIsTimerRunning(false);
      ttsService.speak(currentWord.tu, language);
      setCorrectCount((c) => c + 1);

      setTimeout(() => {
        handleNextWord();
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isSubmittedWithError) {
        handleNextWord();
      } else {
        // Manual submit check
        if (typedText.trim() !== currentWord.tu.trim()) {
          setIsTimerRunning(false);
          setIsSubmittedWithError(true);
          ttsService.speak(currentWord.tu, language);
        }
      }
    }
  };

  // Diff analysis helper
  const renderDiffAnalysis = () => {
    if (!currentWord) return null;
    const targetStr = currentWord.tu.trim();
    const typedStr = typedText.trim();

    const maxLen = Math.max(targetStr.length, typedStr.length);
    const charDiffs: { char: string; userChar?: string; type: 'correct' | 'wrong' | 'missing' | 'extra' }[] = [];

    let missingCount = 0;
    let wrongCount = 0;

    for (let i = 0; i < maxLen; i++) {
      const targetChar = targetStr[i];
      const userChar = typedStr[i];

      if (i < targetStr.length && i < typedStr.length) {
        if (targetChar === userChar) {
          charDiffs.push({ char: targetChar, userChar, type: 'correct' });
        } else {
          wrongCount++;
          charDiffs.push({ char: targetChar, userChar, type: 'wrong' });
        }
      } else if (i < targetStr.length) {
        missingCount++;
        charDiffs.push({ char: targetChar, type: 'missing' });
      } else {
        charDiffs.push({ char: userChar, userChar, type: 'extra' });
      }
    }

    return (
      <div className="p-4 bg-rose-50 border-2 border-rose-800 text-rose-950 text-left space-y-3 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-rose-300 pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-800" />
            <span className="font-mono text-xs font-bold uppercase">
              {isTimeOut ? '⏱️ HẾT GIỜ KHI ĐANG GÕ!' : '❌ CHƯA KHỚP CHÍNH XÁC!'}
            </span>
          </div>
          <span className="text-[10px] font-mono bg-rose-200 px-2 py-0.5 border border-rose-400 font-bold">
            Thiếu {missingCount} • Sai {wrongCount}
          </span>
        </div>

        {/* Character Diff Visualizer */}
        <div>
          <span className="text-[10px] font-mono uppercase text-rose-700 block mb-1">
            Phân tích vị trí gõ lỗi (Xanh: Đúng | Đỏ: Sai | Vàng: Thiếu):
          </span>
          <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-rose-300 font-mono text-lg font-bold">
            {charDiffs.map((item, idx) => {
              if (item.type === 'correct') {
                return (
                  <span key={idx} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded-sm">
                    {item.char}
                  </span>
                );
              }
              if (item.type === 'wrong') {
                return (
                  <span key={idx} className="px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-400 line-through rounded-sm" title={`Gõ '${item.userChar}' thay vì '${item.char}'`}>
                    {item.userChar || item.char}
                  </span>
                );
              }
              if (item.type === 'missing') {
                return (
                  <span key={idx} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 rounded-sm" title="Thiếu ký tự này">
                    {item.char}
                  </span>
                );
              }
              return (
                <span key={idx} className="px-1.5 py-0.5 bg-stone-200 text-stone-700 line-through rounded-sm">
                  {item.userChar}
                </span>
              );
            })}
          </div>
        </div>

        {/* Expected Answer */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div>
            <span className="font-mono text-[10px] text-stone-500 uppercase">Đáp án đúng chuẩn: </span>
            <span className="font-serif font-bold text-base text-[#1A1A1A] ml-1">{currentWord.tu}</span>
            {currentWord.phien_am && <span className="font-mono text-stone-600 ml-2">({currentWord.phien_am})</span>}
          </div>
          <button
            type="button"
            onClick={() => ttsService.speak(currentWord.tu, language)}
            className="p-1 border border-stone-800 bg-white hover:bg-stone-100"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Next Question Button */}
        <button
          onClick={handleNextWord}
          className="w-full py-2.5 bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider hover:bg-stone-800 flex items-center justify-center gap-2 mt-2"
        >
          <span>NHẢY QUA CÂU KHÁC (NHẤN ENTER)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (!shuffledWords || shuffledWords.length === 0) {
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
    const timeTakenSec = Math.round((Date.now() - startTime) / 1000);
    const wpm = Math.round((shuffledWords.length / (timeTakenSec || 1)) * 60);

    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">HOÀN THÀNH LUYỆN GÕ PHẢN XẠ</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Kết quả luyện gõ tốc độ cao</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
              {correctCount} / {shuffledWords.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Từ gõ đúng hoàn hảo</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-800 font-mono">{wpm} WPM</div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Tốc độ WPM tổng quát</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={restartGame}
            className="flex-1 py-3 border-2 border-[#1A1A1A] bg-stone-100 text-[#1A1A1A] hover:bg-stone-200 text-xs font-mono font-bold uppercase tracking-wider"
          >
            🔄 CHƠI LẠI (XÁO TRỘN ĐỀ MỚI)
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider"
          >
            QUAY LẠI TRUNG TÂM TRÒ CHƠI →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header with Timer */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-xs font-mono uppercase font-bold text-stone-600 hover:text-[#1A1A1A]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>THOÁT</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Countdown timer badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 border border-[#1A1A1A] font-bold ${
              timeLeft <= 3 ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#F9F7F2] text-[#1A1A1A]'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}S</span>
          </div>

          <span className="font-bold text-[#1A1A1A]">
            TỪ {currentIndex + 1} / {words.length}
          </span>
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
        {!isSubmittedWithError ? (
          <div className="space-y-2 pt-4 border-t border-[#1A1A1A]/15">
            <input
              ref={inputRef}
              type="text"
              placeholder="Gõ chính xác các ký tự..."
              value={typedText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={!isTimerRunning}
              className="w-full p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] font-mono text-xl text-center text-[#1A1A1A] focus:bg-white focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500 pt-1">
              <span>Hệ thống tự động chuyển từ khi nhập đúng</span>
              <span>Nhấn Enter nếu muốn kiểm tra</span>
            </div>
          </div>
        ) : (
          renderDiffAnalysis()
        )}
      </div>
    </div>
  );
};
