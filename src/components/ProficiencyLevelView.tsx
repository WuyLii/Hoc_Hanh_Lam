import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES, LanguageCode } from '../types';
import {
  LANGUAGE_LEVEL_MAP,
  DIAGNOSTIC_TESTS,
  LevelDetail,
  DiagnosticQuestion,
} from '../data/levelData';
import { ttsService } from '../services/ttsService';
import { SpeakButton } from './SpeakButton';
import {
  Award,
  CheckCircle2,
  BookOpen,
  Layers,
  Headphones,
  CheckSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2,
  Clock,
  Target,
  FileText,
  RotateCcw,
  X,
  HelpCircle,
  BarChart2,
  GraduationCap,
  ListChecks,
} from 'lucide-react';

const CAN_DO_STORAGE_KEY = 'polyglot_cando_completed_ids';

export const ProficiencyLevelView: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    currentLangVocabulary,
    currentLangGrammar,
    updateUser,
    setActiveNav,
    setSelectedLevelFilter,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];
  const levelList: LevelDetail[] = LANGUAGE_LEVEL_MAP[currentLanguage] || [];

  // Selected level in the viewer (defaults to current user's level or first level)
  const currentSavedLevel = currentUser.cap_do[currentLanguage] || levelList[0]?.name || 'A1';
  
  // Find matching initial level code
  const initialLevelCode = React.useMemo(() => {
    const found = levelList.find((l) => currentSavedLevel.includes(l.code) || l.name === currentSavedLevel);
    return found ? found.code : levelList[0]?.code || 'A1';
  }, [currentSavedLevel, levelList]);

  const [activeLevelCode, setActiveLevelCode] = useState<string>(initialLevelCode);
  const [activeTab, setActiveTab] = useState<'cando' | 'vocab' | 'grammar' | 'roadmap'>('cando');
  const [completedCanDoIds, setCompletedCanDoIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CAN_DO_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Diagnostic Test State
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [diagStep, setDiagStep] = useState<'intro' | 'testing' | 'result'>('intro');
  const [currentDiagQIndex, setCurrentDiagQIndex] = useState(0);
  const [diagAnswers, setDiagAnswers] = useState<Record<number, number>>({});
  const [diagResultLevel, setDiagResultLevel] = useState<string | null>(null);

  // Equivalency Matrix Modal
  const [isEquivModalOpen, setIsEquivModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync active level if language changes
  useEffect(() => {
    const found = levelList.find((l) => (currentUser.cap_do[currentLanguage] || '').includes(l.code));
    setActiveLevelCode(found ? found.code : levelList[0]?.code || 'A1');
  }, [currentLanguage]);

  // Save can-do progress
  const toggleCanDo = (id: string) => {
    setCompletedCanDoIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(CAN_DO_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const selectedLevel = levelList.find((l) => l.code === activeLevelCode) || levelList[0];

  // Calculate stats for selected level
  const userVocabInLevel = currentLangVocabulary.filter((w) => {
    if (!w.cap_do) return false;
    return w.cap_do.toLowerCase().includes(selectedLevel.code.toLowerCase()) ||
      w.cap_do.toLowerCase().includes(selectedLevel.name.toLowerCase());
  });

  const userGrammarInLevel = currentLangGrammar.filter((g) => {
    if (!g.cap_do) return false;
    return g.cap_do.toLowerCase().includes(selectedLevel.code.toLowerCase()) ||
      g.cap_do.toLowerCase().includes(selectedLevel.name.toLowerCase());
  });

  const vocabProgressPercent = Math.min(100, Math.round((userVocabInLevel.length / (selectedLevel.vocabTarget || 1)) * 100));
  const completedCanDoCount = selectedLevel.canDoList.filter((c) => completedCanDoIds.includes(c.id)).length;
  const canDoProgressPercent = Math.round((completedCanDoCount / (selectedLevel.canDoList.length || 1)) * 100);

  // Check if this level is user's current level
  const isUserCurrentLevel = (currentUser.cap_do[currentLanguage] || '').toLowerCase().includes(selectedLevel.code.toLowerCase()) ||
    currentUser.cap_do[currentLanguage] === selectedLevel.name;

  const handleSetAsCurrentLevel = (level: LevelDetail) => {
    const updatedCapDo = {
      ...currentUser.cap_do,
      [currentLanguage]: level.name,
    };
    updateUser({ cap_do: updatedCapDo });
    showToast(`✅ Đã cập nhật cấp bậc học hiện tại của bạn thành: ${level.name}`);
  };

  // Jump to other modules with level filter
  const handleJumpToVocab = (levelCode: string) => {
    setSelectedLevelFilter(levelCode);
    setActiveNav('vocabulary');
  };

  const handleJumpToGrammar = (levelCode: string) => {
    setSelectedLevelFilter(levelCode);
    setActiveNav('grammar');
  };

  const handleJumpToMockTest = (levelCode: string) => {
    setSelectedLevelFilter(levelCode);
    setActiveNav('mocktest');
  };

  const handleJumpToListening = (levelCode: string) => {
    setSelectedLevelFilter(levelCode);
    setActiveNav('listening');
  };

  // Diagnostic Test Logic
  const diagnosticQuestions: DiagnosticQuestion[] = DIAGNOSTIC_TESTS[currentLanguage] || [];

  const handleStartDiagnostic = () => {
    setCurrentDiagQIndex(0);
    setDiagAnswers({});
    setDiagResultLevel(null);
    setDiagStep('testing');
    setIsDiagnosticOpen(true);
  };

  const handleSelectDiagAnswer = (optIndex: number) => {
    setDiagAnswers((prev) => ({ ...prev, [currentDiagQIndex]: optIndex }));
  };

  const handleNextDiagQuestion = () => {
    if (currentDiagQIndex < diagnosticQuestions.length - 1) {
      setCurrentDiagQIndex((prev) => prev + 1);
    } else {
      // Calculate result
      let correct = 0;
      diagnosticQuestions.forEach((q, idx) => {
        if (diagAnswers[idx] === q.correctIndex) {
          correct++;
        }
      });

      const total = diagnosticQuestions.length;
      const ratio = correct / total;

      let recommended = levelList[0];
      if (ratio >= 0.85) {
        recommended = levelList[Math.min(levelList.length - 1, 4)] || levelList[levelList.length - 1];
      } else if (ratio >= 0.65) {
        recommended = levelList[Math.min(levelList.length - 1, 3)] || levelList[2];
      } else if (ratio >= 0.45) {
        recommended = levelList[Math.min(levelList.length - 1, 2)] || levelList[1];
      } else if (ratio >= 0.25) {
        recommended = levelList[1] || levelList[0];
      } else {
        recommended = levelList[0];
      }

      setDiagResultLevel(recommended.name);
      setDiagStep('result');
    }
  };

  const handleApplyDiagnosticResult = () => {
    if (diagResultLevel) {
      const updatedCapDo = {
        ...currentUser.cap_do,
        [currentLanguage]: diagResultLevel,
      };
      updateUser({ cap_do: updatedCapDo });
      setIsDiagnosticOpen(false);
      showToast(`🎯 Tuyệt vời! Đã thiết lập cấp độ học của bạn thành: ${diagResultLevel}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1A1A1A] text-[#F9F7F2] border-2 border-amber-400 px-4 py-3 shadow-xl font-mono text-xs animate-in slide-in-from-top-4 flex items-center gap-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-stone-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[#1A1A1A] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5">
              Hệ thống phân cấp chuẩn hóa
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              Khung tham chiếu {currentLanguage === 'en' ? 'CEFR & TOEIC/IELTS' : currentLanguage === 'ko' ? 'TOPIK I-II' : 'HSK 1-6 & HSK 3.0'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Phân cấp bậc trình độ — {currentLangInfo.name} ({currentLangInfo.flag})
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-3xl">
            Lộ trình học theo từng nấc thang năng lực ngôn ngữ, chuẩn đầu ra 4 kỹ năng và bài kiểm tra chẩn đoán trình độ tức thì.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleStartDiagnostic}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>THI CHẨN ĐOÁN TRÌNH ĐỘ</span>
          </button>

          <button
            onClick={() => setIsEquivModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#1A1A1A] bg-white hover:bg-stone-100 text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] transition"
          >
            <BarChart2 className="w-4 h-4" />
            <span>BẢNG QUY ĐỔI CHỨNG CHỈ</span>
          </button>
        </div>
      </div>

      {/* User Current Level Spotlight Card */}
      <div className="bg-white border-2 border-[#1A1A1A] editorial-shadow p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 border-2 border-[#1A1A1A] bg-[#F9F7F2] flex items-center justify-center text-2xl font-serif font-black shadow-inner">
            <GraduationCap className="w-7 h-7 text-[#1A1A1A]" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-stone-500 tracking-wider">
              Cấp bậc mục tiêu hiện tại của bạn:
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A] flex items-center gap-3">
              <span>{currentUser.cap_do[currentLanguage] || levelList[0]?.name}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-800 uppercase">
                ĐANG KÍCH HOẠT
              </span>
            </div>
            <div className="text-xs font-serif italic text-stone-600 mt-0.5">
              Mục tiêu: {currentUser.muc_tieu[currentLanguage] || 'Chinh phục toàn diện các kỹ năng'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-[#1A1A1A]/20 pt-4 lg:pt-0 lg:pl-8">
          <div className="text-center sm:text-left">
            <div className="text-[10px] font-mono uppercase text-stone-500">Từ vựng thuộc cấp độ</div>
            <div className="text-xl font-serif font-bold text-[#1A1A1A]">
              {userVocabInLevel.length} / {selectedLevel.vocabTarget} từ
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="text-[10px] font-mono uppercase text-stone-500">Kỹ năng Can-Do đạt</div>
            <div className="text-xl font-serif font-bold text-[#1A1A1A]">
              {completedCanDoCount} / {selectedLevel.canDoList.length} chuẩn
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="text-[10px] font-mono uppercase text-stone-500">Tổng điểm EXP</div>
            <div className="text-xl font-serif font-bold text-amber-800">
              {currentUser.total_points || 0} PTS
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Roadmap Ribbon */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Lộ trình bậc thang năng lực ({levelList.length} cấp bậc):</span>
          </span>
          <span className="text-stone-500">Nhấn vào từng cấp bậc để xem chuẩn chi tiết</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {levelList.map((lvl, index) => {
            const isSelected = lvl.code === activeLevelCode;
            const isUserLevel = (currentUser.cap_do[currentLanguage] || '').toLowerCase().includes(lvl.code.toLowerCase()) ||
              currentUser.cap_do[currentLanguage] === lvl.name;

            // Calculate level completion
            const wordsInThisLevel = currentLangVocabulary.filter((w) =>
              (w.cap_do || '').toLowerCase().includes(lvl.code.toLowerCase()) ||
              (w.cap_do || '').toLowerCase().includes(lvl.name.toLowerCase())
            ).length;
            const percent = Math.min(100, Math.round((wordsInThisLevel / lvl.vocabTarget) * 100));

            return (
              <button
                key={lvl.code}
                onClick={() => setActiveLevelCode(lvl.code)}
                className={`p-4 text-left border-2 transition-all relative flex flex-col justify-between h-36 ${
                  isSelected
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] editorial-shadow'
                    : 'border-[#1A1A1A] bg-white hover:bg-stone-100 text-[#1A1A1A]'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 border ${
                    isSelected ? 'bg-white/15 border-white/30 text-white' : 'bg-[#F9F7F2] border-[#1A1A1A] text-[#1A1A1A]'
                  }`}>
                    BẬC {index + 1}
                  </span>
                  {isUserLevel && (
                    <span className="text-[9px] font-mono font-bold bg-amber-400 text-[#1A1A1A] px-1 py-0.5 uppercase tracking-wider">
                      MỤC TIÊU
                    </span>
                  )}
                </div>

                {/* Level Code & Name */}
                <div className="my-1">
                  <div className="text-xl font-serif font-black tracking-tight">{lvl.code}</div>
                  <div className={`text-[11px] font-serif line-clamp-1 ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                    {lvl.name.split(' - ')[1] || lvl.subTitle}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span>{wordsInThisLevel}/{lvl.vocabTarget} từ</span>
                    <span>{percent}%</span>
                  </div>
                  <div className={`h-1.5 w-full border ${isSelected ? 'border-white/40 bg-white/20' : 'border-[#1A1A1A] bg-stone-100'}`}>
                    <div
                      className={`h-full ${isSelected ? 'bg-amber-300' : 'bg-[#1A1A1A]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Level Deep-Dive Explorer Pane */}
      <div className="bg-white border-2 border-[#1A1A1A] editorial-shadow overflow-hidden">
        {/* Level Header Strip */}
        <div className="p-6 sm:p-8 bg-[#F9F7F2] border-b-2 border-[#1A1A1A] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
                {selectedLevel.badge}
              </span>
              <span className="px-2.5 py-0.5 border border-[#1A1A1A] bg-white text-xs font-mono font-bold text-[#1A1A1A]">
                {selectedLevel.cefrEquivalent}
              </span>
              {selectedLevel.examEquivalents.map((eq, i) => (
                <span key={i} className="px-2 py-0.5 border border-[#1A1A1A]/40 bg-white/60 text-[10px] font-mono text-stone-700">
                  {eq}
                </span>
              ))}
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A]">
              {selectedLevel.name}
            </h2>
            <p className="text-xs sm:text-sm font-serif text-stone-700 max-w-3xl leading-relaxed">
              {selectedLevel.description}
            </p>
          </div>

          {/* Action to set level */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            {isUserCurrentLevel ? (
              <div className="px-4 py-2.5 border-2 border-emerald-800 bg-emerald-50 text-emerald-950 text-xs font-mono font-bold uppercase flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>CẤP ĐỘ HIỆN TẠI CỦA BẠN</span>
              </div>
            ) : (
              <button
                onClick={() => handleSetAsCurrentLevel(selectedLevel)}
                className="px-4 py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm transition flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4 text-amber-300" />
                <span>CHỌN LÀM MỤC TIÊU HỌC</span>
              </button>
            )}

            <button
              onClick={() => handleJumpToMockTest(selectedLevel.code)}
              className="px-4 py-2 border border-[#1A1A1A] bg-white hover:bg-stone-100 text-xs font-mono font-bold uppercase text-[#1A1A1A] flex items-center justify-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>THI THỬ CẤP ĐỘ {selectedLevel.code}</span>
            </button>
          </div>
        </div>

        {/* Level Vital Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#1A1A1A] divide-x divide-[#1A1A1A] bg-white text-center">
          <div className="p-4">
            <div className="text-[10px] font-mono uppercase text-stone-500">Từ vựng chuẩn đầu ra</div>
            <div className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
              {selectedLevel.vocabTarget} <span className="text-xs font-sans font-normal text-stone-500">từ</span>
            </div>
            <div className="text-[10px] font-mono text-stone-600 mt-0.5">
              Bạn có: {userVocabInLevel.length} từ ({vocabProgressPercent}%)
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] font-mono uppercase text-stone-500">Ngữ pháp trọng điểm</div>
            <div className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
              {selectedLevel.grammarTarget} <span className="text-xs font-sans font-normal text-stone-500">mẫu</span>
            </div>
            <div className="text-[10px] font-mono text-stone-600 mt-0.5">
              Bạn có: {userGrammarInLevel.length} cấu trúc
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] font-mono uppercase text-stone-500">Thời lượng ước tính</div>
            <div className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
              ~{selectedLevel.estimatedHours} <span className="text-xs font-sans font-normal text-stone-500">giờ</span>
            </div>
            <div className="text-[10px] font-mono text-stone-600 mt-0.5">
              ~{Math.ceil(selectedLevel.estimatedHours / (currentUser.daily_target_minutes / 60 || 0.5))} ngày học
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] font-mono uppercase text-stone-500">Tiêu chí Can-Do đạt</div>
            <div className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
              {completedCanDoCount}/{selectedLevel.canDoList.length}
            </div>
            <div className="text-[10px] font-mono text-stone-600 mt-0.5">
              Hoàn thành: {canDoProgressPercent}%
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1A1A1A] bg-[#F9F7F2] overflow-x-auto">
          <button
            onClick={() => setActiveTab('cando')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition flex items-center gap-2 shrink-0 ${
              activeTab === 'cando' ? 'bg-white text-[#1A1A1A] border-b-2 border-b-white font-black' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>1. Chuẩn đầu ra 4 kỹ năng (Can-Do)</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition flex items-center gap-2 shrink-0 ${
              activeTab === 'vocab' ? 'bg-white text-[#1A1A1A] border-b-2 border-b-white font-black' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Từ vựng & Chủ đề cốt lõi</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition flex items-center gap-2 shrink-0 ${
              activeTab === 'grammar' ? 'bg-white text-[#1A1A1A] border-b-2 border-b-white font-black' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Cấu trúc ngữ pháp then chốt</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'roadmap' ? 'bg-white text-[#1A1A1A] border-b-2 border-b-white font-black' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>4. Kế hoạch & Luyện tập nhanh</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: CAN-DO COMPETENCIES */}
          {activeTab === 'cando' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A]/20 pb-3">
                <div>
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    Bảng kiểm tra năng lực thực hành (Can-Do Checklist)
                  </h3>
                  <p className="text-xs font-sans text-stone-600">
                    Đánh dấu các tiêu chí bạn đã tự tin làm chủ để hệ thống ghi nhận tiến độ đạt chuẩn của cấp bậc này.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-[#1A1A1A] bg-[#F9F7F2] px-3 py-1.5 border border-[#1A1A1A] shrink-0">
                  ĐÃ ĐẠT: {completedCanDoCount} / {selectedLevel.canDoList.length} TIÊU CHÍ
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLevel.canDoList.map((item) => {
                  const isChecked = completedCanDoIds.includes(item.id);
                  const skillColors: Record<string, string> = {
                    Nghe: 'bg-blue-100 text-blue-900 border-blue-800',
                    Nói: 'bg-emerald-100 text-emerald-900 border-emerald-800',
                    Đọc: 'bg-amber-100 text-amber-900 border-amber-800',
                    Viết: 'bg-purple-100 text-purple-900 border-purple-800',
                  };

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCanDo(item.id)}
                      className={`p-4 border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                        isChecked
                          ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950'
                          : 'border-[#1A1A1A] bg-white hover:bg-stone-50 text-[#1A1A1A]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 bg-emerald-800 text-white rounded-none flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-[#1A1A1A] bg-white" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border uppercase ${skillColors[item.skill] || 'bg-stone-100 text-stone-900 border-stone-800'}`}>
                            KỸ NĂNG {item.skill.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500 uppercase">
                            Chuẩn {selectedLevel.code}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm font-serif ${isChecked ? 'line-through opacity-80' : 'text-[#1A1A1A]'}`}>
                          {item.statement}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action */}
              <div className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-serif italic text-stone-700">
                  💡 Hoàn thành toàn bộ tiêu chí Can-Do và đạt trên 80% từ vựng sẽ giúp bạn tự tin vượt qua các kỳ thi chứng chỉ tương ứng.
                </div>
                <button
                  onClick={() => handleJumpToMockTest(selectedLevel.code)}
                  className="px-4 py-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-stone-800 text-xs font-mono font-bold uppercase shrink-0"
                >
                  LÀM BÀI TEST THỬ THÁCH CẤP ĐỘ
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VOCABULARY & TOPICS */}
          {activeTab === 'vocab' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A]/20 pb-3">
                <div>
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    Từ vựng mẫu & Các chủ đề cốt lõi của cấp độ {selectedLevel.code}
                  </h3>
                  <p className="text-xs font-sans text-stone-600">
                    Mục tiêu: Đạt tối thiểu {selectedLevel.vocabTarget} từ vựng trong kho từ để hoàn thành cấp bậc này.
                  </p>
                </div>
                <button
                  onClick={() => handleJumpToVocab(selectedLevel.code)}
                  className="px-4 py-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-stone-800 text-xs font-mono font-bold uppercase flex items-center gap-1.5 shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>MỞ KHO TỪ VỰNG CẤP ĐỘ NÀY →</span>
                </button>
              </div>

              {/* Core Topics Pills */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Chủ đề từ vựng trọng tâm:
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLevel.coreTopics.map((topic, i) => (
                    <span key={i} className="px-3 py-1.5 border border-[#1A1A1A] bg-[#F9F7F2] text-xs font-serif font-bold text-[#1A1A1A]">
                      🏷️ {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Words Table */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Từ vựng tiêu biểu cấp độ {selectedLevel.code}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {selectedLevel.sampleWords.map((word, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-2 relative group hover:bg-white transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-lg font-serif font-black text-[#1A1A1A]">
                          {word.word}
                        </div>
                        <SpeakButton
                          text={word.word}
                          language={currentLanguage}
                          variant="ghost"
                          position="left"
                          title="Nhấn để phát âm 1x • Giữ để chọn tốc độ"
                        />
                      </div>

                      <div className="text-xs font-mono text-stone-600">
                        {word.phonetic}
                      </div>

                      <div className="text-xs font-serif italic text-stone-800 border-t border-[#1A1A1A]/15 pt-1.5">
                        {word.meaning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Vocab Stats Banner */}
              <div className="p-5 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="font-serif font-bold text-sm text-[#1A1A1A]">
                    Bạn đang có {userVocabInLevel.length} từ vựng thuộc cấp độ {selectedLevel.code} trong sổ tay cá nhân.
                  </div>
                  <div className="text-xs font-mono text-stone-600 mt-0.5">
                    Hãy tiếp tục bổ sung từ vựng mới hoặc quét từ sách giáo khoa bằng OCR AI để gia tăng vốn từ!
                  </div>
                </div>
                <button
                  onClick={() => handleJumpToVocab(selectedLevel.code)}
                  className="px-4 py-2 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white text-xs font-mono font-bold uppercase transition"
                >
                  THÊM TỪ VỰNG MỚI
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KEY GRAMMAR */}
          {activeTab === 'grammar' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A]/20 pb-3">
                <div>
                  <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                    Các cấu trúc ngữ pháp trọng điểm của cấp độ {selectedLevel.code}
                  </h3>
                  <p className="text-xs font-sans text-stone-600">
                    Nắm chắc các mẫu câu và quy tắc ngữ pháp dưới đây để diễn đạt câu chuẩn xác và tự nhiên.
                  </p>
                </div>
                <button
                  onClick={() => handleJumpToGrammar(selectedLevel.code)}
                  className="px-4 py-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-stone-800 text-xs font-mono font-bold uppercase flex items-center gap-1.5 shrink-0"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>XEM KHO NGỮ PHÁP →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedLevel.keyGrammar.map((gram, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] flex items-center justify-between gap-3 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-serif font-bold text-[#1A1A1A]">
                        {gram}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 border border-[#1A1A1A] text-stone-600 shrink-0">
                      {selectedLevel.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ROADMAP & PRACTICE JUMP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div className="border-b border-[#1A1A1A]/20 pb-3">
                <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                  Lộ trình rèn luyện & Khóa huấn luyện cấp độ {selectedLevel.code}
                </h3>
                <p className="text-xs font-sans text-stone-600">
                  Kế hoạch học tập đề xuất hàng ngày để bạn hoàn thành cấp độ này trong thời gian ngắn nhất.
                </p>
              </div>

              {/* Recommended Daily Routine Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-2">
                  <div className="flex items-center gap-2 text-[#1A1A1A]">
                    <Clock className="w-4 h-4 text-amber-800" />
                    <span className="text-xs font-mono font-bold uppercase">Thời gian học mỗi ngày</span>
                  </div>
                  <div className="text-2xl font-serif font-black text-[#1A1A1A]">
                    25 - 35 <span className="text-xs font-sans font-normal text-stone-600">phút/ngày</span>
                  </div>
                  <p className="text-xs font-serif text-stone-600">
                    Duy trì chuỗi streak liên tục để củng cố trí nhớ dài hạn theo thuật toán SRS SM-2.
                  </p>
                </div>

                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-2">
                  <div className="flex items-center gap-2 text-[#1A1A1A]">
                    <BookOpen className="w-4 h-4 text-blue-800" />
                    <span className="text-xs font-mono font-bold uppercase">Mục tiêu từ vựng mới</span>
                  </div>
                  <div className="text-2xl font-serif font-black text-[#1A1A1A]">
                    10 - 15 <span className="text-xs font-sans font-normal text-stone-600">từ mới/ngày</span>
                  </div>
                  <p className="text-xs font-serif text-stone-600">
                    Kết hợp luyện tập qua 8 trò chơi phản xạ (Flashcard, Điền từ, Nối cặp từ).
                  </p>
                </div>

                <div className="p-5 bg-[#F9F7F2] border-2 border-[#1A1A1A] space-y-2">
                  <div className="flex items-center gap-2 text-[#1A1A1A]">
                    <Headphones className="w-4 h-4 text-emerald-800" />
                    <span className="text-xs font-mono font-bold uppercase">Luyện nghe & Phản xạ</span>
                  </div>
                  <div className="text-2xl font-serif font-black text-[#1A1A1A]">
                    2 - 3 <span className="text-xs font-sans font-normal text-stone-600">bài nghe/tuần</span>
                  </div>
                  <p className="text-xs font-serif text-stone-600">
                    Luyện chính tả và đóng vai hội thoại với Trợ lý AI theo các tình huống thực tế.
                  </p>
                </div>
              </div>

              {/* 4 Direct Practice Portals */}
              <div className="space-y-3 pt-4">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Bắt đầu luyện tập ngay với cấp độ {selectedLevel.code}:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleJumpToVocab(selectedLevel.code)}
                    className="p-4 border-2 border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-left transition group space-y-2 editorial-shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <BookOpen className="w-5 h-5 text-amber-700 group-hover:text-amber-300" />
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white" />
                    </div>
                    <div className="font-serif font-black text-sm">Học từ vựng cấp độ {selectedLevel.code}</div>
                    <div className="text-[10px] font-mono opacity-70">Luyện thẻ Flashcard & Ôn tập SRS</div>
                  </button>

                  <button
                    onClick={() => handleJumpToGrammar(selectedLevel.code)}
                    className="p-4 border-2 border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-left transition group space-y-2 editorial-shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <Layers className="w-5 h-5 text-blue-700 group-hover:text-blue-300" />
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white" />
                    </div>
                    <div className="font-serif font-black text-sm">Học ngữ pháp {selectedLevel.code}</div>
                    <div className="text-[10px] font-mono opacity-70">Công thức & Ví dụ thực tiễn</div>
                  </button>

                  <button
                    onClick={() => handleJumpToListening(selectedLevel.code)}
                    className="p-4 border-2 border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-left transition group space-y-2 editorial-shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <Headphones className="w-5 h-5 text-emerald-700 group-hover:text-emerald-300" />
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white" />
                    </div>
                    <div className="font-serif font-black text-sm">Luyện nghe cấp độ {selectedLevel.code}</div>
                    <div className="text-[10px] font-mono opacity-70">Chép chính tả & Luyện phản xạ</div>
                  </button>

                  <button
                    onClick={() => handleJumpToMockTest(selectedLevel.code)}
                    className="p-4 border-2 border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-left transition group space-y-2 editorial-shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <Award className="w-5 h-5 text-purple-700 group-hover:text-purple-300" />
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white" />
                    </div>
                    <div className="font-serif font-black text-sm">Thi thử mô phỏng {selectedLevel.code}</div>
                    <div className="text-[10px] font-mono opacity-70">Đánh giá điểm số & Lời giải chi tiết</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: DIAGNOSTIC TEST ================= */}
      {isDiagnosticOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsDiagnosticOpen(false)}
              className="absolute top-4 right-4 p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* STEP 1: INTRO */}
            {diagStep === 'intro' && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 border-2 border-[#1A1A1A] bg-amber-100 text-amber-950 mx-auto flex items-center justify-center text-3xl shadow-sm">
                  🎯
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest bg-[#1A1A1A] text-white px-2.5 py-0.5">
                    Bài kiểm tra chẩn đoán phân cấp trình độ
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A]">
                    Kiểm tra trình độ {currentLangInfo.name} ({currentLangInfo.flag})
                  </h2>
                  <p className="text-xs sm:text-sm font-serif text-stone-700 max-w-lg mx-auto leading-relaxed">
                    Bài kiểm tra gồm <strong>{diagnosticQuestions.length} câu hỏi</strong> đa dạng với độ khó tăng dần (từ Nhập môn đến Cao cấp). Hệ thống sẽ tự động phân tích và xếp bạn vào cấp bậc học phù hợp nhất!
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#1A1A1A] text-left text-xs font-mono text-stone-700 space-y-1.5 max-w-md mx-auto">
                  <div>✓ Thời gian làm bài: ~3-5 phút</div>
                  <div>✓ Không yêu cầu tra cứu từ điển để đảm bảo độ chính xác</div>
                  <div>✓ Nhận ngay kết quả phân tích & lộ trình cá nhân hóa</div>
                </div>

                <button
                  onClick={() => setDiagStep('testing')}
                  className="w-full sm:w-auto px-8 py-3.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
                >
                  BẮT ĐẦU LÀM BÀI TEST NGAY →
                </button>
              </div>
            )}

            {/* STEP 2: TESTING */}
            {diagStep === 'testing' && diagnosticQuestions[currentDiagQIndex] && (
              <div className="space-y-6 py-2">
                <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase">
                      CÂU {currentDiagQIndex + 1} / {diagnosticQuestions.length}
                    </span>
                    <span className="text-xs font-mono text-stone-500">
                      Độ khó: {diagnosticQuestions[currentDiagQIndex].level}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-stone-600">
                    Tiến độ: {Math.round(((currentDiagQIndex + 1) / diagnosticQuestions.length) * 100)}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-stone-200 border border-[#1A1A1A]">
                  <div
                    className="h-full bg-[#1A1A1A] transition-all"
                    style={{ width: `${((currentDiagQIndex + 1) / diagnosticQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div className="p-6 bg-white border-2 border-[#1A1A1A] space-y-4">
                  <div className="text-xs font-mono text-stone-500 uppercase">
                    Chọn đáp án đúng nhất để hoàn thiện câu:
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A] leading-snug">
                    {diagnosticQuestions[currentDiagQIndex].question}
                  </h3>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {diagnosticQuestions[currentDiagQIndex].options.map((opt, optIdx) => {
                    const isSelected = diagAnswers[currentDiagQIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectDiagAnswer(optIdx)}
                        className={`w-full p-4 text-left border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] font-bold'
                            : 'border-[#1A1A1A] bg-white hover:bg-stone-100 text-[#1A1A1A]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 border flex items-center justify-center text-xs font-mono ${
                            isSelected ? 'border-white bg-white text-[#1A1A1A]' : 'border-[#1A1A1A] bg-[#F9F7F2]'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="font-serif text-base">{opt}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    disabled={diagAnswers[currentDiagQIndex] === undefined}
                    onClick={handleNextDiagQuestion}
                    className="px-6 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2"
                  >
                    <span>{currentDiagQIndex === diagnosticQuestions.length - 1 ? 'XEM KẾT QUẢ CHẨN ĐOÁN' : 'CÂU TIẾP THEO'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RESULT */}
            {diagStep === 'result' && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 border-2 border-[#1A1A1A] bg-emerald-100 text-emerald-950 mx-auto flex items-center justify-center text-3xl shadow-sm">
                  🏆
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest bg-emerald-800 text-white px-2.5 py-0.5">
                    ĐÃ HOÀN THÀNH BÀI CHẨN ĐOÁN
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A]">
                    Kết quả đánh giá trình độ của bạn
                  </h2>
                </div>

                {/* Score & Recommended Level */}
                <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
                  <div className="text-xs font-mono text-stone-500 uppercase">
                    Cấp bậc học được đề xuất cho bạn:
                  </div>
                  <div className="text-3xl font-serif font-black text-[#1A1A1A]">
                    {diagResultLevel}
                  </div>
                  <p className="text-xs font-serif text-stone-600">
                    Dựa trên độ chính xác các câu hỏi từ vựng, ngữ pháp và khả năng nhận diện ngữ cảnh của bạn.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleApplyDiagnosticResult}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>ÁP DỤNG CẤP ĐỘ NÀY VÀO HỒ SƠ</span>
                  </button>

                  <button
                    onClick={() => setIsDiagnosticOpen(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-[#1A1A1A] bg-white hover:bg-stone-100 text-xs font-mono font-bold uppercase text-[#1A1A1A]"
                  >
                    ĐÓNG LẠI
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: EQUIVALENCY MATRIX ================= */}
      {isEquivModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F7F2] border-4 border-[#1A1A1A] editorial-shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsEquivModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div className="border-b border-[#1A1A1A] pb-3">
                <span className="text-[10px] font-mono uppercase bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">
                  Bảng tra cứu chuẩn hóa quốc tế
                </span>
                <h2 className="text-2xl font-serif font-black text-[#1A1A1A] mt-1">
                  Bảng đối chiếu quy đổi các chứng chỉ ngoại ngữ
                </h2>
                <p className="text-xs font-mono uppercase text-stone-600">
                  Quy đổi tương đương giữa khung CEFR Châu Âu, TOEIC, IELTS, TOPIK và HSK
                </p>
              </div>

              {/* Comparative Table */}
              <div className="overflow-x-auto border-2 border-[#1A1A1A]">
                <table className="w-full text-left text-xs font-serif divide-y divide-[#1A1A1A]">
                  <thead className="bg-[#1A1A1A] text-[#F9F7F2] font-mono font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Cấp CEFR</th>
                      <th className="p-3">Tiếng Anh (IELTS / TOEIC)</th>
                      <th className="p-3">Tiếng Hàn (TOPIK)</th>
                      <th className="p-3">Tiếng Trung (HSK)</th>
                      <th className="p-3">Lượng từ vựng</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#1A1A1A] font-sans">
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold bg-[#F9F7F2]">A1 (Nhập môn)</td>
                      <td className="p-3">IELTS 2.0-3.0 • TOEIC 120-225</td>
                      <td className="p-3">TOPIK 1 (80+ đ)</td>
                      <td className="p-3">HSK 1 (150 từ)</td>
                      <td className="p-3 font-mono">150 - 800 từ</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold bg-[#F9F7F2]">A2 (Sơ cấp)</td>
                      <td className="p-3">IELTS 3.5-4.5 • TOEIC 250-450</td>
                      <td className="p-3">TOPIK 2 (140+ đ)</td>
                      <td className="p-3">HSK 2 (300 từ)</td>
                      <td className="p-3 font-mono">300 - 1,800 từ</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold bg-[#F9F7F2]">B1 (Trung cấp 1)</td>
                      <td className="p-3">IELTS 5.0-5.5 • TOEIC 500-700</td>
                      <td className="p-3">TOPIK 3 (120+ đ)</td>
                      <td className="p-3">HSK 3 (600 từ)</td>
                      <td className="p-3 font-mono">600 - 3,200 từ</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold bg-[#F9F7F2]">B2 (Trung cấp 2)</td>
                      <td className="p-3">IELTS 6.0-7.0 • TOEIC 750-850</td>
                      <td className="p-3">TOPIK 4 (150+ đ)</td>
                      <td className="p-3">HSK 4 (1,200 từ)</td>
                      <td className="p-3 font-mono">1,200 - 5,000 từ</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold bg-[#F9F7F2]">C1 (Cao cấp 1)</td>
                      <td className="p-3">IELTS 7.5-8.5 • TOEIC 855-990</td>
                      <td className="p-3">TOPIK 5 (190+ đ)</td>
                      <td className="p-3">HSK 5 (2,500 từ)</td>
                      <td className="p-3 font-mono">2,500 - 8,000 từ</td>
                    </tr>
                    <tr className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold bg-[#F9F7F2]">C2 (Thành thạo)</td>
                      <td className="p-3">IELTS 8.5-9.0 • TOEIC 990 Max</td>
                      <td className="p-3">TOPIK 6 (230+ đ)</td>
                      <td className="p-3">HSK 6 (5,000+ từ)</td>
                      <td className="p-3 font-mono">5,000 - 12,000+ từ</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setIsEquivModalOpen(false)}
                  className="px-6 py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase"
                >
                  ĐÃ HIỂU VÀ ĐÓNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
