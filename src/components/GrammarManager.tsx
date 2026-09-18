import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GrammarItem, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import { SpeakButton } from './SpeakButton';
import { TextbookExtractorModal } from './TextbookExtractorModal';
import { matchGrammar } from '../utils/searchHelper';
import koreanGrammarSeed from '../data/koreanGrammarData.json';
import {
  Plus,
  Search,
  Volume2,
  Trash2,
  Edit2,
  X,
  BookMarked,
  Layers,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

const KOREAN_LESSONS = [
  { id: 'ALL', label: 'Tất cả bài', icon: '📚' },
  { id: 'Bài 1', label: 'Bài 1: Giới thiệu (소개)', icon: '👋' },
  { id: 'Bài 2', label: 'Bài 2: Trường học (학교)', icon: '🏫' },
  { id: 'Bài 3', label: 'Bài 3: Sinh hoạt (일상생활)', icon: '☕' },
  { id: 'Bài 4', label: 'Bài 4: Mua sắm (쇼핑)', icon: '🛍️' },
  { id: 'Bài 5', label: 'Bài 5: Ngày & Thứ (날짜와 요일)', icon: '📅' },
  { id: 'Bài 6', label: 'Bài 6: Lịch trình (하루 일과)', icon: '⏰' },
  { id: 'Bài 7', label: 'Bài 7: Thời tiết (날씨)', icon: '☀️' },
  { id: 'Bài 8', label: 'Bài 8: Điện thoại (전화)', icon: '📞' },
  { id: 'Bài 9', label: 'Bài 9: Ngày nghỉ (휴일)', icon: '🏖️' },
];

export const GrammarManager: React.FC = () => {
  const {
    currentLanguage,
    currentLangGrammar,
    addGrammar,
    batchAddGrammar,
    updateGrammar,
    deleteGrammar,
    selectedLevelFilter,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(selectedLevelFilter || 'ALL');
  const [selectedLesson, setSelectedLesson] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedLevelFilter) {
      setSelectedLevel(selectedLevelFilter);
    }
  }, [selectedLevelFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTextbookModalOpen, setIsTextbookModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GrammarItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formStructure, setFormStructure] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formExampleVi, setFormExampleVi] = useState('');
  const [formLevel, setFormLevel] = useState(currentLangInfo.levels[0] || 'Cơ bản');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('Ngữ pháp cốt lõi');

  const resetForm = () => {
    setFormStructure('');
    setFormExplanation('');
    setFormExample('');
    setFormExampleVi('');
    setFormLevel(currentLangInfo.levels[0] || 'Cơ bản');
    setFormNotes('');
    setFormTags('Ngữ pháp cốt lõi');
    setEditingItem(null);
    setFormError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GrammarItem) => {
    setEditingItem(item);
    setFormStructure(item.cau_truc);
    setFormExplanation(item.giai_thich);
    setFormExample(item.vi_du);
    setFormExampleVi(item.vi_du_dich);
    setFormLevel(item.cap_do);
    setFormNotes(item.ghi_chu || '');
    setFormTags(item.tags?.join(', ') || 'Ngữ pháp');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveGrammar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStructure.trim() || !formExplanation.trim()) {
      setFormError('Vui lòng nhập cấu trúc câu và giải thích!');
      return;
    }

    const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingItem) {
      updateGrammar({
        ...editingItem,
        cau_truc: formStructure.trim(),
        giai_thich: formExplanation.trim(),
        vi_du: formExample.trim(),
        vi_du_dich: formExampleVi.trim(),
        cap_do: formLevel,
        ghi_chu: formNotes.trim(),
        tags: tagsArray,
      });
    } else {
      addGrammar({
        cau_truc: formStructure.trim(),
        giai_thich: formExplanation.trim(),
        vi_du: formExample.trim(),
        vi_du_dich: formExampleVi.trim(),
        cap_do: formLevel,
        ghi_chu: formNotes.trim(),
        tags: tagsArray,
        ngon_ngu: currentLanguage,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleReloadKoreanCurriculum = () => {
    const count = batchAddGrammar(koreanGrammarSeed as GrammarItem[]);
    setToastMessage(`Đã nạp đầy đủ ${koreanGrammarSeed.length} ngữ pháp Sơ Cấp 1 (Bài 1 - Bài 9)!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter & Rank Grammar Items with smart symbol, tone-insensitive search, and lesson tags
  const filteredGrammar = useMemo(() => {
    const scored = currentLangGrammar
      .map((g) => {
        const matchLevel =
          selectedLevel === 'ALL' ||
          g.cap_do === selectedLevel ||
          (selectedLevel && g.cap_do && (
            g.cap_do.toLowerCase().includes(selectedLevel.toLowerCase()) ||
            selectedLevel.toLowerCase().includes(g.cap_do.toLowerCase())
          ));
        if (!matchLevel) return null;

        if (selectedLesson !== 'ALL') {
          const hasLessonTag = g.tags?.some((t) =>
            t.toLowerCase().includes(selectedLesson.toLowerCase())
          );
          if (!hasLessonTag) return null;
        }

        const res = matchGrammar(g, searchQuery);
        if (!res.matches) return null;

        return { item: g, score: res.score };
      })
      .filter((entry): entry is { item: GrammarItem; score: number } => entry !== null);

    return scored
      .sort((a, b) => {
        if (searchQuery.trim() && b.score !== a.score) {
          return b.score - a.score;
        }
        return (a.item.grammar_id || '').localeCompare(b.item.grammar_id || '');
      })
      .map((entry) => entry.item);
  }, [currentLangGrammar, selectedLevel, selectedLesson, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b-2 border-[#1A1A1A] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
              Grammar Syntheses — {currentLangInfo.name}
            </h1>
            <span className="text-2xl">{currentLangInfo.flag}</span>
            <span className="px-2 py-0.5 border border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold">
              {currentLangGrammar.length} PATTERNS
            </span>
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-1">
            Rules, Sentence Patterns, and Syntax Architecture • Sơ Cấp 1 (Bài 1 → Bài 9)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentLanguage === 'ko' && (
            <button
              onClick={handleReloadKoreanCurriculum}
              className="flex items-center gap-1.5 px-3.5 py-2.5 border-2 border-emerald-800 bg-emerald-100 text-emerald-950 hover:bg-emerald-200 text-xs font-mono font-bold uppercase tracking-wider transition editorial-shadow-sm"
              title="Đồng bộ lại toàn bộ 38 cấu trúc ngữ pháp Sơ cấp 1 từ Bài 1 đến Bài 9"
            >
              <RefreshCw className="w-4 h-4 text-emerald-700" />
              <span>NẠP SƠ CẤP 1 (BÀI 1-9)</span>
            </button>
          )}

          <button
            onClick={() => setIsTextbookModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 border-2 border-amber-800 bg-amber-100 text-amber-950 hover:bg-amber-200 text-xs font-mono font-bold uppercase tracking-wider transition editorial-shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>🤖 AI TRÍCH XUẤT</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ THÊM NGỮ PHÁP</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-600 text-white font-mono text-xs font-bold border-2 border-[#1A1A1A] editorial-shadow-sm animate-pulse">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Korean Lesson Filter Chips */}
      {currentLanguage === 'ko' && (
        <div className="bg-[#F4F1EA] border-2 border-[#1A1A1A] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-stone-700" />
              Chọn bài học Sơ Cấp 1 (Giáo trình Tiếng Hàn Sơ Cấp 1):
            </span>
            <span className="text-[11px] font-mono text-stone-600">
              {selectedLesson === 'ALL' ? 'Tất cả bài (1 - 9)' : selectedLesson}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KOREAN_LESSONS.map((ls) => {
              const isActive = selectedLesson === ls.id;
              const countInLesson =
                ls.id === 'ALL'
                  ? currentLangGrammar.length
                  : currentLangGrammar.filter((g) =>
                      g.tags?.some((t) => t.toLowerCase().includes(ls.id.toLowerCase()))
                    ).length;

              return (
                <button
                  key={ls.id}
                  onClick={() => setSelectedLesson(ls.id)}
                  className={`px-2.5 py-1.5 text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm'
                      : 'bg-white text-stone-800 border-stone-300 hover:border-[#1A1A1A] hover:bg-stone-100'
                  }`}
                >
                  <span>{ls.icon}</span>
                  <span>{ls.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white text-[#1A1A1A]' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {countInLesson}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar with View Mode Toggle */}
      <div className="bg-white border-2 border-[#1A1A1A] editorial-shadow-sm p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
            <input
              id="grammar-search-input"
              type="text"
              placeholder="Tìm kiếm tập trung theo cấu trúc hoặc giải thích ngữ pháp (có/không dấu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:bg-white transition"
            />
            {searchQuery && (
              <button
                id="clear-grammar-search-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-[#1A1A1A] transition"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="sm:col-span-4">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full py-2 px-3 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            >
              <option value="ALL">ALL LEVELS ({currentLangInfo.levels.length})</option>
              {currentLangInfo.levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {searchQuery && (
          <div className="flex items-center justify-between gap-2 text-xs font-mono bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5">
            <span>
              Tìm thấy <strong>{filteredGrammar.length}</strong> cấu trúc ngữ pháp khớp với &quot;{searchQuery}&quot;
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-emerald-700 hover:text-red-600 font-bold underline"
            >
              Bỏ lọc
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]/20 text-xs font-mono">
          <div className="text-stone-600">
            SHOWING <strong className="text-[#1A1A1A]">{filteredGrammar.length}</strong> OF {currentLangGrammar.length} RULES
            {selectedLesson !== 'ALL' && <span className="ml-2 text-indigo-700 font-bold">({selectedLesson})</span>}
          </div>

          <div className="flex items-center gap-1 border border-[#1A1A1A] p-0.5 bg-[#F9F7F2]">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                viewMode === 'grid' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-stone-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>GRID</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                viewMode === 'list' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-stone-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>LIST</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grammar Cards List */}
      {filteredGrammar.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3">
          <BookMarked className="w-8 h-8 mx-auto text-stone-400" />
          <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
            {searchQuery ? `Không tìm thấy cấu trúc ngữ pháp nào khớp với "${searchQuery}"` : 'Chưa có cấu trúc ngữ pháp nào'}
          </h3>
          <p className="text-xs font-mono text-stone-500 max-w-md mx-auto">
            {searchQuery
              ? 'Thử tìm từ khóa không dấu hoặc kiểm tra lại cấu trúc / giải thích ngữ pháp.'
              : 'Ghi chép các cấu trúc ngữ pháp quan trọng để luyện tập ghép câu và nâng cao kỹ năng diễn đạt.'}
          </p>
          {searchQuery ? (
            <button
              id="clear-grammar-empty-btn"
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-stone-800 transition"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          ) : (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-stone-800 transition"
            >
              + ADD_FIRST_RULE
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrammar.map((item) => (
            <div
              key={item.grammar_id}
              className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm hover:editorial-shadow transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
                  <span className="px-2 py-0.5 bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase">
                    {item.cap_do}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                      title="Edit Rule"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove rule "${item.cau_truc}"?`)) {
                          deleteGrammar(item.grammar_id);
                        }
                      }}
                      className="p-1 border border-[#1A1A1A] hover:bg-rose-900 hover:text-white transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-mono font-black text-[#1A1A1A] tracking-tight">
                  {item.cau_truc}
                </h3>

                <p className="text-sm font-serif text-[#1A1A1A] leading-relaxed line-clamp-3">
                  {item.giai_thich}
                </p>

                {item.vi_du && (
                  <div className="p-2.5 bg-[#F9F7F2] border-l-2 border-[#1A1A1A] text-xs flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif italic text-[#1A1A1A]">"{item.vi_du}"</p>
                      {item.vi_du_dich && (
                        <p className="text-stone-600 font-mono text-[10px] mt-0.5">→ {item.vi_du_dich}</p>
                      )}
                    </div>
                    <SpeakButton
                      text={item.vi_du}
                      language={item.ngon_ngu}
                      variant="card"
                      position="left"
                      buttonClassName="bg-white p-1 shrink-0"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#1A1A1A]/20 flex flex-wrap gap-1">
                {item.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-stone-700 text-[9px] font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGrammar.map((item) => (
            <div
              key={item.grammar_id}
              className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm hover:editorial-shadow transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#1A1A1A]/15 pb-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase">
                      {item.cap_do}
                    </span>
                    {item.tags?.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-stone-700 text-[10px] font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-mono font-black text-[#1A1A1A] tracking-tight">
                    {item.cau_truc}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                    title="Edit Rule"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete grammar rule "${item.cau_truc}"?`)) {
                        deleteGrammar(item.grammar_id);
                      }
                    }}
                    className="p-1.5 border border-[#1A1A1A] hover:bg-rose-900 hover:text-white transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-sm sm:text-base font-serif text-[#1A1A1A] leading-relaxed">
                {item.giai_thich}
              </p>

              {/* Example Box */}
              {item.vi_du && (
                <div className="p-4 bg-[#F9F7F2] border-l-4 border-[#1A1A1A] border-y border-r border-[#1A1A1A]/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base font-serif font-bold text-[#1A1A1A]">
                      "{item.vi_du}"
                    </p>
                    {item.vi_du_dich && (
                      <p className="text-xs font-mono text-stone-600">→ {item.vi_du_dich}</p>
                    )}
                  </div>
                  <SpeakButton
                    text={item.vi_du}
                    language={item.ngon_ngu}
                    variant="card"
                    position="left"
                    buttonClassName="bg-white p-2 shrink-0"
                    title="Nhấn để phát âm 1x • Rê chuột hoặc giữ để chọn tốc độ"
                  />
                </div>
              )}

              {/* Notes */}
              {item.ghi_chu && (
                <div className="text-xs font-mono text-[#1A1A1A] bg-[#F9F7F2] border border-[#1A1A1A] p-3 flex items-start gap-2">
                  <span className="font-bold shrink-0">NOTE:</span>
                  <span>{item.ghi_chu}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Grammar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b-2 border-[#1A1A1A] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentLangInfo.flag}</span>
                <h2 className="text-base font-serif font-black uppercase tracking-tight text-[#1A1A1A]">
                  {editingItem ? 'EDIT GRAMMAR FORMULA' : 'NEW GRAMMAR FORMULA'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrammar} className="p-6 space-y-4 overflow-y-auto flex-1 bg-[#F9F7F2]">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-500 text-rose-800 text-xs font-mono">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                  Grammar Structure / Formula *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S + had + V3/ed ..., -아/어야 하다, 无论……都……"
                  value={formStructure}
                  onChange={(e) => setFormStructure(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#1A1A1A] text-sm font-mono text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                  Explanation & Usage Rules *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain usage, nuanced contexts, common collocations..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#1A1A1A] text-xs font-serif text-[#1A1A1A] focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A]">
                  Illustrative Sentence & Translation
                </label>
                <textarea
                  rows={2}
                  placeholder="Example sentence using this grammar structure..."
                  value={formExample}
                  onChange={(e) => setFormExample(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-serif text-[#1A1A1A] focus:outline-none resize-none"
                />
                <input
                  type="text"
                  placeholder="Vietnamese translation..."
                  value={formExampleVi}
                  onChange={(e) => setFormExampleVi(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-serif text-[#1A1A1A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-mono uppercase font-bold text-stone-600 mb-1">Level</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
                  >
                    {currentLangInfo.levels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase font-bold text-stone-600 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Mệnh đề, Điều kiện, HSK 4..."
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono uppercase font-bold text-stone-600 mb-1">Special Notes / Nuances</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Không đi kèm với câu mệnh lệnh..."
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
                />
              </div>

              <div className="pt-4 border-t border-[#1A1A1A] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#1A1A1A] bg-white hover:bg-stone-200 text-xs font-mono font-bold uppercase text-[#1A1A1A]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm"
                >
                  {editingItem ? 'SAVE_CHANGES' : 'COMMIT_RULE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Textbook Extractor Modal */}
      <TextbookExtractorModal
        isOpen={isTextbookModalOpen}
        onClose={() => setIsTextbookModalOpen(false)}
      />
    </div>
  );
};
