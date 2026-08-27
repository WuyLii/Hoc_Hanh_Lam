import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { VocabularyItem, LANGUAGES } from '../types';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { ttsService } from '../services/ttsService';
import { TextbookExtractorModal } from './TextbookExtractorModal';
import { DuplicateVocabModal } from './DuplicateVocabModal';
import {
  Plus,
  Search,
  Download,
  Upload,
  Sparkles,
  Volume2,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  CopyCheck,
} from 'lucide-react';

export const VocabularyManager: React.FC = () => {
  const {
    currentLanguage,
    currentLangVocabulary,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    batchDeleteVocabulary,
    batchAddVocabulary,
    selectedLevelFilter,
    setSelectedLevelFilter,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState(selectedLevelFilter || 'ALL');
  const [selectedSrsBox, setSelectedSrsBox] = useState('ALL');
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'srs'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isTextbookModalOpen, setIsTextbookModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  React.useEffect(() => {
    if (selectedLevelFilter) {
      setSelectedLevel(selectedLevelFilter);
    }
  }, [selectedLevelFilter]);

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);

  // Form Fields
  const [formWord, setFormWord] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formPhonetic, setFormPhonetic] = useState('');
  const [formType, setFormType] = useState('Danh từ');
  const [formExample, setFormExample] = useState('');
  const [formExampleVi, setFormExampleVi] = useState('');
  const [formLevel, setFormLevel] = useState(currentLangInfo.levels[0] || 'Cơ bản');
  const [formTopic, setFormTopic] = useState('Giao tiếp');
  const [formSource, setFormSource] = useState('Tự học');

  // Unique topics in current list
  const topics = Array.from(new Set(currentLangVocabulary.map((w) => w.chu_de || 'Tổng hợp'))).filter(Boolean);

  const resetForm = () => {
    setFormWord('');
    setFormMeaning('');
    setFormPhonetic('');
    setFormType('Danh từ');
    setFormExample('');
    setFormExampleVi('');
    setFormLevel(currentLangInfo.levels[0] || 'Cơ bản');
    setFormTopic('Giao tiếp');
    setFormSource('Tự học');
    setEditingItem(null);
    setAiError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: VocabularyItem) => {
    setEditingItem(item);
    setFormWord(item.tu);
    setFormMeaning(item.nghia);
    setFormPhonetic(item.phien_am);
    setFormType(item.loai_tu);
    setFormExample(item.vi_du);
    setFormExampleVi(item.vi_du_dich);
    setFormLevel(item.cap_do);
    setFormTopic(item.chu_de);
    setFormSource(item.nguon_goc || 'Tự học');
    setAiError(null);
    setIsModalOpen(true);
  };

  // AI Auto-Enrichment Handler
  const handleAiAutoEnrich = async () => {
    if (!formWord.trim()) {
      setAiError('Vui lòng nhập từ hoặc cụm từ trước');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/gemini/generate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: formWord.trim(),
          language: currentLanguage,
          meaning: formMeaning.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể kết nối máy chủ AI');
      }

      const data = await response.json();
      if (data.meaning && !formMeaning) setFormMeaning(data.meaning);
      if (data.phonetic) setFormPhonetic(data.phonetic);
      if (data.type) setFormType(data.type);
      if (data.example) setFormExample(data.example);
      if (data.exampleVi) setFormExampleVi(data.exampleVi);
      if (data.level) setFormLevel(data.level);
      if (data.topic) setFormTopic(data.topic);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Lỗi khi gọi AI làm giàu từ vựng');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim() || !formMeaning.trim()) {
      setAiError('Vui lòng nhập từ và nghĩa tiếng Việt');
      return;
    }

    if (editingItem) {
      updateVocabulary({
        ...editingItem,
        tu: formWord.trim(),
        nghia: formMeaning.trim(),
        phien_am: formPhonetic.trim(),
        loai_tu: formType,
        vi_du: formExample.trim(),
        vi_du_dich: formExampleVi.trim(),
        cap_do: formLevel,
        chu_de: formTopic,
        nguon_goc: formSource,
      });
    } else {
      addVocabulary({
        tu: formWord.trim(),
        nghia: formMeaning.trim(),
        phien_am: formPhonetic.trim(),
        loai_tu: formType,
        vi_du: formExample.trim(),
        vi_du_dich: formExampleVi.trim(),
        cap_do: formLevel,
        chu_de: formTopic,
        nguon_goc: formSource,
        ngon_ngu: currentLanguage,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  // CSV Import / Export
  const handleExportCSV = () => {
    GoogleSheetsService.exportToCSV(`PolyglotHub_Vocab_${currentLanguage.toUpperCase()}`, currentLangVocabulary);
  };

  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const rows = GoogleSheetsService.parseCSV(text);
        const count = batchAddVocabulary(
          rows.map((r) => ({
            tu: r.tu || r.word || r.vocabulary || '',
            nghia: r.nghia || r.meaning || '',
            phien_am: r.phien_am || r.phonetic || '',
            loai_tu: r.loai_tu || r.type || 'Từ vựng',
            vi_du: r.vi_du || r.example || '',
            vi_du_dich: r.vi_du_dich || r.example_meaning || '',
            cap_do: r.cap_do || r.level || 'Cơ bản',
            chu_de: r.chu_de || r.topic || 'Import CSV',
            ngon_ngu: currentLanguage,
          }))
        );
        alert(`Đã nhập thành công ${count} từ vựng mới vào kho!`);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Calculate duplicate words set for fast lookup
  const duplicateWordSet = React.useMemo(() => {
    const counts = new Map<string, number>();
    currentLangVocabulary.forEach((w) => {
      const k = (w.tu || '').trim().toLowerCase();
      if (k) counts.set(k, (counts.get(k) || 0) + 1);
    });
    const dups = new Set<string>();
    counts.forEach((count, key) => {
      if (count > 1) dups.add(key);
    });
    return dups;
  }, [currentLangVocabulary]);

  // Filtered & Sorted Vocabulary
  const filteredWords = currentLangVocabulary.filter((w) => {
    const normWord = (w.tu || '').trim().toLowerCase();
    const isDuplicate = duplicateWordSet.has(normWord);

    if (showOnlyDuplicates && !isDuplicate) return false;

    const matchQuery =
      w.tu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.nghia.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.phien_am && w.phien_am.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchTopic = selectedTopic === 'ALL' || w.chu_de === selectedTopic;
    const matchLevel =
      selectedLevel === 'ALL' ||
      w.cap_do === selectedLevel ||
      (selectedLevel && w.cap_do && (
        w.cap_do.toLowerCase().includes(selectedLevel.toLowerCase()) ||
        selectedLevel.toLowerCase().includes(w.cap_do.toLowerCase())
      ));
    const matchSrs =
      selectedSrsBox === 'ALL' ||
      (selectedSrsBox === 'new' && (w.srs_box === 0 || !w.times_reviewed)) ||
      (selectedSrsBox === 'learning' && w.srs_box >= 1 && w.srs_box <= 3) ||
      (selectedSrsBox === 'mastered' && w.srs_box >= 4);

    return matchQuery && matchTopic && matchLevel && matchSrs;
  });

  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortBy === 'alphabetical') return a.tu.localeCompare(b.tu);
    if (sortBy === 'srs') return (a.srs_box || 0) - (b.srs_box || 0);
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header & Action Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b-2 border-[#1A1A1A] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
              Lexicon & Glossary — {currentLangInfo.name}
            </h1>
            <span className="text-2xl">{currentLangInfo.flag}</span>
            <span className="px-2 py-0.5 border border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold">
              {currentLangVocabulary.length} TERMS
            </span>
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-1">
            SRS SM-2 SuperMemo Repetition Protocol • {currentLangInfo.phoneticLabel} Accents
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.txt"
            className="hidden"
          />

          <button
            onClick={() => setIsDuplicateModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-2 text-xs font-mono font-bold uppercase tracking-wider transition editorial-shadow-sm ${
              duplicateWordSet.size > 0
                ? 'border-rose-800 bg-rose-100 text-rose-950 hover:bg-rose-200'
                : 'border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2]'
            }`}
            title="Lọc & Dọn Dẹp Từ Vựng Trùng Lập"
          >
            <CopyCheck className={`w-3.5 h-3.5 ${duplicateWordSet.size > 0 ? 'text-rose-700 font-bold' : ''}`} />
            <span>
              {duplicateWordSet.size > 0
                ? `🔍 XỬ LÝ TỪ TRÙNG (${duplicateWordSet.size} NHÓM)`
                : '🔍 LỌC TỪ TRÙNG'}
            </span>
          </button>

          <button
            onClick={() => setIsTextbookModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-amber-800 bg-amber-100 text-amber-950 hover:bg-amber-200 text-xs font-mono font-bold uppercase tracking-wider transition editorial-shadow-sm"
            title="Đọc sách & trích xuất AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>🤖 AI ĐỌC SÁCH & TRÍCH XUẤT</span>
          </button>

          <button
            onClick={handleImportCSVClick}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider transition"
            title="Import CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT_CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider transition"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT_CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ NEW_TERM</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Search keyword, definition, ${currentLangInfo.phoneticLabel}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F9F7F2] border border-[#1A1A1A] text-xs text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:bg-white font-mono transition"
            />
          </div>

          {/* Topic Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full py-2 px-3 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:bg-white"
            >
              <option value="ALL">ALL TOPICS ({topics.length})</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full py-2 px-3 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:bg-white"
            >
              <option value="ALL">ALL LEVELS</option>
              {currentLangInfo.levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* SRS Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedSrsBox}
              onChange={(e) => setSelectedSrsBox(e.target.value)}
              className="w-full py-2 px-3 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:bg-white"
            >
              <option value="ALL">ALL SRS</option>
              <option value="new">NEW (BOX 0)</option>
              <option value="learning">LEARNING (1-3)</option>
              <option value="mastered">MASTERED (4-5)</option>
            </select>
          </div>
        </div>

        {/* Sort & View Mode Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-[#1A1A1A]/20 text-xs font-mono gap-3">
          <div className="flex items-center gap-3">
            <span className="text-stone-600">
              SHOWING <strong className="text-[#1A1A1A]">{sortedWords.length}</strong> OF {currentLangVocabulary.length} TERMS
            </span>

            {/* Quick Duplicate Filter Toggle */}
            {duplicateWordSet.size > 0 && (
              <button
                type="button"
                onClick={() => setShowOnlyDuplicates((prev) => !prev)}
                className={`px-2.5 py-1 border text-[10px] font-bold font-mono uppercase transition flex items-center gap-1 ${
                  showOnlyDuplicates
                    ? 'bg-rose-600 text-white border-rose-800'
                    : 'bg-[#F9F7F2] text-rose-900 border-rose-300 hover:border-rose-600'
                }`}
              >
                <CopyCheck className="w-3 h-3" />
                <span>⚠️ CHỈ HIỆN TỪ TRÙNG ({duplicateWordSet.size} NHÓM)</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
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
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                  viewMode === 'table' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-stone-200'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>TABLE</span>
              </button>
            </div>

            {/* Sort Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 uppercase">SORT:</span>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2 py-1 border ${
                  sortBy === 'recent' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-stone-300 hover:border-[#1A1A1A]'
                }`}
              >
                RECENT
              </button>
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`px-2 py-1 border ${
                  sortBy === 'alphabetical' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-stone-300 hover:border-[#1A1A1A]'
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortBy('srs')}
                className={`px-2 py-1 border ${
                  sortBy === 'srs' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-stone-300 hover:border-[#1A1A1A]'
                }`}
              >
                SRS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary Display (Grid or Table) */}
      {sortedWords.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-stone-400" />
          <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">No vocabulary terms found</h3>
          <p className="text-xs font-mono text-stone-500 max-w-sm mx-auto">
            Try adjusting your search criteria or add new words via "+ NEW_TERM" or "IMPORT_CSV".
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border-2 border-[#1A1A1A] editorial-shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] text-[#F9F7F2] font-mono text-xs uppercase">
                <th className="p-3.5 border-b border-[#1A1A1A]">Term</th>
                <th className="p-3.5 border-b border-[#1A1A1A]">Phonetic</th>
                <th className="p-3.5 border-b border-[#1A1A1A]">Meaning</th>
                <th className="p-3.5 border-b border-[#1A1A1A]">Type / Level</th>
                <th className="p-3.5 border-b border-[#1A1A1A]">Topic</th>
                <th className="p-3.5 border-b border-[#1A1A1A]">SRS</th>
                <th className="p-3.5 border-b border-[#1A1A1A] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/20 font-serif text-sm">
              {sortedWords.map((word) => {
                const accuracy = word.times_reviewed > 0 ? Math.round((word.times_correct / word.times_reviewed) * 100) : 0;
                return (
                  <tr key={word.word_id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5 font-bold text-[#1A1A1A] flex items-center gap-2">
                      <button
                        onClick={() => ttsService.speak(word.tu, word.ngon_ngu)}
                        className="p-1 text-stone-600 hover:text-[#1A1A1A] transition"
                        title="Pronounce"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span>{word.tu}</span>
                      {duplicateWordSet.has(word.tu.trim().toLowerCase()) && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-800 text-[9px] font-mono font-bold">
                          ⚠️ TRÙNG
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-stone-600">{word.phien_am || '—'}</td>
                    <td className="p-3.5 text-[#1A1A1A] font-medium">{word.nghia}</td>
                    <td className="p-3.5 font-mono text-xs">
                      <span className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] mr-1">{word.loai_tu}</span>
                      <span className="text-stone-500">{word.cap_do}</span>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-stone-700 uppercase">{word.chu_de}</td>
                    <td className="p-3.5 font-mono text-xs">
                      <div className="flex items-center gap-0.5" title={`SRS Box: ${word.srs_box}/5`}>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <span
                            key={lvl}
                            className={`w-2 h-2 border border-[#1A1A1A] ${
                              (word.srs_box || 0) >= lvl ? 'bg-[#1A1A1A]' : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(word)}
                          className="p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove term "${word.tu}"?`)) {
                              deleteVocabulary(word.word_id);
                            }
                          }}
                          className="p-1.5 border border-[#1A1A1A] hover:bg-rose-900 hover:text-white transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedWords.map((word) => {
            const accuracy = word.times_reviewed > 0 ? Math.round((word.times_correct / word.times_reviewed) * 100) : 0;
            return (
              <div
                key={word.word_id}
                className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm hover:editorial-shadow transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Metadata Badges */}
                  <div className="flex items-center justify-between mb-3 border-b border-[#1A1A1A]/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-[9px] font-mono font-bold uppercase text-[#1A1A1A]">
                        {word.loai_tu}
                      </span>
                      <span className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-[9px] font-mono text-stone-600">
                        {word.cap_do}
                      </span>
                      {duplicateWordSet.has(word.tu.trim().toLowerCase()) && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-800 text-[9px] font-mono font-bold">
                          ⚠️ TRÙNG
                        </span>
                      )}
                    </div>

                    {/* SRS Box Indicator */}
                    <div className="flex items-center gap-1" title={`SuperMemo Box: ${word.srs_box}/5`}>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <span
                          key={lvl}
                          className={`w-2 h-2 border border-[#1A1A1A] ${
                            (word.srs_box || 0) >= lvl ? 'bg-[#1A1A1A]' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Word & Audio */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#1A1A1A]">
                        {word.tu}
                      </h3>
                      {word.phien_am && (
                        <div className="text-xs font-mono text-stone-600 mt-0.5 tracking-wider">
                          {word.phien_am}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => ttsService.speak(word.tu, word.ngon_ngu)}
                      className="p-2 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white transition"
                      title="Pronunciation Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Vietnamese Definition */}
                  <p className="text-base font-serif font-semibold text-[#1A1A1A] mt-3 leading-snug">
                    {word.nghia}
                  </p>

                  {/* Context Example */}
                  {word.vi_du && (
                    <div className="mt-4 p-3 bg-[#F9F7F2] border-l-2 border-[#1A1A1A] border-y border-r border-[#1A1A1A]/20 text-xs">
                      <p className="font-serif italic text-[#1A1A1A]">"{word.vi_du}"</p>
                      {word.vi_du_dich && (
                        <p className="text-stone-600 font-mono text-[10px] mt-1">
                          → {word.vi_du_dich}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Metadata & Actions */}
                <div className="mt-5 pt-3 border-t border-[#1A1A1A] flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600 font-bold uppercase">{word.chu_de}</span>
                    {word.times_reviewed > 0 && (
                      <span className="text-emerald-700 font-bold">✓ {accuracy}%</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(word)}
                      className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove term "${word.tu}"?`)) {
                          deleteVocabulary(word.word_id);
                        }
                      }}
                      className="p-1 border border-[#1A1A1A] hover:bg-rose-900 hover:text-white transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Vocabulary Modal (Editorial Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b-2 border-[#1A1A1A] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentLangInfo.flag}</span>
                <h2 className="text-base font-serif font-black uppercase tracking-tight text-[#1A1A1A]">
                  {editingItem ? 'EDIT VOCABULARY RECORD' : 'NEW VOCABULARY ENTRY'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveWord} className="p-6 space-y-4 overflow-y-auto flex-1 bg-[#F9F7F2]">
              {aiError && (
                <div className="p-3 bg-rose-100 border-2 border-rose-800 text-rose-900 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Word Input + AI Button */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                  Target Term ({currentLangInfo.name}) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Resilient, 缘分, 설레다"
                    value={formWord}
                    onChange={(e) => setFormWord(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-serif text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                  <button
                    type="button"
                    onClick={handleAiAutoEnrich}
                    disabled={isAiLoading || !formWord.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                    <span>{isAiLoading ? 'AI GENERATING...' : 'AI AUTO-FILL'}</span>
                  </button>
                </div>
              </div>

              {/* Meaning */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                  Vietnamese Meaning *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ý nghĩa tiếng Việt chuẩn xác..."
                  value={formMeaning}
                  onChange={(e) => setFormMeaning(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-serif text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                />
              </div>

              {/* Phonetic & Word Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                    Phonetic ({currentLangInfo.phoneticLabel})
                  </label>
                  <input
                    type="text"
                    placeholder="/rɪˈzɪl.jəns/ or pinyin"
                    value={formPhonetic}
                    onChange={(e) => setFormPhonetic(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                    Part of Speech
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
                  >
                    <option value="Danh từ">Danh từ (Noun)</option>
                    <option value="Động từ">Động từ (Verb)</option>
                    <option value="Tính từ">Tính từ (Adjective)</option>
                    <option value="Trạng từ">Trạng từ (Adverb)</option>
                    <option value="Cụm từ">Cụm từ (Phrase)</option>
                    <option value="Thành ngữ">Thành ngữ (Idiom)</option>
                    <option value="Liên từ">Liên từ (Conjunction)</option>
                  </select>
                </div>
              </div>

              {/* Example sentence & Translation */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A]">
                  Context Example & Translation
                </label>
                <textarea
                  rows={2}
                  placeholder="Example sentence in target language..."
                  value={formExample}
                  onChange={(e) => setFormExample(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-serif text-[#1A1A1A] focus:outline-none resize-none"
                />
                <input
                  type="text"
                  placeholder="Vietnamese translation of example sentence..."
                  value={formExampleVi}
                  onChange={(e) => setFormExampleVi(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-serif text-[#1A1A1A] focus:outline-none"
                />
              </div>

              {/* Topic, Level, Source */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-mono uppercase font-bold text-stone-600 mb-1">Topic</label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase font-bold text-stone-600 mb-1">Level</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
                  >
                    {currentLangInfo.levels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase font-bold text-stone-600 mb-1">Source</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
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
                  {editingItem ? 'SAVE_CHANGES' : 'COMMIT_ENTRY'}
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

      {/* Duplicate Vocabulary Management Modal */}
      <DuplicateVocabModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        vocabularyItems={currentLangVocabulary}
        onDeleteWords={(wordIds) => {
          batchDeleteVocabulary(wordIds);
        }}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
