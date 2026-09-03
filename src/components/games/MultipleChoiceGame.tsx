import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import { SpeakButton } from '../SpeakButton';
import confetti from 'canvas-confetti';
import { Volume2, ChevronLeft, Check, X, Clock } from 'lucide-react';

interface MultipleChoiceGameProps {
  words: VocabularyItem[];
  allWords: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

export const MultipleChoiceGame: React.FC<MultipleChoiceGameProps> = ({
  words,
  allWords,
  language,
  onFinish,
  onExit,
}) => {
  const [gameWords, setGameWords] = useState<VocabularyItem[]>(() =>
    [...words].sort(() => Math.random() - 0.5)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);

  const restartGame = () => {
    setGameWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCombo(0);
    setCorrectCount(0);
    setTimeLeft(10);
    setIsCompleted(false);
  };

  useEffect(() => {
    setGameWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [words]);

  const currentWord = gameWords[currentIndex];

  // Generate 4 randomized options (1 correct + 3 distractor meanings)
  const options = useMemo(() => {
    if (!currentWord) return [];
    const correct = currentWord.nghia;
    const pool = allWords
      .filter((w) => w.word_id !== currentWord.word_id && w.nghia !== correct)
      .map((w) => w.nghia);

    const shuffledPool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [correct, ...shuffledPool];
    return combined.sort(() => 0.5 - Math.random());
  }, [currentWord, allWords]);

  const { activeNav } = useApp();
  const isPaused = activeNav !== 'games';

  // Timer per question (paused when user is browsing other sections)
  useEffect(() => {
    if (isAnswered || isCompleted || isPaused) return;

    if (timeLeft <= 0) {
      handleChoose(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isCompleted, isPaused]);

  const isChoosingRef = React.useRef(false);

  const handleChoose = (opt: string | null) => {
    if (isAnswered || isChoosingRef.current || !currentWord) return;
    isChoosingRef.current = true;

    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt === currentWord.nghia;
    if (isCorrect) {
      const addedScore = 100 + combo * 25 + timeLeft * 10;
      setScore((s) => s + addedScore);
      setCombo((c) => c + 1);
      setCorrectCount((c) => c + 1);
      ttsService.speak(currentWord.tu, language);
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      isChoosingRef.current = false;
      if (currentIndex + 1 < gameWords.length) {
        setCurrentIndex((i) => i + 1);
        setIsAnswered(false);
        setSelectedOption(null);
        setTimeLeft(10);
      } else {
        setIsCompleted(true);
        confetti({ particleCount: 80, spread: 60 });
        onFinish(isCorrect ? correctCount + 1 : correctCount, gameWords.length, score);
      }
    }, 1400);
  };

  if (!gameWords || gameWords.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <p className="text-xs font-mono text-stone-600">Không đủ dữ liệu từ vựng để tạo bài trắc nghiệm.</p>
        <button onClick={onExit} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
          THOÁT RA
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">TỔNG KẾT BÀI THI PHẢN XẠ</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Hoàn thành thử thách!</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
              {correctCount} / {gameWords.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Số câu trả lời đúng</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-800 font-mono">+{score} ĐIỂM</div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Điểm số đạt được</div>
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
            QUAY LẠI TRUNG TÂM GAME →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-xs font-mono uppercase font-bold text-stone-600 hover:text-[#1A1A1A]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>THOÁT</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-stone-600">
            <Clock className="w-3.5 h-3.5" />
            <span className={`font-bold ${timeLeft <= 3 ? 'text-rose-600 animate-pulse' : 'text-[#1A1A1A]'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="font-bold text-[#1A1A1A]">
            {currentIndex + 1}/{words.length}
          </div>

          <div className="px-2 py-0.5 bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-bold">
            {score} ĐIỂM
          </div>
        </div>
      </div>

      {/* Target Word Card */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow text-center space-y-3">
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A]">
            {currentWord.loai_tu}
          </span>
          <SpeakButton
            text={currentWord.tu}
            language={language}
            variant="ghost"
            position="left"
            buttonClassName="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
            title="Nhấn để phát âm 1x • Rê chuột hoặc giữ để chọn tốc độ"
          />
        </div>

        <h2 className="text-4xl font-serif font-black text-[#1A1A1A]">{currentWord.tu}</h2>
        {currentWord.phien_am && (
          <p className="text-sm font-mono text-stone-600">{currentWord.phien_am}</p>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          const isCorrectAnswer = isAnswered && opt === currentWord.nghia;
          const isWrongSelection = isAnswered && isSelected && opt !== currentWord.nghia;

          let btnClass = 'bg-[#F9F7F2] border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-white hover:editorial-shadow-sm';

          if (isAnswered) {
            if (isCorrectAnswer) {
              btnClass = 'bg-emerald-800 text-white border-emerald-950 font-bold';
            } else if (isWrongSelection) {
              btnClass = 'bg-rose-800 text-white border-rose-950 font-bold';
            } else {
              btnClass = 'bg-stone-100 border-stone-300 text-stone-400';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleChoose(opt)}
              className={`p-4 text-left transition flex items-center justify-between ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 border border-current flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-serif text-sm sm:text-base font-medium">{opt}</span>
              </div>

              {isAnswered && isCorrectAnswer && <Check className="w-5 h-5 text-white shrink-0" />}
              {isAnswered && isWrongSelection && <X className="w-5 h-5 text-white shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
