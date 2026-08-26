import React, { useState, useEffect } from 'react';
import { VocabularyItem, LanguageCode } from '../../types';
import { ttsService } from '../../services/ttsService';
import confetti from 'canvas-confetti';
import { ChevronLeft, RotateCcw, Clock, Check } from 'lucide-react';

interface Tile {
  id: string;
  wordId: string;
  type: 'word' | 'meaning';
  text: string;
  isMatched: boolean;
}

interface MatchingPairsGameProps {
  words: VocabularyItem[];
  language: LanguageCode;
  onFinish: (correctCount: number, totalCount: number, score: number) => void;
  onExit: () => void;
}

export const MatchingPairsGame: React.FC<MatchingPairsGameProps> = ({
  words,
  language,
  onFinish,
  onExit,
}) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [wrongMatchPair, setWrongMatchPair] = useState<[string, string] | null>(null);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(6);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const initGame = () => {
    const selectedWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 6);
    setTotalPairs(selectedWords.length);
    setMatchedPairsCount(0);
    setTimerSeconds(0);
    setIsCompleted(false);
    setSelectedTileId(null);
    setWrongMatchPair(null);

    const generatedTiles: Tile[] = [];
    selectedWords.forEach((w) => {
      generatedTiles.push({
        id: `w_${w.word_id}`,
        wordId: w.word_id,
        type: 'word',
        text: w.tu,
        isMatched: false,
      });
      generatedTiles.push({
        id: `m_${w.word_id}`,
        wordId: w.word_id,
        type: 'meaning',
        text: w.nghia,
        isMatched: false,
      });
    });

    setTiles(generatedTiles.sort(() => 0.5 - Math.random()));
  };

  useEffect(() => {
    initGame();
  }, [words]);

  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const handleTileClick = (tile: Tile) => {
    if (tile.isMatched || wrongMatchPair) return;

    if (!selectedTileId) {
      setSelectedTileId(tile.id);
      if (tile.type === 'word') {
        ttsService.speak(tile.text, language);
      }
      return;
    }

    if (selectedTileId === tile.id) {
      setSelectedTileId(null);
      return;
    }

    const firstTile = tiles.find((t) => t.id === selectedTileId);
    if (!firstTile) return;

    if (firstTile.wordId === tile.wordId && firstTile.type !== tile.type) {
      setTiles((prev) =>
        prev.map((t) => (t.wordId === tile.wordId ? { ...t, isMatched: true } : t))
      );
      setSelectedTileId(null);
      const newMatched = matchedPairsCount + 1;
      setMatchedPairsCount(newMatched);

      if (tile.type === 'word') {
        ttsService.speak(tile.text, language);
      } else {
        ttsService.speak(firstTile.text, language);
      }

      if (newMatched === totalPairs) {
        setIsCompleted(true);
        confetti({ particleCount: 80, spread: 60 });
        const timeBonus = Math.max(0, 300 - timerSeconds * 5);
        const finalScore = totalPairs * 50 + timeBonus;
        onFinish(totalPairs, totalPairs, finalScore);
      }
    } else {
      setWrongMatchPair([firstTile.id, tile.id]);
      setTimeout(() => {
        setWrongMatchPair(null);
        setSelectedTileId(null);
      }, 700);
    }
  };

  if (tiles.length === 0) {
    return (
      <div className="p-8 text-center bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4 max-w-md mx-auto">
        <p className="text-xs font-mono text-stone-600">Cần có từ vựng để tạo bảng ma trận ghép nối.</p>
        <button onClick={onExit} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase">
          THOÁT RA
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white border-4 border-[#1A1A1A] editorial-shadow-lg space-y-6 animate-in zoom-in-95">
        <div className="text-xs font-mono uppercase tracking-widest text-stone-500">TỔNG KẾT NỐI TỪ</div>
        <h2 className="text-3xl font-serif font-black text-[#1A1A1A]">Đã ghép nối thành công!</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7F2] border border-[#1A1A1A]">
          <div>
            <div className="text-3xl font-serif font-bold text-[#1A1A1A]">{timerSeconds}s</div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Thời gian hoàn thành</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-800 font-mono">
              +{totalPairs * 50 + Math.max(0, 300 - timerSeconds * 5)} ĐIỂM
            </div>
            <div className="text-[10px] font-mono text-stone-600 uppercase">Điểm thưởng đạt được</div>
          </div>
        </div>
        <button
          onClick={onExit}
          className="w-full py-3 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] text-xs font-mono font-bold uppercase tracking-wider editorial-shadow-sm"
        >
          QUAY LẠI TRUNG TÂM GAME →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-xs font-mono uppercase font-bold text-stone-600 hover:text-[#1A1A1A]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>THOÁT</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-stone-600">
            <Clock className="w-3.5 h-3.5" />
            <span>{timerSeconds}s</span>
          </div>

          <div className="font-bold text-[#1A1A1A]">
            ĐÃ GHÉP: {matchedPairsCount}/{totalPairs}
          </div>

          <button onClick={initGame} className="p-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white" title="Chơi lại ván mới">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((tile) => {
          const isSelected = selectedTileId === tile.id;
          const isWrong = wrongMatchPair && wrongMatchPair.includes(tile.id);
          const isMatched = tile.isMatched;

          let tileClass = 'bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] hover:editorial-shadow-sm';

          if (isMatched) {
            tileClass = 'bg-stone-200 border-dashed border-stone-400 text-stone-400 opacity-40 cursor-default';
          } else if (isWrong) {
            tileClass = 'bg-rose-800 text-white border-rose-950 animate-shake';
          } else if (isSelected) {
            tileClass = 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A] editorial-shadow-sm font-bold scale-[1.02]';
          }

          return (
            <button
              key={tile.id}
              disabled={isMatched}
              onClick={() => handleTileClick(tile)}
              className={`p-4 min-h-[90px] transition text-center flex flex-col items-center justify-center ${tileClass}`}
            >
              <span className={`leading-snug ${tile.type === 'word' ? 'font-serif text-lg font-bold' : 'text-xs font-serif font-medium'}`}>
                {tile.text}
              </span>
              {isMatched && <Check className="w-4 h-4 text-stone-500 mt-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
