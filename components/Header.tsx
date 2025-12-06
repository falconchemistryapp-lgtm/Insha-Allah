import React from 'react';
import type { Theme } from '../App';
import { AnimatedLogo } from './AnimatedLogo';

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const FeedbackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;

interface HeaderProps {
  onNavigate: (screen: 'home' | 'profile') => void;
  theme: Theme;
  toggleTheme: () => void;
  onOpenFeedback: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, theme, toggleTheme, onOpenFeedback }) => {
  const iconButtonClass = "p-2 rounded-full text-[color:var(--text-secondary)] hover:bg-[var(--icon-hover-bg)] hover:text-[color:var(--icon-hover-text)] transition-all duration-300 hover:shadow-[var(--icon-hover-shadow)]";

  return (
    <header className="p-4 flex-shrink-0 z-20">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <AnimatedLogo size={48} />
          <div>
             <h1 className="text-xl font-bold">
                <span className="text-transparent bg-clip-text" style={{backgroundImage: 'var(--logo-text-gradient)'}}>
                    PhysIQ
                </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button
            onClick={() => onNavigate('home')}
            className={iconButtonClass}
            aria-label="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </button>
          <button
            onClick={onOpenFeedback}
            className={iconButtonClass}
            aria-label="Give Feedback"
          >
            <FeedbackIcon />
          </button>
          <button
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </header>
  );
};
