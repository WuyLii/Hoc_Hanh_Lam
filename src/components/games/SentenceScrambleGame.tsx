import React, { useState, useEffect } from 'react';
import { GrammarItem, VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import confetti from 'canvas-confetti';
import { ChevronLeft, Volume2, RotateCcw, Check, ArrowRight } from 'lucide-react';

interface SentenceScrambleGameProps {
  grammarItems: GrammarItem[];
  vocabularyItems: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

interface PuzzleItem {
  id: string;
  originalSentence: string;
  meaning: string;
  words: string[];
}

export const SentenceScrambleGame: React.FC<SentenceScrambleGameProps> = ({
  grammarItems,
  vocabularyItems,
  language,
  onFinish,
  onExit,
}) => {
  const [puzzles, setPuzzles] = useState<PuzzleItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState<{ id: string; text: string }[]>([]);
  const [selectedWords, setSelectedWords] = useState<{ id: string; text: string }[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const initPuzzles = () => {
    const rawSentences: { sentence: string; meaning: string }[] = [];

    grammarItems.forEach((g) => {
      if (g.vi_du && g.vi_du.trim().length > 5) {
        rawSentences.push({ sentence: g.vi_du, meaning: g.vi_du_dich || g.giai_thich });
      }
    });

    vocabularyItems.forEach((v) => {
      if (v.vi_du && v.vi_du.trim().length > 5) {
        rawSentences.push({ sentence: v.vi_du, meaning: v.vi_du_dich || v.nghia });
      }
    });

    const shuffledRaw = [...rawSentences].sort(() => Math.random() - 0.5);
    const selected = shuffledRaw.slice(0, 8);
    const formatted: PuzzleItem[] = selected.map((item, idx) => {
      let tokens: string[] = [];
      if (language === 'zh') {
        tokens = item.sentence.replace(/[，。！？,.!?]/g, ' ').trim().split(/\s+/);
        if (tokens.length <= 2) {
          tokens = item.sentence.replace(/[，。！？,.!?]/g, '').split('');
        }
      } else {
        tokens = item.sentence.replace(/[，。！？,.!?]/g, '').trim().split(/\s+/);
      }

      return {
        id: `pz_${idx}_${Math.random()}`,
        originalSentence: item.sentence.trim(),
        meaning: item.meaning,
        words: tokens.filter(Boolean),
      };
    });

    setPuzzles(formatted.filter((p) => p.words.length >= 3));
    setCurrentIndex(0);
    setCorrectCount(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    initPuzzles();
  }, [grammarItems, vocabularyItems, language]);

  const currentPuzzle = puzzles[currentIndex];

  useEffect(() => {
    if (!currentPuzzle) return;
    const shuffled = currentPuzzle.words
      .map((w, idx) => ({ id: `w_${idx}_${Math.random()}`, text: w }))
      .sort(() => 0.5 - Math.random());
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsAnswered(false);
    setIsCorrect(false);
  }, [currentIndex, puzzles]);

  const handlePickWord = (word: { id: string; text: string }) => {
    if (isAnswered) return;
    setAvailableWords((prev) => prev.filter((w) => w.id !== word.id));
    setSelectedWords((prev) => [...prev, word]);
  };

  const handleRemoveWord = (word: { id: string; text: string }) => {
    if (isAnswered) return;
    setSelectedWords((prev) => prev.filter((w) => w.id !== word.id));
    setAvailableWords((prev) => [...prev, word]);
  };

  const handleCheck = () => {
    if (selectedWords.length === 0 || !currentPuzzle) return;

    const userBuilt = selectedWords.map((w) => w.text).join(language === 'zh' ? '' : ' ');
    const cleanTarget = currentPuzzle.words.join(language === 'zh' ? '' : ' ');
    const correct = userBuilt.toLowerCase() === cleanTarget.toLowerCase();

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setCorrectCount((c) => c + 1);
      ttsService.speak(currentPuzzle.originalSentence, language);
    }
  };

  const isAdvancingRef = React.useRef(false);

  const handleNext = () => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    if (currentIndex + 1 < puzzles.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 60 });
      onFinish(correctCount, puzzles.length, correctCount * 30);
    }

    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 400);
  };

  if (!puzzles || puzzles.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <p className="text-xs font-mono text-stone-600">Cần thêm câu ví dụ trong từ điển/ngữ pháp để tạo câu hỏi ghép câu.</p>
        <button onClick={onExit} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
          THOÁT
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">HOÀN THÀNH BÀI GHÉP CÂU</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Kết quả ghép câu</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">
              {correctCount} / {puzzles.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Câu ghép đúng</div>
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
            onClick={initPuzzles}
            className="flex-1 py-3 border-2 border-[#1A1A1A] bg-stone-100 text-[#1A1A1A] hover:bg-stone-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHƠI LẠI (XÁO TRỘN CÂU MỚI)</span>
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

        <div className="text-xs font-mono font-bold text-[#1A1A1A]">
          CÂU {currentIndex + 1} / {puzzles.length}
        </div>
      </div>

      {/* Main Puzzle Card */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
            Nghĩa tiếng Việt cần ghép
          </span>
          <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
            "{currentPuzzle.meaning}"
          </h3>
        </div>

        {/* Selected Tokens Construction Zone */}
        <div className="min-h-[70px] p-4 bg-[#F9F7F2] border-2 border-dashed border-[#1A1A1A] flex flex-wrap items-center gap-2">
          {selectedWords.length === 0 ? (
            <span className="text-xs font-mono text-stone-400">Nhấp vào các khối từ bên dưới để ghép thành câu hoàn chỉnh...</span>
          ) : (
            selectedWords.map((word) => (
              <button
                key={word.id}
                disabled={isAnswered}
                onClick={() => handleRemoveWord(word)}
                className="px-3 py-1.5 bg-[#1A1A1A] text-[#F9F7F2] text-sm font-serif font-bold transition hover:bg-stone-700"
              >
                {word.text}
              </button>
            ))
          )}
        </div>

        {/* Available Word Pool */}
        <div className="flex flex-wrap gap-2 pt-2">
          {availableWords.map((word) => (
            <button
              key={word.id}
              disabled={isAnswered}
              onClick={() => handlePickWord(word)}
              className="px-3 py-1.5 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] text-sm font-serif font-bold hover:bg-[#1A1A1A] hover:text-white transition"
            >
              {word.text}
            </button>
          ))}
        </div>

        {/* Action Button */}
        {!isAnswered ? (
          <button
            onClick={handleCheck}
            disabled={selectedWords.length === 0}
            className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
          >
            KIỂM TRA CÂU
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
                  Đáp án chuẩn: <strong>"{currentPuzzle.originalSentence}"</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => ttsService.speak(currentPuzzle.originalSentence, language)}
                className="p-1 border border-current hover:bg-black hover:text-white"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>CÂU TIẾP THEO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
