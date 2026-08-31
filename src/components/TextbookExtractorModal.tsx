import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../types';
import { TextbookExtractResult, ExtractedVocabItem, ExtractedGrammarItem } from '../types';
import { compressImageForAI } from '../utils/imageCompressor';
import {
  BookOpen,
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  HelpCircle,
  RotateCw,
} from 'lucide-react';

interface TextbookExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TextbookExtractorModal: React.FC<TextbookExtractorModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage, batchAddVocabulary, batchAddGrammar } = useApp();
  const currentLangInfo = LANGUAGES[currentLanguage];

  const [extractMode, setExtractMode] = useState<'all' | 'vocab' | 'grammar'>('all');
  const [customInstruction, setCustomInstruction] = useState('');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<TextbookExtractResult | null>(null);

  // Selected items for import
  const [selectedVocabs, setSelectedVocabs] = useState<Record<number, boolean>>({});
  const [selectedGrammars, setSelectedGrammars] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  // Handle file upload with automatic image compression for AI
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type.startsWith('image/')) {
      setFileMime('image/jpeg');
      try {
        const compressedBase64 = await compressImageForAI(file, 1280, 0.75);
        setFileBase64(compressedBase64);
      } catch (err) {
        console.error('Lỗi khi nén ảnh sách:', err);
      }
    } else {
      setFileMime(file.type);
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunExtraction = async () => {
    if (!fileBase64 && !rawText.trim()) {
      setErrorMsg('Vui lòng tải lên tệp sách (PDF/Ảnh) hoặc dán nội dung văn bản sách để AI phân tích.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await fetch('/api/gemini/extract-textbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          fileMime,
          rawText,
          fileName,
          language: currentLanguage,
          extractMode,
          customInstruction,
        }),
      });

      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('Lỗi 405 (Method Not Allowed) trên Vercel. Hãy đảm bảo bạn đã cấu hình GEMINI_API_KEY trên Vercel Dashboard!');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Lỗi khi kết nối tới máy chủ trích xuất AI.');
      }

      const data: TextbookExtractResult = await response.json();
      setResult(data);

      // Initialize all items as selected
      const vocabMap: Record<number, boolean> = {};
      data.vocabulary?.forEach((_, i) => {
        vocabMap[i] = true;
      });
      setSelectedVocabs(vocabMap);

      const grammarMap: Record<number, boolean> = {};
      data.grammar?.forEach((_, i) => {
        grammarMap[i] = true;
      });
      setSelectedGrammars(grammarMap);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình AI phân tích sách.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAllVocab = (select: boolean) => {
    const updated: Record<number, boolean> = {};
    result?.vocabulary?.forEach((_, i) => {
      updated[i] = select;
    });
    setSelectedVocabs(updated);
  };

  const toggleAllGrammar = (select: boolean) => {
    const updated: Record<number, boolean> = {};
    result?.grammar?.forEach((_, i) => {
      updated[i] = select;
    });
    setSelectedGrammars(updated);
  };

  const handleImportToApp = () => {
    if (!result) return;

    // Filter selected vocabulary
    const vocabsToImport: Partial<any>[] = [];
    result.vocabulary?.forEach((v, i) => {
      if (selectedVocabs[i]) {
        vocabsToImport.push({
          tu: v.tu,
          nghia: v.nghia,
          phien_am: v.phien_am || '',
          loai_tu: v.loai_tu || 'Danh từ',
          chu_de: v.chu_de || v.unit || 'Sách giáo khoa',
          cap_do: v.cap_do || result.level || 'Cơ bản',
          vi_du: v.vi_du || '',
          vi_du_dich: v.vi_du_dich || '',
          ngon_ngu: currentLanguage,
        });
      }
    });

    // Filter selected grammar
    const grammarToImport: Partial<any>[] = [];
    result.grammar?.forEach((g, i) => {
      if (selectedGrammars[i]) {
        grammarToImport.push({
          cau_truc: g.cau_truc,
          giai_thich: g.giai_thich,
          cong_thuc: g.cong_thuc || '',
          vi_du: g.vi_du || '',
          vi_du_dich: g.vi_du_dich || '',
          ghi_chu: g.ghi_chu || g.unit || '',
          cap_do: g.cap_do || result.level || 'Cơ bản',
          ngon_ngu: currentLanguage,
          tags: [result.bookTitle || 'Sách giáo khoa AI', g.unit || 'Chương trình học'],
        });
      }
    });

    const addedVocabCount = batchAddVocabulary(vocabsToImport);
    const addedGrammarCount = batchAddGrammar(grammarToImport);

    alert(`🎉 Đã nhập thành công ${addedVocabCount} từ vựng và ${addedGrammarCount} cấu trúc ngữ pháp từ sách "${result.bookTitle}" vào hệ thống!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg max-w-4xl w-full max-h-[92vh] flex flex-col relative animate-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-6 bg-[#1A1A1A] text-[#F9F7F2] flex items-center justify-between border-b-4 border-[#1A1A1A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-[#1A1A1A] border-2 border-white flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-amber-300 uppercase font-bold">
                Trí tuệ nhân tạo đọc & bóc tách sách giáo trình
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight">
                AI Đọc Sách & Trích Xuất Từ Vựng/Ngữ Pháp — {currentLangInfo.name} ({currentLangInfo.flag})
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white transition border border-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {!result ? (
            <div className="space-y-6">
              <div className="p-4 bg-white border-2 border-[#1A1A1A] space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-[#1A1A1A] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>Hướng dẫn tính năng:</span>
                </div>
                <p className="text-xs sm:text-sm font-serif text-stone-700 leading-relaxed">
                  Tải lên tệp sách giáo khoa (PDF như <em>Tiếng Hàn Tổng hợp Sơ cấp 1, HSK Standard Course, English Grammar in Use</em>...) hoặc dán nội dung văn bản. AI sẽ tự động phân tích toàn bộ cuốn sách, lọc ra danh sách <strong>Từ vựng</strong> và <strong>Cấu trúc Ngữ pháp</strong> chuẩn xác kèm ví dụ, nghĩa tiếng Việt và cấp độ để bạn nhập trực tiếp vào ứng dụng!
                </p>
              </div>

              {/* Upload Box & Text Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#1A1A1A] block">
                    1. Tải lên tệp sách (PDF, Ảnh chụp trang sách):
                  </label>
                  <label className="border-2 border-dashed border-[#1A1A1A] bg-white hover:bg-stone-50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition h-48">
                    <Upload className="w-8 h-8 text-stone-600 mb-2" />
                    <span className="text-sm font-serif font-bold text-[#1A1A1A]">
                      {fileName ? `Đã chọn: ${fileName}` : 'Nhấn để tải lên tệp PDF hoặc hình ảnh'}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 mt-1">
                      Hỗ trợ PDF, PNG, JPG (Sách giáo trình, tài liệu học)
                    </span>
                    <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {fileName && (
                    <button
                      onClick={() => { setFileName(''); setFileBase64(null); setFileMime(null); }}
                      className="text-xs font-mono text-red-600 underline"
                    >
                      Xóa tệp đã chọn
                    </button>
                  )}
                </div>

                {/* Text Area Input */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#1A1A1A] block">
                    2. Hoặc dán nội dung / danh sách bài học sách:
                  </label>
                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Dán nội dung từ vựng, ngữ pháp hoặc phần tóm tắt các Unit của sách vào đây..."
                    className="w-full p-3 border-2 border-[#1A1A1A] bg-white font-serif text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#1A1A1A] block">
                    Chế độ trích xuất AI:
                  </label>
                  <select
                    value={extractMode}
                    onChange={(e: any) => setExtractMode(e.target.value)}
                    className="w-full p-3 border-2 border-[#1A1A1A] bg-white font-serif text-sm focus:outline-none"
                  >
                    <option value="all">Trích xuất toàn diện (Từ vựng & Cấu trúc ngữ pháp)</option>
                    <option value="vocab">Chỉ trích xuất Từ vựng</option>
                    <option value="grammar">Chỉ trích xuất Ngữ pháp</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-[#1A1A1A] block">
                    Yêu cầu bổ sung cho AI (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="Ví dụ: Chỉ lấy từ vựng Bài 1 đến Bài 3..."
                    className="w-full p-3 border-2 border-[#1A1A1A] bg-white font-serif text-sm focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 border-2 border-red-800 text-red-900 text-xs font-mono flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
                    <span className="leading-relaxed font-bold">
                      {errorMsg.includes('Quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('generativelanguage')
                        ? '⚠️ Hệ thống AI vừa chạm giới hạn số lượt gửi trong 1 phút (Quota / Rate Limit - Lỗi 429). Vui lòng đợi khoảng 30–60 giây rồi bấm nút "THỬ LẠI"!'
                        : errorMsg.startsWith('{') || errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE')
                        ? '⚠️ Hệ thống AI Gemini đang quá tải (Lỗi 503). Vui lòng bấm nút "THỬ LẠI" bên cạnh sau 10 giây.'
                        : errorMsg}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunExtraction}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-rose-900 text-white font-mono text-[11px] font-bold uppercase hover:bg-rose-950 flex items-center gap-1.5 shrink-0 transition editorial-shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>THỬ LẠI</span>
                  </button>
                </div>
              )}

              {/* Run Button */}
              <div className="pt-2 flex justify-end">
                <button
                  disabled={isLoading}
                  onClick={handleRunExtraction}
                  className="px-8 py-3.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm transition flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>AI ĐANG ĐỌC VÀ PHÂN TÍCH SÁCH... (Vui lòng đợi vài giây)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>BẮT ĐẦU AI TRÍCH XUẤT TỪ VỰNG & NGỮ PHÁP →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Result View */
            <div className="space-y-6">
              {/* Book Summary Card */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase">
                      Kết quả phân tích sách giáo trình
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A] mt-1">
                      📚 {result.bookTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-950 border border-amber-800 text-xs font-mono font-bold uppercase">
                      Cấp độ: {result.level || 'Sơ cấp'}
                    </span>
                    <button
                      onClick={() => setResult(null)}
                      className="px-3 py-1 border border-[#1A1A1A] bg-stone-100 hover:bg-stone-200 text-xs font-mono uppercase"
                    >
                      ← Phân tích sách khác
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-serif text-stone-700 leading-relaxed">
                  {result.summary}
                </p>

                {result.unitList && result.unitList.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] font-mono uppercase font-bold text-stone-500 mb-1.5">
                      Các bài học / Unit nhận diện được ({result.unitList.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.unitList.map((unit, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-serif">
                          {unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vocabulary Section */}
              {result.vocabulary && result.vocabulary.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
                    <h4 className="text-base font-serif font-black text-[#1A1A1A] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span>Danh sách Từ vựng trích xuất ({result.vocabulary.length} từ)</span>
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <button onClick={() => toggleAllVocab(true)} className="text-blue-700 underline">Chọn tất cả</button>
                      <span>|</span>
                      <button onClick={() => toggleAllVocab(false)} className="text-stone-600 underline">Bỏ chọn</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {result.vocabulary.map((v, idx) => {
                      const isChecked = selectedVocabs[idx] !== false;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedVocabs((prev) => ({ ...prev, [idx]: !isChecked }))}
                          className={`p-3 border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                            isChecked ? 'border-emerald-800 bg-emerald-50/50' : 'border-[#1A1A1A]/40 bg-white opacity-60'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-800" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-black text-base text-[#1A1A1A]">{v.tu}</span>
                              <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 border border-[#1A1A1A]/30">
                                {v.loai_tu || 'Từ vựng'}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-stone-600">
                              {v.phien_am && <span className="mr-2 italic">[{v.phien_am}]</span>}
                              <strong className="text-emerald-900">{v.nghia}</strong>
                            </div>
                            {v.vi_du && (
                              <div className="text-[11px] font-serif italic text-stone-700 border-t border-stone-200 pt-1 mt-1">
                                <div>"{v.vi_du}"</div>
                                <div className="text-stone-500">→ {v.vi_du_dich}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grammar Section */}
              {result.grammar && result.grammar.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
                    <h4 className="text-base font-serif font-black text-[#1A1A1A] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-700" />
                      <span>Cấu trúc Ngữ pháp trích xuất ({result.grammar.length} cấu trúc)</span>
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <button onClick={() => toggleAllGrammar(true)} className="text-blue-700 underline">Chọn tất cả</button>
                      <span>|</span>
                      <button onClick={() => toggleAllGrammar(false)} className="text-stone-600 underline">Bỏ chọn</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto pr-1">
                    {result.grammar.map((g, idx) => {
                      const isChecked = selectedGrammars[idx] !== false;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedGrammars((prev) => ({ ...prev, [idx]: !isChecked }))}
                          className={`p-4 border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                            isChecked ? 'border-blue-800 bg-blue-50/50' : 'border-[#1A1A1A]/40 bg-white opacity-60'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-blue-800" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-black text-base text-[#1A1A1A]">{g.cau_truc}</span>
                              <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 border border-[#1A1A1A]/30">
                                {g.unit || result.bookTitle}
                              </span>
                            </div>
                            <p className="text-xs font-serif text-stone-800">
                              <strong>Giải thích:</strong> {g.giai_thich}
                            </p>
                            {g.cong_thuc && (
                              <div className="text-xs font-mono bg-white p-2 border border-blue-200 text-blue-950">
                                <strong>Công thức:</strong> {g.cong_thuc}
                              </div>
                            )}
                            {g.vi_du && (
                              <div className="text-xs font-serif italic text-stone-700 border-t border-stone-200 pt-1">
                                <div>Ví dụ: "{g.vi_du}"</div>
                                <div className="text-stone-500">→ {g.vi_du_dich}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Import Button */}
              <div className="pt-4 border-t-2 border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-mono text-stone-600">
                  ✓ Sẵn sàng nhập các mục đã chọn vào Sổ tay từ vựng & Ngữ pháp cá nhân của bạn.
                </div>
                <button
                  onClick={handleImportToApp}
                  className="w-full sm:w-auto px-8 py-3.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>NHẬP TỪ VỰNG & NGỮ PHÁP VÀO ỨNG DỤNG →</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
