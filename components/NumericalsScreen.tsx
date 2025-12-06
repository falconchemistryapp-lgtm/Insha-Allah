import React, { useState, useEffect } from 'react';
import { getNcertTextbookQuestions, getCompetitiveNumericals } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import type { NumericalProblem } from '../types';
import { Whiteboard } from './Whiteboard';
import { renderMarkdown } from '../utils/markdownRenderer';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-3 mt-8">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-[var(--card-border)] rounded-xl shadow-sm overflow-hidden p-4 bg-[var(--card-bg)] animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
        ))}
    </div>
);


const ExampleList: React.FC<{
    title: string;
    fetcher: () => Promise<NumericalProblem[]>;
    loadingMessage: string;
    errorMessage: string;
}> = ({ title, fetcher, loadingMessage, errorMessage }) => {
    const [problems, setProblems] = useState<NumericalProblem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const loadProblems = async () => {
            setIsLoading(true);
            const fetchedProblems = await fetcher();
            if (!isCancelled) {
                setProblems(fetchedProblems);
                setIsLoading(false);
            }
        };
        
        loadProblems();

        return () => {
            isCancelled = true;
        };
    }, [fetcher]);

    if (isLoading) {
        return (
            <>
                <div className="mt-8 flex flex-col items-center justify-center text-center p-4">
                    <LoadingSpinner />
                    <p className="text-lg text-[color:var(--text-secondary)] mt-4">{loadingMessage}</p>
                </div>
                <SkeletonLoader />
            </>
        );
    }
    
    if(problems.length === 0){
        return <p className="text-center text-[color:var(--text-secondary)] mt-8">{errorMessage}</p>
    }

    return (
        <div className="space-y-3">
            {problems.map((p, index) => (
                 <div key={index} className="border border-[var(--card-border)] rounded-xl shadow-sm overflow-hidden">
                     <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full flex justify-between items-center p-4 bg-[var(--card-bg)] hover:bg-teal-100/50 dark:hover:bg-slate-700/60 text-left transition-colors"
                     >
                        <span className="font-semibold text-md text-[color:var(--text-primary)]">{p.problem}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"></path></svg>
                     </button>
                    {openIndex === index && (
                        <div className="p-6 bg-stone-50/50 dark:bg-slate-900/50 border-t border-[var(--card-border)]">
                            <div
                                className="text-sm max-w-none text-[color:var(--text-primary)] space-y-2 prose prose-sm"
                                dangerouslySetInnerHTML={renderMarkdown(p.solution)}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

interface NumericalsScreenProps {
    chapter: string;
    topic: string;
}

export const NumericalsScreen: React.FC<NumericalsScreenProps> = ({ chapter, topic }) => {
    const [mode, setMode] = useState<'hub' | 'ncert-questions' | 'competitive' | 'whiteboard'>('hub');

    const fetchNcertQuestions = React.useCallback(() => getNcertTextbookQuestions(chapter, topic), [chapter, topic]);
    const fetchCompetitiveNumericals = React.useCallback(() => getCompetitiveNumericals(chapter, topic), [chapter, topic]);

    const getTitle = () => {
        switch(mode) {
            case 'ncert-questions': return 'NCERT Textbook Questions';
            case 'competitive': return 'Competitive Corner';
            case 'whiteboard': return 'Interactive Whiteboard';
            default: return 'Numericals Hub';
        }
    };

    const renderContent = () => {
        switch (mode) {
            case 'whiteboard':
                return <Whiteboard chapter={chapter} topic={topic} />;
            case 'ncert-questions':
                return <ExampleList 
                           title="NCERT Textbook Questions" 
                           fetcher={fetchNcertQuestions}
                           loadingMessage="Our AI tutor is sourcing questions from your NCERT textbook. This might take a moment!"
                           errorMessage="Sorry, we couldn't find specific textbook questions for this topic. It might be a conceptual topic with fewer numericals."
                       />;
            case 'competitive':
                 return <ExampleList 
                           title="Competitive Numericals" 
                           fetcher={fetchCompetitiveNumericals}
                           loadingMessage="Building challenging problems to sharpen your skills. The AI is on it!"
                           errorMessage="Sorry, I couldn't generate problems right now. Please check your connection and try again."
                       />;
            case 'hub':
            default:
                const hubOptions = [
                    { mode: 'whiteboard', title: 'Interactive Whiteboard', description: 'Solve problems step-by-step with live hints from an AI tutor.', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg> },
                    { mode: 'ncert-questions', title: 'NCERT Textbook Questions', description: 'Practice with solved problems from your NCERT textbook exercises.', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> },
                    { mode: 'competitive', title: 'Competitive Corner', description: 'Challenge yourself with numericals for exams like JEE & NEET.', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>}
                ];
                return (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        {hubOptions.map(opt => (
                            <button
                                key={opt.mode}
                                onClick={() => setMode(opt.mode as any)}
                                className="group text-left p-6 bg-[var(--card-bg)] backdrop-blur-md rounded-2xl shadow-lg border border-[var(--card-border)] hover:shadow-orange-500/20 dark:hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.03] hover:border-[var(--card-border-hover)] focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-green-400 focus:ring-offset-4 focus:ring-offset-[var(--bg-primary)]"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-[color:var(--accent-primary)] dark:text-green-400 mt-1 transition-transform duration-300 group-hover:scale-110">{opt.icon}</div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{opt.title}</h2>
                                        <p className="text-[color:var(--text-secondary)] mt-1">{opt.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    {mode !== 'hub' && (
                         <button onClick={() => setMode('hub')} className="flex items-center gap-2 text-[color:var(--accent-primary)] dark:text-green-400 hover:text-opacity-80 font-medium mb-4 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
                            Back to Numericals Hub
                        </button>
                    )}
                    <p className="text-sm text-[color:var(--text-secondary)]">{chapter} - {topic}</p>
                    <h1 className={`text-3xl md:text-4xl font-bold text-[color:var(--text-primary)] ${mode === 'hub' ? 'dark:text-green-400' : ''}`}>{getTitle()}</h1>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};