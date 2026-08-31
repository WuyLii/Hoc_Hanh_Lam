import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LanguageCode, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import {
  Calculator,
  Volume2,
  BookOpen,
  Layers,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Coins,
  FileSpreadsheet,
  HelpCircle,
  Hash,
} from 'lucide-react';
import {
  KOREAN_NUMBER_TABLE,
  KOREAN_NUMBER_RULES,
  KOREAN_COUNTERS,
  CHINESE_NUMBER_TABLE,
  CHINESE_NUMBER_RULES,
  CHINESE_COUNTERS,
  ENGLISH_NUMBER_TABLE,
  ENGLISH_NUMBER_RULES,
  ENGLISH_PARTITIVES,
  NumberRuleItem,
  CounterWord,
  NumberTableEntry,
} from '../data/numberData';
import {
  convertToKoreanSino,
  convertToKoreanNative,
  convertToKoreanWithCounter,
  convertToChineseSimp,
  convertToEnglishCardinal,
  convertToEnglishOrdinal,
} from '../utils/numberConverter';

export const NumbersView: React.FC = () => {
  const { currentLanguage, setLanguage } = useApp();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'converter' | 'rules' | 'counters' | 'table' | 'quiz'>('converter');

  // Interactive Converter State
  const [inputNum, setInputNum] = useState<string>('25');
  const [selectedCounterUnit, setSelectedCounterUnit] = useState<string>('개');

  // Search filter for counters
  const [counterSearch, setCounterSearch] = useState<string>('');

  // Quiz State
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const numericVal = parseInt(inputNum, 10) || 0;

  const handleSpeak = (text: string) => {
    ttsService.speak(text, currentLanguage);
  };

  // Language-specific data references
  const rulesList: NumberRuleItem[] =
    currentLanguage === 'ko'
      ? KOREAN_NUMBER_RULES
      : currentLanguage === 'en'
      ? ENGLISH_NUMBER_RULES
      : CHINESE_NUMBER_RULES;

  const countersList: CounterWord[] =
    currentLanguage === 'ko'
      ? KOREAN_COUNTERS
      : currentLanguage === 'en'
      ? ENGLISH_PARTITIVES
      : CHINESE_COUNTERS;

  const tableList: NumberTableEntry[] =
    currentLanguage === 'ko'
      ? KOREAN_NUMBER_TABLE
      : currentLanguage === 'en'
      ? ENGLISH_NUMBER_TABLE
      : CHINESE_NUMBER_TABLE;

  // Filtered counters
  const filteredCounters = countersList.filter(
    (c) =>
      c.symbol.toLowerCase().includes(counterSearch.toLowerCase()) ||
      c.vietnameseMeaning.toLowerCase().includes(counterSearch.toLowerCase()) ||
      c.usedFor.toLowerCase().includes(counterSearch.toLowerCase()) ||
      c.pinyinOrRomaja.toLowerCase().includes(counterSearch.toLowerCase())
  );

  // Conversion calculations
  const koSino = convertToKoreanSino(numericVal);
  const koNative = convertToKoreanNative(numericVal);
  const koWithCounter = convertToKoreanWithCounter(numericVal, selectedCounterUnit);

  const zhResult = convertToChineseSimp(numericVal);

  const enCardinal = convertToEnglishCardinal(numericVal);
  const enOrdinal = convertToEnglishOrdinal(numericVal);

  // Sample Quiz Data per language
  const quizData =
    currentLanguage === 'ko'
      ? [
          {
            q: 'Khi nói "3 giờ 25 phút" trong tiếng Hàn, quy tắc số nào được áp dụng?',
            options: [
              'Cả giờ và phút đều dùng số Hán-Hàn (삼 시 이십오 분)',
              'Giờ dùng số Thuần Hàn (세 시), Phút dùng số Hán-Hàn (이십오 분)',
              'Cả giờ và phút đều dùng số Thuần Hàn (세 시 스물다섯 분)',
              'Giờ dùng số Hán-Hàn, Phút dùng số Thuần Hàn',
            ],
            correct: 1,
            explain: 'Quy tắc vàng: Giờ dùng số Thuần Hàn (세 시), còn Phút/Giây dùng số Hán-Hàn (이십오 분).',
          },
          {
            q: 'Từ nào sau đây là dạng biến đổi của "하나" khi đứng trước lượng từ?',
            options: ['한', '하', '나', '일'],
            correct: 0,
            explain: '하나 biến thành "한" khi đi với lượng từ (ví dụ: 한 개, 한 명).',
          },
          {
            q: 'Đọc số tiền 50,000 Won trong tiếng Hàn như thế nào?',
            options: ['오십천 원', '오만 원', '다섯만 원', '오백백 원'],
            correct: 1,
            explain: '50,000 được tách theo hàng Vạn (5만) đọc là "오만 원".',
          },
        ]
      : currentLanguage === 'zh'
      ? [
          {
            q: 'Khi nói "2 người", cách dùng nào sau đây là CHUẨN XÁC trong tiếng Trung?',
            options: ['二个人 (èr gè rén)', '两个人 (liǎng gè rén)', '二两个人', '双个人'],
            correct: 1,
            explain: 'Trước lượng từ (个), bắt buộc dùng 两 (liǎng), tuyệt đối không dùng 二 (èr).',
          },
          {
            q: 'Số 1005 (Một nghìn không trăm lẻ năm) đọc như thế nào?',
            options: ['一千零零五', '一千零五', '一千五', '一千零五十'],
            correct: 1,
            explain: 'Khi có nhiều số 0 liên tiếp ở giữa, chỉ đọc đúng một chữ 零 (líng) → 一千零五 (yì qiān líng wǔ).',
          },
          {
            q: 'Khi đọc số phòng hoặc số điện thoại, số 1 thường được đọc là gì để tránh nhầm với số 7?',
            options: ['yī (一)', 'yāo (幺)', 'liǎng (两)', 'dān (单)'],
            correct: 1,
            explain: 'Trong số điện thoại và phòng, số 1 đọc là yāo (幺) để phân biệt rõ với số 7 (qī).',
          },
        ]
      : [
          {
            q: 'Cách đọc đúng của phân số 3/4 trong tiếng Anh là gì?',
            options: ['Three-four', 'Three-fourth', 'Three-quarters (hoặc Three-fourths)', 'Four-thirds'],
            correct: 2,
            explain: 'Tử số là số đếm (Three), mẫu số là số thứ tự có "s" vì tử > 1 (quarters / fourths).',
          },
          {
            q: 'Trong tỷ số bóng đá 2 - 0, số 0 được người bản xứ đọc là gì?',
            options: ['Zero', 'Oh', 'Nil', 'Love'],
            correct: 2,
            explain: 'Trong thể thao bóng đá, số 0 đọc là "Nil" (Two - Nil). "Love" dùng trong Tennis.',
          },
          {
            q: 'Lượng từ (Partitive) chuẩn cho danh từ không đếm được "advice" là gì?',
            options: ['A cup of advice', 'A piece of advice', 'A bar of advice', 'A slice of advice'],
            correct: 1,
            explain: 'Dùng "A piece of advice" cho lời khuyên hoặc tin tức.',
          },
        ];

  const handleSelectQuiz = (qIdx: number, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCalculateScore = () => {
    let score = 0;
    quizData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        score++;
      }
    });
    setQuizScore(score);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizScore(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* 1. Header Banner & Language Isolation */}
      <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A1A1A]/20 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
                Chuyên đề số & Lượng từ
              </span>
              <span className="text-xs font-serif italic text-stone-600">
                Hệ số đếm, thứ tự, tiền tệ, thời gian & từ chỉ đơn vị
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
              Hệ thống Số — {LANGUAGES[currentLanguage].name}
            </h1>
          </div>

          {/* Language Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EB] border border-[#1A1A1A]">
            {(['zh', 'ko', 'en'] as LanguageCode[]).map((code) => {
              const lang = LANGUAGES[code];
              const isSelected = currentLanguage === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code);
                    handleResetQuiz();
                  }}
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

        {/* View Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-3.5 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-1.5 ${
              activeTab === 'converter'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Bộ chuyển đổi số thông minh</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Quy tắc ngữ pháp ({rulesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('counters')}
            className={`px-3.5 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-1.5 ${
              activeTab === 'counters'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {currentLanguage === 'ko'
                ? 'Lượng từ tiếng Hàn (단위명사)'
                : currentLanguage === 'zh'
                ? 'Lượng từ tiếng Trung (量词)'
                : 'Lượng từ tiếng Anh (Partitives)'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bảng tra cứu số chuẩn</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-2 text-xs font-mono uppercase font-bold border transition flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#1A1A1A]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Trắc nghiệm phản xạ số</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: Smart Number Converter Engine */}
      {activeTab === 'converter' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
            <div className="border-b border-[#1A1A1A] pb-4">
              <h2 className="text-lg font-serif font-black text-[#1A1A1A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Máy phiên dịch & Chuyển đổi số {LANGUAGES[currentLanguage].name}</span>
              </h2>
              <p className="text-xs font-serif text-stone-600 mt-1">
                Nhập bất kỳ số Ả Rập nào để nhận ngay cách đọc, chữ viết bản ngữ, phiên âm và phát âm chuẩn xác.
              </p>
            </div>

            {/* Input Form */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-mono">
                  #
                </span>
                <input
                  type="number"
                  value={inputNum}
                  onChange={(e) => setInputNum(e.target.value)}
                  placeholder="Nhập số (ví dụ: 25, 2026, 150000)..."
                  className="w-full pl-8 pr-4 py-3 bg-[#FCFAF6] border-2 border-[#1A1A1A] font-mono text-xl text-[#1A1A1A] font-bold focus:outline-none focus:bg-white"
                />
              </div>

              {/* Quick Sample Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {['2', '12', '25', '105', '2026', '50000', '1000000'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setInputNum(val)}
                    className="px-2.5 py-2 text-xs font-mono border border-stone-300 bg-[#F9F7F2] hover:border-[#1A1A1A] hover:bg-stone-200 transition"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Cards according to Language */}
            {/* A. KOREAN CONVERSION CARDS */}
            {currentLanguage === 'ko' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* 1. Sino Korean Output */}
                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-stone-700">
                      1. Số Hán-Hàn (Sino-Korean - 한자어 수)
                    </span>
                    <button
                      onClick={() => handleSpeak(koSino)}
                      className="p-1.5 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition flex items-center gap-1 text-xs font-mono font-bold"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe</span>
                    </button>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A] break-words">
                    {koSino}
                  </div>
                  <div className="text-xs font-serif text-stone-600 bg-white p-2.5 border border-stone-300">
                    <span className="font-bold text-[#1A1A1A]">Sử dụng cho:</span> Giá tiền (원), Ngày tháng năm (년/월/일), Phút/Giây (분/초), Số điện thoại, Số tầng/phòng.
                  </div>
                </div>

                {/* 2. Native Korean Output */}
                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-stone-700">
                      2. Số Thuần Hàn (Native Korean - 고유어 수)
                    </span>
                    {numericVal <= 99 && numericVal >= 1 && (
                      <button
                        onClick={() => handleSpeak(koNative)}
                        className="p-1.5 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition flex items-center gap-1 text-xs font-mono font-bold"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Nghe</span>
                      </button>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A] break-words">
                    {koNative}
                  </div>
                  <div className="text-xs font-serif text-stone-600 bg-white p-2.5 border border-stone-300">
                    <span className="font-bold text-[#1A1A1A]">Sử dụng cho:</span> Đếm số lượng người/vật (개, 명, 마리), Tuổi tác (살), Số giờ (시), Số lần (번).
                  </div>
                </div>

                {/* 3. Combined Counter Output */}
                <div className="md:col-span-2 p-5 bg-amber-50/70 border-2 border-amber-900/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/20 pb-2">
                    <span className="text-xs font-mono font-bold uppercase text-amber-950">
                      3. Ghép Lượng từ thực tế (Gắn danh từ chỉ đơn vị):
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span>Chọn đơn vị:</span>
                      {['개 (cái)', '명 (người)', '잔 (ly)', '권 (quyển)', '살 (tuổi)'].map((u) => {
                        const unitKey = u.split(' ')[0];
                        return (
                          <button
                            key={u}
                            onClick={() => setSelectedCounterUnit(unitKey)}
                            className={`px-2 py-0.5 border ${
                              selectedCounterUnit === unitKey
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-white text-stone-700 border-stone-300'
                            }`}
                          >
                            {u}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-serif font-bold text-amber-950">
                      {koWithCounter}
                    </div>
                    <button
                      onClick={() => handleSpeak(koWithCounter)}
                      className="p-1.5 bg-amber-900 text-white hover:bg-black transition flex items-center gap-1 text-xs font-mono font-bold"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Phát âm cụm từ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* B. CHINESE CONVERSION CARDS */}
            {currentLanguage === 'zh' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* 1. Simplified Chinese Output */}
                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-stone-700">
                      1. Chữ Hán Giản Thể & Bính Âm (简体与拼音)
                    </span>
                    <button
                      onClick={() => handleSpeak(zhResult.char)}
                      className="p-1.5 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition flex items-center gap-1 text-xs font-mono font-bold"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe</span>
                    </button>
                  </div>
                  <div className="text-3xl font-serif font-black text-[#1A1A1A] break-words">
                    {zhResult.char}
                  </div>
                  <div className="text-sm font-mono text-stone-700 font-bold bg-white p-2 border border-stone-300">
                    Pinyin: {zhResult.pinyin}
                  </div>
                </div>

                {/* 2. Financial DaXie Output */}
                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-stone-700">
                      2. Chữ Số Đại Tả Tài Chính (大写数字 - Ngân Hàng / Hóa Đơn)
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A] break-words">
                    {zhResult.daxie}
                  </div>
                  <div className="text-xs font-serif text-stone-600 bg-white p-2.5 border border-stone-300">
                    Dùng bắt buộc trong séc ngân hàng, hợp đồng kinh tế để chống hành vi gian lận sửa số.
                  </div>
                </div>
              </div>
            )}

            {/* C. ENGLISH CONVERSION CARDS */}
            {currentLanguage === 'en' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* 1. Cardinal Numbers */}
                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-stone-700">
                      1. Số Đếm (Cardinal Numbers - Đếm số lượng)
                    </span>
                    <button
                      onClick={() => handleSpeak(enCardinal)}
                      className="p-1.5 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition flex items-center gap-1 text-xs font-mono font-bold"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe</span>
                    </button>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A] capitalize break-words">
                    {enCardinal}
                  </div>
                  <div className="text-xs font-serif text-stone-600 bg-white p-2.5 border border-stone-300">
                    Ví dụ: "I have <span className="font-bold">{enCardinal}</span> books."
                  </div>
                </div>

                {/* 2. Ordinal Numbers */}
                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-stone-700">
                      2. Số Thứ Tự (Ordinal Numbers - Thứ hạng, Ngày, Tầng)
                    </span>
                    <button
                      onClick={() => handleSpeak(enOrdinal)}
                      className="p-1.5 bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition flex items-center gap-1 text-xs font-mono font-bold"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe</span>
                    </button>
                  </div>
                  <div className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A] capitalize break-words">
                    {enOrdinal}
                  </div>
                  <div className="text-xs font-serif text-stone-600 bg-white p-2.5 border border-stone-300">
                    Ví dụ: "This is the <span className="font-bold">{enOrdinal}</span> time."
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB 2: Rules & Grammar Guidelines */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-2">
            <h2 className="text-base font-serif font-black text-[#1A1A1A] flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Cẩm nang toàn bộ quy tắc sử dụng số {LANGUAGES[currentLanguage].name}</span>
            </h2>
            <p className="text-xs font-serif text-stone-600">
              Chi tiết cách đọc số lớn, phân biệt các cặp số dễ nhầm lẫn, quy tắc đọc ngày tháng, giờ giấc và tiền tệ.
            </p>
          </div>

          <div className="space-y-6">
            {rulesList.map((rule) => (
              <div
                key={rule.id}
                className="p-6 sm:p-7 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#1A1A1A] pb-3 gap-2">
                  <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">{rule.title}</h3>
                  <span className="text-xs font-mono font-bold bg-[#F9F7F2] border border-[#1A1A1A] px-2.5 py-0.5 text-stone-800">
                    {rule.category}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-serif text-stone-700 leading-relaxed">
                  {rule.desc}
                </p>

                {rule.formula && (
                  <div className="p-3 bg-[#FCFAF6] border-l-4 border-[#1A1A1A] text-xs font-mono font-bold text-[#1A1A1A]">
                    Công thức / Quy luật: {rule.formula}
                  </div>
                )}

                {/* Examples Table */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A]">
                    Các ví dụ thực tế:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rule.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="p-3.5 bg-[#F9F7F2] border border-stone-300 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-stone-800">
                            {ex.numberOrExpression}
                          </span>
                          <button
                            onClick={() => handleSpeak(ex.reading)}
                            className="p-1 border border-stone-400 hover:bg-[#1A1A1A] hover:text-white transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-sm font-serif font-bold text-[#1A1A1A]">{ex.reading}</div>
                        <div className="text-[11px] font-mono text-stone-600">{ex.phonetic}</div>
                        <div className="text-xs font-serif text-stone-700 pt-1 border-t border-stone-200">
                          {ex.meaning}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {rule.warningOrTip && (
                  <div className="p-3 bg-amber-50 border border-amber-300 text-xs font-serif text-amber-950 flex items-start gap-2">
                    <span className="font-bold font-mono">💡 Mẹo & Lưu ý:</span>
                    <span>{rule.warningOrTip}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 3: Counter Words & Partitives Dictionary */}
      {activeTab === 'counters' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A1A1A] pb-4">
              <div>
                <h2 className="text-base font-serif font-black text-[#1A1A1A]">
                  Từ Điển Lượng Từ & Danh Từ Chỉ Đơn Vị ({countersList.length} Từ)
                </h2>
                <p className="text-xs font-serif text-stone-600">
                  {currentLanguage === 'ko'
                    ? 'Đơn vị danh từ (단위명사) gắn liền sau số thuần Hàn'
                    : currentLanguage === 'zh'
                    ? 'Lượng từ (量词) đứng giữa số đếm và danh từ theo cấu trúc: Số + Lượng từ + Danh từ'
                    : 'Partitive Nouns & Quantifiers trong tiếng Anh cho danh từ đếm được và không đếm được'}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={counterSearch}
                  onChange={(e) => setCounterSearch(e.target.value)}
                  placeholder="Tìm lượng từ, ý nghĩa..."
                  className="w-full pl-9 pr-3 py-2 bg-[#FCFAF6] border border-[#1A1A1A] text-xs font-mono focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCounters.map((counter, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-serif font-black text-[#1A1A1A]">
                        {counter.symbol}
                      </span>
                      <span className="text-xs font-mono font-bold bg-white border border-stone-300 px-2 py-0.5">
                        {counter.pinyinOrRomaja}
                      </span>
                    </div>

                    <div className="text-xs font-serif font-bold text-[#1A1A1A] mt-1">
                      Nghĩa: {counter.vietnameseMeaning}
                    </div>

                    <p className="text-[11px] font-serif text-stone-600 mt-1">
                      <span className="font-bold">Dùng cho:</span> {counter.usedFor}
                    </p>
                  </div>

                  {/* Examples */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-300">
                    <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">
                      Ví dụ cụ thể:
                    </span>
                    {counter.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="p-2 bg-white border border-stone-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#1A1A1A]">{ex.fullPhrase}</div>
                          <div className="text-[11px] font-serif text-stone-600">{ex.meaning}</div>
                        </div>
                        <button
                          onClick={() => handleSpeak(ex.fullPhrase)}
                          className="p-1 text-stone-600 hover:text-black hover:bg-stone-100 transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 4: Reference Number Table */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
            <div className="border-b border-[#1A1A1A] pb-3">
              <h2 className="text-base font-serif font-black text-[#1A1A1A]">
                Bảng Tra Cứu Số Chuẩn (0 đến 1 Tỷ)
              </h2>
              <p className="text-xs font-serif text-stone-600">
                Đối chiếu số Ả Rập, chữ viết, phiên âm và ghi chú phát âm.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-serif">
                <thead>
                  <tr className="bg-[#1A1A1A] text-[#F9F7F2] font-mono text-[11px] uppercase">
                    <th className="p-3 border border-[#1A1A1A]">Số</th>
                    {currentLanguage === 'ko' && (
                      <>
                        <th className="p-3 border border-[#1A1A1A]">Số Hán-Hàn</th>
                        <th className="p-3 border border-[#1A1A1A]">Số Thuần Hàn</th>
                        <th className="p-3 border border-[#1A1A1A]">Phiên âm</th>
                      </>
                    )}
                    {currentLanguage === 'zh' && (
                      <>
                        <th className="p-3 border border-[#1A1A1A]">Giản Thể (Bính âm)</th>
                        <th className="p-3 border border-[#1A1A1A]">Đại Tả Tài Chính</th>
                        <th className="p-3 border border-[#1A1A1A]">Bính âm</th>
                      </>
                    )}
                    {currentLanguage === 'en' && (
                      <>
                        <th className="p-3 border border-[#1A1A1A]">Số Đếm (Cardinal)</th>
                        <th className="p-3 border border-[#1A1A1A]">Số Thứ Tự (Ordinal)</th>
                        <th className="p-3 border border-[#1A1A1A]">Phiên âm IPA</th>
                      </>
                    )}
                    <th className="p-3 border border-[#1A1A1A]">Ghi chú & Cách dùng</th>
                    <th className="p-3 border border-[#1A1A1A] text-center">Nghe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {tableList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F9F7F2] transition">
                      <td className="p-3 font-mono font-bold text-[#1A1A1A] border border-stone-300">
                        {typeof row.arabic === 'number' ? row.arabic.toLocaleString() : row.arabic}
                      </td>

                      {currentLanguage === 'ko' && (
                        <>
                          <td className="p-3 font-bold text-stone-900 border border-stone-300">
                            {row.koreanSino}
                          </td>
                          <td className="p-3 font-bold text-amber-900 border border-stone-300">
                            {row.koreanNative}
                          </td>
                          <td className="p-3 font-mono text-stone-600 border border-stone-300">
                            {row.koreanRomaja}
                          </td>
                        </>
                      )}

                      {currentLanguage === 'zh' && (
                        <>
                          <td className="p-3 font-bold text-stone-900 text-sm border border-stone-300">
                            {row.chineseSimp}
                          </td>
                          <td className="p-3 font-bold text-stone-700 text-sm border border-stone-300">
                            {row.chineseDaXie}
                          </td>
                          <td className="p-3 font-mono text-stone-600 border border-stone-300">
                            {row.chinesePinyin}
                          </td>
                        </>
                      )}

                      {currentLanguage === 'en' && (
                        <>
                          <td className="p-3 font-bold text-stone-900 border border-stone-300">
                            {row.englishCardinal}
                          </td>
                          <td className="p-3 font-bold text-blue-900 border border-stone-300">
                            {row.englishOrdinal}
                          </td>
                          <td className="p-3 font-mono text-stone-600 border border-stone-300">
                            {row.englishIpa}
                          </td>
                        </>
                      )}

                      <td className="p-3 text-stone-600 border border-stone-300 max-w-[220px]">
                        {row.note || '-'}
                      </td>

                      <td className="p-3 border border-stone-300 text-center">
                        <button
                          onClick={() => {
                            const textToSpeak =
                              currentLanguage === 'ko'
                                ? row.koreanSino?.split(' ')[0]
                                : currentLanguage === 'zh'
                                ? row.chineseSimp?.split(' ')[0]
                                : row.englishCardinal;
                            if (textToSpeak) handleSpeak(textToSpeak);
                          }}
                          className="p-1 border border-stone-400 hover:bg-[#1A1A1A] hover:text-white transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 5: Interactive Quiz & Reflex Challenge */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <div>
                <h2 className="text-base font-serif font-black text-[#1A1A1A]">
                  Trắc Nghiệm Phản Xạ Số & Lượng Từ — {LANGUAGES[currentLanguage].name}
                </h2>
                <p className="text-xs font-serif text-stone-600">
                  Kiểm tra khả năng phân biệt quy tắc số và chọn lượng từ chuẩn xác.
                </p>
              </div>

              {quizScore !== null && (
                <div className="text-right">
                  <span className="text-xs font-mono uppercase font-bold text-stone-600">Kết quả:</span>
                  <div className="text-2xl font-mono font-black text-[#1A1A1A]">
                    {quizScore} / {quizData.length}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {quizData.map((item, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 bg-[#F9F7F2] border border-[#1A1A1A] space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 bg-[#1A1A1A] text-white font-mono text-xs font-bold">
                      Câu {qIdx + 1}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-[#1A1A1A] leading-snug">
                      {item.q}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-1">
                    {item.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      const isSubmitted = quizScore !== null;
                      const isCorrect = optIdx === item.correct;

                      let btnStyle = 'bg-white border-stone-300 text-stone-800 hover:border-[#1A1A1A]';
                      if (isSelected) {
                        btnStyle = 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold';
                      }
                      if (isSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-100 border-emerald-800 text-emerald-950 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-100 border-rose-800 text-rose-950 font-bold';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isSubmitted}
                          onClick={() => handleSelectQuiz(qIdx, optIdx)}
                          className={`w-full p-3 border text-left text-xs font-serif transition flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizScore !== null && (
                    <div className="p-3 bg-white border border-stone-300 text-xs font-serif text-stone-700">
                      <span className="font-bold text-[#1A1A1A]">Giải thích:</span> {item.explain}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quiz Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
              {quizScore === null ? (
                <button
                  onClick={handleCalculateScore}
                  disabled={Object.keys(selectedAnswers).length < quizData.length}
                  className="px-6 py-2.5 bg-[#1A1A1A] text-white font-mono text-xs uppercase font-bold hover:bg-stone-800 transition disabled:opacity-50"
                >
                  Nộp bài & Xem kết quả
                </button>
              ) : (
                <button
                  onClick={handleResetQuiz}
                  className="px-6 py-2.5 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] font-mono text-xs uppercase font-bold hover:bg-stone-100 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm lại bài kiểm tra</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
