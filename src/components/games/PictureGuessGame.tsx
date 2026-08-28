import React, { useState, useEffect } from 'react';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import confetti from 'canvas-confetti';
import { ChevronLeft, Volume2, ArrowRight, Eye } from 'lucide-react';

interface PictureGuessGameProps {
  words: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

export const PictureGuessGame: React.FC<PictureGuessGameProps> = ({
  words,
  language,
  onFinish,
  onExit,
}) => {
  const [shuffledWords, setShuffledWords] = useState<VocabularyItem[]>(() =>
    [...words].sort(() => Math.random() - 0.5)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState<number>(1);
  const [userGuess, setUserGuess] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const restartGame = () => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setRevealedClues(1);
    setUserGuess('');
    setIsAnswered(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [words]);

  const currentWord = shuffledWords[currentIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGuess.trim() || isAnswered || !currentWord) return;

    const matched = userGuess.trim().toLowerCase() === currentWord.tu.trim().toLowerCase();
    setIsCorrect(matched);
    setIsAnswered(true);

    if (matched) {
      setCorrectCount((c) => c + 1);
      ttsService.speak(currentWord.tu, language);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < shuffledWords.length) {
      setCurrentIndex((i) => i + 1);
      setUserGuess('');
      setIsAnswered(false);
      setIsCorrect(false);
      setRevealedClues(1);
    } else {
      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 60 });
      onFinish(correctCount, shuffledWords.length, correctCount * 25);
    }
  };

  if (!shuffledWords || shuffledWords.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <p className="text-xs font-mono text-stone-600">Cần có từ vựng để chơi trò đoán từ qua gợi ý.</p>
        <button onClick={onExit} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
          THOÁT
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">HOÀN THÀNH THỬ THÁCH ĐOÁN TỪ</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Kết quả đoán từ</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
              {correctCount} / {shuffledWords.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Từ đoán đúng</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-800 font-mono">
              +{correctCount * 25} ĐIỂM
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Điểm nhận được</div>
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

  const clues = [
    { label: 'Định nghĩa / Nghĩa tiếng Việt', val: currentWord.nghia },
    { label: 'Loại từ & Cấp độ', val: `${currentWord.loai_tu} • ${currentWord.cap_do}` },
    { label: 'Ký tự đầu & Độ dài từ', val: `Bắt đầu bằng "${currentWord.tu.charAt(0)}...", gồm ${currentWord.tu.length} ký tự` },
    { label: 'Phiên âm hướng dẫn', val: currentWord.phien_am || 'Không có' },
  ];

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
          THẺ {currentIndex + 1} / {shuffledWords.length}
        </div>
      </div>

      {/* Main Deduction Clue Box */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
            Từ bí ẩn #{currentWord.word_id.slice(-4)}
          </span>
          {revealedClues < clues.length && !isAnswered && (
            <button
              onClick={() => setRevealedClues((c) => Math.min(clues.length, c + 1))}
              className="flex items-center gap-1.5 px-3 py-1 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white text-xs font-mono uppercase font-bold transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>MỞ GỢI Ý TIẾP</span>
            </button>
          )}
        </div>

        {/* Revealed Clues List */}
        <div className="space-y-3">
          {clues.slice(0, revealedClues).map((clue, idx) => (
            <div key={idx} className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-stone-500">
                Gợi ý #{idx + 1}: {clue.label}
              </span>
              <p className="font-serif font-bold text-base text-[#1A1A1A]">{clue.val}</p>
            </div>
          ))}
        </div>

        {/* Guess Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <input
            type="text"
            disabled={isAnswered}
            placeholder="Nhập từ chính xác tại đây..."
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            className="w-full p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] font-serif text-lg text-center text-[#1A1A1A] focus:bg-white focus:outline-none"
          />

          {!isAnswered ? (
            <button
              type="submit"
              disabled={!userGuess.trim()}
              className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
            >
              GIẢI MÃ TỪ NÀY
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
                    {isCorrect ? 'GIẢI MÃ CHÍNH XÁC!' : 'CHƯA CHÍNH XÁC'}
                  </div>
                  <div className="font-serif text-base font-bold mt-0.5">
                    Từ đúng: {currentWord.tu} {currentWord.phien_am ? `(${currentWord.phien_am})` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => ttsService.speak(currentWord.tu, language)}
                  className="p-1 border border-current hover:bg-black hover:text-white"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>TỪ TIẾP THEO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
