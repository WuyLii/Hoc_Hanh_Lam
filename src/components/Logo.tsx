import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-11 h-11', size = 44 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`rounded-full shrink-0 shadow-sm border-2 border-[#1A1A1A] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hhlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A1A1A" />
          <stop offset="100%" stopColor="#2A2A2A" />
        </linearGradient>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </radialGradient>
        <path id="hhlTopArc" d="M 32,100 A 68,68 0 1,1 168,100" fill="none" />
        <path id="hhlBottomArc" d="M 168,100 A 68,68 0 1,1 32,100" fill="none" />
      </defs>

      {/* Circle Dark Base */}
      <circle cx="100" cy="100" r="100" fill="url(#hhlGrad)" />

      {/* Gold Ring & Inner White Ring */}
      <circle cx="100" cy="100" r="92" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.6" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
      <circle cx="100" cy="100" r="76" fill="url(#goldGlow)" />

      {/* Curved Text: HỌC HÀNH LẮM */}
      <text fill="#FFFFFF" fontSize="13" fontFamily="sans-serif" letterSpacing="3.5" fontWeight="900">
        <textPath href="#hhlTopArc" startOffset="50%" textAnchor="middle">
          HỌC HÀNH LẮM
        </textPath>
      </text>

      {/* Curved Text: POLYGLOT LAB */}
      <text fill="#F59E0B" fontSize="11" fontFamily="monospace" letterSpacing="2.5" fontWeight="700">
        <textPath href="#hhlBottomArc" startOffset="50%" textAnchor="middle">
          ● EST. 2026 ●
        </textPath>
      </text>

      {/* Center Graphic: Stylized Graduation Cap + Open Book + AI Sparkle */}
      <g transform="translate(100, 102)">
        {/* Open Book Wings */}
        <path
          d="M -32,10 C -20,2 -8,5 0,12 C 8,5 20,2 32,10 L 32,-12 C 20,-20 8,-17 0,-10 C -8,-17 -20,-20 -32,-12 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M -30,8 C -18,0 -6,3 0,10 C 6,3 18,0 30,8"
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Graduation Cap Top Diamond */}
        <polygon points="0,-36 28,-24 0,-12 -28,-24" fill="#F59E0B" />
        <polygon points="0,-36 28,-24 0,-20 -28,-24" fill="#FBBF24" />

        {/* Cap Base & Tassel */}
        <path d="M -16,-20 L -16,-12 C -16,-6 16,-6 16,-12 L 16,-20" fill="none" stroke="#D97706" strokeWidth="3" />
        <path d="M 22,-22 L 28,-10 L 28,-4" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        <circle cx="28" cy="-2" r="2" fill="#FBBF24" />

        {/* Center Sparkle */}
        <path
          d="M 0,-6 L 2,-2 L 6,0 L 2,2 L 0,6 L -2,2 L -6,0 L -2,-2 Z"
          fill="#1A1A1A"
        />
      </g>
    </svg>
  );
};

