import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MockTestRecord, LANGUAGES } from '../types';
import { INITIAL_MOCK_TESTS } from '../data/seedData';
import { ttsService } from '../services/ttsService';
import { SpeakButton } from './SpeakButton';
import confetti from 'canvas-confetti';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Volume2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const MockTestView: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    mockTests,
    addMockTestRecord,
    addStudyTime,
    selectedLevelFilter,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];

  // Available tests for current language
  const availablePresetTests = INITIAL_MOCK_TESTS.filter((t) => t.ngon_ngu === currentLanguage);

  const [activeTest, setActiveTest] = useState<typeof INITIAL_MOCK_TESTS[0] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Custom AI test generator parameters
  const [genTopic, setGenTopic] = useState('');
  const [genLevel, setGenLevel] = useState(selectedLevelFilter || currentLangInfo.levels[0] || 'Cơ bản');

  React.useEffect(() => {
    if (selectedLevelFilter) {
      const match = currentLangInfo.levels.find(l => l.toLowerCase().includes(selectedLevelFilter.toLowerCase()));
      if (match) setGenLevel(match);
    }
  }, [selectedLevelFilter]);

  const startTest = (test: typeof INITIAL_MOCK_TESTS[0]) => {
    setActiveTest(test);
    setUserAnswers({});
    setIsSubmitted(false);
    setTimeLeft(test.thoi_luong_phut * 60);
  };

  const handleSelectAnswer = (qId: string, answer: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmitTest = () => {
    if (!activeTest || isSubmitted) return;

    setIsSubmitted(true);
    let correctCount = 0;

    activeTest.questions.forEach((q) => {
      if (userAnswers[q.id] === q.dap_an_dung) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / activeTest.questions.length) * 100);
    if (score >= 80) {
      confetti({ particleCount: 100, spread: 70 });
    }

    // Save test record
    const testRecord: MockTestRecord = {
      test_id: `test_${Date.now()}`,
      user_id: currentUser.user_id,
      loai_de: activeTest.loai_de,
      ten_de: activeTest.tieu_de,
      ngay_lam: new Date().toISOString().split('T')[0],
      diem_so: score,
      tong_diem: 100,
      thoi_gian_lam_giay: activeTest.thoi_luong_phut * 60 - timeLeft,
      chi_tiet_cau_tra_loi: userAnswers,
    };

    addMockTestRecord(testRecord);
    addStudyTime(activeTest.thoi_luong_phut, score);
  };

  const handleGenerateAiTest = async () => {
    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/gemini/generate-mock-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          level: genLevel,
          topic: genTopic.trim() || 'Comprehensive Language Evaluation',
          numQuestions: 5,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate mock examination');

      const data = await response.json();
      if (data && data.questions) {
        const customTest = {
          id: `ai_test_${Date.now()}`,
          tieu_de: data.title || `AI Examination — ${currentLangInfo.name} ${genLevel}`,
          loai_de: `${currentLangInfo.examType} AI Gen` as any,
          ngon_ngu: currentLanguage,
          cap_do: genLevel,
          thoi_luong_phut: 8,
          questions: data.questions,
        };
        startTest(customTest);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error connecting to AI exam generator: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (activeTest) {
    let correctCount = 0;
    if (isSubmitted) {
      activeTest.questions.forEach((q) => {
        if (userAnswers[q.id] === q.dap_an_dung) correctCount++;
      });
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Test Header */}
        <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase">
                {activeTest.loai_de} • {activeTest.cap_do}
              </span>
            </div>
            <h2 className="text-2xl font-serif font-black text-[#1A1A1A] mt-1">{activeTest.tieu_de}</h2>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitTest}
                className="px-5 py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm transition"
              >
                NỘP BÀI THI
              </button>
            ) : (
              <button
                onClick={() => setActiveTest(null)}
                className="px-4 py-2 border border-[#1A1A1A] bg-white hover:bg-stone-200 text-[#1A1A1A] text-xs font-mono font-bold uppercase transition"
              >
                ← DANH SÁCH ĐỀ THI
              </button>
            )}
          </div>
        </div>

        {/* Score Banner when submitted */}
        {isSubmitted && (
          <div className="p-8 bg-white border-4 border-[#1A1A1A] editorial-shadow-lg text-center space-y-3 animate-in zoom-in-95">
            <div className="text-xs font-mono uppercase tracking-widest text-stone-500">KẾT QUẢ BÀI THI</div>
            <div className="text-5xl font-serif font-black text-[#1A1A1A]">
              {Math.round((correctCount / activeTest.questions.length) * 100)} / 100 ĐIỂM
            </div>
            <p className="text-xs font-mono text-stone-600">
              Số câu trả lời đúng: <strong>{correctCount}</strong> / {activeTest.questions.length} câu.
            </p>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {activeTest.questions.map((q, idx) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice === q.dap_an_dung;

            return (
              <div
                key={q.id}
                className={`p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-4 ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-800 bg-emerald-50/20'
                      : 'border-rose-800 bg-rose-50/20'
                    : ''
                }`}
              >
                {/* Question Prompt */}
                <div className="flex items-start justify-between gap-4 border-b border-[#1A1A1A]/10 pb-3">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-stone-500">Câu hỏi {idx + 1}:</span>
                    <h3 className="text-lg font-serif font-bold text-[#1A1A1A] leading-snug">{q.cau_hoi}</h3>
                  </div>
                  <SpeakButton
                    text={q.cau_hoi}
                    language={currentLanguage}
                    variant="card"
                    position="left"
                    buttonClassName="p-2 shrink-0"
                    title="Nhấn để phát âm 1x • Rê chuột hoặc giữ để chọn tốc độ"
                  />
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.cac_lua_chon.map((choice, cIdx) => {
                    const isSelected = userChoice === choice;
                    const isRightAnswer = isSubmitted && choice === q.dap_an_dung;

                    let choiceClass = 'bg-[#F9F7F2] border border-[#1A1A1A] text-[#1A1A1A] hover:bg-white';

                    if (isSelected) {
                      choiceClass = 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A] font-bold';
                    }

                    if (isSubmitted) {
                      if (isRightAnswer) {
                        choiceClass = 'bg-emerald-800 text-white border-emerald-900 font-bold';
                      } else if (isSelected && !isCorrect) {
                        choiceClass = 'bg-rose-800 text-white border-rose-900 font-bold';
                      }
                    }

                    return (
                      <button
                        key={cIdx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectAnswer(q.id, choice)}
                        className={`p-3.5 border text-left text-xs font-serif transition flex items-center justify-between ${choiceClass}`}
                      >
                        <span>{choice}</span>
                        {isSubmitted && isRightAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />
                        )}
                        {isSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-white shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation review */}
                {isSubmitted && q.giai_thich && (
                  <div className="mt-4 p-4 bg-[#F9F7F2] border-l-4 border-[#1A1A1A] text-xs space-y-1">
                    <span className="font-mono font-bold uppercase text-[#1A1A1A] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Giải thích chi tiết & Điểm ngữ pháp cốt lõi:</span>
                    </span>
                    <p className="font-serif text-stone-800 leading-relaxed">{q.giai_thich}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header Banner */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
              Chuẩn đánh giá: {currentLangInfo.examType}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Phòng thi thử — {currentLangInfo.name}
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Luyện đề thi thử có tính giờ, tự động chấm điểm và phân tích ngữ pháp từng câu hỏi.
          </p>
        </div>
      </div>

      {/* AI Test Creator Card */}
      <div className="p-6 sm:p-8 bg-[#F9F7F2] border-2 border-[#1A1A1A] editorial-shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
              Tạo đề thi tùy chỉnh bằng Gemini AI
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-[#1A1A1A]">
            Động cơ Gemini 3.7 Flash
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Chủ đề trọng tâm / Ngữ cảnh:
            </label>
            <input
              type="text"
              placeholder="VD: Phỏng vấn xin việc, Đàm phán thương mại, Du lịch sân bay..."
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Cấp độ ngôn ngữ:
            </label>
            <select
              value={genLevel}
              onChange={(e) => setGenLevel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:outline-none"
            >
              {currentLangInfo.levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              onClick={handleGenerateAiTest}
              disabled={isAiGenerating}
              className="w-full py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span>{isAiGenerating ? 'ĐANG TẠO ĐỀ...' : 'TẠO ĐỀ THI AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Mock Tests Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>Danh sách đề thi chuẩn hóa ({availablePresetTests.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availablePresetTests.map((test) => (
            <div
              key={test.id}
              className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm hover:editorial-shadow transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
                  <span className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-[9px] font-mono font-bold uppercase text-[#1A1A1A]">
                    {test.loai_de}
                  </span>
                  <span className="text-xs font-mono text-stone-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{test.thoi_luong_phut} PHÚT</span>
                  </span>
                </div>

                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">{test.tieu_de}</h3>
                <p className="text-xs font-serif text-stone-600 leading-relaxed">
                  Gồm {test.questions.length} câu hỏi trắc nghiệm kiểm tra cấu trúc ngữ pháp, từ vựng và đọc hiểu theo ngữ cảnh.
                </p>
              </div>

              <button
                onClick={() => startTest(test)}
                className="mt-6 w-full py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] hover:bg-stone-800 text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <span>BẮT ĐẦU THI THỬ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test History List */}
      {mockTests.length > 0 && (
        <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A] pb-2">
            Lịch sử làm bài thi
          </h3>
          <div className="divide-y divide-[#1A1A1A]/10 text-xs font-mono">
            {mockTests.map((item) => (
              <div key={item.test_id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A1A] font-serif text-sm">{item.ten_de || item.loai_de}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">HOÀN THÀNH NGÀY {item.ngay_lam}</div>
                </div>
                <div className="text-right font-mono font-black text-[#1A1A1A] text-base">
                  {item.diem_so} / 100 ĐIỂM
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
