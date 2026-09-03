import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  CheckCircle2,
  Check,
  Shuffle,
  Search,
  RefreshCw,
  Sparkles,
  X,
  ArrowLeftRight,
  HelpCircle,
  Eye,
} from 'lucide-react';

export type FlashcardDirectionMode = 'random_alternate' | 'term_to_meaning' | 'meaning_to_term';
export type CardDirection = 'term_to_meaning' | 'meaning_to_term';

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
  // Mode: Alternating random 2-way (Default), Term-first, or Meaning-first
  const [directionMode, setDirectionMode] = useState<FlashcardDirectionMode>('random_alternate');

  // Candidate Filter Controls
  const [selectedLimit, setSelectedLimit] = useState<string>('ALL');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [selectedContext, setSelectedContext] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedSrsStatus, setSelectedSrsStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);
  const [reloadNotice, setReloadNotice] = useState<string | null>(null);

  // Available options derived from full input words
  const availablePos = useMemo(() => Array.from(new Set(words.map((w) => w.loai_tu || 'Khác'))).filter(Boolean), [words]);
  const availableContexts = useMemo(() => Array.from(new Set(words.map((w) => w.chu_de || 'Tổng hợp'))).filter(Boolean), [words]);
  const availableLevels = useMemo(() => Array.from(new Set(words.map((w) => w.cap_do || 'Cơ bản'))).filter(Boolean), [words]);

  // Candidate words matching current filter criteria
  const candidateWords = useMemo(() => {
    let list = words.filter((w) => {
      if (selectedPos !== 'ALL' && w.loai_tu !== selectedPos) return false;
      if (selectedContext !== 'ALL' && w.chu_de !== selectedContext) return false;
      if (selectedLevel !== 'ALL' && w.cap_do !== selectedLevel) return false;

      if (selectedSrsStatus === 'due') {
        const now = new Date();
        const isDue = !w.srs_next_review || new Date(w.srs_next_review) <= now || w.srs_box === 0;
        if (!isDue) return false;
      } else if (selectedSrsStatus === 'new') {
        if (w.srs_box !== 0 && w.times_reviewed) return false;
      } else if (selectedSrsStatus === 'difficult') {
        const isDifficult = (w.times_reviewed > 0 && w.times_correct / w.times_reviewed < 0.6) || w.srs_box <= 1;
        if (!isDifficult) return false;
      } else if (selectedSrsStatus === 'mastered') {
        if ((w.srs_box || 0) < 4) return false;
      }

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const searchFields = [
          w.tu,
          w.nghia,
          w.phien_am,
          w.nghia_tieng_han,
          w.nghia_tieng_anh,
          w.vi_du,
          w.vi_du_dich,
          w.loai_tu,
          w.chu_de,
          w.cap_do,
        ].map((f) => (f || '').toLowerCase());

        const match = searchFields.some((f) => f.includes(q));
        if (!match) return false;
      }

      return true;
    });

    if (selectedLimit !== 'ALL') {
      const lim = parseInt(selectedLimit, 10);
      list = list.slice(0, lim);
    }
    return list;
  }, [words, selectedPos, selectedContext, selectedLevel, selectedSrsStatus, searchKeyword, selectedLimit]);

  // Pending selected word IDs for checkbox selection inside drawer
  const [pendingWordIds, setPendingWordIds] = useState<Set<string>>(() => {
    return new Set(words.map((w) => w.word_id));
  });

  // Keep pendingWordIds synced when candidateWords change if user hasn't manually customized
  useEffect(() => {
    if (candidateWords.length > 0) {
      setPendingWordIds(new Set(candidateWords.map((w) => w.word_id)));
    }
  }, [candidateWords]);

  // Applied words array currently rendered in the Flashcard deck
  const [activeWords, setActiveWords] = useState<VocabularyItem[]>(() => {
    return words.length > 0 ? words : [];
  });

  // Array of directions for each card in activeWords
  const [deckDirections, setDeckDirections] = useState<CardDirection[]>([]);

  // Function to generate balanced/shuffled directions for a word list
  const generateDirections = useCallback((wordList: VocabularyItem[], mode: FlashcardDirectionMode): CardDirection[] => {
    if (wordList.length === 0) return [];
    if (mode === 'term_to_meaning') {
      return wordList.map(() => 'term_to_meaning');
    }
    if (mode === 'meaning_to_term') {
      return wordList.map(() => 'meaning_to_term');
    }
    // Random alternating: create balanced mix of ~50% each and shuffle
    const half = Math.ceil(wordList.length / 2);
    const pool: CardDirection[] = [];
    for (let i = 0; i < wordList.length; i++) {
      pool.push(i % 2 === 0 ? 'term_to_meaning' : 'meaning_to_term');
    }
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, []);

  // Update directions when activeWords or directionMode changes
  useEffect(() => {
    setDeckDirections(generateDirections(activeWords, directionMode));
  }, [activeWords, directionMode, generateDirections]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ wordId: string; rating: RecallQuality }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // When words prop changes initially, sync activeWords
  useEffect(() => {
    if (words.length > 0 && activeWords.length === 0) {
      setActiveWords(words);
      setPendingWordIds(new Set(words.map((w) => w.word_id)));
    }
  }, [words]);

  const currentWord = activeWords[currentIndex];
  const currentDirection: CardDirection = deckDirections[currentIndex] || 'term_to_meaning';
  const isMeaningFirst = currentDirection === 'meaning_to_term';

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const isAdvancingRef = useRef(false);

  const handleRate = useCallback((rating: RecallQuality) => {
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
  }, [currentWord, onRecordSRS, sessionResults, currentIndex, activeWords.length, onFinish]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRate, isFlipped]);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentWord) {
      ttsService.speak(currentWord.tu, language);
    }
  };

  // Checkbox toggle helpers inside drawer
  const handleToggleWord = (wordId: string) => {
    setPendingWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const handleSelectAllCandidates = () => {
    const allIds = candidateWords.map((w) => w.word_id);
    setPendingWordIds(new Set(allIds));
  };

  const handleDeselectAllCandidates = () => {
    setPendingWordIds(new Set());
  };

  const handleSelectRandomCandidates = (count: number) => {
    const shuffled = [...candidateWords].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count).map((w) => w.word_id);
    setPendingWordIds(new Set(chosen));
  };

  // CONFIRMATION & RELOAD HANDLER: Apply filter selection and reload cards!
  const handleApplySelectionAndReload = () => {
    let finalChosen = candidateWords.filter((w) => pendingWordIds.has(w.word_id));
    
    // Fallback if none checked: use candidateWords or entire words list
    if (finalChosen.length === 0) {
      if (candidateWords.length > 0) {
        finalChosen = candidateWords;
        setPendingWordIds(new Set(candidateWords.map((w) => w.word_id)));
      } else {
        finalChosen = words;
        setPendingWordIds(new Set(words.map((w) => w.word_id)));
      }
    }

    // Shuffle slightly for fresh practice
    const shuffledDeck = [...finalChosen].sort(() => Math.random() - 0.3);

    setActiveWords(shuffledDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResults([]);
    setIsCompleted(false);
    setShowFilterBar(false);

    // Toast notice
    setReloadNotice(`✓ Đã nạp lại ${shuffledDeck.length} thẻ flashcard theo lựa chọn của bạn!`);
    setTimeout(() => {
      setReloadNotice(null);
    }, 4000);
  };

  if (!activeWords || activeWords.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto my-8">
        <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Không tìm thấy từ vựng nào</h3>
        <p className="text-xs font-mono text-stone-500">Vui lòng chọn hoặc đặt lại bộ lọc để tải thẻ flashcard.</p>
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => {
              setSelectedLimit('ALL');
              setSelectedPos('ALL');
              setSelectedContext('ALL');
              setSelectedLevel('ALL');
              setSelectedSrsStatus('ALL');
              setSearchKeyword('');
              const allIds = new Set(words.map((w) => w.word_id));
              setPendingWordIds(allIds);
              setActiveWords(words);
              setCurrentIndex(0);
              setIsCompleted(false);
            }}
            className="px-4 py-2 border border-[#1A1A1A] bg-stone-100 hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-mono uppercase font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ĐẶT LẠI TẤT CẢ BỘ LỌC</span>
          </button>
          <button
            onClick={onExit}
            className="px-4 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-mono uppercase font-bold"
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
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95 my-8">
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast Notification Banner when Cards reloaded */}
      {reloadNotice && (
        <div className="p-3 bg-emerald-900 text-emerald-100 border-2 border-[#1A1A1A] text-xs font-mono font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-200 editorial-shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{reloadNotice}</span>
          </div>
          <button
            onClick={() => setReloadNotice(null)}
            className="p-1 hover:bg-emerald-800 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Controls & Progress */}
      <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-xs font-mono uppercase font-bold text-stone-600 hover:text-[#1A1A1A] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>THOÁT RA</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-xs font-mono uppercase font-bold transition editorial-shadow-sm ${
              showFilterBar
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white hover:bg-[#1A1A1A] hover:text-white border-[#1A1A1A] text-[#1A1A1A]'
            }`}
            title="Lọc & chọn từng từ cần ôn flashcard"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>BỘ LỌC SRS & CHỌN TỪ ({activeWords.length})</span>
          </button>

          <span className="text-xs font-mono font-bold text-[#1A1A1A]">
            THẺ {currentIndex + 1} / {activeWords.length}
          </span>
          <div className="w-20 sm:w-28 h-2 border border-[#1A1A1A] bg-[#F9F7F2] overflow-hidden">
            <div
              className="h-full bg-[#1A1A1A] transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / activeWords.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Expandable Filter Drawer & Individual Word Selector */}
      {showFilterBar && (
        <div className="p-5 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                BỘ LỌC TÙY CHỈNH & CHỌN TỪ ÔN FLASHCARD
              </span>
            </div>

            {/* TOP RELOAD BUTTON FOR QUICK ACCESS */}
            <button
              onClick={handleApplySelectionAndReload}
              className="px-4 py-2 border-2 border-[#1A1A1A] bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition editorial-shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>CHỌN XONG (NẠP LẠI {pendingWordIds.size} CARD)</span>
            </button>
          </div>

          {/* Direction Mode in Drawer */}
          <div className="p-3 bg-[#F9F7F2] border border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-amber-800" />
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#1A1A1A] block">
                  CHẾ ĐỘ HIỂN THỊ THẺ FLASHCARD:
                </span>
                <span className="text-[11px] font-mono text-stone-500">
                  Tùy chỉnh chiều ôn tập giữa Từ vựng và Nghĩa tiếng Việt
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDirectionMode('random_alternate')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition ${
                  directionMode === 'random_alternate'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] border-stone-300 hover:border-[#1A1A1A]'
                }`}
              >
                🔀 Luân phiên ngẫu nhiên (Mặc định)
              </button>
              <button
                type="button"
                onClick={() => setDirectionMode('term_to_meaning')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition ${
                  directionMode === 'term_to_meaning'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] border-stone-300 hover:border-[#1A1A1A]'
                }`}
              >
                🔤 Nhìn Từ → Đoán Nghĩa
              </button>
              <button
                type="button"
                onClick={() => setDirectionMode('meaning_to_term')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition ${
                  directionMode === 'meaning_to_term'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] border-stone-300 hover:border-[#1A1A1A]'
                }`}
              >
                💡 Nhìn Nghĩa → Đoán Từ
              </button>
            </div>
          </div>

          {/* Filter Select Controls Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Search Keyword */}
            <div className="col-span-2 sm:col-span-1 md:col-span-2 relative">
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Tìm từ vựng:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Lọc từ, nghĩa..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* SRS Status Filter */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Trạng thái SRS:
              </label>
              <select
                value={selectedSrsStatus}
                onChange={(e) => setSelectedSrsStatus(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white"
              >
                <option value="ALL">Tất cả từ</option>
                <option value="due">🔴 Cần ôn ngay</option>
                <option value="new">🆕 Từ mới chưa học</option>
                <option value="difficult">⚠️ Từ cần củng cố</option>
                <option value="mastered">✅ Từ đã thuộc</option>
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Số từ giới hạn:
              </label>
              <select
                value={selectedLimit}
                onChange={(e) => setSelectedLimit(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white"
              >
                <option value="ALL">Tất cả</option>
                <option value="5">5 từ</option>
                <option value="10">10 từ</option>
                <option value="15">15 từ</option>
                <option value="20">20 từ</option>
                <option value="30">30 từ</option>
                <option value="50">50 từ</option>
                <option value="100">100 từ</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Cấp độ:
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white"
              >
                <option value="ALL">Tất cả cấp độ</option>
                {availableLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* POS */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Từ Loại:
              </label>
              <select
                value={selectedPos}
                onChange={(e) => setSelectedPos(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white"
              >
                <option value="ALL">Tất cả từ loại</option>
                {availablePos.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Context/Topic */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-stone-600 mb-0.5">
                Chủ Đề / Context:
              </label>
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white"
              >
                <option value="ALL">Tất cả chủ đề</option>
                {availableContexts.map((ctx) => (
                  <option key={ctx} value={ctx}>
                    {ctx}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Word Selection Toolbar */}
          <div className="pt-2 border-t border-[#1A1A1A]/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#1A1A1A] uppercase">
                DANH SÁCH TỪ PHÙ HỢP ({candidateWords.length}):
              </span>
              <span className="bg-[#1A1A1A] text-[#F9F7F2] px-2 py-0.5 font-bold">
                ĐÃ CHỌN {pendingWordIds.size} TỪ
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAllCandidates}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-[#1A1A1A] text-[11px] font-bold text-[#1A1A1A]"
              >
                ✓ Chọn tất cả ({candidateWords.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAllCandidates}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-[#1A1A1A] text-[11px] font-bold text-[#1A1A1A]"
              >
                ✗ Bỏ chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => handleSelectRandomCandidates(10)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-800 text-[11px] font-bold text-amber-950 flex items-center gap-1"
              >
                <Shuffle className="w-3 h-3 text-amber-700" />
                <span>🎲 Ngẫu nhiên 10 từ</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectRandomCandidates(20)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-800 text-[11px] font-bold text-amber-950 flex items-center gap-1"
              >
                <Shuffle className="w-3 h-3 text-amber-700" />
                <span>🎲 20 từ</span>
              </button>
            </div>
          </div>

          {/* Checkbox Table / Grid List of Candidate Words */}
          <div className="max-h-56 overflow-y-auto border border-[#1A1A1A] bg-[#F9F7F2] p-2 space-y-1 divide-y divide-stone-200 text-xs font-mono">
            {candidateWords.length === 0 ? (
              <div className="p-4 text-center text-stone-500 font-serif italic">
                Không tìm thấy từ vựng khớp với bộ lọc hiện tại. Vui lòng thay đổi các tùy chọn lọc ở trên.
              </div>
            ) : (
              candidateWords.map((word) => {
                const isChecked = pendingWordIds.has(word.word_id);
                return (
                  <label
                    key={word.word_id}
                    className={`flex items-center justify-between p-2 cursor-pointer transition ${
                      isChecked ? 'bg-white font-bold text-[#1A1A1A]' : 'opacity-60 hover:opacity-100 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleWord(word.word_id)}
                        className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
                      />
                      <span className="font-serif text-sm font-bold text-[#1A1A1A] truncate">
                        {word.tu}
                      </span>
                      {word.phien_am && (
                        <span className="text-stone-500 text-[11px] font-normal truncate">
                          [{word.phien_am}]
                        </span>
                      )}
                      <span className="text-stone-700 font-normal truncate">
                        — {word.nghia}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 text-[9px] uppercase">
                        {word.loai_tu || 'Từ vựng'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 text-[9px]">
                        Box {word.srs_box || 0}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* MAIN PROMINENT 'CHỌN XONG (NẠP LẠI BỘ THẺ)' BUTTON */}
          <div className="pt-2 border-t-2 border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-mono text-stone-600">
              Nhấn nút bên cạnh để áp dụng danh sách từ đã chọn và tải lại các thẻ Flashcard.
            </span>
            <button
              onClick={handleApplySelectionAndReload}
              className="w-full sm:w-auto px-6 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-emerald-950 hover:border-emerald-900 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>CHỌN XONG — TẢI LẠI CARD ({pendingWordIds.size} THẺ) →</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Direction Selector */}
      <div className="p-2.5 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-amber-800" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
            HƯỚNG THẺ:
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#1A1A1A] bg-[#F9F7F2]">
            {directionMode === 'random_alternate'
              ? '🔀 Luân phiên 2 chiều'
              : directionMode === 'term_to_meaning'
              ? '🔤 Từ → Nghĩa'
              : '💡 Nghĩa → Từ'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDirectionMode('random_alternate')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition border ${
              directionMode === 'random_alternate'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
            title="Ngẫu nhiên luân phiên giữa nhìn từ đoán nghĩa và nhìn nghĩa đoán từ"
          >
            🔀 Luân phiên (Mặc định)
          </button>
          <button
            type="button"
            onClick={() => setDirectionMode('term_to_meaning')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition border ${
              directionMode === 'term_to_meaning'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
            title="Chỉ nhìn Từ vựng để đoán Nghĩa"
          >
            🔤 Từ → Nghĩa
          </button>
          <button
            type="button"
            onClick={() => setDirectionMode('meaning_to_term')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition border ${
              directionMode === 'meaning_to_term'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
            title="Chỉ nhìn Nghĩa để đoán Từ vựng"
          >
            💡 Nghĩa → Từ
          </button>
        </div>
      </div>

      {/* Interactive Flip Flashcard (Editorial Paper Style) */}
      <div
        onClick={handleFlip}
        className="relative min-h-[22rem] sm:min-h-[26rem] w-full cursor-pointer select-none"
      >
        <div
          className={`w-full h-full p-6 sm:p-8 transition-all duration-200 border-2 border-[#1A1A1A] editorial-shadow flex flex-col justify-between ${
            isFlipped ? 'bg-[#F9F7F2]' : 'bg-white hover:editorial-shadow-lg'
          }`}
        >
          {/* Top metadata */}
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 border text-[9px] font-mono font-bold uppercase ${
                  currentDirection === 'meaning_to_term'
                    ? 'bg-amber-100 text-amber-900 border-amber-800'
                    : 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                }`}
              >
                {currentDirection === 'meaning_to_term'
                  ? '💡 NHÌN NGHĨA → ĐOÁN TỪ'
                  : '🔤 NHÌN TỪ → ĐOÁN NGHĨA'}
              </span>
              <span className="px-2 py-0.5 bg-[#F9F7F2] border border-stone-300 text-[9px] font-mono uppercase text-stone-700">
                {currentWord.loai_tu || 'Từ vựng'} • {currentWord.cap_do || 'Cơ bản'}
              </span>
            </div>

            {/* Audio button */}
            {(!isMeaningFirst || isFlipped) ? (
              <button
                onClick={handlePlayAudio}
                className="p-2 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition flex items-center gap-1"
                title="Nghe phát âm từ vựng"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-[10px] font-mono hidden sm:inline">Phát âm</span>
              </button>
            ) : (
              <span
                className="text-[10px] font-mono text-stone-400 italic px-2 py-1 bg-stone-50 border border-stone-200"
                title="Phát âm sẽ hiển thị sau khi bạn lật thẻ"
              >
                🔊 Lật để nghe
              </span>
            )}
          </div>

          {/* Card Body */}
          {!isFlipped ? (
            // ================= FRONT FACE =================
            !isMeaningFirst ? (
              // Case 1: Term -> Guess Meaning
              <div className="text-center space-y-4 my-auto py-4">
                <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-[#1A1A1A]">
                  {currentWord.tu}
                </h2>
                {currentWord.phien_am && (
                  <p className="text-lg font-mono text-stone-600 tracking-widest">{currentWord.phien_am}</p>
                )}
                {currentWord.nghia_tieng_han && (
                  <p className="text-xs font-mono text-stone-500">
                    Âm Hán: <span className="font-bold text-stone-700">{currentWord.nghia_tieng_han}</span>
                  </p>
                )}
                <p className="text-xs font-mono uppercase tracking-widest text-stone-400 pt-4 flex items-center justify-center gap-1.5">
                  <span>NHẤN ĐỂ LẬT XEM NGHĨA (SPACEBAR)</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </p>
              </div>
            ) : (
              // Case 2: Meaning -> Guess Term
              <div className="text-center space-y-4 my-auto py-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-800 font-bold">
                    [Hãy nhớ và đoán từ gốc]
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A] max-w-lg mx-auto">
                    {currentWord.nghia}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {currentWord.chu_de && (
                    <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-300 text-xs font-mono text-stone-700">
                      Chủ đề: <strong className="text-[#1A1A1A]">{currentWord.chu_de}</strong>
                    </span>
                  )}
                  {currentWord.loai_tu && (
                    <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-300 text-xs font-mono text-stone-700">
                      Loại từ: <strong className="text-[#1A1A1A]">{currentWord.loai_tu}</strong>
                    </span>
                  )}
                </div>

                {currentWord.vi_du_dich && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-800/30 text-xs font-serif italic text-amber-950 max-w-md mx-auto">
                    Gợi ý ngữ cảnh: "{currentWord.vi_du_dich}"
                  </div>
                )}

                <p className="text-xs font-mono uppercase tracking-widest text-stone-400 pt-4 flex items-center justify-center gap-1.5">
                  <span>NHẤN ĐỂ LẬT XEM TỪ GỐC & PHÁT ÂM (SPACEBAR)</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </p>
              </div>
            )
          ) : (
            // ================= BACK FACE =================
            !isMeaningFirst ? (
              // Case 1 Back: Revealed Meaning
              <div className="space-y-4 my-auto py-4 animate-in fade-in duration-150">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-300 inline-block">
                    ✓ KẾT QUẢ NGHĨA
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A]">
                    {currentWord.nghia}
                  </h3>
                  {currentWord.nghia_tieng_anh && (
                    <p className="text-xs font-mono text-stone-500">
                      English: {currentWord.nghia_tieng_anh}
                    </p>
                  )}
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
            ) : (
              // Case 2 Back: Revealed Target Word
              <div className="space-y-4 my-auto py-4 animate-in fade-in duration-150">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-300 inline-block">
                    ✓ TỪ VỰNG CHÍNH XÁC
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
                    {currentWord.tu}
                  </h3>
                  {currentWord.phien_am && (
                    <p className="text-lg font-mono text-stone-600 tracking-widest">
                      [{currentWord.phien_am}]
                    </p>
                  )}
                  {currentWord.nghia_tieng_han && (
                    <p className="text-xs font-mono text-stone-500">
                      Âm Hán: <span className="font-bold text-stone-700">{currentWord.nghia_tieng_han}</span>
                    </p>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={handlePlayAudio}
                      className="px-3 py-1 bg-stone-100 hover:bg-[#1A1A1A] hover:text-white border border-[#1A1A1A] text-xs font-mono transition inline-flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe phát âm native</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#1A1A1A] text-left space-y-1">
                  <div className="text-xs font-mono text-[#1A1A1A]">
                    <span className="font-bold uppercase text-stone-500 text-[10px] block">Nghĩa tiếng Việt:</span>
                    <span className="font-serif text-sm font-bold">{currentWord.nghia}</span>
                  </div>
                  {currentWord.vi_du && (
                    <div className="pt-2 border-t border-stone-200">
                      <p className="text-xs font-serif italic text-[#1A1A1A]">"{currentWord.vi_du}"</p>
                      {currentWord.vi_du_dich && (
                        <p className="text-[11px] font-mono text-stone-600">→ {currentWord.vi_du_dich}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Bottom Card Footer */}
          <div className="text-center text-[10px] font-mono uppercase tracking-wider text-stone-500 border-t border-[#1A1A1A]/15 pt-2">
            {isFlipped
              ? 'ĐÁNH GIÁ MỨC ĐỘ GHI NHỚ: [1] QUÊN • [2] KHÓ • [3] NHỚ TỐT • [4] RẤT DỄ'
              : `MÃ TỪ #${currentWord.word_id.slice(-4)} • [SPACEBAR / CHẠM ĐỂ LẬT]`}
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

