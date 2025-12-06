import React from 'react';

interface OnboardingAnimationProps {
  onStart: () => void;
}

export const OnboardingAnimation: React.FC<OnboardingAnimationProps> = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full bg-gradient-to-b from-[#0a0f1e] to-[#000000] animate-fadeIn overflow-hidden p-4">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Ambient Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-green-400"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animation: `particle-float ${Math.random() * 8 + 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}

        <svg
          viewBox="0 0 200 200"
          className="absolute w-full h-full"
        >
          <defs>
            <radialGradient id="planet-gradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#00C6FF" />
                <stop offset="65%" stopColor="#007B8A" />
                <stop offset="100%" stopColor="#00D084" />
            </radialGradient>
            <radialGradient id="aura-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00FF9C" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#00FF9C" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#00FF9C" stopOpacity="0" />
            </radialGradient>
            <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="swirl-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="2" result="turbulence"/>
              <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="8" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
            <filter id="swirl-filter-mid">
              <feTurbulence type="fractalNoise" baseFrequency="0.03 0.04" numOctaves="2" result="turbulence"/>
              <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="10" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
             <path id="ring-path-1" d="M 20,100 a 80,40 0 1,0 160,0 a 80,40 0 1,0 -160,0" fill="none" />
             <path id="ring-path-2" d="M 5,100 a 95,45 0 1,0 190,0 a 95,45 0 1,0 -190,0" fill="none" />
          </defs>

          {/* Planet Aura */}
          <circle cx="100" cy="100" r="80" fill="url(#aura-gradient)" />
          
           {/* Rings Back */}
          <g style={{ transform: 'rotate3d(1, 0, 0, 60deg)', transformOrigin: 'center', filter: 'url(#glow-filter)' }}>
            <path d="M 20,100 A 80,40 0 0,1 180,100" stroke="#00FF9C" strokeWidth="6" fill="none" opacity="0.5" />
          </g>
           <g style={{ transform: 'rotate3d(0.5, -0.8, 0.2, 70deg)', transformOrigin: 'center', filter: 'url(#glow-filter)' }}>
            <path d="M 5,100 A 95,45 0 0,1 195,100" stroke="#00C6FF" strokeWidth="5" fill="none" opacity="0.4" />
          </g>

          {/* Orbiting Pulses */}
          <g style={{ transform: 'rotate3d(1, 0, 0, 60deg)', transformOrigin: 'center' }}>
            <circle r="4" fill="#FFFFFF" filter="url(#glow-filter)">
              <animateMotion dur="6s" repeatCount="indefinite" calcMode="linear">
                <mpath href="#ring-path-1" />
              </animateMotion>
            </circle>
          </g>
           <g style={{ transform: 'rotate3d(0.5, -0.8, 0.2, 70deg)', transformOrigin: 'center' }}>
            <circle r="3.5" fill="#FFFFFF" filter="url(#glow-filter)">
              <animateMotion dur="9s" repeatCount="indefinite" begin="-4.5s" calcMode="linear">
                <mpath href="#ring-path-2" />
              </animateMotion>
            </circle>
          </g>
          
          {/* Planet Core Group for Breathing and Rotation Animation */}
          <g style={{ animation: 'planet-core-breathe 4s ease-in-out infinite, spin 25s linear infinite', transformOrigin: 'center' }}>
            {/* Planet Core */}
            <circle cx="100" cy="100" r="50" fill="url(#planet-gradient)" />
            
            {/* Internal Swirling Motion */}
            <circle cx="100" cy="100" r="48" fill="url(#planet-gradient)" opacity="2.8" style={{ animation: 'internal-swirl 8s ease-in-out infinite' }} />
          </g>

          {/* Rings Front */}
           <g style={{ transform: 'rotate3d(1, 0, 0, 60deg)', transformOrigin: 'center', filter: 'url(#glow-filter)' }}>
            <path d="M 20,100 A 80,40 0 0,0 180,100" stroke="#00FF9C" strokeWidth="6" fill="none" opacity="0.8" />
          </g>
           <g style={{ transform: 'rotate3d(0.5, -0.8, 0.2, 70deg)', transformOrigin: 'center', filter: 'url(#glow-filter)' }}>
            <path d="M 5,100 A 95,45 0 0,0 195,100" stroke="#00C6FF" strokeWidth="5" fill="none" opacity="0.6" />
          </g>

        </svg>
      </div>
      
      <h1 className="text-8xl md:text-9xl font-semibold tracking-wider mt-4 opacity-0 animate-text-fade-in-up" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-emerald-800 to-teal-900">
          Phys
        </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
          IQ
        </span>
      </h1>
       <p 
        className="opacity-0 mt-4 text-lg text-cyan-200 tracking-wide animate-fadeIn" 
        style={{ animationDelay: '1.5s' }}
      >
        Ignite the spark of physics.
      </p>
      <button
        onClick={onStart}
        className="opacity-0 mt-12 px-8 py-3 bg-transparent border-2 border-[#00FF9C] rounded-full text-[#00FF9C] font-semibold
                   hover:bg-[#00FF9C] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(0,255,156,0.5)]
                   hover:shadow-[0_0_25px_rgba(0,255,156,0.8)] animate-fadeIn"
        style={{ animationDelay: '2s' }}
      >
        Let's Learn
      </button>
      <div 
        className="absolute bottom-4 left-0 right-0 opacity-0 text-xs text-slate-500 text-center animate-fadeIn"
        style={{ animationDelay: '2.2s' }}
      >
          <p>Developed by: Umme Kulsum, Zoya Arshi, Minha, Falcon Institute, Mysore Road Campus, Bangalore</p>
      </div>
    </div>
  );
};