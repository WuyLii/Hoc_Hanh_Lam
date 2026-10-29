import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES, LanguageCode, DictionaryResult, DictionaryHistoryItem, VocabularyItem } from '../types';
import {
  lookupDictionaryApi,
  getDictionaryHistory,
  syncDictionaryHistoryFromSupabase,
  saveDictionaryHistory,
  toggleStarHistoryItem,
  removeHistoryItem,
  clearDictionaryHistory,
} from '../services/dictionaryService';
import { ttsService } from '../services/ttsService';
import { matchVocabulary, findBestVocabularyMatch } from '../utils/searchHelper';
import {
  Search,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Plus,
  Check,
  Clock,
  Star,
  Copy,
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Share2,
  Trash2,
  ExternalLink,
  ChevronRight,
  X,
  AlertCircle,
  Lightbulb,
  Split,
  FileText,
} from 'lucide-react';

const SUGGESTED_WORDS: Record<LanguageCode, { word: string; meaning: string }[]> = {
  ko: [
    { word: '행복하다', meaning: 'Hạnh phúc' },
    { word: '감사하다', meaning: 'Cảm ơn, biết ơn' },
    { word: '노력하다', meaning: 'Nỗ lực, cố gắng' },
    { word: '사랑', meaning: 'Tình yêu' },
    { word: '포기하다', meaning: 'Từ bỏ, bỏ cuộc' },
    { word: '도전', meaning: 'Thử thách, thách thức' },
    { word: '기회', meaning: 'Cơ hội' },
    { word: '친구', meaning: 'Bạn bè' },
  ],
  en: [
    { word: 'resilient', meaning: 'Kiên cường, bền bỉ' },
    { word: 'serendipity', meaning: 'Sự tình cờ may mắn' },
    { word: 'comprehensive', meaning: 'Toàn diện, bao quát' },
    { word: 'implement', meaning: 'Thực hiện, triển khai' },
    { word: 'persevere', meaning: 'Kiên trì, bền chí' },
    { word: 'collaborate', meaning: 'Hợp tác, cộng tác' },
    { word: 'innovative', meaning: 'Đổi mới, sáng tạo' },
    { word: 'eloquent', meaning: 'Lưu loát, hùng biện' },
  ],
  zh: [
    { word: '努力', meaning: 'Nỗ lực, cố gắng' },
    { word: '坚持', meaning: 'Kiên trì, giữ vững' },
    { word: '希望', meaning: 'Hy vọng, kỳ vọng' },
    { word: '成功', meaning: 'Thành công' },
    { word: '幸福', meaning: 'Hạnh phúc' },
    { word: '朋友', meaning: 'Bạn bè' },
    { word: '机会', meaning: 'Cơ hội' },
    { word: '挑战', meaning: 'Thách thức' },
  ],
};

export const DictionaryView: React.FC = () => {
  const { currentUser, currentLanguage, setCurrentLanguage, currentLangVocabulary, addVocabulary, toggleTodayFlashcard, setActiveNav } = useApp();
  const currentLangInfo = LANGUAGES[currentLanguage];

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'auto' | 'target_to_vi' | 'vi_to_target'>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [history, setHistory] = useState<DictionaryHistoryItem[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'history' | 'starred' | 'local'>('history');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount & sync from Supabase
  useEffect(() => {
    setHistory(getDictionaryHistory());
    syncDictionaryHistoryFromSupabase(currentUser.user_id).then((synced) => {
      setHistory(synced);
    });
  }, [currentUser.user_id]);

  // Filter history items by current language
  const currentLangHistory = useMemo(() => {
    return history.filter((h) => h.language === currentLanguage);
  }, [history, currentLanguage]);

  const starredHistory = useMemo(() => {
    return history.filter((h) => h.language === currentLanguage && h.isStarred);
  }, [history, currentLanguage]);

  // Check if current search word exists in user's vocabulary
  const matchedLocalVocabs = useMemo(() => {
    if (!query.trim()) return [];
    return currentLangVocabulary
      .map((item) => ({ item, match: matchVocabulary(item, query, 'both') }))
      .filter(({ match }) => match.matches && match.score >= 500)
      .sort((a, b) => b.match.score - a.match.score)
      .map(({ item }) => item)
      .slice(0, 6);
  }, [query, currentLangVocabulary]);

  // Gợi ý những từ tìm thấy trong kho từ vựng của người dùng
  // CHỈ HIỂN THỊ KHI ĐÃ TÌM KIẾM (khi nào tìm từ thì mới hiện lên, chưa tìm từ thì ẩn đi)
  const suggestedStoreVocabs = useMemo(() => {
    // Khi chưa tìm từ (chưa có result) -> Ẩn hoàn toàn để hiển thị giống ban đầu
    if (!result || !currentLangVocabulary || currentLangVocabulary.length === 0) {
      return [];
    }

    const activeTerm = (result.word || query || '').trim().toLowerCase();
    if (!activeTerm) return [];

    // Tìm các từ trong kho có liên quan đến từ vừa tra cứu
    const matched = currentLangVocabulary
      .map((item) => ({ item, match: matchVocabulary(item, activeTerm, 'both') }))
      .filter(({ match }) => match.matches)
      .sort((a, b) => b.match.score - a.match.score)
      .map(({ item }) => item);

    // Bổ sung các từ cùng chủ đề hoặc bài học nếu có
    const matchedIds = new Set(matched.map((m) => m.word_id));
    const currentTopic = matched[0]?.chu_de;
    const topicComplements = currentLangVocabulary.filter(
      (v) => !matchedIds.has(v.word_id) && currentTopic && v.chu_de === currentTopic
    );

    // Các từ nổi bật khác trong kho (được đánh dấu sao hoặc flashcard)
    const otherComplements = [...currentLangVocabulary]
      .filter((v) => !matchedIds.has(v.word_id) && !topicComplements.some((t) => t.word_id === v.word_id))
      .sort((a, b) => {
        const aPri = (a.is_starred ? 5 : 0) + (a.is_added_today_flashcard ? 4 : 0);
        const bPri = (b.is_starred ? 5 : 0) + (b.is_added_today_flashcard ? 4 : 0);
        return bPri - aPri;
      });

    return [...matched, ...topicComplements, ...otherComplements].slice(0, 6);
  }, [result, query, currentLangVocabulary]);

  // Check if the current result word is already in vocabulary bank
  const isAlreadyInVocab = useMemo(() => {
    if (!result || !result.word) return null;
    const cleanWord = result.word.trim().toLowerCase();
    return currentLangVocabulary.find(
      (v) => v.tu.trim().toLowerCase() === cleanWord
    ) || null;
  }, [result, currentLangVocabulary]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePlayAudio = (text: string, id: string = 'word') => {
    if (!text) return;
    setAudioPlaying(id);
    ttsService.speak(text, currentLanguage, 1.0, () => {
      setAudioPlaying(null);
    });
  };

  const handleSearch = async (searchTerm?: string, forceRefresh = false) => {
    const term = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!term) return;

    // Ẩn gợi ý ngay khi người dùng tìm kiếm (hoặc bấm chọn từ gợi ý)
    setShowSuggestions(false);
    setQuery(term);
    setError(null);

    // Khi tìm những từ đã có sẵn trong kho từ vựng:
    // "kh cần AI phải biên soạn lại quá chi tiết, có thể bê nguyên cái đã có trong kho và đưa ra. Chỉ cần cho thêm 1 ví dụ kèm."
    if (!forceRefresh) {
      // Tìm từ khớp tối ưu và chuẩn xác nhất trong kho từ vựng (chống nhầm lẫn chuỗi con)
      const matchRes = findBestVocabularyMatch(currentLangVocabulary, term, 900);
      const matchedVocab = matchRes ? matchRes.item : null;

      if (matchedVocab) {
        setLoading(false);

        // Bê nguyên cái đã có trong kho và đưa ra, kèm đúng 1 câu ví dụ
        const hasExample = matchedVocab.vi_du && matchedVocab.vi_du.trim().length > 0;
        const examplesList = hasExample
          ? [{ sentence: matchedVocab.vi_du, phonetic: '', translation: matchedVocab.vi_du_dich || '' }]
          : [{
              sentence: currentLanguage === 'en'
                ? `Please practice using the word "${matchedVocab.tu}" in everyday conversations.`
                : currentLanguage === 'ko'
                ? `우리는 매일 "${matchedVocab.tu}"(을/를) 연습합니다.`
                : `我们每天都练习使用"${matchedVocab.tu}"。`,
              phonetic: '',
              translation: `Ví dụ minh họa cho từ "${matchedVocab.tu}": ${matchedVocab.nghia}`,
            }];

        const localResult: DictionaryResult = {
          query: term,
          language: currentLanguage,
          found: true,
          word: matchedVocab.tu,
          originalScript: matchedVocab.tu,
          phonetic: matchedVocab.phien_am || '',
          partOfSpeech: matchedVocab.loai_tu || 'Từ vựng',
          level: matchedVocab.cap_do || 'Cơ bản',
          bai_hoc: matchedVocab.bai_hoc || matchedVocab.chu_de || 'Kho từ cá nhân',
          primaryMeaning: matchedVocab.nghia,
          additionalMeanings: [],
          hanVietOrRoot: matchedVocab.nghia_tieng_han || matchedVocab.phien_am_tieng_han || '',
          englishMeaning: matchedVocab.nghia_tieng_anh || (currentLanguage === 'en' ? matchedVocab.nghia : ''),
          koreanMeaning: matchedVocab.nghia_tieng_han || (currentLanguage === 'ko' ? matchedVocab.nghia : ''),
          chineseMeaning: '',
          definition: `Mục từ sẵn có từ Kho Từ Vựng cá nhân (Hộp SRS ${matchedVocab.srs_box ?? 0}${
            matchedVocab.retention_level ? ` • ${matchedVocab.retention_level === 'nho' ? 'Đã nhớ' : matchedVocab.retention_level === 'hoi_nho' ? 'Hơi nhớ' : matchedVocab.retention_level === 'quen' ? 'Quên' : 'Chưa thuộc'}` : ''
          }). Trích xuất tức thì 0ms không cần AI biên soạn lại, kèm 1 ví dụ thực tế.`,
          examples: examplesList,
          synonyms: [],
          antonyms: [],
          collocations: [],
          conjugationsOrForms: [],
          grammarNotes: matchedVocab.ghi_chu || '',
          mnemonic: matchedVocab.retention_level ? `Trạng thái: Hộp SRS ${matchedVocab.srs_box} (${matchedVocab.retention_level})` : '',
          aiModel: 'Kho Từ Vựng Cá Nhân (Lấy trực tiếp từ kho & 1 ví dụ)',
          aiModelId: 'local-store-direct',
          fromCache: true,
        };

        setResult(localResult);

        // Lưu vào lịch sử tra cứu
        const updated = saveDictionaryHistory({
          query: term,
          word: localResult.word,
          meaning: localResult.primaryMeaning || '',
          language: currentLanguage,
        });
        setHistory(updated);
        return;
      }
    }

    // Nếu từ chưa có trong kho từ vựng hoặc người dùng yêu cầu forceRefresh
    setLoading(true);
    try {
      const res = await lookupDictionaryApi(term, currentLanguage, searchMode, forceRefresh);
      setResult(res);

      if (res && res.word) {
        // Save to history
        const updated = saveDictionaryHistory({
          query: term,
          word: res.word,
          meaning: res.primaryMeaning || '',
          language: currentLanguage,
        });
        setHistory(updated);
      }
    } catch (err: any) {
      console.error('Dictionary search error:', err);
      setError(err?.message || 'Không thể tra từ điển lúc này. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: DictionaryHistoryItem) => {
    setQuery(item.query || item.word);
    handleSearch(item.query || item.word);
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleStarHistoryItem(id);
    setHistory(updated);
    const item = updated.find((h) => h.id === id);
    if (item) {
      toggleTodayFlashcard({
        tu: item.word,
        nghia: item.meaning,
        ngon_ngu: item.language || currentLanguage,
        chu_de: 'Từ điển tra cứu',
        nguon_goc: 'Đại từ điển v3.0',
        retention_level: 'chua_danh_gia',
        is_added_today_flashcard: Boolean(item.isStarred),
        is_starred: Boolean(item.isStarred),
      });
      if (item.isStarred) {
        showToast(`★ Đã đánh sao từ "${item.word}" và thêm vào Flashcard Hôm Nay!`);
      } else {
        showToast(`☆ Đã bỏ đánh sao từ "${item.word}" khỏi Flashcard Hôm Nay.`);
      }
    }
  };

  const handleRemoveHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeHistoryItem(id);
    setHistory(updated);
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử tra cứu của ngôn ngữ này?')) {
      clearDictionaryHistory();
      setHistory([]);
      showToast('Đã xóa toàn bộ lịch sử tra từ điển.');
    }
  };

  const handleSaveToVocabulary = () => {
    if (!result || !result.word) return;

    if (isAlreadyInVocab) {
      showToast(`Từ "${result.word}" đã có trong kho từ vựng (Hộp SRS ${isAlreadyInVocab.srs_box})!`);
      return;
    }

    const firstExample = result.examples && result.examples.length > 0 ? result.examples[0] : null;

    const newVocab: Partial<VocabularyItem> = {
      tu: result.word,
      nghia: result.primaryMeaning || '',
      phien_am: result.phonetic || '',
      loai_tu: result.partOfSpeech || 'Từ vựng',
      vi_du: firstExample ? firstExample.sentence : '',
      vi_du_dich: firstExample ? firstExample.translation : '',
      nghia_tieng_han: result.koreanMeaning || (currentLanguage === 'ko' ? result.hanVietOrRoot : '') || '',
      nghia_tieng_anh: result.englishMeaning || '',
      phien_am_tieng_han: currentLanguage === 'ko' ? result.hanVietOrRoot : '',
      cap_do: result.level || 'Cơ bản',
      chu_de: 'Từ điển tra cứu',
      ngon_ngu: currentLanguage,
      srs_box: 0,
      nguon_goc: 'Đại từ điển v3.0',
    };

    addVocabulary(newVocab);
    showToast(`✅ Đã lưu từ "${result.word}" vào kho từ vựng và kích hoạt chu trình SRS!`);
  };

  const handleToggleTodayFlashcardAction = () => {
    if (!result || !result.word) return;
    const firstExample = result.examples && result.examples.length > 0 ? result.examples[0] : null;

    const resItem = toggleTodayFlashcard({
      word_id: isAlreadyInVocab?.word_id,
      tu: result.word,
      nghia: result.primaryMeaning || '',
      phien_am: result.phonetic || '',
      loai_tu: result.partOfSpeech || 'Từ vựng',
      vi_du: firstExample ? firstExample.sentence : '',
      vi_du_dich: firstExample ? firstExample.translation : '',
      nghia_tieng_han: result.koreanMeaning || (currentLanguage === 'ko' ? result.hanVietOrRoot : '') || '',
      nghia_tieng_anh: result.englishMeaning || '',
      phien_am_tieng_han: currentLanguage === 'ko' ? result.hanVietOrRoot : '',
      cap_do: result.level || 'Cơ bản',
      chu_de: 'Từ điển tra cứu',
      ngon_ngu: currentLanguage,
      nguon_goc: 'Đại từ điển v3.0',
    });

    if (resItem?.is_added_today_flashcard) {
      showToast(`★ Đã thêm từ "${result.word}" vào Flashcard Ôn Tập Hôm Nay & CSDL!`);
    } else {
      showToast(`☆ Đã bỏ từ "${result.word}" khỏi danh sách Flashcard Hôm Nay.`);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const textToCopy = `${result.word} ${result.phonetic ? `[${result.phonetic}]` : ''}\nNghĩa: ${result.primaryMeaning}\n${result.definition ? `Định nghĩa: ${result.definition}\n` : ''}${
      result.examples && result.examples.length > 0
        ? `Ví dụ: ${result.examples[0].sentence} - ${result.examples[0].translation}`
        : ''
    }`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Đã sao chép nội dung vào Clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-[#1A1A1A] text-[#F9F7F2] px-4 py-3 border-2 border-white shadow-[4px_4px_0px_0px_#000] font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-stone-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="border-2 border-[#1A1A1A] bg-white p-4 sm:p-6 md:p-8 editorial-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-[#1A1A1A]/20 pb-4">
          <div className="space-y-1">
            <h1 className="font-serif font-black text-2xl sm:text-4xl text-[#1A1A1A] tracking-tight">
              ĐẠI TỪ ĐIỂN ĐA NGÔN NGỮ
            </h1>
            <p className="font-mono text-xs text-stone-600 max-w-2xl leading-relaxed">
              Tra cứu sâu mọi từ vựng ngoại ngữ với phiên âm quốc tế (IPA / Romaja / Pinyin), âm Hán Việt, bảng chia động từ và câu ví dụ thực tế.
            </p>
          </div>

          {/* Language Tabs */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 border-2 border-[#1A1A1A] p-1 bg-[#F9F7F2] w-full sm:w-auto">
            {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
              const info = LANGUAGES[code];
              const isSelected = code === currentLanguage;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setCurrentLanguage(code);
                    setResult(null);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-mono font-bold uppercase transition ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-200 active:bg-stone-300'
                  }`}
                >
                  <span>{info.flag}</span>
                  <span className="truncate">{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="space-y-3 pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (val.trim()) {
                    setShowSuggestions(true);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (query.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                placeholder={`Nhập từ vựng (${currentLangInfo.name}) hoặc nghĩa tiếng Việt cần tra...`}
                className="w-full pl-11 pr-10 py-3 bg-[#F9F7F2] border-2 border-[#1A1A1A] text-sm font-mono text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:bg-white transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setError(null);
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-3 text-stone-400 hover:text-[#1A1A1A] p-0.5"
                  title="Xóa ô nhập để tìm từ mới"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mode Select */}
            <select
              value={searchMode}
              onChange={(e: any) => setSearchMode(e.target.value)}
              className="py-3 px-3 border-2 border-[#1A1A1A] bg-[#F9F7F2] text-xs font-mono font-bold text-[#1A1A1A] focus:outline-none focus:bg-white"
            >
              <option value="auto">🔄 Tự động nhận diện (Hai chiều)</option>
              <option value="target_to_vi">{currentLangInfo.name} ➔ Tiếng Việt</option>
              <option value="vi_to_target">Tiếng Việt ➔ {currentLangInfo.name}</option>
            </select>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] text-xs font-mono font-bold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 transition flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tra cứu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>TRA CỨU TỪ ĐIỂN</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Layout: Result & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Result View (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Gợi ý những từ tìm thấy trong kho từ vựng - Hiện khi đang gõ phím tìm kiếm, ẩn đi sau khi tìm kiếm xong */}
          {showSuggestions && matchedLocalVocabs.length > 0 && (
            <div className="border-2 border-[#1A1A1A] bg-amber-50/95 p-4 editorial-shadow-sm space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300/80 pb-2.5">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-950">
                  <Bookmark className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="uppercase tracking-wide">
                    GỢI Ý {matchedLocalVocabs.length} TỪ TRONG KHO TỪ VỰNG KHỚP VỚI &quot;{query.trim()}&quot;:
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-amber-900">
                  <span className="text-amber-800 text-[10px] bg-amber-200/80 px-2 py-0.5 border border-amber-300">
                    ⚡ Bấm để tra cứu tức thì (0ms & kèm 1 ví dụ)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-stone-500 hover:text-black font-bold transition text-xs"
                    title="Đóng gợi ý"
                  >
                    ✕ Đóng
                  </button>
                </div>
              </div>

              {/* Grid các từ gợi ý trong kho */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-0.5">
                {matchedLocalVocabs.map((vocab) => (
                  <div
                    key={vocab.word_id}
                    onClick={() => handleSearch(vocab.tu)}
                    className="p-2.5 border border-[#1A1A1A] bg-white hover:bg-amber-100/70 hover:shadow-xs transition cursor-pointer flex flex-col justify-between gap-1.5"
                    title={`Bấm để tra cứu tức thì từ "${vocab.tu}"`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-bold text-sm text-[#1A1A1A] truncate">{vocab.tu}</span>
                        <span className="text-[9px] font-mono font-bold bg-amber-600 text-white px-1 py-0.2 shrink-0">
                          Trong kho
                        </span>
                      </div>
                      <div className="text-xs text-stone-700 line-clamp-1">{vocab.nghia}</div>
                      {vocab.phien_am && (
                        <div className="text-[10px] font-mono text-stone-500 truncate">[{vocab.phien_am}]</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono font-bold pt-1 border-t border-stone-200/80">
                      <span className="bg-[#1A1A1A] text-white px-1.5 py-0.5 uppercase">
                        Hộp {vocab.srs_box}
                      </span>
                      <div className="flex items-center gap-1">
                        {vocab.retention_level && (
                          <span className={`px-1.5 py-0.5 uppercase ${
                            vocab.retention_level === 'nho'
                              ? 'bg-emerald-100 text-emerald-800'
                              : vocab.retention_level === 'hoi_nho'
                              ? 'bg-blue-100 text-blue-800'
                              : vocab.retention_level === 'quen'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {vocab.retention_level === 'nho'
                              ? 'Đã nhớ'
                              : vocab.retention_level === 'hoi_nho'
                              ? 'Hơi nhớ'
                              : vocab.retention_level === 'quen'
                              ? 'Quên'
                              : 'Chưa thuộc'}
                          </span>
                        )}
                        {(vocab.is_starred || vocab.is_added_today_flashcard) && (
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="border-2 border-[#1A1A1A] bg-white p-12 editorial-shadow-sm text-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Đang biên soạn mục từ từ Đại Từ Điển...
                </h3>
                <p className="font-mono text-xs text-stone-500">
                  Phân tích ngữ nghĩa, cấu trúc từ, phát âm chuẩn quốc tế, âm Hán Việt và câu ví dụ...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="border-2 border-red-500 bg-red-50 p-6 editorial-shadow-sm text-red-900 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>Không thể hoàn tất tra cứu</span>
              </div>
              <p>{error}</p>
              <button
                onClick={() => handleSearch(query, true)}
                className="px-4 py-2 bg-red-600 text-white font-bold uppercase hover:bg-red-700 transition"
              >
                Thử lại ngay
              </button>
            </div>
          )}

          {/* Detailed Dictionary Result */}
          {result && !loading && (
            <div className="border-2 border-[#1A1A1A] bg-white p-4 sm:p-6 md:p-8 editorial-shadow space-y-5 sm:space-y-6">
              {/* Thông báo nếu từ vừa tìm đã có sẵn trong kho */}
              {isAlreadyInVocab && (
                <div className="p-3 bg-emerald-50 border border-emerald-400 text-emerald-950 text-xs font-mono flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Từ <strong className="font-bold underline">{isAlreadyInVocab.tu}</strong> đã có sẵn trong kho từ vựng của bạn (Hộp SRS {isAlreadyInVocab.srs_box}
                      {isAlreadyInVocab.retention_level ? ` • ${isAlreadyInVocab.retention_level === 'nho' ? 'Đã nhớ' : isAlreadyInVocab.retention_level === 'hoi_nho' ? 'Hơi nhớ' : isAlreadyInVocab.retention_level === 'quen' ? 'Quên' : 'Chưa thuộc'}` : ''}).
                      {result.aiModelId === 'local-store-direct' && ' Đã lấy trực tiếp từ kho kèm 1 ví dụ.'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 font-bold uppercase shrink-0">
                    Có sẵn trong kho
                  </span>
                </div>
              )}
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-[#1A1A1A] pb-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="font-serif font-black text-3xl sm:text-5xl text-[#1A1A1A] tracking-tight">
                      {result.word}
                    </h2>
                    {result.phonetic && (
                      <span className="font-mono text-base sm:text-xl text-stone-600 font-semibold">
                        [{result.phonetic}]
                      </span>
                    )}
                    <button
                      onClick={() => handlePlayAudio(result.word, 'word')}
                      disabled={audioPlaying === 'word'}
                      className={`p-2 border border-[#1A1A1A] rounded-full transition ${
                        audioPlaying === 'word' ? 'bg-amber-300 animate-pulse' : 'bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white'
                      }`}
                      title="Phát âm từ vựng"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    {result.partOfSpeech && (
                      <span className="px-2 py-0.5 bg-[#1A1A1A] text-white font-bold uppercase">
                        {result.partOfSpeech}
                      </span>
                    )}
                    {result.level && (
                      <span className="px-2 py-0.5 bg-stone-200 border border-[#1A1A1A] text-[#1A1A1A] font-bold">
                        {result.level}
                      </span>
                    )}
                    {result.originalScript && (
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-semibold">
                        Chữ gốc: {result.originalScript}
                      </span>
                    )}
                    {result.hanVietOrRoot && (
                      <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold">
                        Hán Việt: {result.hanVietOrRoot}
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleToggleTodayFlashcardAction}
                    className={`flex items-center gap-1.5 px-3.5 py-2 border-2 border-[#1A1A1A] text-xs font-mono font-bold uppercase transition editorial-shadow-sm ${
                      (isAlreadyInVocab?.is_added_today_flashcard || isAlreadyInVocab?.is_starred)
                        ? 'bg-amber-400 text-amber-950 border-amber-800'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-[#1A1A1A]'
                    }`}
                    title="Đánh dấu sao và thêm từ này vào danh sách Flashcard Hôm Nay"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        (isAlreadyInVocab?.is_added_today_flashcard || isAlreadyInVocab?.is_starred)
                          ? 'fill-amber-950 text-amber-950'
                          : 'text-amber-700'
                      }`}
                    />
                    <span>
                      {(isAlreadyInVocab?.is_added_today_flashcard || isAlreadyInVocab?.is_starred)
                        ? '★ ĐÃ ĐÁNH SAO (FLASHCARD HÔM NAY)'
                        : '☆ ĐÁNH SAO / FLASHCARD HÔM NAY'}
                    </span>
                  </button>

                  <button
                    onClick={handleSaveToVocabulary}
                    className={`flex items-center gap-1.5 px-3.5 py-2 border border-[#1A1A1A] text-xs font-mono font-bold uppercase transition ${
                      isAlreadyInVocab
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-500 hover:bg-emerald-100'
                        : 'bg-[#1A1A1A] text-white hover:bg-stone-800'
                    }`}
                  >
                    {isAlreadyInVocab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã lưu (Hộp {isAlreadyInVocab.srs_box})</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-amber-300" />
                        <span>+ Lưu vào kho từ (SRS)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyResult}
                    className="p-2 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-stone-200 text-[#1A1A1A] transition"
                    title="Sao chép nội dung"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Primary Meaning & Definitions */}
              <div className="space-y-3 bg-[#F9F7F2] p-4 sm:p-5 border border-[#1A1A1A]">
                <div className="text-[10px] font-mono font-bold uppercase text-stone-500 tracking-wider">
                  Định nghĩa & Nghĩa tiếng Việt
                </div>
                <div className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
                  {result.primaryMeaning}
                </div>

                {result.additionalMeanings && result.additionalMeanings.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-mono font-bold text-stone-600">Các nét nghĩa mở rộng:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs font-mono text-stone-700 pl-1">
                      {result.additionalMeanings.map((meaning, idx) => (
                        <li key={idx}>{meaning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.definition && (
                  <p className="text-xs font-mono text-stone-600 pt-2 border-t border-[#1A1A1A]/10 italic">
                    💡 {result.definition}
                  </p>
                )}
              </div>

              {/* Multilingual Equivalents */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.englishMeaning && currentLanguage !== 'en' && (
                  <div className="p-3 border border-[#1A1A1A] bg-white space-y-1">
                    <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">🇬🇧 Tiếng Anh:</div>
                    <div className="font-mono text-xs font-bold text-[#1A1A1A]">{result.englishMeaning}</div>
                  </div>
                )}
                {result.koreanMeaning && currentLanguage !== 'ko' && (
                  <div className="p-3 border border-[#1A1A1A] bg-white space-y-1">
                    <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">🇰🇷 Tiếng Hàn:</div>
                    <div className="font-mono text-xs font-bold text-[#1A1A1A]">{result.koreanMeaning}</div>
                  </div>
                )}
                {result.chineseMeaning && currentLanguage !== 'zh' && (
                  <div className="p-3 border border-[#1A1A1A] bg-white space-y-1">
                    <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">🇨🇳 Tiếng Trung:</div>
                    <div className="font-mono text-xs font-bold text-[#1A1A1A]">{result.chineseMeaning}</div>
                  </div>
                )}
              </div>

              {/* Examples Section */}
              {result.examples && result.examples.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#1A1A1A] border-b border-[#1A1A1A]/20 pb-1.5">
                    <FileText className="w-4 h-4 text-stone-600" />
                    <span>Câu ví dụ thực tế trong ngữ cảnh ({result.examples.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {result.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white border border-[#1A1A1A] hover:border-black transition space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm text-[#1A1A1A]">
                            {ex.sentence}
                          </div>
                          <button
                            onClick={() => handlePlayAudio(ex.sentence, `ex-${idx}`)}
                            disabled={audioPlaying === `ex-${idx}`}
                            className={`p-1 text-stone-400 hover:text-[#1A1A1A] transition shrink-0 ${
                              audioPlaying === `ex-${idx}` ? 'text-amber-500 animate-pulse' : ''
                            }`}
                            title="Nghe câu ví dụ"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {ex.phonetic && (
                          <div className="text-[10px] font-mono text-stone-500">[{ex.phonetic}]</div>
                        )}
                        <div className="text-xs font-mono text-stone-600">
                          ➔ {ex.translation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Synonyms & Antonyms */}
              {((result.synonyms && result.synonyms.length > 0) ||
                (result.antonyms && result.antonyms.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {result.synonyms && result.synonyms.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase font-bold text-emerald-800 flex items-center gap-1">
                        <span>≒ Từ đồng nghĩa:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.synonyms.map((syn, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSearch(syn)}
                            className="px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono font-semibold hover:bg-emerald-100 transition"
                          >
                            {syn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.antonyms && result.antonyms.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase font-bold text-red-800 flex items-center gap-1">
                        <span>≠ Từ trái nghĩa:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.antonyms.map((ant, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSearch(ant)}
                            className="px-2 py-1 bg-red-50 border border-red-300 text-red-900 text-xs font-mono font-semibold hover:bg-red-100 transition"
                          >
                            {ant}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collocations */}
              {result.collocations && result.collocations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono uppercase font-bold text-stone-600 flex items-center gap-1">
                    <Split className="w-3.5 h-3.5" />
                    <span>Cụm từ thông dụng & Collocations:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.collocations.map((col, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-stone-100 border border-stone-300 text-[#1A1A1A] text-xs font-mono"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conjugations or Forms */}
              {result.conjugationsOrForms && result.conjugationsOrForms.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono uppercase font-bold text-stone-600">
                    Bảng chia động từ / Dạng từ biến đổi:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {result.conjugationsOrForms.map((item, idx) => (
                      <div key={idx} className="p-2.5 border border-[#1A1A1A] bg-[#F9F7F2] space-y-0.5">
                        <div className="text-[10px] font-mono text-stone-500 uppercase">{item.form}</div>
                        <div className="font-mono text-xs font-bold text-[#1A1A1A]">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar Notes & Mnemonic */}
              {(result.grammarNotes || result.mnemonic) && (
                <div className="space-y-3 pt-2 border-t border-[#1A1A1A]/20">
                  {result.grammarNotes && (
                    <div className="p-3.5 bg-blue-50 border border-blue-300 text-blue-950 font-mono text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-blue-600" />
                        <span>Lưu ý ngữ pháp & Cách sử dụng:</span>
                      </div>
                      <p>{result.grammarNotes}</p>
                    </div>
                  )}

                  {result.mnemonic && (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-950 font-mono text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span>Mẹo ghi nhớ từ vựng:</span>
                      </div>
                      <p>{result.mnemonic}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Clean Result Action Footer */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-stone-500">
                <span className="text-[11px]">
                  {result.aiModelId === 'local-store-direct'
                    ? '✓ Lấy trực tiếp từ kho từ vựng của bạn'
                    : '✓ Mục từ được giải nghĩa chi tiết'}
                </span>

                <button
                  type="button"
                  onClick={() => handleSearch(result.word || query, true)}
                  disabled={loading}
                  className="text-stone-700 hover:text-black font-bold underline transition self-start sm:self-auto text-[11px]"
                >
                  Làm mới tra cứu ➔
                </button>
              </div>
            </div>
          )}

          {/* Initial / Empty State When No Search Executed */}
          {!result && !loading && !error && (
            <div className="border-2 border-[#1A1A1A] bg-white p-8 sm:p-12 editorial-shadow-sm text-center space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-stone-400" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-serif font-black text-xl text-[#1A1A1A]">
                  Sẵn sàng tra cứu bất kỳ từ vựng nào
                </h3>
                <p className="font-mono text-xs text-stone-500">
                  Nhập từ khóa tiếng Hàn, tiếng Anh, tiếng Trung hoặc tiếng Việt vào ô tìm kiếm ở trên để nhận định nghĩa đầy đủ, phát âm bản xứ và mẹo nhớ thông minh.
                </p>
              </div>

              {/* Quick Popular Topics */}
              <div className="pt-4 border-t border-[#1A1A1A]/10 max-w-lg mx-auto">
                <div className="text-[10px] font-mono uppercase font-bold text-stone-500 mb-2">
                  Hoặc chọn thử từ vựng thông dụng:
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_WORDS[currentLanguage]?.slice(0, 5).map((item) => (
                    <button
                      key={item.word}
                      onClick={() => handleSearch(item.word)}
                      className="px-3 py-1.5 border border-[#1A1A1A] bg-[#F9F7F2] text-xs font-mono hover:bg-[#1A1A1A] hover:text-white transition"
                    >
                      {item.word}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History, Starred, & Quick Helpers (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sidebar Panel */}
          <div className="border-2 border-[#1A1A1A] bg-white editorial-shadow-sm">
            {/* Sidebar Tabs */}
            <div className="grid grid-cols-3 border-b-2 border-[#1A1A1A] bg-[#F9F7F2] text-xs font-mono">
              <button
                onClick={() => setSidebarTab('history')}
                className={`py-2.5 px-1 font-bold text-center border-r border-[#1A1A1A] transition flex items-center justify-center gap-1 ${
                  sidebarTab === 'history' ? 'bg-white text-[#1A1A1A]' : 'text-stone-500 hover:bg-stone-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Lịch sử ({currentLangHistory.length})</span>
              </button>

              <button
                onClick={() => setSidebarTab('starred')}
                className={`py-2.5 px-1 font-bold text-center border-r border-[#1A1A1A] transition flex items-center justify-center gap-1 ${
                  sidebarTab === 'starred' ? 'bg-white text-[#1A1A1A]' : 'text-stone-500 hover:bg-stone-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>Đã lưu ({starredHistory.length})</span>
              </button>

              <button
                onClick={() => setSidebarTab('local')}
                className={`py-2.5 px-1 font-bold text-center transition flex items-center justify-center gap-1 ${
                  sidebarTab === 'local' ? 'bg-white text-[#1A1A1A]' : 'text-stone-500 hover:bg-stone-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Sổ từ ({currentLangVocabulary.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 max-h-[500px] overflow-y-auto space-y-2">
              {/* History Tab */}
              {sidebarTab === 'history' && (
                <>
                  {currentLangHistory.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-stone-400">
                      Chưa có lịch sử tra cứu nào trong {currentLangInfo.name}.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-[10px] font-mono text-stone-500">
                        <span>GẦN ĐÂY NHẤT ({currentLangHistory.length})</span>
                        <button
                          onClick={handleClearAllHistory}
                          className="text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa tất cả</span>
                        </button>
                      </div>
                      {currentLangHistory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectHistory(item)}
                          className="p-2.5 bg-[#F9F7F2] border border-stone-300 hover:border-[#1A1A1A] hover:bg-white cursor-pointer transition flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-[#1A1A1A] truncate">{item.word}</div>
                            <div className="text-[11px] text-stone-600 truncate">{item.meaning}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => handleToggleStar(item.id, e)}
                              className="p-1 text-stone-400 hover:text-amber-500"
                              title={item.isStarred ? 'Bỏ lưu' : 'Lưu từ'}
                            >
                              <Star className={`w-3.5 h-3.5 ${item.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => handleRemoveHistory(item.id, e)}
                              className="p-1 text-stone-400 hover:text-red-600"
                              title="Xóa mục này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* Starred Tab */}
              {sidebarTab === 'starred' && (
                <>
                  {starredHistory.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-stone-400">
                      Chưa có từ nào được đánh dấu sao ⭐ trong {currentLangInfo.name}.
                    </div>
                  ) : (
                    starredHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistory(item)}
                        className="p-2.5 bg-amber-50/50 border border-amber-300 hover:border-[#1A1A1A] hover:bg-white cursor-pointer transition flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-[#1A1A1A] truncate">{item.word}</div>
                          <div className="text-[11px] text-stone-600 truncate">{item.meaning}</div>
                        </div>
                        <button
                          onClick={(e) => handleToggleStar(item.id, e)}
                          className="p-1 text-amber-500 shrink-0"
                          title="Bỏ lưu"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Local Vocabulary Tab */}
              {sidebarTab === 'local' && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-[10px] font-mono text-stone-500">
                    <span>TỪ TRONG SỔ TAY ({currentLangVocabulary.length})</span>
                    <button
                      onClick={() => setActiveNav('vocabulary')}
                      className="text-[#1A1A1A] font-bold underline"
                    >
                      Mở quản lý từ
                    </button>
                  </div>
                  {currentLangVocabulary.map((v) => (
                    <div
                      key={v.word_id}
                      onClick={() => handleSearch(v.tu)}
                      className="p-2 bg-[#F9F7F2] border border-stone-200 hover:border-[#1A1A1A] hover:bg-white cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-bold text-[#1A1A1A]">{v.tu}</span>
                        <span className="text-stone-500 text-[11px] ml-1.5">— {v.nghia}</span>
                      </div>
                      <span className="text-[9px] font-mono bg-[#1A1A1A] text-white px-1.5 py-0.2 shrink-0">
                        Box {v.srs_box}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
