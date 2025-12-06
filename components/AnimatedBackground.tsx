import React from 'react';

interface AnimatedBackgroundProps {
  parallaxOffset: { x: number; y: number };
}

const DarkParticle: React.FC = () => {
  const size = Math.random() * 2 + 1;
  const duration = Math.random() * 20 + 15; // 15-35 seconds
  const delay = Math.random() * -duration; // Start at a random point in the animation
  const startX = Math.random() * 100;
  const opacity = Math.random() * 0.4 + 0.1;

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}vw`,
        top: '-5vh',
        background: `rgba(0, 255, 220, ${opacity})`,
        animation: `particle-drift ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

const LightParticle: React.FC = () => {
  const size = Math.random() * 2.5 + 1;
  const duration = Math.random() * 30 + 20; // 20-50 seconds
  const delay = Math.random() * -duration;
  const startX = Math.random() * 100;

  return (
    <div
      className="absolute rounded-full bg-gradient-to-br from-teal-200 to-green-200"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}vw`,
        top: '-5vh',
        opacity: Math.random() * 0.6 + 0.2,
        animation: `particle-drift ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ parallaxOffset }) => {
  const parallaxStyle = {
    transform: `translate(${parallaxOffset.x * 6}px, ${parallaxOffset.y * 6}px)`,
    transition: 'transform 0.2s ease-out',
  };

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-all duration-500"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Dark Mode Effects */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
        {/* Central Glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-[var(--glow-color)] rounded-full blur-3xl opacity-50"
        />
        {/* Particles */}
        <div style={parallaxStyle}>
          {[...Array(60)].map((_, i) => <DarkParticle key={i} />)}
        </div>
      </div>
      
      {/* Light Mode Effects */}
      <div className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-500">
         {/* Vignette */}
         <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 100px 20px rgba(0,0,0,0.05)' }} />
         {/* Particles */}
        <div style={parallaxStyle}>
          {[...Array(30)].map((_, i) => <LightParticle key={i} />)}
        </div>
      </div>
    </div>
  );
};