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
  Grid,
  X,
  Menu,
  Calculator,
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
    pullGoogleSheets,
    syncWithCloudServer,
    isSyncing,
    isCloudSyncing,
    sheetsConfig,
    selectedGameMode,
  } = useApp();

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const currentLangInfo = LANGUAGES[currentLanguage];

  const handleManualSync = async () => {
    setSyncStatusMsg('⏳ Đang đồng bộ Cloud đa thiết bị & Google Sheets...');
    const cloudRes = await syncWithCloudServer();
    let sheetsMsg = '';
    if (sheetsConfig.scriptUrl || sheetsConfig.spreadsheetUrlOrId) {
      const sheetsRes = await pullGoogleSheets();
      sheetsMsg = ` • Sheets: ${sheetsRes.message}`;
    }
    setSyncStatusMsg(`✅ Cloud: ${cloudRes.message}${sheetsMsg}`);
    setTimeout(() => setSyncStatusMsg(null), 4500);
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', num: '01', icon: BarChart3 },
    { id: 'levels', label: 'Cấp bậc trình độ', num: '02', icon: GraduationCap },
    { id: 'vocabulary', label: 'Từ vựng', num: '03', icon: BookOpen },
    { id: 'grammar', label: 'Ngữ pháp', num: '04', icon: Layers },
    { id: 'games', label: 'Trò chơi SRS', num: '05', icon: Gamepad2 },
    { id: 'mocktest', label: 'Đề thi thử', num: '06', icon: Award },
    { id: 'aichat', label: 'Gia sư AI', num: '07', icon: Sparkles },
    { id: 'stroke', label: 'Tập viết nét chữ', num: '08', icon: PenTool },
    { id: 'numbers', label: 'Số & Lượng từ', num: '09', icon: Calculator },
    { id: 'sheets', label: 'Google Sheets', num: '10', icon: FileSpreadsheet },
  ];

  const handleMobileNavClick = (id: string) => {
    setActiveNav(id);
    setShowMobileDrawer(false);
  };

  return (
    <>
      {/* HEADER WRAPPER */}
      <header className="sticky top-0 z-40 bg-[#F9F7F2] border-b-2 border-[#1A1A1A] text-[#1A1A1A]">
        {/* ================= DESKTOP HEADER (MD & UP) ================= */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between gap-4">
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

            {/* Right Controls */}
            <div className="flex items-center gap-3 text-xs">
              {/* Quick OCR */}
              <button
                onClick={onOpenOcrModal}
                title="Quét từ vựng từ ảnh (OCR AI)"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] font-mono text-[11px] uppercase tracking-wider font-semibold transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Quét ảnh OCR</span>
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

              {/* Unified Cloud & Sheets Sync Indicator */}
              <button
                onClick={handleManualSync}
                disabled={isSyncing || isCloudSyncing}
                title="Bấm để đồng bộ dữ liệu giữa Safari iPhone PWA, Chrome PC & Google Sheets"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] font-mono text-[11px] transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isCloudSyncing ? 'animate-spin text-amber-500' : 'text-emerald-600'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isSyncing || isCloudSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ CLOUD'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <nav className="hidden md:block bg-[#F3EFE6] px-4 overflow-x-auto">
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
                  {item.id === 'games' && selectedGameMode && (
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-stone-950 text-[9px] font-mono font-black px-1.5 py-0.5 rounded shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
                      ĐANG CHƠI
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ================= MOBILE NATIVE HEADER (< MD) ================= */}
        <div className="md:hidden px-3.5 py-2.5 flex items-center justify-between gap-2 bg-[#F9F7F2]">
          {/* Logo & Compact Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveNav('dashboard')}
          >
            <Logo size={34} className="w-8 h-8" />
            <div className="flex flex-col">
              <span className="text-base font-serif font-black tracking-tight leading-none text-[#1A1A1A]">
                HỌC HÀNH LẮM
              </span>
              <span className="text-[9px] font-mono tracking-wider text-stone-600 font-bold uppercase mt-0.5">
                {currentLangInfo.name} ({currentLanguage.toUpperCase()})
              </span>
            </div>
          </div>

          {/* Quick Mobile Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Language Toggle */}
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-[#1A1A1A] text-xs font-mono font-bold"
            >
              <span>{currentLangInfo.flag}</span>
              <span className="text-[10px] uppercase">{currentLanguage.toUpperCase()}</span>
            </button>

            {/* Quick Camera OCR */}
            <button
              onClick={onOpenOcrModal}
              className="p-1.5 bg-[#1A1A1A] text-white border border-[#1A1A1A] active:bg-stone-800"
              title="Quét OCR từ ảnh"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Menu Drawer Toggle */}
            <button
              onClick={() => setShowMobileDrawer(!showMobileDrawer)}
              className="p-1.5 bg-white text-[#1A1A1A] border border-[#1A1A1A] active:bg-stone-200"
              title="Danh mục tính năng"
            >
              {showMobileDrawer ? <X className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatusMsg && (
          <div className="bg-[#1A1A1A] text-[#F9F7F2] text-[11px] font-mono py-1 px-3 text-center tracking-wider">
            {syncStatusMsg}
          </div>
        )}

        {/* Mobile Language Switcher Dropdown */}
        {showLangMenu && (
          <div
            className="md:hidden border-t border-[#1A1A1A] bg-[#F3EFE6] p-2 space-y-1 animate-in slide-in-from-top-2"
            onClick={() => setShowLangMenu(false)}
          >
            <div className="text-[9px] font-mono uppercase font-bold text-stone-600 px-2 py-0.5">
              Chọn ngôn ngữ đang học:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
                const info = LANGUAGES[code];
                const isSelected = code === currentLanguage;
                return (
                  <button
                    key={code}
                    onClick={() => setCurrentLanguage(code)}
                    className={`flex items-center justify-center gap-1.5 p-2 text-xs font-bold border transition ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-white text-[#1A1A1A] border-stone-300'
                    }`}
                  >
                    <span>{info.flag}</span>
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR (< MD) ================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F9F7F2] border-t-2 border-[#1A1A1A] px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => handleMobileNavClick('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded transition ${
              activeNav === 'dashboard' ? 'text-[#1A1A1A] font-bold' : 'text-stone-500'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeNav === 'dashboard' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
            <span className="text-[10px] font-mono uppercase mt-0.5">Tổng quan</span>
          </button>

          <button
            onClick={() => handleMobileNavClick('vocabulary')}
            className={`flex flex-col items-center justify-center py-1 rounded transition ${
              activeNav === 'vocabulary' ? 'text-[#1A1A1A] font-bold' : 'text-stone-500'
            }`}
          >
            <BookOpen className={`w-5 h-5 ${activeNav === 'vocabulary' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
            <span className="text-[10px] font-mono uppercase mt-0.5">Từ vựng</span>
          </button>

          <button
            onClick={() => handleMobileNavClick('grammar')}
            className={`flex flex-col items-center justify-center py-1 rounded transition ${
              activeNav === 'grammar' ? 'text-[#1A1A1A] font-bold' : 'text-stone-500'
            }`}
          >
            <Layers className={`w-5 h-5 ${activeNav === 'grammar' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
            <span className="text-[10px] font-mono uppercase mt-0.5">Ngữ pháp</span>
          </button>

          <button
            onClick={() => handleMobileNavClick('games')}
            className={`flex flex-col items-center justify-center py-1 rounded transition relative ${
              activeNav === 'games' ? 'text-[#1A1A1A] font-bold' : 'text-stone-500'
            }`}
          >
            <div className="relative">
              <Gamepad2 className={`w-5 h-5 ${activeNav === 'games' ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
              {selectedGameMode && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono uppercase mt-0.5 font-semibold">
              {selectedGameMode ? 'Đang chơi' : 'Luyện tập'}
            </span>
          </button>

          <button
            onClick={() => setShowMobileDrawer(!showMobileDrawer)}
            className={`flex flex-col items-center justify-center py-1 rounded transition ${
              showMobileDrawer ? 'text-[#1A1A1A] font-bold' : 'text-stone-500'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase mt-0.5">Tất cả</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE ALL MODULES DRAWER (< MD) ================= */}
      {showMobileDrawer && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div
            className="bg-[#F9F7F2] border-t-2 border-[#1A1A1A] max-h-[85vh] overflow-y-auto rounded-t-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <div className="flex items-center gap-2">
                <Logo size={28} className="w-7 h-7" />
                <span className="font-serif font-black text-lg text-[#1A1A1A]">TẤT CẢ TÍNH NĂNG</span>
              </div>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-1.5 bg-stone-200 border border-[#1A1A1A] text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNavClick(item.id)}
                    className={`flex items-center gap-2.5 p-3 text-left border-2 text-xs font-mono transition ${
                      isActive
                        ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A] font-bold shadow-sm'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A] hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="truncate flex-1 min-w-0">
                      <div className="text-[9px] opacity-60">{item.num}</div>
                      <div className="font-bold truncate text-[11px]">{item.label}</div>
                    </div>
                    {item.id === 'games' && selectedGameMode && (
                      <span className="shrink-0 text-[8px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.5 rounded">
                        ĐANG CHƠI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions in Drawer */}
            <div className="pt-2 border-t border-[#1A1A1A]/20 flex flex-col gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing || isCloudSyncing}
                className="w-full flex items-center justify-center gap-2 p-2.5 border border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold uppercase active:bg-stone-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isCloudSyncing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
                <span>{isSyncing || isCloudSyncing ? 'Đang đồng bộ Đa Nền Tảng...' : 'Đồng bộ Cloud & Sheets ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

