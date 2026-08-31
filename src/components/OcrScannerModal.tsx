import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../types';
import { compressImageForAI } from '../utils/imageCompressor';
import {
  Sparkles,
  Camera,
  Upload,
  X,
  BookmarkPlus,
  AlertCircle,
  Volume2,
  BookOpen,
  Layers,
  Award,
  Tag,
  RotateCw,
} from 'lucide-react';
import { ttsService } from '../services/ttsService';

interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedWord {
  tu: string;
  nghia: string;
  phien_am: string;
  loai_tu: string;
  cap_do: string;
  chu_de: string;
  vi_du: string;
  vi_du_dich: string;
  selected: boolean;
}

interface ExtractedGrammar {
  cau_truc: string;
  giai_thich: string;
  cong_thuc: string;
  cap_do: string;
  chu_de: string;
  vi_du: string;
  vi_du_dich: string;
  selected: boolean;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage, batchAddVocabulary, batchAddGrammar } = useApp();
  const currentLangInfo = LANGUAGES[currentLanguage];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);
  const [extractedGrammars, setExtractedGrammars] = useState<ExtractedGrammar[]>([]);
  const [activeTab, setActiveTab] = useState<'words' | 'grammar'>('words');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          // Tự động nén chất lượng & kích thước ảnh về mức tối ưu (max 1280px, quality 0.75) để AI đọc OCR chuẩn xác và không bị nghẽn
          const compressed = await compressImageForAI(file, 1280, 0.75);
          setImagesBase64((prev) => [...prev, compressed]);
        } catch (err) {
          console.error('Lỗi khi nén ảnh:', err);
        }
      }
    }

    setExtractedWords([]);
    setExtractedGrammars([]);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagesBase64((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleScanImage = async () => {
    if (imagesBase64.length === 0 || isScanning) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch('/api/gemini/ocr-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          images: imagesBase64,
        }),
      });

      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('Lỗi 405 (Method Not Allowed) từ server Vercel static. Hãy cài đặt biến môi trường GEMINI_API_KEY trên Vercel Dashboard và redeploy lại ứng dụng với file vercel.json!');
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Không thể xử lý ảnh (Mã lỗi HTTP ${response.status})`);
      }

      const data = await response.json();

      let hasData = false;
      if (Array.isArray(data.words) && data.words.length > 0) {
        hasData = true;
        setExtractedWords(
          data.words.map((w: any) => ({
            tu: w.tu || w.word || '',
            nghia: w.nghia || w.meaning || '',
            phien_am: w.phien_am || w.phonetic || '',
            loai_tu: w.loai_tu || w.type || 'Từ vựng',
            cap_do: w.cap_do || (currentLanguage === 'en' ? 'TOEIC 500' : currentLanguage === 'ko' ? 'TOPIK 2' : 'HSK 3'),
            chu_de: w.chu_de || 'Quét OCR Sách',
            vi_du: w.vi_du || w.example || '',
            vi_du_dich: w.vi_du_dich || w.exampleVi || '',
            selected: true,
          }))
        );
      } else {
        setExtractedWords([]);
      }

      if (Array.isArray(data.grammar) && data.grammar.length > 0) {
        hasData = true;
        setExtractedGrammars(
          data.grammar.map((g: any) => ({
            cau_truc: g.cau_truc || g.pattern || '',
            giai_thich: g.giai_thich || g.explanation || '',
            cong_thuc: g.cong_thuc || '',
            cap_do: g.cap_do || (currentLanguage === 'en' ? 'TOEIC 600' : currentLanguage === 'ko' ? 'TOPIK 2' : 'HSK 3'),
            chu_de: g.chu_de || 'Quét OCR Sách',
            vi_du: g.vi_du || g.example || '',
            vi_du_dich: g.vi_du_dich || g.exampleVi || '',
            selected: true,
          }))
        );
      } else {
        setExtractedGrammars([]);
      }

      if (!hasData) {
        setScanError('Không trích xuất được từ vựng/ngữ pháp rõ ràng từ các ảnh. Vui lòng thử lại với ảnh rõ nét hơn.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Lỗi khi thực thi trích xuất OCR');
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleSelectWord = (idx: number) => {
    setExtractedWords((prev) =>
      prev.map((w, i) => (i === idx ? { ...w, selected: !w.selected } : w))
    );
  };

  const handleToggleSelectGrammar = (idx: number) => {
    setExtractedGrammars((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, selected: !g.selected } : g))
    );
  };

  const handleSaveSelectedItems = () => {
    const selectedVocab = extractedWords.filter((w) => w.selected && w.tu.trim() && w.nghia.trim());
    const selectedGrammar = extractedGrammars.filter((g) => g.selected && g.cau_truc.trim() && g.giai_thich.trim());

    if (selectedVocab.length === 0 && selectedGrammar.length === 0) {
      alert('Vui lòng chọn ít nhất 1 từ vựng hoặc 1 cấu trúc ngữ pháp để lưu.');
      return;
    }

    let addedVocab = 0;
    let addedGrammar = 0;

    if (selectedVocab.length > 0) {
      addedVocab = batchAddVocabulary(
        selectedVocab.map((w) => ({
          tu: w.tu,
          nghia: w.nghia,
          phien_am: w.phien_am,
          loai_tu: w.loai_tu,
          vi_du: w.vi_du,
          vi_du_dich: w.vi_du_dich,
          cap_do: w.cap_do,
          chu_de: w.chu_de,
          ngon_ngu: currentLanguage,
          nguon_goc: 'Quét OCR AI',
        }))
      );
    }

    if (selectedGrammar.length > 0) {
      addedGrammar = batchAddGrammar(
        selectedGrammar.map((g) => ({
          cau_truc: g.cau_truc,
          giai_thich: g.giai_thich,
          cong_thuc: g.cong_thuc,
          vi_du: g.vi_du,
          vi_du_dich: g.vi_du_dich,
          cap_do: g.cap_do,
          ngon_ngu: currentLanguage,
          tags: [g.chu_de, 'Quét OCR AI'],
        }))
      );
    }

    alert(`🎉 Đã lưu thành công ${addedVocab} từ vựng và ${addedGrammar} cấu trúc ngữ pháp vào hệ thống!`);
    onClose();
  };

  const selectedVocabCount = extractedWords.filter((w) => w.selected).length;
  const selectedGrammarCount = extractedGrammars.filter((g) => g.selected).length;
  const totalExtracted = extractedWords.length + extractedGrammars.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#1A1A1A]" />
            <h2 className="text-base font-serif font-black uppercase tracking-tight text-[#1A1A1A]">
              AI Quét OCR & Phân Tích Trích Xuất ({currentLangInfo.name})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F9F7F2]">
          {scanError && (
            <div className="p-3 bg-rose-100 border-2 border-rose-800 text-rose-900 text-xs font-mono flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-800" />
                <span className="leading-relaxed font-bold">
                  {scanError.includes('Quota') || scanError.includes('429') || scanError.includes('RESOURCE_EXHAUSTED') || scanError.includes('generativelanguage')
                    ? '⚠️ Hệ thống AI vừa chạm giới hạn số lượt gửi trong 1 phút (Quota / Rate Limit - Lỗi 429). Vui lòng đợi khoảng 30–60 giây rồi bấm nút "THỬ LẠI"!'
                    : scanError.startsWith('{') || scanError.includes('503') || scanError.includes('high demand') || scanError.includes('UNAVAILABLE')
                    ? '⚠️ Hệ thống AI Gemini đang quá tải (Lỗi 503). Vui lòng bấm "THỬ LẠI" bên cạnh sau 10 giây.'
                    : scanError}
                </span>
              </div>
              <button
                type="button"
                onClick={handleScanImage}
                disabled={isScanning}
                className="px-3 py-1.5 bg-rose-900 text-white font-mono text-[11px] font-bold uppercase hover:bg-rose-950 flex items-center gap-1.5 shrink-0 transition editorial-shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>THỬ LẠI</span>
              </button>
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {imagesBase64.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-[#1A1A1A] bg-white hover:bg-stone-50 cursor-pointer text-center space-y-3"
              >
                <Upload className="w-8 h-8 text-stone-500 mx-auto" />
                <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                  Tải lên một hoặc nhiều ảnh sách giáo khoa / bài tập / tài liệu
                </h3>
                <p className="text-[10px] font-mono text-stone-500 uppercase">
                  Tự động phân tích Từ Vựng & Ngữ Pháp • Phân loại TOPIC, TOEIC/TOPIK/HSK • Tạo Ví Dụ Thực Tế
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[#1A1A1A]">
                    Đã chọn {imagesBase64.length} hình ảnh:
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-mono underline text-[#1A1A1A] hover:font-bold"
                  >
                    + Thêm ảnh khác
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 border-2 border-[#1A1A1A] bg-white">
                  {imagesBase64.map((imgSrc, idx) => (
                    <div key={idx} className="relative border border-[#1A1A1A] bg-stone-100 group h-24 flex items-center justify-center overflow-hidden">
                      <img src={imgSrc} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-none hover:bg-rose-700 shadow"
                        title="Xóa ảnh này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleScanImage}
                  disabled={isScanning}
                  className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'AI ĐANG PHÂN TÍCH TỪ VỰNG & NGỮ PHÁP...' : `BẮT ĐẦU TRÍCH XUẤT OCR (${imagesBase64.length} ẢNH)`}</span>
                </button>
              </div>
            )}
          </div>

          {/* Extracted Items List */}
          {totalExtracted > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-[#1A1A1A]">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between border-b-2 border-[#1A1A1A]">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('words')}
                    className={`px-4 py-2 font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 border-t-2 border-x-2 ${
                      activeTab === 'words'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-white text-[#1A1A1A] border-transparent hover:bg-stone-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>TỪ VỰNG ({selectedVocabCount}/{extractedWords.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('grammar')}
                    className={`px-4 py-2 font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 border-t-2 border-x-2 ${
                      activeTab === 'grammar'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-white text-[#1A1A1A] border-transparent hover:bg-stone-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>NGỮ PHÁP ({selectedGrammarCount}/{extractedGrammars.length})</span>
                  </button>
                </div>

                <span className="text-[10px] font-mono text-stone-500 uppercase pr-2">
                  TỔNG CỘNG: {selectedVocabCount + selectedGrammarCount} ĐÃ CHỌN
                </span>
              </div>

              {/* Tab 1: Vocabulary List */}
              {activeTab === 'words' && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {extractedWords.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-stone-500">
                      Không tìm thấy từ vựng nào trong ảnh.
                    </div>
                  ) : (
                    extractedWords.map((word, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleSelectWord(idx)}
                        className={`p-4 border-2 transition cursor-pointer flex items-start justify-between gap-3 ${
                          word.selected
                            ? 'bg-white border-[#1A1A1A] editorial-shadow-sm'
                            : 'bg-[#F9F7F2] border-stone-300 opacity-60'
                        }`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif font-black text-lg text-[#1A1A1A]">{word.tu}</span>
                            {word.phien_am && (
                              <span className="text-xs font-mono text-stone-600">[{word.phien_am}]</span>
                            )}
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A]">
                              {word.loai_tu}
                            </span>
                            
                            {/* Certificate Badge */}
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-amber-200 border border-[#1A1A1A] text-amber-950 flex items-center gap-1">
                              <Award className="w-3 h-3 shrink-0" />
                              <span>{word.cap_do}</span>
                            </span>

                            {/* Topic Badge */}
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-sky-100 border border-[#1A1A1A] text-sky-900 flex items-center gap-1">
                              <Tag className="w-3 h-3 shrink-0" />
                              <span>{word.chu_de}</span>
                            </span>
                          </div>

                          <p className="text-sm font-serif font-bold text-[#1A1A1A]">{word.nghia}</p>

                          {/* Example & Translation */}
                          {word.vi_du && (
                            <div className="p-2.5 bg-[#F9F7F2] border-l-3 border-[#1A1A1A] text-xs space-y-0.5">
                              <p className="font-serif italic text-[#1A1A1A]">"{word.vi_du}"</p>
                              {word.vi_du_dich && (
                                <p className="text-stone-600 font-mono text-[11px]">→ {word.vi_du_dich}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ttsService.speak(word.tu, currentLanguage);
                            }}
                            className="p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="checkbox"
                            checked={word.selected}
                            onChange={() => handleToggleSelectWord(idx)}
                            className="w-4 h-4 accent-[#1A1A1A]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Grammar List */}
              {activeTab === 'grammar' && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {extractedGrammars.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-stone-500">
                      Không tìm thấy cấu trúc ngữ pháp nào trong ảnh.
                    </div>
                  ) : (
                    extractedGrammars.map((gram, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleSelectGrammar(idx)}
                        className={`p-4 border-2 transition cursor-pointer flex items-start justify-between gap-3 ${
                          gram.selected
                            ? 'bg-white border-[#1A1A1A] editorial-shadow-sm'
                            : 'bg-[#F9F7F2] border-stone-300 opacity-60'
                        }`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-lg text-[#1A1A1A]">{gram.cau_truc}</span>
                            
                            {/* Certificate Badge */}
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-amber-200 border border-[#1A1A1A] text-amber-950 flex items-center gap-1">
                              <Award className="w-3 h-3 shrink-0" />
                              <span>{gram.cap_do}</span>
                            </span>

                            {/* Topic Badge */}
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-purple-100 border border-[#1A1A1A] text-purple-900 flex items-center gap-1">
                              <Tag className="w-3 h-3 shrink-0" />
                              <span>{gram.chu_de}</span>
                            </span>
                          </div>

                          <p className="text-xs font-serif text-[#1A1A1A] leading-relaxed">{gram.giai_thich}</p>

                          {gram.cong_thuc && (
                            <div className="text-[11px] font-mono font-bold text-stone-700 bg-stone-100 p-1.5 border border-stone-300">
                              Công thức: {gram.cong_thuc}
                            </div>
                          )}

                          {/* Example & Translation */}
                          {gram.vi_du && (
                            <div className="p-2.5 bg-[#F9F7F2] border-l-3 border-[#1A1A1A] text-xs space-y-0.5">
                              <p className="font-serif italic text-[#1A1A1A]">"{gram.vi_du}"</p>
                              {gram.vi_du_dich && (
                                <p className="text-stone-600 font-mono text-[11px]">→ {gram.vi_du_dich}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="checkbox"
                            checked={gram.selected}
                            onChange={() => handleToggleSelectGrammar(idx)}
                            className="w-4 h-4 accent-[#1A1A1A]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1A1A1A]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#1A1A1A] bg-white text-xs font-mono uppercase text-[#1A1A1A]"
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  onClick={handleSaveSelectedItems}
                  className="px-6 py-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm flex items-center gap-2"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>LƯU CÁC MỤC ĐÃ CHỌN ({selectedVocabCount + selectedGrammarCount})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

