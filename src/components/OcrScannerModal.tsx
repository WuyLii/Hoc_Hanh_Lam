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
  nghia_tieng_han?: string;
  nghia_tieng_anh?: string;
  ngon_ngu?: 'en' | 'ko' | 'zh';
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
  const { currentLanguage, setCurrentLanguage, batchAddVocabulary, batchAddGrammar } = useApp();
  const currentLangInfo = LANGUAGES[currentLanguage];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanLanguage, setScanLanguage] = useState<'en' | 'ko' | 'zh'>(currentLanguage);
  
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
          language: scanLanguage,
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
          data.words.map((w: any) => {
            const isKo = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(w.tu || w.word || '') || w.ngon_ngu === 'ko' || scanLanguage === 'ko';
            const isEn = !isKo && (/^[a-zA-Z\s\-'’.,!?()]+$/.test((w.tu || w.word || '').trim()) || w.ngon_ngu === 'en' || scanLanguage === 'en');
            const wordLang: 'en' | 'ko' | 'zh' = isKo ? 'ko' : isEn ? 'en' : (w.ngon_ngu || scanLanguage);

            return {
              tu: w.tu || w.word || '',
              nghia: w.nghia || w.meaning || '',
              phien_am: w.phien_am || w.phonetic || '',
              loai_tu: w.loai_tu || w.type || 'Từ vựng',
              cap_do: w.cap_do || (wordLang === 'en' ? 'TOEIC 500' : wordLang === 'ko' ? 'TOPIK 2' : 'HSK 3'),
              chu_de: w.chu_de || 'Quét OCR Sách',
              vi_du: w.vi_du || w.example || '',
              vi_du_dich: w.vi_du_dich || w.exampleVi || '',
              nghia_tieng_han: w.nghia_tieng_han || w.korean || '',
              nghia_tieng_anh: w.nghia_tieng_anh || w.english || '',
              ngon_ngu: wordLang,
              selected: true,
            };
          })
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
            cap_do: g.cap_do || (scanLanguage === 'en' ? 'TOEIC 600' : scanLanguage === 'ko' ? 'TOPIK 2' : 'HSK 3'),
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

  const handleEnrichAllWords = async () => {
    if (extractedWords.length === 0 || isEnriching) return;
    setIsEnriching(true);

    try {
      const wordsToEnrich = extractedWords.map((w, idx) => ({
        word_id: String(idx),
        tu: w.tu,
        nghia: w.nghia,
        ngon_ngu: w.ngon_ngu || scanLanguage,
      }));

      const res = await fetch('/api/gemini/fill-missing-bilingual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: scanLanguage,
          words: wordsToEnrich,
        }),
      });

      if (!res.ok) throw new Error('Không thể bổ sung đối ứng song ngữ lúc này.');
      const data = await res.json();

      if (Array.isArray(data.results)) {
        setExtractedWords((prev) =>
          prev.map((item, idx) => {
            const found = data.results.find((r: any) => r.word_id === String(idx));
            if (!found) return item;
            return {
              ...item,
              nghia_tieng_anh: found.nghia_tieng_anh || item.nghia_tieng_anh,
              nghia_tieng_han: found.nghia_tieng_han || item.nghia_tieng_han,
              phien_am: found.phien_am || item.phien_am,
            };
          })
        );
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi bổ sung');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleEnrichSingleWord = async (idx: number) => {
    const target = extractedWords[idx];
    if (!target) return;

    try {
      const res = await fetch('/api/gemini/fill-missing-bilingual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: target.ngon_ngu || scanLanguage,
          words: [{ word_id: '0', tu: target.tu, nghia: target.nghia, ngon_ngu: target.ngon_ngu || scanLanguage }],
        }),
      });

      if (!res.ok) throw new Error('Lỗi điền nghĩa');
      const data = await res.json();
      if (Array.isArray(data.results) && data.results[0]) {
        const r = data.results[0];
        setExtractedWords((prev) =>
          prev.map((w, i) =>
            i === idx
              ? {
                  ...w,
                  nghia_tieng_anh: r.nghia_tieng_anh || w.nghia_tieng_anh,
                  nghia_tieng_han: r.nghia_tieng_han || w.nghia_tieng_han,
                  phien_am: r.phien_am || w.phien_am,
                }
              : w
          )
        );
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi điền nghĩa');
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
        selectedVocab.map((w) => {
          const isKo = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(w.tu) || w.ngon_ngu === 'ko';
          const isEn = !isKo && (/^[a-zA-Z\s\-'’.,!?()]+$/.test(w.tu) || w.ngon_ngu === 'en');
          const finalLang: 'en' | 'ko' | 'zh' = isKo ? 'ko' : isEn ? 'en' : (w.ngon_ngu || currentLanguage);

          return {
            tu: w.tu.trim(),
            nghia: w.nghia.trim(),
            phien_am: w.phien_am?.trim() || '',
            loai_tu: w.loai_tu || 'Từ vựng',
            vi_du: w.vi_du || '',
            vi_du_dich: w.vi_du_dich || '',
            cap_do: w.cap_do || 'Cơ bản',
            chu_de: w.chu_de || 'Quét OCR AI',
            ngon_ngu: finalLang,
            nghia_tieng_han: w.nghia_tieng_han || '',
            nghia_tieng_anh: w.nghia_tieng_anh || '',
            nguon_goc: 'Quét OCR AI',
          };
        })
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
          ngon_ngu: scanLanguage || currentLanguage,
          tags: [g.chu_de, 'Quét OCR AI'],
        }))
      );
    }

    const koreanWordsCount = selectedVocab.filter((w) => w.ngon_ngu === 'ko' || /[\uAC00-\uD7AF\u1100-\u11FF]/.test(w.tu)).length;
    const englishWordsCount = selectedVocab.filter((w) => w.ngon_ngu === 'en' && !/[\uAC00-\uD7AF\u1100-\u11FF]/.test(w.tu)).length;

    // Tự động chuyển tab sang ngôn ngữ tương ứng để người dùng thấy ngay từ vừa lưu
    if (koreanWordsCount > 0 && currentLanguage !== 'ko') {
      setCurrentLanguage('ko');
    } else if (englishWordsCount > 0 && currentLanguage !== 'en' && koreanWordsCount === 0) {
      setCurrentLanguage('en');
    }

    let detailMsg = `🎉 Đã lưu thành công ${addedVocab} từ vựng`;
    if (koreanWordsCount > 0) {
      detailMsg += ` (trong đó có ${koreanWordsCount} từ tiếng Hàn kèm đầy đủ nghĩa tiếng Anh & tiếng Việt)`;
    }
    if (englishWordsCount > 0) {
      detailMsg += ` (trong đó có ${englishWordsCount} từ tiếng Anh kèm nghĩa tiếng Hàn & tiếng Việt)`;
    }
    if (addedGrammar > 0) {
      detailMsg += ` và ${addedGrammar} cấu trúc ngữ pháp`;
    }
    detailMsg += ` vào hệ thống!`;

    alert(detailMsg);
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
          {/* Language Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border-2 border-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-[#1A1A1A]">
                Ngôn ngữ tài liệu:
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setScanLanguage('ko')}
                  className={`px-3 py-1 text-xs font-mono font-bold border transition cursor-pointer ${
                    scanLanguage === 'ko'
                      ? 'bg-indigo-900 text-white border-indigo-900'
                      : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  🇰🇷 Tiếng Hàn
                </button>
                <button
                  type="button"
                  onClick={() => setScanLanguage('en')}
                  className={`px-3 py-1 text-xs font-mono font-bold border transition cursor-pointer ${
                    scanLanguage === 'en'
                      ? 'bg-sky-900 text-white border-sky-900'
                      : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  🇬🇧 Tiếng Anh
                </button>
                <button
                  type="button"
                  onClick={() => setScanLanguage('zh')}
                  className={`px-3 py-1 text-xs font-mono font-bold border transition cursor-pointer ${
                    scanLanguage === 'zh'
                      ? 'bg-red-900 text-white border-red-900'
                      : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  🇨🇳 Tiếng Trung
                </button>
              </div>
            </div>
            <span className="text-[10px] font-mono text-stone-500">
              * Từ tiếng Hàn sẽ lưu vào kho Hàn kèm nghĩa tiếng Anh đối ứng
            </span>
          </div>

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
                  {/* Bilingual Enrichment Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50 border border-indigo-200">
                    <div className="text-xs font-serif text-indigo-950">
                      <strong className="font-mono text-indigo-900 uppercase">Quy tắc đối ứng:</strong> Từ tiếng Hàn có nghĩa tiếng Anh, từ tiếng Anh có nghĩa tiếng Hàn & Romaja.
                    </div>
                    <button
                      type="button"
                      onClick={handleEnrichAllWords}
                      disabled={isEnriching}
                      className="px-3 py-1 bg-indigo-900 text-white font-mono text-xs font-bold hover:bg-indigo-950 disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
                      <span>{isEnriching ? 'ĐANG BỔ SUNG...' : '✨ AI BỔ SUNG ĐỐI ỨNG HÀN ⇄ ANH'}</span>
                    </button>
                  </div>

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

                            {/* Language Destination Badge */}
                            {word.ngon_ngu === 'ko' ? (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-indigo-100 border border-indigo-400 text-indigo-950">
                                🇰🇷 KHO TIẾNG HÀN
                              </span>
                            ) : word.ngon_ngu === 'en' ? (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-sky-100 border border-sky-400 text-sky-950">
                                🇬🇧 KHO TIẾNG ANH
                              </span>
                            ) : null}
                            
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

                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] font-mono text-stone-500 shrink-0">🇻🇳 Tiếng Việt:</span>
                              <p className="text-sm font-serif font-bold text-[#1A1A1A]">{word.nghia}</p>
                            </div>

                            {/* Korean equivalent for English words */}
                            {(word.ngon_ngu === 'en' || word.nghia_tieng_han || scanLanguage === 'en') && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50/80 border border-indigo-300 text-xs font-mono"
                              >
                                <span className="font-bold text-indigo-900 shrink-0 flex items-center gap-1">
                                  <span>🇰🇷</span> Tiếng Hàn đối ứng:
                                </span>
                                <input
                                  type="text"
                                  value={word.nghia_tieng_han || ''}
                                  placeholder="Nghĩa tiếng Hàn (kèm Romaja)..."
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExtractedWords((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, nghia_tieng_han: val } : item))
                                    );
                                  }}
                                  className="flex-1 px-2 py-0.5 bg-white border border-indigo-200 text-xs text-indigo-950 focus:outline-none focus:border-indigo-500 font-sans"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleEnrichSingleWord(idx)}
                                  className="px-2 py-0.5 bg-indigo-800 text-white text-[10px] font-mono hover:bg-indigo-900 shrink-0 cursor-pointer"
                                  title="AI tự động dịch từ đối ứng"
                                >
                                  ⚡ AI Điền
                                </button>
                              </div>
                            )}

                            {/* English equivalent for Korean words */}
                            {(word.ngon_ngu === 'ko' || word.nghia_tieng_anh || scanLanguage === 'ko') && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-sky-50/80 border border-sky-300 text-xs font-mono"
                              >
                                <span className="font-bold text-sky-900 shrink-0 flex items-center gap-1">
                                  <span>🇬🇧</span> Tiếng Anh đối ứng:
                                </span>
                                <input
                                  type="text"
                                  value={word.nghia_tieng_anh || ''}
                                  placeholder="Nghĩa tiếng Anh tương ứng..."
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExtractedWords((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, nghia_tieng_anh: val } : item))
                                    );
                                  }}
                                  className="flex-1 px-2 py-0.5 bg-white border border-sky-200 text-xs text-sky-950 focus:outline-none focus:border-sky-500 font-sans"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleEnrichSingleWord(idx)}
                                  className="px-2 py-0.5 bg-sky-800 text-white text-[10px] font-mono hover:bg-sky-900 shrink-0 cursor-pointer"
                                  title="AI tự động dịch từ đối ứng"
                                >
                                  ⚡ AI Điền
                                </button>
                              </div>
                            )}
                          </div>

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

