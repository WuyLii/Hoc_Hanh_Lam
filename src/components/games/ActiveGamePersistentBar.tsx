import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, X, ChevronUp, ChevronDown, Gamepad2 } from 'lucide-react';

const GAME_INFO: Record<string, { name: string; icon: string; tag: string }> = {
  flashcard: { name: 'Thẻ ghi nhớ Flashcard (SRS)', icon: '🎴', tag: 'Lặp lại ngắt quãng' },
  multiple_choice: { name: 'Trắc nghiệm phản xạ nhanh', icon: '🎯', tag: 'Đếm ngược 10s' },
  matching: { name: 'Nối cặp từ và nghĩa', icon: '🧩', tag: 'Ghép cặp thẻ' },
  fill_blank: { name: 'Điền từ vào chỗ trống', icon: '✏️', tag: 'Ngữ cảnh câu' },
  scramble: { name: 'Sắp xếp khối từ thành câu', icon: '🧱', tag: 'Ngữ pháp thực hành' },
  picture_guess: { name: 'Đoán từ qua manh mối ẩn', icon: '🖼️', tag: 'Mở khóa gợi ý' },
  hangman: { name: 'Treo cổ đoán chữ (Hangman)', icon: '🎪', tag: 'Bảo toàn mạng chơi' },
  typing: { name: 'Luyện gõ phím tốc độ cao', icon: '⌨️', tag: 'Phân tích WPM' },
};

export const ActiveGamePersistentBar: React.FC = () => {
  const { selectedGameMode, setSelectedGameMode, activeNav, setActiveNav } = useApp();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Only render when a game has been started AND user is browsing other sections
  if (!selectedGameMode || activeNav === 'games') {
    return null;
  }

  const game = GAME_INFO[selectedGameMode] || {
    name: 'Trò chơi ôn tập từ vựng',
    icon: '🎮',
    tag: 'Đang diễn ra',
  };

  const handleResumeGame = () => {
    setActiveNav('games');
  };

  const handleConfirmExit = () => {
    setSelectedGameMode(null);
    setShowExitConfirm(false);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-16 md:bottom-6 right-3 md:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1A1A1A] text-[#F9F7F2] border-2 border-amber-500 shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-stone-900 transition group"
          title="Bấm để mở rộng bảng trò chơi đang chạy"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-base">{game.icon}</span>
          <span className="text-xs font-mono font-bold tracking-wider uppercase hidden sm:inline">
            Đang chơi: {game.name}
          </span>
          <span className="text-xs font-mono font-bold tracking-wider uppercase sm:hidden">
            Trò chơi đang chạy
          </span>
          <ChevronUp className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 md:bottom-6 left-2 right-2 md:left-auto md:right-6 md:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#1A1A1A] text-[#F9F7F2] border-2 border-[#1A1A1A] shadow-[5px_5px_0px_0px_#D97706] p-3.5 sm:p-4">
        {/* Top Status Header */}
        <div className="flex items-center justify-between gap-2 border-b border-stone-700/80 pb-2 mb-2.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              Trò chơi đang diễn ra (Tạm dừng an toàn)
            </span>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="text-stone-400 hover:text-white p-0.5 transition flex items-center gap-1 text-[10px] tracking-wider uppercase font-mono"
            title="Thu nhỏ thanh trạng thái"
          >
            <span>Thu nhỏ</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Game Title & Instructions */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 shrink-0 bg-stone-800 border border-stone-700 flex items-center justify-center text-xl shadow-inner">
            {game.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif font-black text-sm sm:text-base text-white truncate">
              {game.name}
            </div>
            <div className="text-[11px] font-mono text-stone-300 mt-0.5 flex flex-wrap items-center gap-x-2">
              <span className="text-amber-300 font-semibold">{game.tag}</span>
              <span className="text-stone-400 hidden sm:inline">•</span>
              <span className="text-stone-400">
                Tiến độ &amp; câu hỏi được bảo lưu nguyên vẹn khi bạn xem mục khác.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons or Exit Confirmation */}
        {showExitConfirm ? (
          <div className="bg-stone-900 border border-amber-600/60 p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
            <span className="text-amber-300 font-semibold text-center sm:text-left">
              Xác nhận thoát trò chơi hiện tại?
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 uppercase font-bold tracking-wider text-[10px] transition"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white uppercase font-bold tracking-wider text-[10px] transition"
              >
                Đồng ý Thoát
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleResumeGame}
              className="flex-1 py-2.5 px-4 bg-amber-400 text-stone-950 hover:bg-amber-300 font-mono text-xs uppercase font-black tracking-wider transition flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#000]"
            >
              <Play className="w-4 h-4 fill-stone-950" />
              <span>Tiếp tục chơi ngay</span>
            </button>

            <button
              onClick={() => setShowExitConfirm(true)}
              className="py-2.5 px-3 border border-stone-600 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-1.5"
              title="Thoát và hủy trò chơi hiện tại"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát trò chơi</span>
              <span className="sm:hidden">Thoát</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
