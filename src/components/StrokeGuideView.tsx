import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LanguageCode, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import {
  PenTool,
  Volume2,
  Layers,
  RotateCcw,
  Eraser,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2,
  ArrowRight,
  Pencil,
} from 'lucide-react';
import {
  KOREAN_STROKE_RULES,
  KOREAN_BASIC_CONSONANTS,
  KOREAN_DOUBLE_CONSONANTS,
  KOREAN_VOWELS,
  KOREAN_COMPOUND_VOWELS,
  KOREAN_SAMPLE_PRACTICE,
  CHINESE_BASIC_STROKES,
  CHINESE_COMPOSITE_STROKES,
  CHINESE_STROKE_RULES,
  CHINESE_ESSENTIAL_RADICALS,
  CHINESE_SAMPLE_PRACTICE,
  ENGLISH_HANDWRITING_RULES,
  ENGLISH_ALPHABET_ITEMS,
  ENGLISH_SAMPLE_PRACTICE,
  PracticeCharacter,
  RadicalOrComponent,
} from '../data/strokeData';

export const StrokeGuideView: React.FC = () => {
  const { currentLanguage, setLanguage } = useApp();

  // Active sub-tab inside each language
  const [activeSubTab, setActiveSubTab] = useState<'practice' | 'rules' | 'components'>('practice');

  // Selected character for canvas practice
  const [selectedPracticeChar, setSelectedPracticeChar] = useState<PracticeCharacter>(() => {
    if (currentLanguage === 'ko') return KOREAN_SAMPLE_PRACTICE[0];
    if (currentLanguage === 'en') return ENGLISH_SAMPLE_PRACTICE[0];
    return CHINESE_SAMPLE_PRACTICE[0];
  });

  // Canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState<string>('#1A1A1A');
  const [brushWidth, setBrushWidth] = useState<number>(6);
  const [showGhostGuide, setShowGhostGuide] = useState(true);

  // Sync practice char when language changes
  useEffect(() => {
    if (currentLanguage === 'ko') {
      setSelectedPracticeChar(KOREAN_SAMPLE_PRACTICE[0]);
    } else if (currentLanguage === 'en') {
      setSelectedPracticeChar(ENGLISH_SAMPLE_PRACTICE[0]);
    } else {
      setSelectedPracticeChar(CHINESE_SAMPLE_PRACTICE[0]);
    }
    clearCanvas();
  }, [currentLanguage]);

  // Redraw grid background
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Background color
    ctx.fillStyle = '#FCFAF6';
    ctx.fillRect(0, 0, width, height);

    if (currentLanguage === 'en') {
      // 4-Line Ruling for English Handwriting
      const lineSpacing = height / 5;
      const lines = [
        { y: lineSpacing * 1, color: '#DC2626', dash: [], label: 'Top / Ascender Line' },
        { y: lineSpacing * 2, color: '#9CA3AF', dash: [4, 4], label: 'Mid / Waist Line' },
        { y: lineSpacing * 3, color: '#2563EB', dash: [], label: 'Base Line' },
        { y: lineSpacing * 4, color: '#DC2626', dash: [], label: 'Bottom / Descender Line' },
      ];

      lines.forEach((l) => {
        ctx.beginPath();
        ctx.setLineDash(l.dash);
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 1.2;
        ctx.moveTo(10, l.y);
        ctx.lineTo(width - 10, l.y);
        ctx.stroke();
      });
    } else {
      // Tian Zi Ge / Mi Zi Ge (Ô chữ Điền / Ô chữ Mễ)
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 1;

      // Outer border
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Mid lines (Cross)
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(width / 2, 10);
      ctx.lineTo(width / 2, height - 10);
      ctx.moveTo(10, height / 2);
      ctx.lineTo(width - 10, height / 2);

      // Diagonals (Mi Zi Ge)
      ctx.moveTo(10, 10);
      ctx.lineTo(width - 10, height - 10);
      ctx.moveTo(width - 10, 10);
      ctx.lineTo(10, height - 10);
      ctx.stroke();
    }

    ctx.restore();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, canvas.width, canvas.height);
  };

  useEffect(() => {
    clearCanvas();
  }, [currentLanguage, selectedPracticeChar]);

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSpeak = (text: string) => {
    ttsService.speak(text, currentLanguage);
  };

  // Practice characters list for the active language
  const practiceList: PracticeCharacter[] =
    currentLanguage === 'ko'
      ? KOREAN_SAMPLE_PRACTICE
      : currentLanguage === 'en'
      ? ENGLISH_SAMPLE_PRACTICE
      : CHINESE_SAMPLE_PRACTICE;

  // Rules list for the active language
  const rulesList =
    currentLanguage === 'ko'
      ? KOREAN_STROKE_RULES
      : currentLanguage === 'en'
      ? ENGLISH_HANDWRITING_RULES
      : CHINESE_STROKE_RULES;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* 1. Header Banner & Language Selector */}
      <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1A]/20 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
                Cẩm nang thư pháp & Nét chữ
              </span>
              <span className="text-xs font-serif italic text-stone-600">
                Thứ tự nét, bộ thủ & quy tắc ghép chữ chuẩn
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
              Tập viết nét chữ — {LANGUAGES[currentLanguage].name}
            </h1>
          </div>

          {/* Direct Language Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EB] border border-[#1A1A1A] rounded-none">
            {(['zh', 'ko', 'en'] as LanguageCode[]).map((code) => {
              const lang = LANGUAGES[code];
              const isSelected = currentLanguage === code;
              return (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-3 py-2 text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-[#F9F7F2] shadow-sm'
                      : 'text-[#1A1A1A] hover:bg-stone-200'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub Navigation for View Modes */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('practice')}
            className={`px-4 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-2 ${
              activeSubTab === 'practice'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Ô vẽ & Luyện viết tương tác</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-4 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-2 ${
              activeSubTab === 'rules'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Quy tắc viết nét ({rulesList.length} Quy tắc vàng)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('components')}
            className={`px-4 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-2 ${
              activeSubTab === 'components'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {currentLanguage === 'ko'
                ? 'Phụ âm, Nguyên âm & Batchim'
                : currentLanguage === 'zh'
                ? 'Vĩnh Tự Bát Pháp & Bộ thủ'
                : 'Bảng chữ cái & Vùng 4 dòng kẻ'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB: Interactive Canvas Practice */}
      {activeSubTab === 'practice' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Selection List */}
            <div className="lg:col-span-4 p-5 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Danh sách chữ mẫu luyện viết:
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  {practiceList.length} mẫu
                </span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {practiceList.map((item) => {
                  const isSelected = selectedPracticeChar.char === item.char;
                  return (
                    <button
                      key={item.char}
                      onClick={() => setSelectedPracticeChar(item)}
                      className={`w-full p-3 border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                          : 'bg-[#F9F7F2] border-stone-300 text-[#1A1A1A] hover:border-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-serif font-bold">{item.char}</span>
                        <div>
                          <div className="text-xs font-mono font-bold">{item.phonetic}</div>
                          <div className="text-[11px] opacity-80 truncate max-w-[130px]">
                            {item.meaning}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono border border-current px-1.5 py-0.5">
                        {item.strokeCount} nét
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Interactive Canvas Pad */}
            <div className="lg:col-span-8 p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-5">
              {/* Header of character */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A1A1A]/15 pb-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl sm:text-6xl font-serif font-black text-[#1A1A1A]">
                    {selectedPracticeChar.char}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-bold text-[#1A1A1A]">
                        {selectedPracticeChar.phonetic}
                      </span>
                      <button
                        onClick={() => handleSpeak(selectedPracticeChar.char)}
                        className="p-1.5 bg-[#F9F7F2] border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-serif text-stone-700">{selectedPracticeChar.meaning}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#F9F7F2] border border-[#1A1A1A] px-2.5 py-1">
                    {selectedPracticeChar.strokeCount} NÉT
                  </span>
                  <span className="text-xs font-mono font-bold bg-[#1A1A1A] text-white px-2.5 py-1">
                    {selectedPracticeChar.difficulty}
                  </span>
                </div>
              </div>

              {/* Stroke Order Step breakdown */}
              <div className="p-3.5 bg-[#F9F7F2] border-l-4 border-[#1A1A1A] space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Thứ tự các nét & Thành phần:
                </span>
                <p className="text-xs sm:text-sm font-serif text-[#1A1A1A] leading-relaxed">
                  {selectedPracticeChar.strokeOrder}
                </p>
                {selectedPracticeChar.components && (
                  <p className="text-[11px] font-mono text-stone-600">
                    Thành phần cấu tạo: <span className="font-bold">{selectedPracticeChar.components}</span>
                  </p>
                )}
              </div>

              {/* Canvas Area */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative border-2 border-[#1A1A1A] shadow-inner bg-[#FCFAF6] overflow-hidden">
                  {/* Ghost Guide Character Layer */}
                  {showGhostGuide && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                      <span className="text-[140px] sm:text-[180px] font-serif font-normal text-stone-300/45 leading-none">
                        {selectedPracticeChar.char}
                      </span>
                    </div>
                  )}

                  {/* Active Drawing Canvas */}
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={300}
                    className="relative z-10 cursor-crosshair touch-none w-full max-w-[380px] h-[300px]"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>

                {/* Canvas Controls & Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-[380px] text-xs font-mono">
                  {/* Color selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase text-stone-500 font-bold">Mực:</span>
                    {[
                      { color: '#1A1A1A', title: 'Mực đen' },
                      { color: '#DC2626', title: 'Mực đỏ' },
                      { color: '#2563EB', title: 'Mực xanh' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setBrushColor(c.color)}
                        className={`w-6 h-6 border-2 transition ${
                          brushColor === c.color ? 'border-[#1A1A1A] scale-110' : 'border-stone-300'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.title}
                      />
                    ))}
                  </div>

                  {/* Width selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-stone-500 font-bold">Nét:</span>
                    {[4, 7, 12].map((w) => (
                      <button
                        key={w}
                        onClick={() => setBrushWidth(w)}
                        className={`px-2 py-0.5 border ${
                          brushWidth === w
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {w === 4 ? 'Thanh' : w === 7 ? 'Vừa' : 'Đậm'}
                      </button>
                    ))}
                  </div>

                  {/* Toggle Ghost & Clear */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGhostGuide(!showGhostGuide)}
                      className={`px-2 py-1 border transition ${
                        showGhostGuide
                          ? 'bg-amber-100 border-amber-800 text-amber-900 font-bold'
                          : 'bg-white border-stone-300 text-stone-600'
                      }`}
                      title="Bật/Tắt chữ mẫu mờ"
                    >
                      Mẫu mờ: {showGhostGuide ? 'Bật' : 'Tắt'}
                    </button>

                    <button
                      onClick={clearCanvas}
                      className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-stone-100 transition flex items-center gap-1 font-bold"
                      title="Xóa viết lại"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB: Complete Stroke Order Rules */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-3">
            <h2 className="text-base font-serif font-black text-[#1A1A1A] flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Quy tắc viết nét chuẩn xác trong {LANGUAGES[currentLanguage].name}</span>
            </h2>
            <p className="text-xs font-serif text-stone-600 leading-relaxed">
              Thứ tự viết nét (Stroke Order) không chỉ giúp chữ viết cân đối, vững chãi và đẹp mắt, mà
              còn là nền tảng để tra cứu từ điển theo bộ thủ và nhận diện chữ viết tay chính xác.
            </p>
          </div>

          <div className="space-y-6">
            {rulesList.map((rule, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-7 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#1A1A1A] pb-3 gap-2">
                  <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">{rule.title}</h3>
                  {rule.nativeTitle && (
                    <span className="text-xs font-mono font-bold bg-[#F9F7F2] border border-[#1A1A1A] px-2.5 py-0.5 text-stone-700">
                      {rule.nativeTitle}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-serif text-stone-700 leading-relaxed">
                  {rule.desc}
                </p>

                {/* Example cards inside rule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                  {rule.examples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-3.5 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-3xl font-serif font-black text-[#1A1A1A]">{ex.char}</span>
                        {ex.pinyinOrRomaja && (
                          <button
                            onClick={() => handleSpeak(ex.char)}
                            className="p-1 border border-stone-400 hover:bg-[#1A1A1A] hover:text-white transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {ex.pinyinOrRomaja && (
                        <div className="text-[11px] font-mono font-bold text-stone-800">
                          {ex.pinyinOrRomaja}
                        </div>
                      )}

                      <div className="text-xs font-serif text-stone-700 leading-snug">{ex.meaning}</div>

                      <div className="pt-2 border-t border-stone-300 text-[10px] font-mono text-stone-600">
                        {ex.breakdown}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUB-TAB: Components, Radicals & Alphabets */}
      {activeSubTab === 'components' && (
        <div className="space-y-8">
          {/* A. TIẾNG HÀN: Components */}
          {currentLanguage === 'ko' && (
            <div className="space-y-8">
              {/* Basic Consonants */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    1. Bảng 14 Phụ Âm Cơ Bản (기본 자음)
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Tượng hình theo cơ quan phát âm: Lưỡi, Răng, Môi, Vòm họng và Thanh quản.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {KOREAN_BASIC_CONSONANTS.map((c) => (
                    <div
                      key={c.symbol}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-4xl font-serif font-black text-[#1A1A1A]">
                          {c.symbol}
                        </span>
                        <button
                          onClick={() => handleSpeak(c.symbol)}
                          className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1A1A1A]">{c.name}</div>
                      <div className="text-[10px] font-mono text-stone-600">Âm: {c.pinyinOrRomaja} • {c.strokes} nét</div>
                      <p className="text-[11px] font-serif text-stone-700 leading-tight">{c.meaning}</p>
                      {c.tips && (
                        <div className="text-[10px] font-mono bg-white p-1.5 border border-stone-300 text-stone-600">
                          {c.tips}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Double Consonants */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    2. Bảng 5 Phụ Âm Căng / Đôi (쌍자음)
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Phát âm căng cứng giọng, nén hơi không bật luồng khí ra ngoài.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {KOREAN_DOUBLE_CONSONANTS.map((c) => (
                    <div
                      key={c.symbol}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-serif font-black text-[#1A1A1A]">
                          {c.symbol}
                        </span>
                        <button
                          onClick={() => handleSpeak(c.symbol)}
                          className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1A1A1A]">{c.name}</div>
                      <div className="text-[10px] font-mono text-stone-600">{c.pinyinOrRomaja}</div>
                      <p className="text-[11px] font-serif text-stone-700 leading-tight">{c.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Vowels */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    3. Bảng 10 Nguyên Âm Cơ Bản (기본 모음)
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Triết lý Tam Tài: Trời (•), Đất (ㅡ) và Con người (ㅣ).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {KOREAN_VOWELS.map((v) => (
                    <div
                      key={v.symbol}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-serif font-black text-[#1A1A1A]">
                          {v.symbol}
                        </span>
                        <button
                          onClick={() => handleSpeak(v.symbol)}
                          className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1A1A1A]">{v.name}</div>
                      <div className="text-[10px] font-mono text-stone-600">Âm: {v.pinyinOrRomaja}</div>
                      <p className="text-[11px] font-serif text-stone-700 leading-tight">{v.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compound Vowels */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    4. Bảng 11 Nguyên Âm Ghép (이중 모음)
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Ghép từ các nguyên âm cơ bản tạo thành âm đôi và âm lướt.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {KOREAN_COMPOUND_VOWELS.map((v) => (
                    <div
                      key={v.symbol}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-serif font-black text-[#1A1A1A]">
                          {v.symbol}
                        </span>
                        <button
                          onClick={() => handleSpeak(v.symbol)}
                          className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1A1A1A]">{v.name}</div>
                      <div className="text-[10px] font-mono text-stone-600">Âm: {v.pinyinOrRomaja}</div>
                      <p className="text-[11px] font-serif text-stone-700 leading-tight">{v.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B. TIẾNG TRUNG: Vĩnh Tự Bát Pháp & Bộ thủ */}
          {currentLanguage === 'zh' && (
            <div className="space-y-8">
              {/* 8 Basic Strokes */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    1. Vĩnh Tự Bát Pháp (永字八法) — 8 Nét Cơ Bản Của Chữ Hán
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Chữ "Vĩnh" (永) chứa trọn vẹn 8 nét bút cơ bản nhất trong nghệ thuật thư pháp Hán tự.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {CHINESE_BASIC_STROKES.map((stroke, idx) => (
                    <div
                      key={stroke.id}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-4xl font-serif font-black text-[#1A1A1A]">
                          {stroke.symbol}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">Nét {idx + 1}</span>
                      </div>
                      <h4 className="text-xs font-serif font-bold text-[#1A1A1A]">{stroke.name}</h4>
                      <p className="text-[11px] font-serif text-stone-600 leading-snug">{stroke.desc}</p>
                      {stroke.exampleChar && (
                        <div className="text-[10px] font-mono bg-white p-1 border border-stone-300">
                          Ví dụ: <span className="font-bold">{stroke.exampleChar}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Composite strokes */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    2. Các Nét Biến Thể & Nét Phức (复合笔画)
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Các nét gập, móc, hất kết hợp tạo nên khung xương cho chữ Hán phức tạp.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {CHINESE_COMPOSITE_STROKES.map((stroke) => (
                    <div
                      key={stroke.id}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-serif font-black text-[#1A1A1A]">
                          {stroke.symbol}
                        </span>
                      </div>
                      <h4 className="text-xs font-serif font-bold text-[#1A1A1A]">{stroke.name}</h4>
                      <p className="text-[11px] font-serif text-stone-600 leading-snug">{stroke.desc}</p>
                      {stroke.exampleChar && (
                        <div className="text-[10px] font-mono bg-white p-1 border border-stone-300">
                          Trong chữ: <span className="font-bold">{stroke.exampleChar}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Essential Radicals */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    3. Bảng Bộ Thủ Thiết Yếu (常用部首)
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Bộ thủ gợi ý ý nghĩa và phạm trù biểu đạt của chữ Hán (Hán tự biểu ý).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {CHINESE_ESSENTIAL_RADICALS.map((rad) => (
                    <div
                      key={rad.symbol}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-serif font-black text-[#1A1A1A]">
                          {rad.symbol}
                        </span>
                        <span className="text-[10px] font-mono bg-white border border-stone-300 px-1.5 py-0.5">
                          {rad.strokes} nét
                        </span>
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1A1A1A]">{rad.name}</div>
                      <div className="text-[11px] font-mono text-stone-600">Bính âm: {rad.pinyinOrRomaja}</div>
                      <p className="text-[11px] font-serif text-stone-700 leading-snug">{rad.meaning}</p>
                      <div className="text-[10px] font-mono bg-white p-1.5 border border-stone-300 text-stone-700">
                        Chữ chứa bộ: <span className="font-bold">{rad.sampleChars.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* C. TIẾNG ANH: Alphabet & 4-line Ruling */}
          {currentLanguage === 'en' && (
            <div className="space-y-8">
              {/* Alphabet Breakdown */}
              <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
                <div className="border-b border-[#1A1A1A] pb-3">
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    1. Bảng Chữ Cái Tiếng Anh (English Alphabet & Strokes)
                  </h3>
                  <p className="text-xs font-serif text-stone-600">
                    Cấu trúc nét viết hoa, viết thường và ký hiệu ngữ âm quốc tế IPA.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ENGLISH_ALPHABET_ITEMS.map((item) => (
                    <div
                      key={item.symbol}
                      className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-serif font-black text-[#1A1A1A]">
                          {item.symbol}
                        </span>
                        <button
                          onClick={() => handleSpeak(item.symbol.charAt(0))}
                          className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1A1A1A]">{item.name}</div>
                      <div className="text-[10px] font-mono text-stone-600">IPA: {item.pinyinOrRomaja}</div>
                      <p className="text-[11px] font-serif text-stone-700 leading-snug">{item.meaning}</p>
                      {item.tips && (
                        <div className="text-[10px] font-mono bg-white p-1.5 border border-stone-300 text-stone-600">
                          {item.tips}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-stone-500">
                        Ví dụ: <span className="font-bold">{item.sampleChars.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
