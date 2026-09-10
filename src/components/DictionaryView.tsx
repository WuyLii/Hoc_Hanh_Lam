import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES, LanguageCode, DictionaryResult, DictionaryHistoryItem, VocabularyItem } from '../types';
import {
  lookupDictionaryApi,
  getDictionaryHistory,
  saveDictionaryHistory,
  toggleStarHistoryItem,
  removeHistoryItem,
  clearDictionaryHistory,
} from '../services/dictionaryService';
import { ttsService } from '../services/ttsService';
import { matchVocabulary } from '../utils/searchHelper';
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
  const { currentLanguage, setCurrentLanguage, currentLangVocabulary, addVocabulary, setActiveNav } = useApp();
  const currentLangInfo = LANGUAGES[currentLanguage];

  const [query, setQuery] = useState('');
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

  // Load history on mount
  useEffect(() => {
    setHistory(getDictionaryHistory());
  }, []);

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
      .filter(({ match }) => match.matches)
      .sort((a, b) => b.match.score - a.match.score)
      .map(({ item }) => item)
      .slice(0, 5);
  }, [query, currentLangVocabulary]);

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

    setQuery(term);
    setLoading(true);
    setError(null);

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
      <div className="border-2 border-[#1A1A1A] bg-white p-6 sm:p-8 editorial-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1A]/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#1A1A1A] text-white text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5">
                PHIÊN BẢN v3.0 MỚI
              </span>
              <span className="text-xs font-mono uppercase text-stone-500 font-bold">
                Song ngữ & Học thuật đối chiếu
              </span>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-4xl text-[#1A1A1A] tracking-tight">
              ĐẠI TỪ ĐIỂN ĐA NGÔN NGỮ
            </h1>
            <p className="font-mono text-xs text-stone-600 max-w-2xl">
              Tra cứu sâu mọi từ vựng ngoại ngữ với phiên âm quốc tế (IPA / Romaja / Pinyin), âm Hán Việt, bảng chia động từ, câu ví dụ thực tế và tự động đồng bộ kho từ SRS.
            </p>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center gap-1 border-2 border-[#1A1A1A] p-1 bg-[#F9F7F2]">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase transition ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{info.flag}</span>
                  <span>{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated 2 AI Architecture Banner */}
        <div className="border border-[#1A1A1A] bg-[#F9F7F2] p-3 text-xs font-mono space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[11px] sm:text-xs">
                CẤP ĐỘC QUYỀN 2 CON AI RIÊNG CHO TRA TỪ ĐIỂN
              </span>
              <span className="text-[9px] bg-[#1A1A1A] text-white px-1.5 py-0.5 font-bold uppercase tracking-wider">
                ĐỘC LẬP 100%
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-900 font-bold bg-emerald-100/90 px-2 py-0.5 border border-emerald-400">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Đảm bảo &ge; 100 từ/ngày không lo hết lượt</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-stone-700 bg-white p-2 border border-stone-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] shrink-0" />
              <div>
                <span className="font-bold text-[#1A1A1A]">AI 1: Gemini 3.8 Flash</span>
                <span className="text-stone-500 block text-[10px]">Học thuật, ngữ nghĩa chuyên sâu & phiên âm IPA/Pinyin chuẩn</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-stone-700 bg-white p-2 border border-stone-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-[#1A1A1A]">AI 2: Gemini Flash Latest</span>
                <span className="text-stone-500 block text-[10px]">Tốc độ cao, đối chiếu song ngữ & Tự động dự phòng thông minh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="space-y-3 pt-2">
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Nhập từ vựng (${currentLangInfo.name}) hoặc nghĩa tiếng Việt cần tra...`}
                className="w-full pl-11 pr-10 py-3 bg-[#F9F7F2] border-2 border-[#1A1A1A] text-sm font-mono text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:bg-white transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-3 text-stone-400 hover:text-[#1A1A1A] p-0.5"
                  title="Xóa tìm kiếm"
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

          {/* Quick Word Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono pt-1">
            <span className="text-stone-500 text-[11px] uppercase font-bold mr-1">Từ gợi ý nhanh:</span>
            {SUGGESTED_WORDS[currentLanguage]?.map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => handleSearch(item.word)}
                className="px-2.5 py-1 bg-[#F9F7F2] border border-stone-300 hover:border-[#1A1A1A] hover:bg-white text-stone-700 text-[11px] transition flex items-center gap-1"
              >
                <span className="font-bold text-[#1A1A1A]">{item.word}</span>
                <span className="text-stone-400 text-[10px]">({item.meaning})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Result & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Result View (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Matched Local Vocabulary Notice */}
          {matchedLocalVocabs.length > 0 && !result && (
            <div className="border-2 border-[#1A1A1A] bg-amber-50 p-4 editorial-shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-900">
                  <Bookmark className="w-4 h-4 text-amber-600" />
                  <span>TÌM THẤY {matchedLocalVocabs.length} TỪ TRONG KHO TỪ VỰNG CỦA BẠN:</span>
                </div>
                <button
                  onClick={() => setActiveNav('vocabulary')}
                  className="text-[11px] font-mono font-bold text-amber-800 underline hover:text-black"
                >
                  Mở Sổ Từ Vựng ➔
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {matchedLocalVocabs.map((vocab) => (
                  <div
                    key={vocab.word_id}
                    onClick={() => handleSearch(vocab.tu)}
                    className="p-2.5 bg-white border border-[#1A1A1A] hover:bg-amber-100/50 cursor-pointer transition flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#1A1A1A]">{vocab.tu}</div>
                      <div className="text-xs text-stone-600 line-clamp-1">{vocab.nghia}</div>
                      {vocab.phien_am && (
                        <div className="text-[10px] font-mono text-stone-400">[{vocab.phien_am}]</div>
                      )}
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 uppercase">
                      Hộp SRS {vocab.srs_box}
                    </span>
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
                onClick={() => handleSearch()}
                className="px-4 py-2 bg-red-600 text-white font-bold uppercase hover:bg-red-700 transition"
              >
                Thử lại ngay
              </button>
            </div>
          )}

          {/* Detailed Dictionary Result */}
          {result && !loading && (
            <div className="border-2 border-[#1A1A1A] bg-white p-6 sm:p-8 editorial-shadow space-y-6">
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

              {/* AI Processing Attribution & Quota Shield Footer */}
              <div className="pt-4 border-t-2 border-[#1A1A1A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-[#1A1A1A]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {result.fromCache
                        ? '⚡ Tải tức thì từ Bộ nhớ đệm (0ms - Tiết kiệm quota)'
                        : `Xử lý bởi: ${result.aiModel || 'Từ điển AI Độc Quyền'}`}
                    </span>
                  </span>
                  {result.turn && !result.fromCache && (
                    <span className="bg-stone-200 text-stone-800 text-[10px] px-1.5 py-0.5 font-bold">
                      Lượt #{result.turn}
                    </span>
                  )}
                  <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 font-semibold text-[10px]">
                    ● Độc quyền 2 AI luân phiên (Không lo hết lượt)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSearch(result.word || query, true)}
                  disabled={loading}
                  className="text-stone-700 hover:text-black font-bold underline transition self-start sm:self-auto"
                >
                  Tra cứu lại (Làm mới AI) ➔
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
                      Xem tất cả
                    </button>
                  </div>
                  {currentLangVocabulary.slice(0, 15).map((v) => (
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

          {/* Quick Study Card */}
          <div className="border-2 border-[#1A1A1A] bg-[#F3EFE6] p-4 font-mono text-xs space-y-2">
            <div className="font-bold uppercase text-[11px] flex items-center gap-1 text-[#1A1A1A]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Lợi ích của Tra Từ Điển v3.0</span>
            </div>
            <ul className="text-stone-600 text-[11px] space-y-1.5 list-disc list-inside">
              <li>Tra cứu 2 chiều tự động (Ngoại ngữ ⇄ Tiếng Việt).</li>
              <li>Tự động bóc tách âm Hán Việt hỗ trợ nhớ siêu nhanh.</li>
              <li>1 click lưu trực tiếp vào sổ từ vựng SRS để ôn tập.</li>
              <li>Phát âm giọng đọc chuẩn bản ngữ cho từng từ & ví dụ.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
