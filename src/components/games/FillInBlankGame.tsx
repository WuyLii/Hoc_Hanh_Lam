import React, { useState, useEffect } from 'react';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import confetti from 'canvas-confetti';
import { ChevronLeft, Volume2, Check, X, HelpCircle, ArrowRight } from 'lucide-react';

interface FillInBlankGameProps {
  words: VocabularyItem[];
  allWords: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

export const FillInBlankGame: React.FC<FillInBlankGameProps> = ({
  words,
  language,
  onFinish,
  onExit,
}) => {
  const [shuffledWords, setShuffledWords] = useState<VocabularyItem[]>(() => {
    const valid = words.filter((w) => w.vi_du && w.vi_du.toLowerCase().includes(w.tu.toLowerCase()));
    const pool = valid.length >= 3 ? valid : words;
    return [...pool].sort(() => Math.random() - 0.5);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const restartGame = () => {
    const valid = words.filter((w) => w.vi_du && w.vi_du.toLowerCase().includes(w.tu.toLowerCase()));
    const pool = valid.length >= 3 ? valid : words;
    setShuffledWords([...pool].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setShowHint(false);
    setIsCompleted(false);
  };

  useEffect(() => {
    const valid = words.filter((w) => w.vi_du && w.vi_du.toLowerCase().includes(w.tu.toLowerCase()));
    const pool = valid.length >= 3 ? valid : words;
    setShuffledWords([...pool].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [words]);

  const currentWord = shuffledWords[currentIndex];

  const maskedSentence = React.useMemo(() => {
    if (!currentWord) return '';
    if (!currentWord.vi_du) return `[ _______ ] có nghĩa là: ${currentWord.nghia}`;

    const regex = new RegExp(currentWord.tu, 'gi');
    return currentWord.vi_du.replace(regex, '________');
  }, [currentWord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAnswered || !currentWord) return;

    const cleanInput = userInput.trim().toLowerCase();
    const cleanWord = currentWord.tu.trim().toLowerCase();
    const correct = cleanInput === cleanWord;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setCorrectCount((c) => c + 1);
      ttsService.speak(currentWord.tu, language);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < shuffledWords.length) {
      setCurrentIndex((i) => i + 1);
      setUserInput('');
      setIsAnswered(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 60 });
      onFinish(correctCount, shuffledWords.length, correctCount * 25);
    }
  };

  if (!shuffledWords || shuffledWords.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <p className="text-xs font-mono text-stone-600">Không đủ dữ liệu câu ví dụ ngữ cảnh để tạo bài tập.</p>
        <button onClick={onExit} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
          THOÁT RA
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">TỔNG KẾT BÀI TẬP ĐIỀN TỪ</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Hoàn thành bài tập điền từ!</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
              {correctCount} / {shuffledWords.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Số từ điền chính xác</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-800 font-mono">
              +{correctCount * 25} ĐIỂM
            </div>
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
          CÂU HỎI {currentIndex + 1} / {shuffledWords.length}
        </div>
      </div>

      {/* Main Cloze Card */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 uppercase">
            <span>Điền từ vựng đúng vào chỗ trống</span>
            <span>{currentWord.loai_tu}</span>
          </div>

          <p className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A] leading-relaxed">
            "{maskedSentence}"
          </p>

          {currentWord.vi_du_dich && (
            <p className="text-xs font-mono text-stone-600 italic">
              → {currentWord.vi_du_dich}
            </p>
          )}
        </div>

        {/* Clue Hint */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]/15">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-xs font-mono uppercase text-stone-600 hover:text-[#1A1A1A]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? 'ẨN GỢI Ý' : 'HIỆN GỢI Ý'}</span>
          </button>
          {showHint && (
            <span className="text-xs font-serif font-bold text-amber-800">
              Nghĩa: {currentWord.nghia} ({currentWord.tu.length} ký tự)
            </span>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <input
            type="text"
            disabled={isAnswered}
            placeholder="Nhập từ vựng còn thiếu tại đây..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] font-serif text-lg text-center text-[#1A1A1A] focus:bg-white focus:outline-none"
          />

          {!isAnswered ? (
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
            >
              KIỂM TRA ĐÁP ÁN
            </button>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 border-2 flex items-center justify-between ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-800 text-emerald-950'
                    : 'bg-rose-50 border-rose-800 text-rose-950'
                }`}
              >
                <div>
                  <div className="font-mono text-xs font-bold uppercase">
                    {isCorrect ? 'CHÍNH XÁC!' : 'CHƯA CHÍNH XÁC'}
                  </div>
                  <div className="font-serif text-sm mt-0.5">
                    Đáp án đúng: <strong>{currentWord.tu}</strong> ({currentWord.nghia})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => ttsService.speak(currentWord.tu, language)}
                  className="p-1 border border-current hover:bg-black hover:text-white"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>CÂU TIẾP THEO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
