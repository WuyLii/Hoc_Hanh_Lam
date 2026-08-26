import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES, LanguageCode } from '../types';
import { Logo } from './Logo';
import {
  BookOpen,
  Gamepad2,
  Headphones,
  Award,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Edit3,
  RefreshCw,
  Layers,
  Sparkle,
  PenTool,
  ChevronDown,
  Camera,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  onOpenOcrModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenOcrModal }) => {
  const {
    currentLanguage,
    setCurrentLanguage,
    activeNav,
    setActiveNav,
    syncGoogleSheets,
    isSyncing,
    sheetsConfig,
  } = useApp();

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const currentLangInfo = LANGUAGES[currentLanguage];

  const handleManualSync = async () => {
    if (!sheetsConfig.scriptUrl) {
      setActiveNav('sheets');
      return;
    }
    const res = await syncGoogleSheets();
    setSyncStatusMsg(res.message);
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', num: '01', icon: BarChart3 },
    { id: 'levels', label: 'Cấp bậc trình độ', num: '02', icon: GraduationCap, highlight: true },
    { id: 'vocabulary', label: 'Từ vựng', num: '03', icon: BookOpen },
    { id: 'grammar', label: 'Ngữ pháp', num: '04', icon: Layers },
    { id: 'games', label: 'Trò chơi SRS', num: '05', icon: Gamepad2 },
    { id: 'mocktest', label: 'Đề thi thử', num: '06', icon: Award },
    { id: 'listening', label: 'Luyện nghe', num: '07', icon: Headphones },
    { id: 'aichat', label: 'Gia sư AI', num: '08', icon: Sparkles },
    { id: 'roleplay', label: 'Đóng vai hội thoại', num: '09', icon: Sparkle },
    { id: 'journal', label: 'Nhật ký học', num: '10', icon: Edit3 },
    { id: 'stroke', label: 'Tập viết nét chữ', num: '11', icon: PenTool },
    { id: 'sheets', label: 'Google Sheets', num: '12', icon: FileSpreadsheet },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F9F7F2] border-b-2 border-[#1A1A1A] text-[#1A1A1A] shadow-none">
      {/* Top Editorial Masthead Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 border-b border-[#1A1A1A]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Headline */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveNav('dashboard')}
          >
            <Logo size={42} className="w-11 h-11 transition group-hover:scale-105" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-serif font-black tracking-tight leading-none transition-all text-[#1A1A1A]">
                  HỌC HÀNH LẮM
                </span>
                <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#1A1A1A]/70 mt-0.5">
                Nền tảng học đa ngôn ngữ & CSDL Google Sheets
              </p>
            </div>
          </div>

          {/* Right Action Vitals & Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs">
            {/* Quick OCR Scanner */}
            <button
              onClick={onOpenOcrModal}
              title="Quét từ vựng từ ảnh (OCR AI)"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] font-mono text-[11px] uppercase tracking-wider font-semibold transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quét ảnh OCR</span>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] font-sans transition"
              >
                <span className="text-sm">{currentLangInfo.flag}</span>
                <span className="font-semibold text-xs">{currentLangInfo.name}</span>
                <span className="text-[10px] font-mono uppercase bg-[#1A1A1A]/10 px-1 py-0.5 border border-[#1A1A1A]/20">
                  {currentLanguage.toUpperCase()}
                </span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {showLangMenu && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-[#F9F7F2] border-2 border-[#1A1A1A] editorial-shadow py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowLangMenu(false)}
                >
                  <div className="px-3 py-1 text-[9px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A]/60 border-b border-[#1A1A1A]/20 mb-1">
                    Chọn ngôn ngữ đang học
                  </div>
                  {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
                    const info = LANGUAGES[code];
                    const isSelected = code === currentLanguage;
                    return (
                      <button
                        key={code}
                        onClick={() => setCurrentLanguage(code)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition ${
                          isSelected
                            ? 'bg-[#1A1A1A] text-[#F9F7F2] font-bold'
                            : 'text-[#1A1A1A] hover:bg-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{info.flag}</span>
                          <div>
                            <div className="font-sans font-bold text-xs">{info.name}</div>
                            <div className="text-[10px] font-mono opacity-70">{info.nativeName}</div>
                          </div>
                        </div>
                        {isSelected && <span className="text-xs font-mono font-bold">●</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sheets Connection Indicator */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title={sheetsConfig.scriptUrl ? 'Đồng bộ dữ liệu với Google Sheets' : 'Cấu hình Google Sheets'}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] font-mono text-[11px] transition"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isSyncing ? 'ĐANG ĐỒNG BỘ...' : sheetsConfig.scriptUrl ? 'SHEETS: ĐÃ NỐI' : 'SHEETS: CHƯA NỐI'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono py-1 px-4 text-center tracking-wider">
          TRẠNG THÁI: {syncStatusMsg}
        </div>
      )}

      {/* Editorial Navigation Tabs Strip */}
      <nav className="bg-[#F3EFE6] px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center divide-x divide-[#1A1A1A] border-x border-[#1A1A1A]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#1A1A1A] text-[#F9F7F2] font-bold'
                    : 'text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2]'
                }`}
              >
                <span className={`text-[10px] font-serif ${isActive ? 'text-amber-300' : 'text-stone-500'}`}>
                  {item.num}
                </span>
                <Icon className="w-3.5 h-3.5" />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
