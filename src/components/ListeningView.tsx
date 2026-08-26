import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ListeningExercise, LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import confetti from 'canvas-confetti';
import {
  Headphones,
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const ListeningView: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    currentLangListening,
    addStudyTime,
  } = useApp();

  const currentLangInfo = LANGUAGES[currentLanguage];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playSpeed, setPlaySpeed] = useState<number>(1.0);
  const [userTranscript, setUserTranscript] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const currentEx = currentLangListening[currentIndex];

  const handlePlayAudio = (text?: string) => {
    const speechText = text || currentEx?.transcript || '';
    if (!speechText) return;
    ttsService.speak(speechText, currentLanguage, playSpeed);
  };

  const handleCheckDictation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTranscript.trim() || isAnswered || !currentEx) return;

    setIsAnswered(true);
    setShowTranscript(true);

    const cleanUser = userTranscript.trim().toLowerCase().replace(/[.,!?'"~]/g, '');
    const cleanReal = currentEx.transcript.trim().toLowerCase().replace(/[.,!?'"~]/g, '');

    const isMatch = cleanUser === cleanReal;
    if (isMatch) {
      confetti({ particleCount: 60, spread: 50 });
      setScore((s) => s + 50);
      addStudyTime(2, 50);
    }
  };

  const handleSelectChoice = (choice: string) => {
    if (isAnswered || !currentEx) return;
    setSelectedChoice(choice);
    setIsAnswered(true);
    setShowTranscript(true);

    if (choice === currentEx.dap_an_dung) {
      confetti({ particleCount: 60, spread: 50 });
      setScore((s) => s + 50);
      addStudyTime(2, 50);
    }
  };

  const handleNextExercise = () => {
    if (currentIndex + 1 < currentLangListening.length) {
      setCurrentIndex((i) => i + 1);
      setUserTranscript('');
      setIsAnswered(false);
      setShowTranscript(false);
      setSelectedChoice(null);
    } else {
      alert(`🎉 Chúc mừng! Bạn đã hoàn thành tất cả ${currentLangListening.length} bài luyện nghe.`);
      setCurrentIndex(0);
      setIsAnswered(false);
      setShowTranscript(false);
      setUserTranscript('');
    }
  };

  if (!currentEx) {
    return (
      <div className="p-12 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-3 max-w-md mx-auto">
        <Headphones className="w-10 h-10 text-stone-400 mx-auto" />
        <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Chưa có bài luyện nghe trong kho này</h3>
        <p className="text-xs font-mono text-stone-500">Các bài tập âm thanh đang được đồng bộ hóa.</p>
      </div>
    );
  }

  const isDictation = currentEx.kieu_bai === 'dictation';
  const isMultipleChoice = currentEx.kieu_bai === 'multiple_choice';

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b-2 border-[#1A1A1A] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
              Phòng luyện nghe âm thanh
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              Chính tả âm vị & Đọc hiểu thính giác
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Luyện nghe chính tả — {currentLangInfo.name}
          </h1>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-stone-500 uppercase">ĐIỂM SỐ</span>
          <p className="text-2xl font-serif font-black text-[#1A1A1A]">{score} ĐIỂM</p>
        </div>
      </div>

      {/* Progress & Speed Controls */}
      <div className="p-4 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs font-mono font-bold text-[#1A1A1A]">
          <span>BÀI {currentIndex + 1} / {currentLangListening.length}</span>
          <span className="px-2 py-0.5 bg-[#F9F7F2] border border-[#1A1A1A] text-[9px] uppercase">
            {currentEx.cap_do}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-stone-500 uppercase text-[10px] font-bold">Tốc độ:</span>
          {[0.75, 1.0, 1.25].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaySpeed(spd)}
              className={`px-2 py-0.5 border ${
                playSpeed === spd
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-[#F9F7F2] border-stone-300 text-stone-700 hover:border-[#1A1A1A]'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Audio Player Card */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow text-center space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
            {isDictation ? 'LUYỆN NGHE CHÉP CHÍNH TẢ' : 'TRẮC NGHIỆM ĐỌC HIỂU'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A] max-w-xl mx-auto">
            {currentEx.tieu_de}
          </h2>
        </div>

        {/* Big Audio Play Button */}
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => handlePlayAudio()}
            className="w-20 h-20 border-2 border-[#1A1A1A] bg-[#1A1A1A] hover:bg-stone-800 text-[#F9F7F2] flex items-center justify-center text-xl editorial-shadow transition transform hover:scale-105 active:scale-95"
            title="Phát âm thanh"
          >
            <Play className="w-8 h-8 fill-white translate-x-0.5" />
          </button>
        </div>
        <p className="text-xs font-mono uppercase tracking-wider text-stone-500">
          Nhấp nút để nghe phát âm thanh bản xứ (tốc độ {playSpeed}x)
        </p>

        {/* Dictation Mode Form */}
        {isDictation && (
          <form onSubmit={handleCheckDictation} className="space-y-4 pt-4 border-t border-[#1A1A1A]/15">
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] mb-2 text-left">
                Gõ lại chính xác những gì bạn nghe được ({currentLangInfo.name}):
              </label>
              <textarea
                rows={3}
                disabled={isAnswered}
                placeholder="Gõ lại nội dung bài nghe tại đây..."
                value={userTranscript}
                onChange={(e) => setUserTranscript(e.target.value)}
                className="w-full p-4 bg-[#F9F7F2] border-2 border-[#1A1A1A] text-base font-serif text-[#1A1A1A] focus:bg-white focus:outline-none"
              />
            </div>

            {!isAnswered ? (
              <button
                type="submit"
                disabled={!userTranscript.trim()}
                className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition"
              >
                KIỂM TRA ĐÁP ÁN
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextExercise}
                className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>BÀI TIẾP THEO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form>
        )}

        {/* Multiple Choice Mode */}
        {isMultipleChoice && currentEx.cau_hoi && currentEx.cac_lua_chon && (
          <div className="space-y-4 pt-4 border-t border-[#1A1A1A]/15 text-left">
            <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">{currentEx.cau_hoi}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentEx.cac_lua_chon.map((choice, idx) => {
                const isSelected = selectedChoice === choice;
                const isCorrect = isAnswered && choice === currentEx.dap_an_dung;

                let btnClass = 'bg-[#F9F7F2] border border-[#1A1A1A] text-[#1A1A1A] hover:bg-white';
                if (isSelected) btnClass = 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A] font-bold';
                if (isAnswered) {
                  if (isCorrect) btnClass = 'bg-emerald-800 text-white border-emerald-900 font-bold';
                  else if (isSelected && choice !== currentEx.dap_an_dung)
                    btnClass = 'bg-rose-800 text-white border-rose-900 font-bold';
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectChoice(choice)}
                    className={`p-3.5 border text-left text-xs font-serif transition flex items-center justify-between ${btnClass}`}
                  >
                    <span>{choice}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-white shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <button
                onClick={handleNextExercise}
                className="w-full mt-4 py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-widest editorial-shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>BÀI TIẾP THEO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Revealed Transcript Box */}
        {showTranscript && (
          <div className="p-6 bg-[#F9F7F2] border-2 border-[#1A1A1A] text-left space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                Nội dung gốc bài nghe
              </span>
              <button
                onClick={() => handlePlayAudio(currentEx.transcript)}
                className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                title="Nghe lại"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-lg font-serif font-bold text-[#1A1A1A]">"{currentEx.transcript}"</p>
            {currentEx.transcript_dich && (
              <p className="text-xs font-mono text-stone-600">→ {currentEx.transcript_dich}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
