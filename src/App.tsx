import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProficiencyLevelView } from './components/ProficiencyLevelView';
import { VocabularyManager } from './components/VocabularyManager';
import { GrammarManager } from './components/GrammarManager';
import { GameReviewHub } from './components/games/GameReviewHub';
import { MockTestView } from './components/MockTestView';
import { ListeningView } from './components/ListeningView';
import { AiChatboxView } from './components/AiChatboxView';
import { RoleplayView } from './components/RoleplayView';
import { JournalView } from './components/JournalView';
import { StrokeGuideView } from './components/StrokeGuideView';
import { GoogleSheetsSettings } from './components/GoogleSheetsSettings';
import { OcrScannerModal } from './components/OcrScannerModal';

const AppContent: React.FC = () => {
  const { activeNav } = useApp();
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <Dashboard />;
      case 'levels':
        return <ProficiencyLevelView />;
      case 'vocabulary':
        return <VocabularyManager />;
      case 'grammar':
        return <GrammarManager />;
      case 'games':
        return <GameReviewHub />;
      case 'mocktest':
        return <MockTestView />;
      case 'listening':
        return <ListeningView />;
      case 'aichat':
        return <AiChatboxView />;
      case 'roleplay':
        return <RoleplayView />;
      case 'journal':
        return <JournalView />;
      case 'stroke':
        return <StrokeGuideView />;
      case 'sheets':
        return <GoogleSheetsSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-[#F9F7F2] flex flex-col">
      {/* Top Sticky Editorial Header & Navigation */}
      <Navbar
        onOpenOcrModal={() => setIsOcrModalOpen(true)}
      />

      {/* Main Editorial Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>

      {/* Editorial Newspaper Footer */}
      <footer className="border-t border-[#1A1A1A] bg-[#F3EFE6] py-6 text-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-black tracking-tight text-base">POLYGLOT LAB</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#1A1A1A]/70">
              — Phiên bản v2.4 / Bản đa ngôn ngữ (Anh • Hàn • Trung)
            </span>
          </div>
          <div className="text-xs font-serif italic text-stone-700 text-center sm:text-right">
            Thuật toán lặp lại ngắt quãng SRS SM-2 • Trí tuệ nhân tạo Gemini 3.7 • Đồng bộ hóa Google Sheets
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
