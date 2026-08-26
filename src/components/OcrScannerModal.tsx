import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../types';
import {
  Sparkles,
  Camera,
  Upload,
  X,
  Check,
  BookmarkPlus,
  AlertCircle,
  Volume2,
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
  vi_du: string;
  selected: boolean;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage, batchAddVocabulary } = useApp();
  const currentLangInfo = LANGUAGES[currentLanguage];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setImageBase64(evt.target?.result as string);
      setExtractedWords([]);
      setScanError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanImage = async () => {
    if (!imageBase64 || isScanning) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch('/api/gemini/ocr-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          imageBase64: imageBase64,
        }),
      });

      if (!response.ok) throw new Error('Không thể xử lý ảnh qua Gemini Vision');

      const data = await response.json();
      if (Array.isArray(data.words) && data.words.length > 0) {
        setExtractedWords(
          data.words.map((w: any) => ({
            tu: w.tu || w.word || '',
            nghia: w.nghia || w.meaning || '',
            phien_am: w.phien_am || w.phonetic || '',
            loai_tu: w.loai_tu || w.type || 'Từ vựng',
            vi_du: w.vi_du || w.example || '',
            selected: true,
          }))
        );
      } else {
        setScanError('Không trích xuất được từ vựng rõ ràng. Vui lòng chụp lại ảnh với ánh sáng tốt và rõ nét hơn.');
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

  const handleSaveSelectedWords = () => {
    const selected = extractedWords.filter((w) => w.selected && w.tu.trim() && w.nghia.trim());
    if (selected.length === 0) return;

    const count = batchAddVocabulary(
      selected.map((w) => ({
        tu: w.tu,
        nghia: w.nghia,
        phien_am: w.phien_am,
        loai_tu: w.loai_tu,
        vi_du: w.vi_du,
        cap_do: 'Cốt lõi',
        chu_de: 'Quét OCR Sách',
        ngon_ngu: currentLanguage,
      }))
    );

    alert(`Đã lưu thành công ${count} từ vựng từ ảnh OCR vào sổ tay từ vựng!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#1A1A1A]" />
            <h2 className="text-base font-serif font-black uppercase tracking-tight text-[#1A1A1A]">
              Quét từ vựng qua ảnh OCR AI ({currentLangInfo.name})
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
            <div className="p-3 bg-rose-100 border-2 border-rose-800 text-rose-900 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!imageBase64 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-[#1A1A1A] bg-white hover:bg-stone-50 cursor-pointer text-center space-y-3"
              >
                <Upload className="w-8 h-8 text-stone-500 mx-auto" />
                <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                  Tải lên ảnh trang sách giáo khoa / bài tập / tài liệu
                </h3>
                <p className="text-[10px] font-mono text-stone-500 uppercase">
                  PNG, JPG, WEBP • Tự động nhận diện từ vựng & giải nghĩa bằng AI
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative border-2 border-[#1A1A1A] bg-white p-2 flex items-center justify-center max-h-60 overflow-hidden">
                  <img src={imageBase64} alt="Xem trước ảnh OCR" className="max-h-56 object-contain" />
                  <button
                    onClick={() => {
                      setImageBase64(null);
                      setExtractedWords([]);
                    }}
                    className="absolute top-3 right-3 px-2 py-1 bg-[#1A1A1A] text-white text-[10px] font-mono font-bold uppercase"
                  >
                    ĐỔI ẢNH KHÁC
                  </button>
                </div>

                <button
                  onClick={handleScanImage}
                  disabled={isScanning}
                  className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'ĐANG TRÍCH XUẤT TỪ VỰNG...' : 'BẮT ĐẦU TRÍCH XUẤT OCR'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Extracted Words List */}
          {extractedWords.length > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-[#1A1A1A]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
                  Từ vựng trích xuất được ({extractedWords.filter((w) => w.selected).length} từ đã chọn):
                </h3>
              </div>

              <div className="space-y-3">
                {extractedWords.map((word, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleSelectWord(idx)}
                    className={`p-4 border-2 transition cursor-pointer flex items-start justify-between gap-3 ${
                      word.selected
                        ? 'bg-white border-[#1A1A1A] editorial-shadow-sm'
                        : 'bg-[#F9F7F2] border-stone-300 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-black text-lg text-[#1A1A1A]">{word.tu}</span>
                        {word.phien_am && (
                          <span className="text-xs font-mono text-stone-600">{word.phien_am}</span>
                        )}
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A]">
                          {word.loai_tu}
                        </span>
                      </div>
                      <p className="text-xs font-serif font-semibold text-[#1A1A1A]">{word.nghia}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          ttsService.speak(word.tu, currentLanguage);
                        }}
                        className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
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
                ))}
              </div>

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
                  onClick={handleSaveSelectedWords}
                  className="px-6 py-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm flex items-center gap-2"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>LƯU VÀO KHO TỪ VỰNG</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
