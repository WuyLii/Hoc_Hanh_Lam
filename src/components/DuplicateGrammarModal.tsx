import React, { useState, useMemo, useEffect } from 'react';
import { GrammarItem, LanguageCode, LANGUAGES } from '../types';
import { SpeakButton } from './SpeakButton';
import { normalizeGrammarKey } from '../utils/deduplicate';
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
  BookMarked,
  Tag,
  Calendar,
} from 'lucide-react';

interface DuplicateGrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
  grammarItems: GrammarItem[];
  onDeleteGrammar: (grammarIds: string[]) => Promise<any> | void;
  onAutoCleanAll?: () => Promise<{ success: boolean; deletedCount: number; message: string }>;
  currentLanguage: LanguageCode;
}

export const DuplicateGrammarModal: React.FC<DuplicateGrammarModalProps> = ({
  isOpen,
  onClose,
  grammarItems,
  onDeleteGrammar,
  onAutoCleanAll,
  currentLanguage,
}) => {
  const currentLangInfo = LANGUAGES[currentLanguage];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmPending, setConfirmPending] = useState<'selected' | 'all' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Group duplicate grammar items by normalized structure key
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, GrammarItem[]>();

    grammarItems.forEach((item) => {
      const normalizedKey = normalizeGrammarKey(item.cau_truc || '');
      if (!normalizedKey) return;
      if (!map.has(normalizedKey)) {
        map.set(normalizedKey, []);
      }
      map.get(normalizedKey)!.push(item);
    });

    // Keep only groups that have 2 or more items
    const duplicates: { key: string; structureDisplay: string; items: GrammarItem[] }[] = [];
    map.forEach((items, key) => {
      if (items.length > 1) {
        // Sort items inside group so the richest item is index 0 (the recommended keep)
        const sorted = [...items].sort((a, b) => {
          const scoreA =
            (a.vi_du ? 3 : 0) +
            (a.vi_du_dich ? 3 : 0) +
            ((a.giai_thich || '').length > 25 ? 2 : 0) +
            (a.tags?.length || 0);
          const scoreB =
            (b.vi_du ? 3 : 0) +
            (b.vi_du_dich ? 3 : 0) +
            ((b.giai_thich || '').length > 25 ? 2 : 0) +
            (b.tags?.length || 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          if (timeA !== timeB) return timeB - timeA;
          return (b.grammar_id || '').localeCompare(a.grammar_id || '');
        });

        duplicates.push({
          key,
          structureDisplay: sorted[0].cau_truc,
          items: sorted,
        });
      }
    });

    return duplicates;
  }, [grammarItems]);

  // Filter duplicate groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return duplicateGroups;
    const q = searchQuery.toLowerCase().trim();

    return duplicateGroups.filter((g) => {
      const groupText = [
        g.key,
        g.structureDisplay,
        ...g.items.flatMap((item) => [
          item.cau_truc,
          item.giai_thich,
          item.vi_du,
          item.vi_du_dich,
          item.cap_do,
          item.ghi_chu,
          ...(item.tags || []),
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
      handleAutoSelectDuplicates();
      setNotification(null);
      setConfirmPending(null);
    }
  }, [isOpen, duplicateGroups.length]);

  if (!isOpen) return null;

  // Preset Auto-Selection: Mark duplicate copies (index 1..n), keep recommended index 0
  const handleAutoSelectDuplicates = () => {
    const newSelected = new Set<string>();
    duplicateGroups.forEach((group) => {
      for (let i = 1; i < group.items.length; i++) {
        newSelected.add(group.items[i].grammar_id);
      }
    });
    setSelectedForDeletion(newSelected);
  };

  // Clear all selections
  const handleClearSelections = () => {
    setSelectedForDeletion(new Set());
  };

  // Toggle single item selection
  const handleToggleItem = (grammarId: string) => {
    setSelectedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(grammarId)) {
        next.delete(grammarId);
      } else {
        next.add(grammarId);
      }
      return next;
    });
  };

  // Toggle group items (mark all in group for deletion except the first item)
  const handleToggleGroupExceptFirst = (groupItems: GrammarItem[]) => {
    const idsInGroup = groupItems.map((item) => item.grammar_id);
    const allGroupSelected = groupItems.slice(1).every((item) => selectedForDeletion.has(item.grammar_id));

    setSelectedForDeletion((prev) => {
      const next = new Set(prev);
      if (allGroupSelected) {
        idsInGroup.forEach((id) => next.delete(id));
      } else {
        next.delete(groupItems[0].grammar_id);
        for (let i = 1; i < groupItems.length; i++) {
          next.add(groupItems[i].grammar_id);
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
      await onDeleteGrammar(idsToDelete);
      setNotification({
        type: 'success',
        text: `Đã dọn dẹp và xóa thành công ${idsToDelete.length} cấu trúc ngữ pháp trùng lặp!`,
      });
      setSelectedForDeletion(new Set());
      setConfirmPending(null);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Lỗi khi xóa ngữ pháp trùng: ${err.message || err}`,
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
          for (let i = 1; i < group.items.length; i++) {
            idsToDelete.push(group.items[i].grammar_id);
          }
        });

        if (idsToDelete.length > 0) {
          await onDeleteGrammar(idsToDelete);
          setNotification({
            type: 'success',
            text: `Đã tự động làm sạch và xóa ${idsToDelete.length} cấu trúc ngữ pháp trùng lặp!`,
          });
        } else {
          setNotification({
            type: 'success',
            text: 'Không có ngữ pháp trùng lặp nào cần dọn dẹp!',
          });
        }
      }
      setSelectedForDeletion(new Set());
      setConfirmPending(null);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Lỗi trong quá trình tự động làm sạch: ${err.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete a single grammar item immediately
  const handleDeleteSingleItem = async (grammarId: string, structure: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản sao ngữ pháp "${structure}" này?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      await onDeleteGrammar([grammarId]);
      setSelectedForDeletion((prev) => {
        const next = new Set(prev);
        next.delete(grammarId);
        return next;
      });
      setNotification({
        type: 'success',
        text: `Đã xóa 1 bản sao ngữ pháp "${structure}"!`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Lỗi khi xóa: ${err.message || err}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="duplicate-grammar-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="duplicate-grammar-dialog"
        className="bg-[#F9F7F2] border-4 border-[#1A1A1A] w-full max-w-5xl max-h-[92vh] flex flex-col editorial-shadow overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#1A1A1A] text-[#F9F7F2] p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-700 text-white border border-white/20">
              <CopyCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif font-black tracking-wide">
                  LỌC & DỌN DẸP NGỮ PHÁP TRÙNG LẶP
                </h2>
                <span className="text-base">{currentLangInfo.flag}</span>
                <span className="px-2 py-0.5 bg-rose-700 text-white font-mono text-xs font-bold uppercase">
                  {duplicateGroups.length} NHÓM TRÙNG
                </span>
              </div>
              <p className="text-xs font-mono text-stone-300 mt-0.5">
                Hệ thống phát hiện các cấu trúc giống nhau và tự động đề xuất giữ lại bản có ví dụ & giải thích đầy đủ nhất
              </p>
            </div>
          </div>
          <button
            id="close-duplicate-grammar-modal"
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white transition border border-transparent hover:border-stone-700"
            title="Đóng cửa sổ"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`px-4 py-3 border-b-2 border-[#1A1A1A] flex items-center gap-2 font-mono text-xs font-bold ${
              notification.type === 'success'
                ? 'bg-emerald-100 text-emerald-950 border-emerald-800'
                : 'bg-rose-100 text-rose-950 border-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Top Control Bar & Stats */}
        <div className="p-4 bg-stone-100 border-b-2 border-[#1A1A1A] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Stat 1 */}
            <div className="bg-white border-2 border-[#1A1A1A] p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Cấu trúc bị trùng</p>
                <p className="text-xl font-mono font-black text-rose-700">{duplicateGroups.length} nhóm</p>
              </div>
              <div className="p-2 bg-rose-100 border border-rose-300 text-rose-800">
                <CopyCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white border-2 border-[#1A1A1A] p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Bản sao thừa cần xóa</p>
                <p className="text-xl font-mono font-black text-amber-700">{totalExcessItems} mục</p>
              </div>
              <div className="p-2 bg-amber-100 border border-amber-300 text-amber-800">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border-2 border-[#1A1A1A] p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Đã đánh dấu xóa</p>
                <p className="text-xl font-mono font-black text-[#1A1A1A]">{selectedForDeletion.size} mục</p>
              </div>
              <div className="p-2 bg-stone-200 border border-stone-400 text-stone-800">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search and Presets */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                id="search-duplicate-grammar-input"
                type="text"
                placeholder="Tìm cấu trúc, giải thích, ví dụ trong các nhóm trùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-[#1A1A1A] font-mono text-xs focus:outline-none focus:bg-amber-50"
              />
            </div>

            {/* Selection Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                id="btn-select-all-duplicates"
                onClick={handleAutoSelectDuplicates}
                className="px-2.5 py-1.5 bg-white border border-[#1A1A1A] hover:bg-stone-200 font-mono text-[11px] font-bold text-stone-800 flex items-center gap-1 transition"
                title="Tự động chọn tất cả bản sao và giữ lại bản đầy đủ nhất"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Tự động chọn bản sao</span>
              </button>
              <button
                id="btn-clear-selections"
                onClick={handleClearSelections}
                className="px-2.5 py-1.5 bg-white border border-[#1A1A1A] hover:bg-stone-200 font-mono text-[11px] font-bold text-stone-800 flex items-center gap-1 transition"
                title="Bỏ chọn tất cả"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>Bỏ chọn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body: Duplicate Groups List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12 bg-white border-2 border-[#1A1A1A] p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-800 text-emerald-800 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-black text-[#1A1A1A]">
                KHÔNG CÓ NGỮ PHÁP NÀO BỊ TRÙNG LẶP!
              </h3>
              <p className="text-xs font-mono text-stone-600 max-w-md mx-auto">
                Tất cả {grammarItems.length} cấu trúc ngữ pháp trong ngôn ngữ {currentLangInfo.name} đều là duy nhất và được định danh chuẩn xác.
              </p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 bg-white border-2 border-[#1A1A1A] p-6 space-y-2">
              <p className="font-mono text-xs text-stone-600">
                Không tìm thấy nhóm trùng khớp với từ khóa "{searchQuery}".
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-mono text-rose-700 underline font-bold"
              >
                Xóa tìm kiếm
              </button>
            </div>
          ) : (
            filteredGroups.map((group, groupIdx) => {
              const allSelected = group.items.slice(1).every((it) => selectedForDeletion.has(it.grammar_id));

              return (
                <div
                  key={group.key}
                  className="bg-white border-2 border-[#1A1A1A] editorial-shadow-sm overflow-hidden"
                >
                  {/* Group Banner */}
                  <div className="bg-[#FAF7F0] border-b-2 border-[#1A1A1A] p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-rose-700 text-white font-mono text-xs font-bold flex items-center justify-center">
                        {groupIdx + 1}
                      </span>
                      <span className="font-serif font-black text-base text-[#1A1A1A]">
                        {group.structureDisplay}
                      </span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-400 font-mono text-[11px] font-bold">
                        {group.items.length} BẢN TRÙNG LẶP
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleGroupExceptFirst(group.items)}
                        className={`px-2.5 py-1 text-[11px] font-mono font-bold border flex items-center gap-1 transition ${
                          allSelected
                            ? 'bg-rose-100 text-rose-950 border-rose-800'
                            : 'bg-white text-stone-800 border-[#1A1A1A] hover:bg-stone-100'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{allSelected ? 'Bỏ chọn nhóm' : 'Chọn xóa các bản sao'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Group Items Comparison */}
                  <div className="divide-y-2 divide-stone-200">
                    {group.items.map((item, itemIdx) => {
                      const isRecommendedKeep = itemIdx === 0;
                      const isMarkedForDeletion = selectedForDeletion.has(item.grammar_id);

                      return (
                        <div
                          key={item.grammar_id}
                          className={`p-3 sm:p-4 transition ${
                            isMarkedForDeletion
                              ? 'bg-rose-50/70 border-l-4 border-l-rose-600'
                              : isRecommendedKeep
                              ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600'
                              : 'bg-white hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Selection Checkbox */}
                              <input
                                type="checkbox"
                                checked={isMarkedForDeletion}
                                onChange={() => handleToggleItem(item.grammar_id)}
                                className="mt-1 w-4 h-4 text-rose-600 border-2 border-[#1A1A1A] rounded focus:ring-0 cursor-pointer"
                                title={isMarkedForDeletion ? 'Bỏ chọn xóa' : 'Đánh dấu để xóa'}
                              />

                              <div className="space-y-1.5 flex-1">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#1A1A1A] text-white">
                                    {item.cau_truc}
                                  </span>

                                  <span className="px-2 py-0.5 bg-stone-200 text-stone-800 font-mono text-[10px] font-bold border border-stone-400">
                                    {item.cap_do}
                                  </span>

                                  {isRecommendedKeep ? (
                                    <span className="px-2 py-0.5 bg-emerald-700 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      <span>BẢN ĐẦY ĐỦ NHẤT (GỢI Ý GIỮ LẠI)</span>
                                    </span>
                                  ) : isMarkedForDeletion ? (
                                    <span className="px-2 py-0.5 bg-rose-700 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                                      <Trash2 className="w-3 h-3" />
                                      <span>BẢN SAO SẼ XÓA</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 font-mono text-[10px] font-bold">
                                      BẢN SAO PHỤ
                                    </span>
                                  )}

                                  {item.created_at && (
                                    <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1 ml-auto">
                                      <Calendar className="w-3 h-3" />
                                      {item.created_at}
                                    </span>
                                  )}
                                </div>

                                {/* Explanation */}
                                <p className="text-xs text-stone-900 font-sans leading-relaxed">
                                  <span className="font-bold text-stone-700 font-mono text-[11px] mr-1">
                                    Giải thích:
                                  </span>
                                  {item.giai_thich}
                                </p>

                                {/* Example */}
                                {item.vi_du && (
                                  <div className="bg-stone-50 p-2 border border-stone-300 rounded space-y-0.5 mt-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-serif font-bold text-stone-950">
                                        {item.vi_du}
                                      </p>
                                      <SpeakButton
                                        text={item.vi_du}
                                        language={currentLanguage}
                                        variant="card"
                                        buttonClassName="bg-white p-1 shrink-0"
                                      />
                                    </div>
                                    {item.vi_du_dich && (
                                      <p className="text-[11px] text-stone-600 italic">
                                        👉 {item.vi_du_dich}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Tags & Notes */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {item.tags?.map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.2 bg-stone-100 border border-stone-300 font-mono text-[10px] text-stone-600 flex items-center gap-0.5"
                                    >
                                      <Tag className="w-2.5 h-2.5" />
                                      {t}
                                    </span>
                                  ))}
                                  {item.ghi_chu && (
                                    <span className="text-[10px] font-mono text-stone-500 italic">
                                      ({item.ghi_chu})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Delete single button */}
                            <button
                              onClick={() => handleDeleteSingleItem(item.grammar_id, item.cau_truc)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-300 transition"
                              title="Xóa ngay bản này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* Footer Actions */}
        <div className="p-4 bg-[#1A1A1A] border-t-2 border-[#1A1A1A] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-400">
              Đã chọn <strong className="text-white">{selectedForDeletion.size}</strong> / {totalExcessItems} bản sao
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-600 bg-stone-800 hover:bg-stone-700 font-mono text-xs font-bold text-white transition"
            >
              ĐÓNG
            </button>

            {duplicateGroups.length > 0 && (
              <>
                {/* Delete Selected Button */}
                <button
                  id="btn-delete-selected-grammar"
                  disabled={selectedForDeletion.size === 0 || isProcessing}
                  onClick={() => setConfirmPending('selected')}
                  className={`px-4 py-2 border-2 font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 ${
                    selectedForDeletion.size > 0
                      ? 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700 editorial-shadow-sm'
                      : 'border-stone-700 bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>XÓA ĐÃ CHỌN ({selectedForDeletion.size})</span>
                </button>

                {/* 1-Click Auto Clean All Button */}
                <button
                  id="btn-auto-clean-all-grammar"
                  disabled={isProcessing || totalExcessItems === 0}
                  onClick={() => setConfirmPending('all')}
                  className="px-4 py-2 border-2 border-amber-500 bg-amber-500 text-stone-950 hover:bg-amber-400 font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 editorial-shadow-sm"
                  title="Tự động giữ lại bản đầy đủ nhất của mỗi nhóm và xóa sạch tất cả bản sao trùng lặp"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>⚡ LỌC & DỌN SẠCH TẤT CẢ ({totalExcessItems})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Confirmation Modal overlay */}
        {confirmPending && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white border-4 border-[#1A1A1A] max-w-md w-full p-5 editorial-shadow space-y-4">
              <div className="flex items-center gap-3 text-rose-700">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-serif font-black text-lg text-[#1A1A1A]">
                  XÁC NHẬN XÓA NGỮ PHÁP TRÙNG LẶP
                </h3>
              </div>

              <p className="text-xs font-mono text-stone-700 leading-relaxed">
                {confirmPending === 'selected'
                  ? `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedForDeletion.size} cấu trúc ngữ pháp trùng lặp đã chọn khỏi bộ nhớ, IndexedDB, Máy chủ và Supabase Cloud?`
                  : `Bạn có chắc chắn muốn hệ thống TỰ ĐỘNG giữ lại bản đầy đủ nhất của mỗi nhóm và xóa sạch tất cả ${totalExcessItems} bản sao trùng lặp?`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  disabled={isProcessing}
                  onClick={() => setConfirmPending(null)}
                  className="px-3 py-1.5 border border-[#1A1A1A] font-mono text-xs font-bold text-stone-800 hover:bg-stone-100"
                >
                  HỦY BỎ
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    if (confirmPending === 'selected') {
                      handleExecuteDeleteSelected();
                    } else {
                      handleExecuteAutoCleanAll();
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-700 text-white border-2 border-[#1A1A1A] font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-rose-800"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ĐỒNG Ý XÓA</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
