import React, { useState, useEffect, useRef, useMemo } from 'react';
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

