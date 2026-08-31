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
} from 'lucide-react';

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
    addReviewSession,
    addStudyTime,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];

  // Filter state inside Game Hub
  const [activeDeckFilter, setActiveDeckFilter] = useState<string>('ALL');
  const [activeTopicFilter, setActiveTopicFilter] = useState<string>('ALL');
  const [activePosFilter, setActivePosFilter] = useState<string>('ALL');
  const [activeLimitFilter, setActiveLimitFilter] = useState<string>('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'due' | 'difficult'>('due');

  const [shuffleKey, setShuffleKey] = useState<number>(0);

  const topics = Array.from(new Set(currentLangVocabulary.map((w) => w.chu_de || 'Tổng hợp'))).filter(Boolean);
  const posTypes = Array.from(new Set(currentLangVocabulary.map((w) => w.loai_tu || 'Khác'))).filter(Boolean);

  // Filter words based on selected source
  const reviewWords = currentLangVocabulary.filter((w) => {
    if (activeDeckFilter !== 'ALL') {
      const targetDeck = currentLangDecks.find((d) => d.deck_id === activeDeckFilter);
      if (targetDeck && !targetDeck.danh_sach_word_id.includes(w.word_id)) return false;
    }

    if (activeTopicFilter !== 'ALL' && w.chu_de !== activeTopicFilter) {
      return false;
    }

    if (activePosFilter !== 'ALL' && w.loai_tu !== activePosFilter) {
      return false;
    }

    if (activeStatusFilter === 'due') {
      const now = new Date();
      return !w.srs_next_review || new Date(w.srs_next_review) <= now || w.srs_box === 0;
    } else if (activeStatusFilter === 'difficult') {
      return (w.times_reviewed > 0 && w.times_correct / w.times_reviewed < 0.6) || w.srs_box <= 1;
    }

    return true;
  });

  const filteredPool = reviewWords.length > 0 ? reviewWords : currentLangVocabulary;
  
  // Dynamic random shuffle every time filters change or user clicks shuffle
  const finalWordsToPlay = React.useMemo(() => {
    const shuffled = [...filteredPool].sort(() => Math.random() - 0.5);
    if (activeLimitFilter !== 'ALL') {
      return shuffled.slice(0, parseInt(activeLimitFilter, 10));
    }
    return shuffled;
  }, [filteredPool, activeLimitFilter, shuffleKey]);

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
        danh_sach_word_id: finalWordsToPlay.map((w) => w.word_id),
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
            words={finalWordsToPlay}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onRecordSRS={recordSRSRating}
            onExit={() => setSelectedGameMode(null)}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceGame
            words={finalWordsToPlay}
            allWords={currentLangVocabulary}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={() => setSelectedGameMode(null)}
          />
        );
      case 'matching':
        return (
          <MatchingPairsGame
            words={finalWordsToPlay}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={() => setSelectedGameMode(null)}
          />
        );
      case 'fill_blank':
        return (
          <FillInBlankGame
            words={finalWordsToPlay}
            allWords={currentLangVocabulary}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={() => setSelectedGameMode(null)}
          />
        );
      case 'scramble':
        return (
          <SentenceScrambleGame
            grammarItems={currentLangGrammar}
            vocabularyItems={currentLangVocabulary}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={() => setSelectedGameMode(null)}
          />
        );
      case 'picture_guess':
        return (
          <PictureGuessGame
            words={finalWordsToPlay}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={() => setSelectedGameMode(null)}
          />
        );
      case 'hangman':
        return (
          <HangmanGame
            words={finalWordsToPlay}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={() => setSelectedGameMode(null)}
          />
        );
      case 'typing':
        return (
          <TypingPracticeGame
            words={finalWordsToPlay}
            language={currentLanguage}
            onFinish={handleFinishGame}
            onExit={() => setSelectedGameMode(null)}
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
              onClick={() => setShuffleKey((k) => k + 1)}
              className="px-2.5 py-1 bg-[#1A1A1A] text-white hover:bg-stone-800 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition"
              title="Tự động đảo vị trí từ vựng ngẫu nhiên liên tục"
            >
              <span>🎲 XÁO TRỘN ĐỔI TỪ MỚI</span>
            </button>
            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 border border-[#1A1A1A] text-[#1A1A1A]">
              {finalWordsToPlay.length} TỪ HÀNG ĐỢI
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Trạng thái SRS:
            </label>
            <select
              value={activeStatusFilter}
              onChange={(e: any) => setActiveStatusFilter(e.target.value)}
              className="w-full py-2 px-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            >
              <option value="due">Cần ôn hôm nay</option>
              <option value="difficult">Từ khó nhớ</option>
              <option value="all">Toàn bộ kho từ</option>
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
