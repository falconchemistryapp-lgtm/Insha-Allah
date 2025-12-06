import React from 'react';
import type { Screen, TopicContext } from '../App';

interface Tool {
  label: string;
  screen: Screen;
  description: string;
  icon: React.ReactNode;
}

const LearnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const VisualizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const QuizIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>;
const FlashcardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M12 3v4"></path><path d="M8 3v4"></path><path d="M16 3v4"></path></svg>;
const TestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
const FormulaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.2 3.2-3.2"/><path d="M7 15h4"/></svg>;
const SiUnitsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L3 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0l12.3 12.3Z"/><path d="m18 22 4-4"/><path d="m6 6 4 4"/><path d="m15 11 4 4"/><path d="m12 14 4 4"/></svg>;
const NumericalsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>;

const tools: Tool[] = [
  { label: 'Learn', screen: 'learn', description: 'Explore concepts.', icon: <LearnIcon /> },
  { label: 'Flash Cards', screen: 'flashcards', description: 'Memorize key terms.', icon: <FlashcardIcon /> },
  { label: 'Visualize', screen: 'visualize', description: 'See concepts as images.', icon: <VisualizeIcon /> },
  { label: 'Numericals', screen: 'numericals', description: 'Solve practice problems.', icon: <NumericalsIcon /> },
  { label: 'Quiz', screen: 'quiz', description: 'Test your knowledge.', icon: <QuizIcon /> },
  { label: 'Tests', screen: 'tests', description: 'Prepare with sample tests.', icon: <TestIcon /> },
  { label: 'Formula Sheet', screen: 'formulas', description: 'Quick access to formulas.', icon: <FormulaIcon /> },
  { label: 'SI Units', screen: 'si_units', description: 'Reference SI units.', icon: <SiUnitsIcon /> },
];

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  context: TopicContext;
  onChangeTopic: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, context, onChangeTopic }) => {

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-10 animate-card-enter">
        <div className="topic-header-card mb-6">
            <p className="text-sm text-[color:var(--text-secondary)]">{context.chapter}</p>
            <h1 className="text-3xl font-bold text-[color:var(--accent-primary)]">{context.topic}</h1>
            <button 
                onClick={onChangeTopic}
                className="mt-2 text-sm font-medium text-[color:var(--accent-primary)] hover:text-opacity-80 underline flex items-center gap-1 mx-auto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Change Topic
            </button>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-heading)]">Choose Your Module</h2>
        <p className="text-lg text-[color:var(--text-subheading)] mt-2">Select an activity to start your learning journey.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {tools.map((tool, index) => (
          <button
            key={tool.label}
            onClick={() => onNavigate(tool.screen)}
            className="group text-left p-5 rounded-2xl transition-all duration-300 transform-gpu
                       hover:-translate-y-1
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-4 focus:ring-offset-transparent
                       animate-card-enter glassmorphism"
            style={{ 
                animationDelay: `${100 + index * 100}ms` 
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--card-border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
            aria-label={`Go to ${tool.label}`}
          >
            <div className="text-[color:var(--accent-primary)] mb-2 transition-transform duration-300 group-hover:scale-110">
                {tool.icon}
            </div>
            <h2 className="text-base font-bold text-[color:var(--text-primary)]">{tool.label}</h2>
            <p className="text-xs text-[color:var(--text-secondary)] mt-1">{tool.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
