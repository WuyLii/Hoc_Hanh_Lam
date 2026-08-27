import React, { useState, useMemo } from 'react';
import { VocabularyItem, LanguageCode, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import {
  X,
  Trash2,
  CopyCheck,
  Check,
  AlertTriangle,
  Sparkles,
  Volume2,
  Search,
  Filter,
  CheckSquare,
  Square,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface DuplicateVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabularyItems: VocabularyItem[];
  onDeleteWords: (wordIds: string[]) => void;
  currentLanguage: LanguageCode;
}

export const DuplicateVocabModal: React.FC<DuplicateVocabModalProps> = ({
  isOpen,
  onClose,
  vocabularyItems,
  onDeleteWords,
  currentLanguage,
}) => {
  const currentLangInfo = LANGUAGES[currentLanguage];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());

  // Group duplicate words by normalized 'tu' (lowercase, trimmed)
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, VocabularyItem[]>();

    vocabularyItems.forEach((item) => {
      const normalizedKey = (item.tu || '').trim().toLowerCase();
      if (!normalizedKey) return;
      if (!map.has(normalizedKey)) {
        map.set(normalizedKey, []);
      }
      map.get(normalizedKey)!.push(item);
    });

    // Keep only keys that have 2 or more items
    const duplicates: { key: string; wordDisplay: string; items: VocabularyItem[] }[] = [];
    map.forEach((items, key) => {
      if (items.length > 1) {
        duplicates.push({
          key,
          wordDisplay: items[0].tu,
          items,
        });
      }
    });

    return duplicates;
  }, [vocabularyItems]);

  // Filter duplicate groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return duplicateGroups;
    const q = searchQuery.toLowerCase().trim();
    return duplicateGroups.filter(
      (g) =>
        g.key.includes(q) ||
        g.items.some(
          (item) =>
            item.nghia.toLowerCase().includes(q) ||
            item.phien_am.toLowerCase().includes(q) ||
            (item.chu_de || '').toLowerCase().includes(q)
        )
    );
  }, [duplicateGroups, searchQuery]);

  // Total excess items (number of items to delete if keeping 1 per group)
  const totalExcessItems = useMemo(() => {
    return duplicateGroups.reduce((acc, g) => acc + (g.items.length - 1), 0);
  }, [duplicateGroups]);

  // Initialize auto-selection on modal open or duplicate change
  React.useEffect(() => {
    if (isOpen) {
      handleAutoSelectOlder();
    }
  }, [isOpen, duplicateGroups]);

  if (!isOpen) return null;

  // Preset Auto-Selection 1: Keep newest entry (highest date or latest array index), mark older ones for deletion
  const handleAutoSelectOlder = () => {
    const newSelected = new Set<string>();
    duplicateGroups.forEach((group) => {
      // Sort items by created_at or word_id
      const sorted = [...group.items].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA; // newest first
      });
      // Keep the newest (index 0), mark all others for deletion
      for (let i = 1; i < sorted.length; i++) {
        newSelected.add(sorted[i].word_id);
      }
    });
    setSelectedForDeletion(newSelected);
  };

  // Preset Auto-Selection 2: Keep highest SRS Box entry, mark lower ones for deletion
  const handleAutoSelectKeepHighestSrs = () => {
    const newSelected = new Set<string>();
    duplicateGroups.forEach((group) => {
      const sorted = [...group.items].sort((a, b) => {
        if ((b.srs_box || 0) !== (a.srs_box || 0)) {
          return (b.srs_box || 0) - (a.srs_box || 0); // highest SRS first
        }
        return (b.times_reviewed || 0) - (a.times_reviewed || 0);
      });
      // Keep index 0, delete the rest
      for (let i = 1; i < sorted.length; i++) {
        newSelected.add(sorted[i].word_id);
      }
    });
    setSelectedForDeletion(newSelected);
  };

  // Preset Auto-Selection 3: Select all duplicates in group except the first item
  const handleAutoSelectExceptFirst = () => {
    const newSelected = new Set<string>();
    duplicateGroups.forEach((group) => {
      for (let i = 1; i < group.items.length; i++) {
        newSelected.add(group.items[i].word_id);
      }
    });
    setSelectedForDeletion(newSelected);
  };

  // Clear all selections
  const handleClearSelections = () => {
    setSelectedForDeletion(new Set());
  };

  // Toggle single item selection
  const handleToggleItem = (wordId: string) => {
    setSelectedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  // Toggle group items (mark all in group for deletion except 1)
  const handleToggleGroupExceptFirst = (groupItems: VocabularyItem[]) => {
    const idsInGroup = groupItems.map((item) => item.word_id);
    const allGroupSelected = groupItems.slice(1).every((item) => selectedForDeletion.has(item.word_id));

    setSelectedForDeletion((prev) => {
      const next = new Set(prev);
      if (allGroupSelected) {
        // Deselect group
        idsInGroup.forEach((id) => next.delete(id));
      } else {
        // Keep 1st item, mark rest for deletion
        next.delete(groupItems[0].word_id);
        for (let i = 1; i < groupItems.length; i++) {
          next.add(groupItems[i].word_id);
        }
      }
      return next;
    });
  };

  // Perform deletion
  const handleConfirmDelete = () => {
    if (selectedForDeletion.size === 0) {
      alert('Vui lòng chọn ít nhất 1 từ vựng trùng lặp để xoá.');
      return;
    }

    const confirmMessage = `⚠️ Bạn có chắc chắn muốn XOÁ VĨNH VIỄN ${selectedForDeletion.size} từ vựng trùng lặp đã chọn không?\nAction này không thể hoàn tác.`;
    if (window.confirm(confirmMessage)) {
      const idsToDelete = Array.from(selectedForDeletion);
      onDeleteWords(idsToDelete);
      alert(`🎉 Đã dọn dẹp và xoá thành công ${idsToDelete.length} từ vựng trùng lặp!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-[#1A1A1A] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 border border-[#1A1A1A] bg-amber-100 text-amber-900">
              <CopyCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-black uppercase tracking-tight text-[#1A1A1A]">
                  Bộ Lọc & Xử Lý Từ Vựng Trùng Lập
                </h2>
                <span className="px-2 py-0.5 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-[10px] font-mono font-bold">
                  {currentLangInfo.name} {currentLangInfo.flag}
                </span>
              </div>
              <p className="text-[11px] font-mono text-stone-600">
                Phát hiện {duplicateGroups.length} nhóm từ trùng ({totalExcessItems} từ dư thừa trong tổng {vocabularyItems.length} từ)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#F9F7F2]">
          {duplicateGroups.length === 0 ? (
            <div className="p-12 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Không phát hiện từ vựng bị trùng lặp!
              </h3>
              <p className="text-xs font-mono text-stone-600 max-w-md mx-auto">
                Tất cả các từ vựng trong kho từ tiếng {currentLangInfo.name} của bạn hiện đều là duy nhất. Không cần dọn dẹp.
              </p>
            </div>
          ) : (
            <>
              {/* Presets & Filter Controls */}
              <div className="p-4 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm từ bị trùng..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Summary counts */}
                  <div className="text-xs font-mono text-stone-700 flex items-center gap-2">
                    <span>Đã chọn xoá:</span>
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-bold border border-[#1A1A1A]">
                      {selectedForDeletion.size} / {vocabularyItems.length} từ
                    </span>
                  </div>
                </div>

                {/* Quick Auto-Selection Presets */}
                <div className="pt-3 border-t border-stone-200">
                  <span className="text-[10px] font-mono font-bold uppercase text-stone-500 block mb-2">
                    ⚙️ TỰ ĐỘNG GỢI Ý CHỌN XOÁ NHANH:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoSelectOlder}
                      className="px-3 py-1.5 border border-[#1A1A1A] bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                      title="Giữ từ mới nhất, chọn xoá các từ cũ hơn"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Giữ từ mới nhất (Xoá từ cũ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoSelectKeepHighestSrs}
                      className="px-3 py-1.5 border border-[#1A1A1A] bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                      title="Giữ bản sao có cấp độ ôn tập SRS cao nhất"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Giữ từ có SRS cao nhất</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoSelectExceptFirst}
                      className="px-3 py-1.5 border border-[#1A1A1A] bg-stone-100 hover:bg-stone-200 text-[#1A1A1A] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Giữ 1 bản sao bất kỳ</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearSelections}
                      className="px-3 py-1.5 border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-xs font-mono font-medium flex items-center gap-1.5 transition ml-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Bỏ chọn tất cả</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grouped Duplicate List */}
              <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-stone-300 font-mono text-xs text-stone-500">
                    Không tìm thấy từ trùng khớp với từ khoá "{searchQuery}".
                  </div>
                ) : (
                  filteredGroups.map((group, groupIdx) => {
                    const selectedInGroupCount = group.items.filter((item) =>
                      selectedForDeletion.has(item.word_id)
                    ).length;

                    return (
                      <div
                        key={group.key}
                        className="bg-white border-2 border-[#1A1A1A] editorial-shadow-sm overflow-hidden"
                      >
                        {/* Group Header */}
                        <div className="px-4 py-2.5 bg-stone-100 border-b-2 border-[#1A1A1A] flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-[#1A1A1A] text-white">
                              #{groupIdx + 1}
                            </span>
                            <span className="font-serif font-black text-lg text-[#1A1A1A]">
                              {group.wordDisplay}
                            </span>
                            <span className="text-xs font-mono text-stone-600 font-bold">
                              ({group.items.length} bản sao)
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-rose-700 font-bold">
                              Đã chọn xoá: {selectedInGroupCount}/{group.items.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleGroupExceptFirst(group.items)}
                              className="px-2.5 py-1 text-[11px] font-mono font-bold border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition"
                            >
                              Toggle nhóm này
                            </button>
                          </div>
                        </div>

                        {/* Duplicate Items Grid inside Group */}
                        <div className="divide-y border-stone-200">
                          {group.items.map((item, itemIdx) => {
                            const isMarkedForDelete = selectedForDeletion.has(item.word_id);

                            return (
                              <div
                                key={item.word_id}
                                onClick={() => handleToggleItem(item.word_id)}
                                className={`p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                  isMarkedForDelete
                                    ? 'bg-rose-50/70 border-l-4 border-l-rose-600'
                                    : 'bg-white border-l-4 border-l-emerald-600 hover:bg-stone-50'
                                }`}
                              >
                                {/* Left Info */}
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-serif font-bold text-base text-[#1A1A1A]">
                                      {item.tu}
                                    </span>
                                    {item.phien_am && (
                                      <span className="text-xs font-mono text-stone-600">
                                        [{item.phien_am}]
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A]">
                                      {item.loai_tu}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 border border-[#1A1A1A] text-amber-900">
                                      {item.cap_do}
                                    </span>
                                    {item.chu_de && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-sky-100 border border-[#1A1A1A] text-sky-900">
                                        {item.chu_de}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs font-serif font-bold text-[#1A1A1A]">
                                    Nghĩa: {item.nghia}
                                  </p>

                                  {item.vi_du && (
                                    <p className="text-[11px] font-serif italic text-stone-600">
                                      "{item.vi_du}" {item.vi_du_dich ? `→ ${item.vi_du_dich}` : ''}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-stone-500 pt-1">
                                    <span>Ngày tạo: {item.created_at || 'Không rõ'}</span>
                                    <span>•</span>
                                    <span>SRS Box: {item.srs_box || 0}</span>
                                    <span>•</span>
                                    <span>Đã ôn: {item.times_reviewed || 0} lần</span>
                                    <span>•</span>
                                    <span>Nguồn: {item.nguon_goc || 'Tự tạo'}</span>
                                  </div>
                                </div>

                                {/* Right Controls */}
                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      ttsService.speak(item.tu, currentLanguage);
                                    }}
                                    className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition"
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="flex items-center gap-2">
                                    {isMarkedForDelete ? (
                                      <span className="px-3 py-1.5 border-2 border-rose-800 bg-rose-600 text-white font-mono text-xs font-bold flex items-center gap-1.5">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>XOÁ BẢN SAO NÀY</span>
                                      </span>
                                    ) : (
                                      <span className="px-3 py-1.5 border-2 border-emerald-800 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>GIỮ LẠI (KHÔNG XOÁ)</span>
                                      </span>
                                    )}

                                    <input
                                      type="checkbox"
                                      checked={isMarkedForDelete}
                                      onChange={() => handleToggleItem(item.word_id)}
                                      className="w-5 h-5 accent-rose-600 cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Action Bar */}
        {duplicateGroups.length > 0 && (
          <div className="px-5 py-3.5 border-t-2 border-[#1A1A1A] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono text-[#1A1A1A] font-bold">
              Tổng số từ sẽ xoá: <span className="text-rose-600 text-sm font-black">{selectedForDeletion.size}</span> từ vựng
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 border-2 border-[#1A1A1A] bg-white hover:bg-stone-100 text-xs font-mono font-bold uppercase"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={selectedForDeletion.size === 0}
                className="flex-1 sm:flex-none px-6 py-2 border-2 border-[#1A1A1A] bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>XOÁ {selectedForDeletion.size} TỪ TRÙNG LẬP DÃ CHỌN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
