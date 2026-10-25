import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, VocabularyItem, Deck } from '../../types';
import { FlashcardGame } from './FlashcardGame';
import { MultipleChoiceGame } from './MultipleChoiceGame';
import { MatchingPairsGame } from './MatchingPairsGame';
import { FillInBlankGame } from './FillInBlankGame';
import { SentenceScrambleGame } from './SentenceScrambleGame';
import { PictureGuessGame } from './PictureGuessGame';
import { HangmanGame } from './HangmanGame';
import { TypingPracticeGame } from './TypingPracticeGame';
import {
  Gamepad2,
  Filter,
  Play,
  ArrowRight,
  RotateCcw,
  Shuffle,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  filterWords,
  buildLessonIndex,
  isLessonMatch,
  LessonIndexItem,
} from '../../utils/lessonFilter';

export { isLessonMatch };

export const GameReviewHub: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    currentLangVocabulary,
    currentLangGrammar,
    currentLangDecks,
    selectedGameMode,
    setSelectedGameMode,
    recordSRSRating,
    toggleTodayFlashcard,
    updateRetentionLevel,
    addReviewSession,
    addStudyTime,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];

  // Filter state inside Game Hub
  const [activeDeckFilter, setActiveDeckFilter] = useState<string>('ALL');
  const [activeTopicFilter, setActiveTopicFilter] = useState<string>('ALL');
  const [activeLessonFilter, setActiveLessonFilter] = useState<string>('ALL');
  const [activePosFilter, setActivePosFilter] = useState<string>('ALL');
  const [activeLimitFilter, setActiveLimitFilter] = useState<string>('ALL');
  // 1. Lựa chọn Ôn Bài hôm nay hay không
  const [activeTodayFilter, setActiveTodayFilter] = useState<'ALL' | 'today_only'>('ALL');
  // 2. Cho phép chọn trạng thái của từ
  const [activeRetentionFilter, setActiveRetentionFilter] = useState<
    'ALL' | 'due' | 'difficult' | 'chua_thuoc' | 'quen' | 'hoi_nho' | 'nho' | 'chua_danh_gia'
  >('ALL');

  const [shuffleKey, setShuffleKey] = useState<number>(0);

  const topics = Array.from(new Set(currentLangVocabulary.map((w) => w.chu_de || 'Tổng hợp'))).filter(Boolean);
  const posTypes = Array.from(new Set(currentLangVocabulary.map((w) => w.loai_tu || 'Khác'))).filter(Boolean);

  const lessonIndex = React.useMemo(() => buildLessonIndex(currentLangVocabulary), [currentLangVocabulary]);

  const targetDeck = React.useMemo(
    () => (activeDeckFilter !== 'ALL' ? currentLangDecks.find((d) => d.deck_id === activeDeckFilter) : null),
    [activeDeckFilter, currentLangDecks]
  );

  // Contextual word count for each lesson in the dropdown considering other active filters
  const contextualLessonCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    lessonIndex.forEach((item) => {
      const matched = filterWords(currentLangVocabulary, {
        lessons: [item.key],
        todayOnly: activeTodayFilter === 'today_only',
        wordStatus: activeRetentionFilter,
        pos: activePosFilter,
        topic: activeTopicFilter,
        deckId: activeDeckFilter,
        deckWordIds: targetDeck?.danh_sach_word_id,
      });
      counts.set(item.key, matched.length);
    });
    return counts;
  }, [currentLangVocabulary, lessonIndex, activeTodayFilter, activeRetentionFilter, activePosFilter, activeTopicFilter, activeDeckFilter, targetDeck]);

  // Single-pass source filter using unified filterWords
  const reviewWords = React.useMemo(() => {
    return filterWords(currentLangVocabulary, {
      selectedLesson: activeLessonFilter,
      todayOnly: activeTodayFilter === 'today_only',
      wordStatus: activeRetentionFilter,
      pos: activePosFilter,
      topic: activeTopicFilter,
      deckId: activeDeckFilter,
      deckWordIds: targetDeck?.danh_sach_word_id,
    });
  }, [currentLangVocabulary, activeLessonFilter, activeTodayFilter, activeRetentionFilter, activePosFilter, activeTopicFilter, activeDeckFilter, targetDeck]);

  const handleResetAllFilters = () => {
    setActiveDeckFilter('ALL');
    setActiveTopicFilter('ALL');
    setActiveLessonFilter('ALL');
    setActivePosFilter('ALL');
    setActiveLimitFilter('ALL');
    setActiveTodayFilter('ALL');
    setActiveRetentionFilter('ALL');
  };

  const isFilteringActive = activeTodayFilter === 'today_only' || activeRetentionFilter !== 'ALL' || activeLessonFilter !== 'ALL' || activeTopicFilter !== 'ALL' || activePosFilter !== 'ALL' || activeDeckFilter !== 'ALL';
  const filteredPool = isFilteringActive
    ? reviewWords
    : (reviewWords.length > 0 ? reviewWords : currentLangVocabulary);

  const [shuffledOrder, setShuffledOrder] = useState<VocabularyItem[] | null>(null);
  const [shuffleNotice, setShuffleNotice] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // Robust Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const handleShuffleFilteredWords = () => {
    setIsShuffling(true);
    const pool = isFilteringActive
      ? reviewWords
      : (reviewWords.length > 0 ? reviewWords : currentLangVocabulary);

    if (pool.length === 0) {
      setShuffleNotice('⚠️ Chưa có từ nào khớp với bộ lọc để xáo trộn!');
      setIsShuffling(false);
      setTimeout(() => setShuffleNotice(null), 3000);
      return;
    }

    const randomized = shuffleArray(pool);
    setShuffledOrder(randomized);
    setSessionWords(randomized);
    setShuffleKey((k) => k + 1);
    setShuffleNotice(`🎲 Đã xáo trộn ngẫu nhiên ${randomized.length} từ vựng đã lọc!`);

    setTimeout(() => setIsShuffling(false), 450);
    setTimeout(() => setShuffleNotice(null), 4000);
  };

  const handleResetShuffleOrder = () => {
    setShuffledOrder(null);
    setSessionWords(null);
    setShuffleKey((k) => k + 1);
    setShuffleNotice('🔄 Đã trở về thứ tự mặc định');
    setTimeout(() => setShuffleNotice(null), 2500);
  };

  // Reset custom shuffle when fundamental filters change
  React.useEffect(() => {
    setShuffledOrder(null);
    setSessionWords(null);
  }, [activeLessonFilter, activeTopicFilter, activePosFilter, activeDeckFilter, activeTodayFilter, activeRetentionFilter]);

  // Dynamic random shuffle every time filters change or user clicks shuffle
  const finalWordsToPlay = React.useMemo(() => {
    let source = filteredPool;
    if (shuffledOrder && shuffledOrder.length > 0) {
      const filteredSet = new Set(filteredPool.map((w) => w.word_id));
      const validShuffled = shuffledOrder.filter((w) => filteredSet.has(w.word_id));
      if (validShuffled.length > 0) {
        source = validShuffled;
      }
    }
    if (activeLimitFilter !== 'ALL') {
      return source.slice(0, parseInt(activeLimitFilter, 10));
    }
    return source;
  }, [filteredPool, activeLimitFilter, shuffleKey, shuffledOrder]);

  // Stable words for active game session: persists across navigation so words don't reshuffle mid-game
  const [sessionWords, setSessionWords] = React.useState<VocabularyItem[] | null>(null);

  React.useEffect(() => {
    if (selectedGameMode) {
      if (!sessionWords || sessionWords.length === 0) {
        setSessionWords(finalWordsToPlay.length > 0 ? finalWordsToPlay : (isFilteringActive ? [] : currentLangVocabulary));
      }
    } else {
      if (sessionWords) {
        setSessionWords(null);
      }
    }
  }, [selectedGameMode]);

  const activeWordsForGame = sessionWords && sessionWords.length > 0 ? sessionWords : finalWordsToPlay;

  const handleExitGame = () => {
    setSelectedGameMode(null);
    setSessionWords(null);
  };

  const handleFinishGame = (correctCount: number, totalCount: number, score: number) => {
    if (selectedGameMode) {
      addReviewSession({
        user_id: currentUser.user_id,
        loai_game: selectedGameMode as any,
        thoi_gian_bat_dau: new Date(Date.now() - 120000).toISOString(),
        thoi_gian_ket_thuc: new Date().toISOString(),
        so_cau_dung: correctCount,
        so_cau_sai: totalCount - correctCount,
        diem: score,
        danh_sach_word_id: activeWordsForGame.map((w) => w.word_id),
      });
      addStudyTime(2, score);
    }
  };

  const GAME_MODES = [
    {
      id: 'flashcard',
      num: '01',
      name: 'Thẻ ghi nhớ Flashcard (SRS SM-2)',
      icon: '🎴',
      tag: 'Thuật toán lặp lại ngắt quãng',
      desc: 'Giãn cách thời gian ôn tập khoa học theo thang nhớ 4 mức độ của SuperMemo SM-2.',
    },
    {
      id: 'multiple_choice',
      num: '02',
      name: 'Trắc nghiệm phản xạ nhanh',
      icon: '🎯',
      tag: 'Đếm ngược 10s & Nhân điểm combo',
      desc: 'Luyện phản xạ chọn đáp án đúng trong 4 phương án dưới áp lực thời gian.',
    },
    {
      id: 'matching',
      num: '03',
      name: 'Nối cặp từ và nghĩa',
      icon: '🧩',
      tag: 'Bảng lưới ma trận 12 ô',
      desc: 'Tìm và ghép nối chính xác các cặp từ vựng cùng nghĩa tương ứng trên bảng lật.',
    },
    {
      id: 'fill_blank',
      num: '04',
      name: 'Điền từ vào chỗ trống',
      icon: '✏️',
      tag: 'Ngữ cảnh câu ví dụ thực tế',
      desc: 'Khôi phục câu văn hoàn chỉnh bằng cách điền từ vựng còn thiếu dựa trên gợi ý độ dài.',
    },
    {
      id: 'scramble',
      num: '05',
      name: 'Sắp xếp khối từ thành câu',
      icon: '🧱',
      tag: 'Luyện cấu trúc ngữ pháp',
      desc: 'Kéo thả và ghép các khối từ xáo trộn để tạo thành câu hoàn chỉnh đúng ngữ pháp.',
    },
    {
      id: 'picture_guess',
      num: '06',
      name: 'Đoán từ qua manh mối ẩn',
      icon: '🖼️',
      tag: 'Mở khóa gợi ý từng bước',
      desc: 'Mở các lớp manh mối (từ loại, chữ cái đầu, định nghĩa) để giải mã từ vựng bí ẩn.',
    },
    {
      id: 'hangman',
      num: '07',
      name: 'Treo cổ đoán chữ (Hangman)',
      icon: '🎪',
      tag: 'Bàn phím & 6 lượt mạng',
      desc: 'Đoán từng ký tự hoặc âm tiết phiên âm để ghép nên từ vựng trước khi hết lượt.',
    },
    {
      id: 'typing',
      num: '08',
      name: 'Luyện gõ phím tốc độ cao',
      icon: '⌨️',
      tag: 'Phân tích WPM & Độ chính xác',
      desc: 'Rèn luyện trí nhớ cơ bắp và độ chuẩn xác chính tả khi gõ phím ngoại ngữ theo thời gian thực.',
    },
  ];

  // Render Active Game
  if (selectedGameMode) {
    switch (selectedGameMode) {
      case 'flashcard':
        return (
          <FlashcardGame
            words={currentLangVocabulary}
            initialWords={isFilteringActive ? reviewWords : undefined}
            initialRetentionFilter={activeTodayFilter === 'today_only' ? 'today_only' : undefined}
            initialLessonFilter={activeLessonFilter !== 'ALL' ? activeLessonFilter : undefined}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onRecordSRS={recordSRSRating}
            onToggleStar={toggleTodayFlashcard}
            onUpdateRetention={updateRetentionLevel}
            onExit={handleExitGame}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceGame
            words={activeWordsForGame}
            allWords={currentLangVocabulary}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={handleExitGame}
          />
        );
      case 'matching':
        return (
          <MatchingPairsGame
            words={activeWordsForGame}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={handleExitGame}
          />
        );
      case 'fill_blank':
        return (
          <FillInBlankGame
            words={activeWordsForGame}
            allWords={currentLangVocabulary}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={handleExitGame}
          />
        );
      case 'scramble':
        return (
          <SentenceScrambleGame
            grammarItems={currentLangGrammar}
            vocabularyItems={currentLangVocabulary}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={handleExitGame}
          />
        );
      case 'picture_guess':
        return (
          <PictureGuessGame
            words={activeWordsForGame}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={handleExitGame}
          />
        );
      case 'hangman':
        return (
          <HangmanGame
            words={activeWordsForGame}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={handleExitGame}
          />
        );
      case 'typing':
        return (
          <TypingPracticeGame
            words={activeWordsForGame}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={handleExitGame}
          />
        );
      default:
        break;
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header Banner */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5">
              Hệ thống trò chơi ôn tập
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              8 Chế độ luyện tập trí nhớ khoa học
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Kho trò chơi ôn tập từ vựng — {currentLangInfo.name}
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Biến danh sách từ vựng khô khan thành các thử thách tương tác ghi nhớ chủ động.
          </p>
        </div>

        <button
          onClick={() => setSelectedGameMode('flashcard')}
          className="flex items-center gap-2 px-6 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>MỞ THẺ FLASHCARD</span>
        </button>
      </div>

      {/* Target Word Source Filter */}
      <div className="p-6 bg-[#F9F7F2] border-2 border-[#1A1A1A] editorial-shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ lọc nguồn từ vựng & xáo trộn:</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffleFilteredWords}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 border border-[#1A1A1A] text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              title="Xáo trộn ngẫu nhiên tất cả các từ vựng đã lọc"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>🎲 XÁO TRỘN CÂU HỎI</span>
            </button>
            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 border border-[#1A1A1A] text-[#1A1A1A]">
              {finalWordsToPlay.length} TỪ HÀNG ĐỢI
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {/* 1. Lựa chọn Ôn Bài hôm nay hay không */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Ôn bài hôm nay:
            </label>
            <select
              value={activeTodayFilter}
              onChange={(e: any) => setActiveTodayFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none font-bold cursor-pointer"
            >
              <option value="ALL">Toàn bộ kho từ</option>
              <option value="today_only">⭐ Chỉ ôn bài hôm nay (Đã đánh sao)</option>
            </select>
          </div>

          {/* 2. Cho phép chọn trạng thái của từ */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Trạng thái của từ:
            </label>
            <select
              value={activeRetentionFilter}
              onChange={(e: any) => setActiveRetentionFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none font-bold cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="chua_danh_gia">⚪ Chưa đánh giá (Chưa chơi)</option>
              <option value="chua_thuoc">🔴 1. Chưa thuộc</option>
              <option value="quen">🟠 2. Quên</option>
              <option value="hoi_nho">🔵 3. Hơi nhớ</option>
              <option value="nho">🟢 4. Đã nhớ</option>
              <option value="due">⏰ Cần ôn ngay (SRS)</option>
              <option value="difficult">⚠️ Từ khó cần củng cố</option>
            </select>
          </div>

          {/* Limit Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Số từ ôn tập:
            </label>
            <select
              value={activeLimitFilter}
              onChange={(e) => setActiveLimitFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            >
              <option value="ALL">Tất cả ({filteredPool.length} từ)</option>
              <option value="5">5 từ</option>
              <option value="10">10 từ</option>
              <option value="15">15 từ</option>
              <option value="20">20 từ</option>
              <option value="30">30 từ</option>
              <option value="50">50 từ</option>
            </select>
          </div>

          {/* Part of Speech filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Từ loại:
            </label>
            <select
              value={activePosFilter}
              onChange={(e) => setActivePosFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            >
              <option value="ALL">Tất cả từ loại ({posTypes.length})</option>
              {posTypes.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {/* Deck filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Bộ thẻ (Deck):
            </label>
            <select
              value={activeDeckFilter}
              onChange={(e) => setActiveDeckFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            >
              <option value="ALL">Tất cả bộ thẻ</option>
              {currentLangDecks.map((d) => (
                <option key={d.deck_id} value={d.deck_id}>
                  {(d as any).ten_bo || d.ten_deck || 'Bộ thẻ'}
                </option>
              ))}
            </select>
          </div>

          {/* Lesson filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              📚 Chọn Bài Học:
            </label>
            <select
              value={activeLessonFilter}
              onChange={(e) => setActiveLessonFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none font-bold cursor-pointer"
            >
              <option value="ALL">Tất cả bài học ({currentLangVocabulary.length})</option>
              {lessonIndex.map((item) => {
                const count = contextualLessonCounts.get(item.key) ?? item.count;
                const isZero = count === 0;
                return (
                  <option
                    key={item.key}
                    value={item.key}
                    disabled={isZero}
                    className={isZero ? 'text-stone-400' : ''}
                  >
                    {item.label} ({count} từ){isZero ? ' — Không có từ' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Topic/Context filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Ngữ cảnh / Chủ đề:
            </label>
            <select
              value={activeTopicFilter}
              onChange={(e) => setActiveTopicFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            >
              <option value="ALL">Tất cả ngữ cảnh</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Action & Status Banners */}
        <div className="space-y-2">
          {activeLessonFilter !== 'ALL' && (
            <div className="p-3 bg-amber-50 border-2 border-[#1A1A1A] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span>📚 Đang lọc theo: <strong className="font-bold underline">{lessonIndex.find((i) => i.key === activeLessonFilter)?.label || activeLessonFilter}</strong></span>
                <span className="bg-[#1A1A1A] text-white px-2 py-0.5 text-[11px] font-bold">
                  {filteredPool.length} TỪ KHỚP
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLessonFilter('ALL')}
                  className="px-2.5 py-1 bg-white border border-[#1A1A1A] hover:bg-stone-100 text-[#1A1A1A] font-bold text-[10px] uppercase transition"
                >
                  ✕ Gỡ lọc bài này
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGameMode('flashcard')}
                  disabled={filteredPool.length === 0}
                  className="px-3 py-1 bg-[#1A1A1A] text-white font-bold uppercase text-[10px] hover:bg-stone-800 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  <span>🎴 TẠO THẺ & ÔN FLASHCARD BÀI NÀY</span>
                </button>
              </div>
            </div>
          )}

          {isFilteringActive && (
            <div className="flex items-center justify-between text-xs font-mono pt-1 text-stone-600">
              <span>Đang bật các điều kiện lọc tùy chỉnh</span>
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-[#1A1A1A] underline font-bold hover:text-red-700 flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa tất cả bộ lọc</span>
              </button>
            </div>
          )}
        </div>

        {/* Shuffle & Ordering Controls Bar - Element 4 of filter container */}
        <div className="p-3.5 sm:p-4 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5 uppercase tracking-wide">
              <Shuffle className={`w-4 h-4 text-amber-700 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>Xáo trộn câu hỏi ngẫu nhiên:</span>
            </span>
            <span className="bg-amber-100 border border-amber-800 text-amber-950 px-2 py-0.5 text-[11px] font-bold">
              {finalWordsToPlay.length} từ đã lọc
            </span>
            {shuffledOrder && (
              <span className="bg-[#1A1A1A] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                ĐÃ ĐẢO THỨ TỰ
              </span>
            )}
            {shuffleNotice && (
              <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in duration-200 bg-emerald-50 px-2.5 py-1 border border-emerald-300">
                <Check className="w-3.5 h-3.5" />
                <span>{shuffleNotice}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShuffleFilteredWords}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 border-2 border-[#1A1A1A] font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              title="Xáo trộn ngẫu nhiên tất cả các từ vựng đã lọc với nhau"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>🎲 XÁO TRỘN CÂU HỎI NGAY</span>
            </button>
            {shuffledOrder && (
              <button
                type="button"
                onClick={handleResetShuffleOrder}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-[#1A1A1A] text-stone-700 text-xs font-mono font-bold uppercase transition"
                title="Khôi phục thứ tự ban đầu"
              >
                <span>↺ Thứ tự gốc</span>
              </button>
            )}
          </div>
        </div>

        {activeTodayFilter === 'today_only' && (
          <div className={`mt-3 p-3 border text-xs font-mono flex items-center justify-between ${
            reviewWords.length === 0
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <span>
              {reviewWords.length === 0
                ? `⚠️ Chưa có từ nào được đánh dấu sao hôm nay trong kho từ vựng ${currentLangInfo.name}! Hãy vào mục Tra Từ Điển hoặc Sổ Từ Vựng, bấm biểu tượng [★ Đánh sao] ở các từ cần học để nạp vào đây.`
                : `⭐ Đang lọc ${reviewWords.length} thẻ Flashcard đã đánh dấu sao hôm nay. Chọn chế độ bất kỳ bên dưới để ôn tập ngay!`}
            </span>
          </div>
        )}
      </div>

      {/* 8 Game Mode Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {GAME_MODES.map((game) => (
          <div
            key={game.id}
            onClick={() => setSelectedGameMode(game.id)}
            className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm hover:editorial-shadow transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between mb-4 border-b border-[#1A1A1A]/15 pb-3">
                <span className="text-3xl font-serif font-black text-[#1A1A1A] group-hover:text-amber-700">
                  {game.num}
                </span>
                <span className="text-3xl">{game.icon}</span>
              </div>

              <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-500 mb-1">
                {game.tag}
              </div>

              <h3 className="text-lg font-serif font-bold text-[#1A1A1A] leading-tight group-hover:underline">
                {game.name}
              </h3>

              <p className="text-xs font-serif text-stone-700 mt-3 leading-relaxed">
                {game.desc}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#1A1A1A] flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-[#1A1A1A] group-hover:text-amber-800">CHƠI NGAY</span>
              <ArrowRight className="w-4 h-4 text-[#1A1A1A] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
