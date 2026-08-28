import React, { useState, useEffect } from 'react';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import confetti from 'canvas-confetti';
import { ChevronLeft, Volume2, ArrowRight } from 'lucide-react';

interface HangmanGameProps {
  words: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const HangmanGame: React.FC<HangmanGameProps> = ({
  words,
  language,
  onFinish,
  onExit,
}) => {
  const [shuffledWords, setShuffledWords] = useState<VocabularyItem[]>(() =>
    [...words].sort(() => Math.random() - 0.5)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [livesLeft, setLivesLeft] = useState(6);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const restartGame = () => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setGuessedLetters(new Set());
    setLivesLeft(6);
    setIsAnswered(false);
    setIsWon(false);
    setCorrectCount(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [words]);

  const currentWord = shuffledWords[currentIndex];

  const targetChars = React.useMemo(() => {
    if (!currentWord) return [];
    return currentWord.tu.trim().split('');
  }, [currentWord]);

  const isLatinScript = React.useMemo(() => {
    if (!currentWord) return true;
    return /^[A-Za-z0-9\s\-'`]+$/.test(currentWord.tu.trim());
  }, [currentWord]);

  const availableKeyboardButtons = React.useMemo(() => {
    if (!currentWord) return [];
    if (isLatinScript) {
      return ALPHABET;
    }
    const targetSet = new Set(targetChars.filter((c) => c.trim().length > 0));
    const distractorPool: string[] = [];
    words.forEach((w) => {
      w.tu.split('').forEach((c) => {
        if (c.trim() && !targetSet.has(c)) {
          distractorPool.push(c);
        }
      });
    });
    const uniqueDistractors = Array.from(new Set(distractorPool)).slice(0, 8);
    const combined = Array.from(targetSet).concat(uniqueDistractors);
    return combined.sort(() => 0.5 - Math.random());
  }, [currentWord, isLatinScript, targetChars, words]);

  const initRound = () => {
    setGuessedLetters(new Set());
    setLivesLeft(6);
    setIsAnswered(false);
    setIsWon(false);
  };

  useEffect(() => {
    initRound();
  }, [currentIndex, words]);

  const handleGuessLetter = (letter: string) => {
    if (isAnswered || guessedLetters.has(letter.toUpperCase()) || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    newGuessed.add(letter.toUpperCase());
    setGuessedLetters(newGuessed);

    const isMatch = targetChars.some((char) => {
      if (!char.trim()) return false;
      return char === letter || char.toUpperCase() === letter.toUpperCase();
    });

    if (!isMatch) {
      const newLives = livesLeft - 1;
      setLivesLeft(newLives);
      if (newLives <= 0) {
        setIsAnswered(true);
        setIsWon(false);
      }
    } else {
      const allGuessed = targetChars.every((char) => {
        if (!char.trim() || /[^A-Za-z0-9\u4e00-\u9fa5\uac00-\ud7a3]/i.test(char)) return true;
        return newGuessed.has(char) || newGuessed.has(char.toUpperCase());
      });
      if (allGuessed) {
        setIsAnswered(true);
        setIsWon(true);
        setCorrectCount((c) => c + 1);
        ttsService.speak(currentWord.tu, language);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < shuffledWords.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 60 });
      onFinish(correctCount, shuffledWords.length, correctCount * 30);
    }
  };

  if (!shuffledWords || shuffledWords.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <p className="text-xs font-mono text-stone-600">Cần có từ vựng để chơi trò đoán chữ (Hangman).</p>
        <button onClick={onExit} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
          THOÁT
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">HOÀN THÀNH THỬ THÁCH ĐOÁN CHỮ</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Kết quả đoán chữ cái</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
              {correctCount} / {shuffledWords.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Từ đoán đúng</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-800 font-mono">
              +{correctCount * 30} ĐIỂM
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

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="font-bold text-[#1A1A1A]">
            LƯỢT THỬ CÒN: {livesLeft} / 6
          </span>
          <span className="font-bold text-[#1A1A1A]">
            TỪ {currentIndex + 1} / {words.length}
          </span>
        </div>
      </div>

      {/* Hangman Card */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6 text-center">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">Định nghĩa nghĩa</span>
          <h3 className="text-2xl font-serif font-bold text-[#1A1A1A]">{currentWord.nghia}</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] inline-block mt-1">
            {currentWord.loai_tu}
          </span>
        </div>

        {/* Dashed Word Slots */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-4">
          {targetChars.map((char, idx) => {
            const isBlank = !char.trim();
            const isRevealed = isBlank || guessedLetters.has(char) || guessedLetters.has(char.toUpperCase()) || isAnswered;
            return (
              <div
                key={idx}
                className={`w-10 h-12 ${
                  isBlank ? 'border-b-0' : 'border-b-4 border-[#1A1A1A]'
                } flex items-center justify-center font-serif text-2xl font-black text-[#1A1A1A]`}
              >
                {isRevealed ? char : ''}
              </div>
            );
          })}
        </div>

        {/* Result Banner */}
        {isAnswered && (
          <div className="space-y-4 pt-2">
            <div
              className={`p-4 border-2 flex items-center justify-between ${
                isWon
                  ? 'bg-emerald-50 border-emerald-800 text-emerald-950'
                  : 'bg-rose-50 border-rose-800 text-rose-950'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-bold uppercase">
                  {isWon ? 'ĐOÁN ĐÚNG CHÍNH XÁC!' : 'HẾT LƯỢT THỬ'}
                </div>
                <div className="font-serif text-base font-bold mt-0.5">
                  Đáp án: {currentWord.tu} {currentWord.phien_am ? `(${currentWord.phien_am})` : ''}
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
              onClick={handleNext}
              className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>TỪ TIẾP THEO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Character Keyboard */}
        {!isAnswered && (
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 pt-2">
            {availableKeyboardButtons.map((char) => {
              const isUsed = guessedLetters.has(char) || guessedLetters.has(char.toUpperCase());
              return (
                <button
                  key={char}
                  disabled={isUsed}
                  onClick={() => handleGuessLetter(char)}
                  className={`p-2 border text-sm font-mono font-bold transition ${
                    isUsed
                      ? 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed opacity-50'
                      : 'bg-white border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
