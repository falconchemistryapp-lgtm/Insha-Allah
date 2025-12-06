import React from 'react';

interface AnimatedLogoProps {
  size: number;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size }) => {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className="relative flex items-center justify-center animate-logo-pulse"
    >
      <svg
        viewBox="0 0 200 200"
        className="absolute w-full h-full"
      >
        <defs>
          <radialGradient id="logo-planet-gradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#00C6FF" />
              <stop offset="65%" stopColor="#007B8A" />
              <stop offset="100%" stopColor="#00D084" />
          </radialGradient>
          <filter id="logo-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Rings Back */}
        <g style={{ transform: 'rotate3d(1, 0, 0, 60deg)', transformOrigin: 'center', filter: 'url(#logo-glow-filter)' }}>
          <path d="M 20,100 A 80,40 0 0,1 180,100" stroke="#00FF9C" strokeWidth="6" fill="none" opacity="0.5" />
        </g>
        <g style={{ transform: 'rotate3d(0.5, -0.8, 0.2, 70deg)', transformOrigin: 'center', filter: 'url(#logo-glow-filter)' }}>
          <path d="M 5,100 A 95,45 0 0,1 195,100" stroke="#00C6FF" strokeWidth="5" fill="none" opacity="0.4" />
        </g>
        
        {/* Planet Core */}
        <g style={{ animation: 'spin 25s linear infinite', transformOrigin: 'center' }}>
          <circle cx="100" cy="100" r="50" fill="url(#logo-planet-gradient)" />
        </g>

        {/* Rings Front */}
        <g style={{ transform: 'rotate3d(1, 0, 0, 60deg)', transformOrigin: 'center', filter: 'url(#logo-glow-filter)' }}>
          <path d="M 20,100 A 80,40 0 0,0 180,100" stroke="#00FF9C" strokeWidth="6" fill="none" opacity="0.8" />
        </g>
        <g style={{ transform: 'rotate3d(0.5, -0.8, 0.2, 70deg)', transformOrigin: 'center', filter: 'url(#logo-glow-filter)' }}>
          <path d="M 5,100 A 95,45 0 0,0 195,100" stroke="#00C6FF" strokeWidth="5" fill="none" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};