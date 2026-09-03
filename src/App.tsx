import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProficiencyLevelView } from './components/ProficiencyLevelView';
import { VocabularyManager } from './components/VocabularyManager';
import { GrammarManager } from './components/GrammarManager';
import { GameReviewHub } from './components/games/GameReviewHub';
import { MockTestView } from './components/MockTestView';
import { AiChatboxView } from './components/AiChatboxView';
import { StrokeGuideView } from './components/StrokeGuideView';
import { NumbersView } from './components/NumbersView';
import { GoogleSheetsSettings } from './components/GoogleSheetsSettings';
import { OcrScannerModal } from './components/OcrScannerModal';
import { ActiveGamePersistentBar } from './components/games/ActiveGamePersistentBar';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full border-2 border-[#1A1A1A] bg-white p-8 shadow-[6px_6px_0px_0px_#1A1A1A]">
            <div className="w-12 h-12 bg-amber-100 border border-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-serif font-black uppercase mb-2">Đã xảy ra sự cố hiển thị</h2>
            <p className="text-sm font-mono text-stone-600 mb-6">
              Ứng dụng đang tự động lưu trữ dữ liệu an toàn. Vui lòng tải lại để tiếp tục học tập.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="w-full py-3 bg-[#1A1A1A] text-[#F9F7F2] font-mono text-xs uppercase font-bold tracking-wider hover:bg-stone-800 transition"
            >
              🔄 Tải lại trang & Khôi phục
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { activeNav } = useApp();
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-[#F9F7F2] flex flex-col overflow-x-hidden w-full max-w-full">
      {/* Top Sticky Editorial Header & Navigation */}
      <Navbar
        onOpenOcrModal={() => setIsOcrModalOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8 overflow-x-hidden">
        {/* Persistent Game Review Hub: kept mounted in DOM so active game session, question index, flipped state and scores are NEVER lost */}
        <div style={{ display: activeNav === 'games' ? 'block' : 'none' }}>
          <GameReviewHub />
        </div>

        {/* Dynamic Views: rendered when activeNav is matched */}
        {activeNav === 'dashboard' && <Dashboard />}
        {activeNav === 'levels' && <ProficiencyLevelView />}
        {activeNav === 'vocabulary' && <VocabularyManager />}
        {activeNav === 'grammar' && <GrammarManager />}
        {activeNav === 'mocktest' && <MockTestView />}
        {activeNav === 'aichat' && <AiChatboxView />}
        {activeNav === 'stroke' && <StrokeGuideView />}
        {activeNav === 'numbers' && <NumbersView />}
        {activeNav === 'sheets' && <GoogleSheetsSettings />}
      </main>

      {/* Persistent floating indicator when a game is in progress and user browses other sections */}
      <ActiveGamePersistentBar />

      {/* Editorial Newspaper Footer */}
      <footer className="border-t border-[#1A1A1A] bg-[#F3EFE6] py-6 text-[#1A1A1A] mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-black tracking-tight text-base">HỌC HÀNH LẮM</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#1A1A1A]/70">
              — Phiên bản v2.5 / Đa ngôn ngữ (Anh • Hàn • Trung)
            </span>
          </div>
          <div className="text-xs font-serif italic text-stone-700 text-center sm:text-right">
            Thuật toán lặp lại ngắt quãng SRS SM-2 • Trí tuệ nhân tạo Gemini 3.7 • Tự động đồng bộ Google Sheets (24h)
          </div>
        </div>
      </footer>

      {/* Global OCR Scanner Modal */}
      <OcrScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
