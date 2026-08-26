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
      className={`rounded-full shrink-0 shadow-md border-2 border-[#1A1A1A] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="smokeBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2c2c2c" />
          <stop offset="60%" stopColor="#141414" />
          <stop offset="100%" stopColor="#080808" />
        </radialGradient>
        <path
          id="topTextPath"
          d="M 30,100 A 70,70 0 1,1 170,100"
          fill="none"
        />
        <path
          id="bottomTextPath"
          d="M 170,100 A 70,70 0 1,1 30,100"
          fill="none"
        />
      </defs>

      {/* Circle Background */}
      <circle cx="100" cy="100" r="100" fill="url(#smokeBg)" />

      {/* Outer Inner White Rings */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />

      {/* Text along path: VÙNG ĐẤT */}
      <text fill="#ffffff" fontSize="13" fontFamily="serif" letterSpacing="3" fontWeight="bold">
        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
          VÙNG ĐẤT
        </textPath>
      </text>

      {/* Text along path: MỘNG MƠ */}
      <text fill="#ffffff" fontSize="13" fontFamily="serif" letterSpacing="3" fontWeight="bold">
        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
          MỘNG MƠ
        </textPath>
      </text>

      {/* Center Cursive 'sf' monogram */}
      <g transform="translate(100, 100)">
        {/* Flourish left and right waves */}
        <path
          d="M -65,5 C -45,15 -35,-5 -20,2 C -10,6 -5,0 0,0 C 5,0 10,6 20,2 C 35,-5 45,15 65,5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.95"
        />
        {/* Letter s */}
        <path
          d="M -16,16 C -24,18 -30,14 -28,6 C -26,-2 -16,-4 -12,-12 C -8,-20 -18,-30 -26,-26 C -31,-23 -33,-17 -30,-12"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Letter f */}
        <path
          d="M -2,-32 C 4,-34 10,-32 10,-24 C 10,-15 10,-5 10,12 C 10,24 14,32 24,30 C 30,28 32,22 28,18"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line x1="2" y1="-12" x2="16" y2="-12" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
