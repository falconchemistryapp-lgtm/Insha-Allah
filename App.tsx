import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { OnboardingAnimation } from './components/OnboardingAnimation';
import QuizScreen from './components/QuizScreen';
import { LearnScreen } from './components/LearnScreen';
import { TopicSelectionScreen } from './components/TopicSelectionScreen';
import { NumericalsScreen } from './components/NumericalsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import TestCornerScreen from './components/TestCornerScreen';
import SiUnitsScreen from './components/SiUnitsScreen';
import { VisualizationScreen } from './components/VisualizationScreen';
import FlashcardScreen from './components/FlashcardScreen';
import type { Chapter } from './data/physicsTopics';
import { getFormulaSheet } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { renderMarkdown } from './utils/markdownRenderer';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Feedback } from './components/Feedback';


export type Screen = 'onboarding' | 'home' | 'topic_selection' | 'learn' | 'quiz' | 'tests' | 'formulas' | 'si_units' | 'dimensions' | 'numericals' | 'profile' | 'visualize' | 'flashcards';

export type Theme = 'light' | 'dark';

export interface TopicContext {
  chapter: string;
  topic: string;
}

const PlaceholderScreen: React.FC<{ screenName: string }> = ({ screenName }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center p-8">
      <h2 className="text-3xl font-bold text-[color:var(--text-primary)] mb-4">{screenName}</h2>
      <p className="text-[color:var(--text-secondary)]">This section is under construction. Come back soon!</p>
    </div>
  </div>
);

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.001.004 4.971 4.971z" /></svg>
);

const FormulaSheetScreen: React.FC<{ chapter: string, topic: string }> = ({ chapter, topic }) => {
    const [formulas, setFormulas] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFormulas = async () => {
            setIsLoading(true);
            const result = await getFormulaSheet(chapter, topic);
            setFormulas(result);
            setIsLoading(false);
        };
        fetchFormulas();
    }, [chapter, topic]);

    const handleShare = () => {
        if (formulas) {
            const textToShare = `*Formula Sheet: ${topic}*\n\n${formulas}`;
            const encodedText = encodeURIComponent(textToShare);
            window.open(`https://wa.me/?text=${encodedText}`);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)]">Formula Sheet: {topic}</h1>
                </div>
                <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6">
                            <LoadingSpinner />
                            <p className="text-lg text-[color:var(--text-secondary)] mt-4 text-center">Compiling all the essential formulas for<br/><strong className="font-bold text-[color:var(--accent-primary)]">{topic}</strong>...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-end p-4 border-b border-[var(--card-border)]">
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)] rounded-lg hover:bg-[var(--button-secondary-hover-bg)] transition-colors"
                                    aria-label="Share on WhatsApp"
                                >
                                    <WhatsAppIcon />
                                    Share
                                </button>
                            </div>
                            <div
                                id="formula-sheet-content"
                                className="p-6 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={renderMarkdown(formulas)}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('physIQTheme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [screen, setScreen] = useState<Screen>('onboarding');
  const [selectedContext, setSelectedContext] = useState<TopicContext | null>(null);
  const [selectedYear, setSelectedYear] = useState<'1st Year PUC' | '2nd Year PUC' | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('physIQTheme', theme);
  }, [theme]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const xOffset = (clientX / innerWidth - 0.5) * 2; // -1 to 1
    const yOffset = (clientY / innerHeight - 0.5) * 2; // -1 to 1
    setParallaxOffset({ x: xOffset, y: yOffset });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleStart = () => {
    setScreen('topic_selection');
  };

  const handleNavigate = (newScreen: Screen) => {
    if (newScreen === 'home') {
        if (selectedContext) {
            setScreen('home');
        } else {
            setSelectedYear(null);
            setScreen('topic_selection');
        }
    } else {
        setScreen(newScreen);
    }
  };
  
  const handleTopicSelected = (chapter: Chapter, topicName: string) => {
    setSelectedYear(chapter.year);
    setSelectedContext({ chapter: chapter.name, topic: topicName });
    setScreen('home'); 
  };
  
  const handleChangeTopic = () => {
    setSelectedContext(null);
    setScreen('topic_selection');
  }

  const renderScreen = () => {
    if (screen === 'onboarding') {
      return <OnboardingAnimation onStart={handleStart} />;
    }
    
    if (screen === 'topic_selection' || !selectedContext) {
      if (screen === 'profile') {
        return <ProfileScreen />;
      }
      return <TopicSelectionScreen onTopicSelected={handleTopicSelected} initialYear={selectedYear} />;
    }

    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} context={selectedContext} onChangeTopic={handleChangeTopic} />;
      case 'learn':
        return <LearnScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'quiz':
         return <QuizScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'visualize':
        return <VisualizationScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'flashcards':
        return <FlashcardScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'tests':
        return <TestCornerScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'formulas':
        return <FormulaSheetScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'si_units':
        return <SiUnitsScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'dimensions':
        return <PlaceholderScreen screenName="Dimensions" />;
      case 'numericals':
        return <NumericalsScreen chapter={selectedContext.chapter} topic={selectedContext.topic} />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onNavigate={handleNavigate} context={selectedContext} onChangeTopic={handleChangeTopic} />;
    }
  };

  return (
    <div className="bg-transparent text-[color:var(--text-primary)] font-sans flex flex-col min-h-screen transition-colors duration-300 relative">
      {screen !== 'onboarding' && <AnimatedBackground parallaxOffset={parallaxOffset} />}
      {screen !== 'onboarding' && (
        <Header 
            onNavigate={handleNavigate} 
            theme={theme} 
            toggleTheme={toggleTheme} 
            onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
      )}
      <main className="flex-grow z-10">
        {renderScreen()}
      </main>
      {screen !== 'onboarding' && (
        <Feedback isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      )}
    </div>
  );
};

export default App;
