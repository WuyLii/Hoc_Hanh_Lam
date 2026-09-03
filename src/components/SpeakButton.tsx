import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, X } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { LanguageCode } from '../types';

export interface SpeakButtonProps {
  text: string;
  language: LanguageCode;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  variant?: 'table' | 'card' | 'outline' | 'ghost' | 'custom';
  showLabel?: boolean;
  label?: string;
  title?: string;
  position?: 'auto' | 'right' | 'left' | 'bottom-right' | 'bottom-left' | 'top';
  stopClickPropagation?: boolean;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5];

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  language,
  className = '',
  buttonClassName = '',
  iconClassName = '',
  variant = 'table',
  showLabel = false,
  label = 'Phát âm',
  title = 'Nhấn để phát âm 1x • Rê chuột hoặc giữ để chọn tốc độ',
  position = 'auto',
  stopClickPropagation = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState<number>(1.0);
  const [resolvedPosition, setResolvedPosition] = useState<'right' | 'left' | 'bottom-right' | 'bottom-left' | 'top'>('right');

  const containerRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Calculate position when opening
  const updatePosition = useCallback(() => {
    if (position !== 'auto') {
      setResolvedPosition(position);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

    // Check if right side has enough space (at least 260px)
    if (rect.right + 260 > windowWidth) {
      // Not enough space on right, place on left
      if (rect.left > 260) {
        setResolvedPosition('left');
      } else {
        setResolvedPosition('bottom-left');
      }
    } else {
      setResolvedPosition('right');
    }
  }, [position]);

  // Open speed menu with position calculation
  const openSpeedBar = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updatePosition();
    setIsSpeedOpen(true);
  }, [updatePosition]);

  // Close speed drawer on click outside
  useEffect(() => {
    if (!isSpeedOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSpeedOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isSpeedOpen]);

  // Execute speak
  const handleSpeak = useCallback(
    (speed: number) => {
      if (!text.trim()) return;
      setIsPlaying(true);
      setActiveSpeed(speed);

      ttsService.speak(text, language, speed, () => {
        setIsPlaying(false);
      });
    },
    [text, language]
  );

  // ================= MOUSE HOVER (PC WEB) =================
  const handleMouseEnterContainer = (e: React.MouseEvent) => {
    // Cancel any closing timer if re-entering
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    // On PC (mouse cursor), start hover timer to reveal speed selector
    if (e.nativeEvent.which === 0) {
      // 0 means no button pressed (pure hover)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

      hoverTimerRef.current = setTimeout(() => {
        openSpeedBar();
      }, 420); // 420ms hover delay
    }
  };

  const handleMouseLeaveContainer = () => {
    // Clear hover trigger
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // If speed bar is open, allow 350ms grace period before closing so cursor can move smoothly
    if (isSpeedOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setIsSpeedOpen(false);
      }, 380);
    }
  };

  // ================= POINTER / TOUCH (MOBILE & PC) =================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (stopClickPropagation) {
      e.stopPropagation();
    }
    if (e.button !== 0) return; // only left click

    isLongPressRef.current = false;
    setIsHolding(true);

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    // Long press timer (350ms) for touch / holding click
    holdTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsHolding(false);
      openSpeedBar();

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {
          // Ignore
        }
      }
    }, 350);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (stopClickPropagation) {
      e.stopPropagation();
    }
    setIsHolding(false);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Normal click if released before hold timer
    if (!isLongPressRef.current) {
      handleSpeak(1.0);
    }
  };

  const handlePointerCancel = () => {
    setIsHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  // Right-click support on desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stopClickPropagation) {
      e.stopPropagation();
    }
    setIsSpeedOpen((prev) => !prev);
  };

  // Speed selection
  const handleSelectSpeed = (e: React.MouseEvent, speed: number) => {
    if (stopClickPropagation) {
      e.stopPropagation();
    }
    handleSpeak(speed);
  };

  // Resolve base button styles according to variant
  let baseButtonStyles = 'transition select-none outline-none cursor-pointer ';
  let defaultIconSize = 'w-3.5 h-3.5';

  if (variant === 'table') {
    baseButtonStyles +=
      'p-1.5 text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200/60 rounded flex items-center gap-1.5';
    defaultIconSize = 'w-3.5 h-3.5';
  } else if (variant === 'card') {
    baseButtonStyles +=
      'p-2 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white flex items-center gap-1.5';
    defaultIconSize = 'w-4 h-4';
  } else if (variant === 'outline') {
    baseButtonStyles +=
      'px-2.5 py-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white flex items-center gap-1.5 text-xs font-mono';
    defaultIconSize = 'w-3.5 h-3.5';
  } else if (variant === 'ghost') {
    baseButtonStyles +=
      'p-1 text-stone-500 hover:text-[#1A1A1A] flex items-center gap-1';
    defaultIconSize = 'w-3.5 h-3.5';
  }

  // Positioning classes for speed bar
  let positionClasses = 'left-full ml-2 top-1/2 -translate-y-1/2';
  let animationClass = 'animate-in fade-in slide-in-from-left-2 duration-150';

  if (resolvedPosition === 'left') {
    positionClasses = 'right-full mr-2 top-1/2 -translate-y-1/2';
    animationClass = 'animate-in fade-in slide-in-from-right-2 duration-150';
  } else if (resolvedPosition === 'bottom-right') {
    positionClasses = 'left-0 top-full mt-2';
    animationClass = 'animate-in fade-in slide-in-from-top-2 duration-150';
  } else if (resolvedPosition === 'bottom-left') {
    positionClasses = 'right-0 top-full mt-2';
    animationClass = 'animate-in fade-in slide-in-from-top-2 duration-150';
  } else if (resolvedPosition === 'top') {
    positionClasses = 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    animationClass = 'animate-in fade-in slide-in-from-bottom-2 duration-150';
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnterContainer}
      onMouseLeave={handleMouseLeaveContainer}
      onClick={(e) => {
        if (stopClickPropagation) e.stopPropagation();
      }}
    >
      {/* Main Speak Trigger Button */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
        className={`${baseButtonStyles} ${
          isHolding ? 'scale-90 bg-amber-100 text-amber-900 ring-2 ring-amber-500' : ''
        } ${isPlaying ? 'text-amber-600 animate-pulse' : ''} ${buttonClassName}`}
        title={title}
        aria-label="Phát âm từ vựng"
      >
        {isPlaying ? (
          <Volume2 className={`${iconClassName || defaultIconSize} animate-bounce text-amber-600`} />
        ) : (
          <Volume2 className={`${iconClassName || defaultIconSize} transition-transform ${isHolding ? 'scale-110' : ''}`} />
        )}

        {showLabel && (
          <span className="text-[11px] font-mono font-medium">{label}</span>
        )}

        {/* Small speed indicator badge if not standard 1x */}
        {activeSpeed !== 1.0 && (
          <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-200 text-amber-900 font-bold border border-amber-400 leading-none">
            {activeSpeed}x
          </span>
        )}
      </button>

      {/* Horizontal Sliding Speed Bar */}
      {isSpeedOpen && (
        <div
          className={`absolute z-50 flex items-center gap-1.5 p-1.5 bg-[#1A1A1A] text-[#F9F7F2] border-2 border-[#1A1A1A] shadow-2xl whitespace-nowrap ${animationClass} ${positionClasses}`}
          style={{ minWidth: 'max-content' }}
          onMouseEnter={() => {
            // Cancel closing when hovering directly on speed options
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 px-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            <span>Tốc độ:</span>
          </div>

          <div className="flex items-center gap-1">
            {PLAYBACK_SPEEDS.map((speed) => {
              const isCurrent = activeSpeed === speed;
              return (
                <button
                  key={speed}
                  type="button"
                  onClick={(e) => handleSelectSpeed(e, speed)}
                  className={`px-2 py-0.5 text-[11px] font-mono font-bold transition border ${
                    isCurrent
                      ? 'bg-amber-400 text-[#1A1A1A] border-amber-400 shadow-sm'
                      : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:text-white'
                  }`}
                  title={`Phát ở tốc độ ${speed}x`}
                >
                  {speed}x
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSpeedOpen(false);
            }}
            className="p-1 ml-1 text-stone-400 hover:text-white hover:bg-stone-800 transition rounded"
            title="Đóng bảng tốc độ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
