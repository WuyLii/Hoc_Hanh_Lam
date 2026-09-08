import React, { useState, useMemo, useEffect } from 'react';
import { VocabularyItem, LanguageCode, LANGUAGES } from '../types';
import { SpeakButton } from './SpeakButton';
import {
  X,
  Trash2,
  CopyCheck,
  Check,
  AlertTriangle,
  Sparkles,
  Search,
  CheckSquare,
  RotateCcw,
  ShieldCheck,
  Loader2,
  Zap,
} from 'lucide-react';

interface DuplicateVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabularyItems: VocabularyItem[];
  onDeleteWords: (wordIds: string[]) => Promise<any> | void;
  onAutoCleanAll?: () => Promise<{ success: boolean; deletedCount: number; message: string }>;
  currentLanguage: LanguageCode;
}

export const DuplicateVocabModal: React.FC<DuplicateVocabModalProps> = ({
  isOpen,
  onClose,
  vocabularyItems,
  onDeleteWords,
  onAutoCleanAll,
  currentLanguage,
}) => {
  const currentLangInfo = LANGUAGES[currentLanguage];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmPending, setConfirmPending] = useState<'selected' | 'all' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    return duplicateGroups.filter((g) => {
      const groupText = [
        g.key,
        ...g.items.flatMap((item) => [
          item.tu,
          item.nghia,
          item.phien_am,
          item.chu_de,
          item.cap_do,
        ]),
      ]
        .map((f) => (f || '').toLowerCase())
        .join(' ');

      return groupText.includes(q);
    });
  }, [duplicateGroups, searchQuery]);

  // Total excess items (number of items to delete if keeping 1 per group)
  const totalExcessItems = useMemo(() => {
    return duplicateGroups.reduce((acc, g) => acc + (g.items.length - 1), 0);
  }, [duplicateGroups]);

  // Initialize auto-selection on modal open or when duplicateGroups changes
  useEffect(() => {
    if (isOpen) {
      handleAutoSelectOlder();
      setNotification(null);
      setConfirmPending(null);
    }
  }, [isOpen, duplicateGroups.length]);

  if (!isOpen) return null;

  // Preset Auto-Selection 1: Keep newest entry, mark older ones for deletion
  const handleAutoSelectOlder = () => {
    const newSelected = new Set<string>();
    duplicateGroups.forEach((group) => {
      const sorted = [...group.items].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.word_id || '').localeCompare(a.word_id || '');
      });
      // Keep newest (index 0), mark the rest
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
          return (b.srs_box || 0) - (a.srs_box || 0);
        }
        if ((b.times_reviewed || 0) !== (a.times_reviewed || 0)) {
          return (b.times_reviewed || 0) - (a.times_reviewed || 0);
        }
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.word_id || '').localeCompare(a.word_id || '');
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
        idsInGroup.forEach((id) => next.delete(id));
      } else {
        next.delete(groupItems[0].word_id);
        for (let i = 1; i < groupItems.length; i++) {
          next.add(groupItems[i].word_id);
        }
      }
      return next;
    });
  };

  // Perform deletion of selected items
  const handleExecuteDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) return;
    setIsProcessing(true);
    setNotification(null);
    try {
      const idsToDelete = Array.from(selectedForDeletion);
      await onDeleteWords(idsToDelete);
      setNotification({
        type: 'success',
        text: `Đã dọn dẹp và xóa vĩnh viễn ${idsToDelete.length} từ trùng lặp khỏi bộ nhớ, Máy chủ và Supabase Cloud!`,
      });
      setSelectedForDeletion(new Set());
      setConfirmPending(null);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Lỗi khi xóa từ trùng: ${err.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform 1-click auto clean all
  const handleExecuteAutoCleanAll = async () => {
    setIsProcessing(true);
    setNotification(null);
    try {
      if (onAutoCleanAll) {
        const res = await onAutoCleanAll();
        setNotification({
          type: res.success ? 'success' : 'error',
          text: res.message,
        });
      } else {
        const idsToDelete: string[] = [];
        duplicateGroups.forEach((group) => {
          const sorted = [...group.items].sort((a, b) => {
            if ((b.srs_box || 0) !== (a.srs_box || 0)) return (b.srs_box || 0) - (a.srs_box || 0);
            if ((b.times_reviewed || 0) !== (a.times_reviewed || 0)) return (b.times_reviewed || 0) - (a.times_reviewed || 0);
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            if (timeA !== timeB) return timeB - timeA;
            return (b.word_id || '').localeCompare(a.word_id || '');
          });
          for (let i = 1; i < sorted.length; i++) {
            idsToDelete.push(sorted[i].word_id);
          }
        });

        if (idsToDelete.length > 0) {
          await onDeleteWords(idsToDelete);
          setNotification({
            type: 'success',
            text: `Đã dọn dẹp tự động và xóa thành công ${idsToDelete.length} từ trùng lặp!`,
          });
        }
      }
      setSelectedForDeletion(new Set());
      setConfirmPending(null);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Lỗi khi dọn dẹp: ${err.message || err}`,
      });
    } finally {
      setIsProcessing(false);
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
            disabled={isProcessing}
            className="p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-[#F9F7F2]">
          {/* Notification Banner */}
          {notification && (
            <div
              className={`p-3.5 border-2 flex items-center justify-between gap-3 animate-in fade-in ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                  : 'bg-rose-50 border-rose-600 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {notification.type === 'success' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{notification.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-black/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
              {/* 1-Click Fast Cleanup Hero Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-[#1A1A1A] editorial-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-black text-amber-950 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>Dọn dẹp tự động 1-Click (Khuyên dùng)</span>
                  </div>
                  <p className="text-xs font-mono text-stone-700">
                    Tự động giữ 1 bản sao tối ưu nhất (ưu tiên SRS cao nhất) cho mỗi nhóm và xóa sạch {totalExcessItems} từ dư thừa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmPending('all')}
                  disabled={isProcessing}
                  className="px-4 py-2 border-2 border-[#1A1A1A] bg-amber-400 hover:bg-amber-300 text-[#1A1A1A] font-mono text-xs font-bold uppercase tracking-wider editorial-shadow-xs flex items-center justify-center gap-2 transition shrink-0 disabled:opacity-40"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>XÓA SẠCH {totalExcessItems} TỪ TRÙNG NGAY</span>
                </button>
              </div>

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
                      disabled={isProcessing}
                      className="px-3 py-1.5 border border-[#1A1A1A] bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-40"
                      title="Giữ từ mới nhất, chọn xoá các từ cũ hơn"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Giữ từ mới nhất (Xoá từ cũ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoSelectKeepHighestSrs}
                      disabled={isProcessing}
                      className="px-3 py-1.5 border border-[#1A1A1A] bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-40"
                      title="Giữ bản sao có cấp độ ôn tập SRS cao nhất"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Giữ từ có SRS cao nhất</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoSelectExceptFirst}
                      disabled={isProcessing}
                      className="px-3 py-1.5 border border-[#1A1A1A] bg-stone-100 hover:bg-stone-200 text-[#1A1A1A] text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-40"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Giữ 1 bản sao bất kỳ</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearSelections}
                      disabled={isProcessing}
                      className="px-3 py-1.5 border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-xs font-mono font-medium flex items-center gap-1.5 transition ml-auto disabled:opacity-40"
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
                              disabled={isProcessing}
                              className="px-2.5 py-1 text-[11px] font-mono font-bold border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition disabled:opacity-40"
                            >
                              Toggle nhóm này
                            </button>
                          </div>
                        </div>

                        {/* Duplicate Items Grid inside Group */}
                        <div className="divide-y border-stone-200">
                          {group.items.map((item) => {
                            const isMarkedForDelete = selectedForDeletion.has(item.word_id);

                            return (
                              <div
                                key={item.word_id}
                                onClick={() => !isProcessing && handleToggleItem(item.word_id)}
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
                                  <SpeakButton
                                    text={item.tu}
                                    language={currentLanguage}
                                    variant="outline"
                                    position="left"
                                    title="Nhấn để phát âm 1x • Giữ để chọn tốc độ"
                                  />

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
                                      disabled={isProcessing}
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

        {/* Inline Confirmation Bar */}
        {confirmPending && (
          <div className="px-5 py-3.5 bg-amber-50 border-t-2 border-amber-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-amber-950 text-xs font-mono font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {confirmPending === 'all'
                  ? `Xác nhận dọn dẹp tự động tất cả ${totalExcessItems} từ trùng lặp? Dữ liệu sẽ được dọn sạch khỏi Máy chủ và Supabase Cloud.`
                  : `Xác nhận xóa vĩnh viễn ${selectedForDeletion.size} từ trùng lặp đã chọn khỏi Máy chủ và Supabase Cloud?`}
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setConfirmPending(null)}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-3 py-1.5 border border-[#1A1A1A] bg-white hover:bg-stone-100 text-xs font-mono font-bold uppercase"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={confirmPending === 'all' ? handleExecuteAutoCleanAll : handleExecuteDeleteSelected}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-4 py-1.5 border-2 border-[#1A1A1A] bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 editorial-shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>ĐANG DỌN DẸP...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>XÁC NHẬN XOÁ NGAY</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        {duplicateGroups.length > 0 && !confirmPending && (
          <div className="px-5 py-3.5 border-t-2 border-[#1A1A1A] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono text-[#1A1A1A] font-bold">
              Tổng số từ sẽ xoá:{' '}
              <span className="text-rose-600 text-sm font-black">{selectedForDeletion.size}</span> từ vựng
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-4 py-2 border-2 border-[#1A1A1A] bg-white hover:bg-stone-100 text-xs font-mono font-bold uppercase disabled:opacity-40"
              >
                ĐÓNG
              </button>
              <button
                type="button"
                onClick={() => setConfirmPending('selected')}
                disabled={selectedForDeletion.size === 0 || isProcessing}
                className="flex-1 sm:flex-none px-6 py-2 border-2 border-[#1A1A1A] bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ĐANG XỬ LÝ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>XOÁ {selectedForDeletion.size} TỪ TRÙNG ĐÃ CHỌN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
