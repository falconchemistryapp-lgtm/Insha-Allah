import React, { useState } from 'react';
import { getTestPaperStream } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { renderMarkdown } from '../utils/markdownRenderer';

interface TestCornerScreenProps {
    chapter: string;
    topic: string;
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.001.004 4.971 4.971z" /></svg>
);

type ExamType = 'Boards' | 'Competitive';
type PaperType = 'Sample Paper' | 'Previous Year Paper' | 'Important Questions';

const TestCornerScreen: React.FC<TestCornerScreenProps> = ({ chapter, topic }) => {
    const [view, setView] = useState<'hub' | 'loading' | 'paper'>('hub');
    const [paperContent, setPaperContent] = useState('');
    const [paperTitle, setPaperTitle] = useState('');

    const handleGeneratePaper = async (examType: ExamType, paperType: PaperType) => {
        setView('loading');
        setPaperTitle(`${examType} - ${paperType}`);
        setPaperContent('');
        
        try {
            const stream = getTestPaperStream(chapter, topic, examType, paperType);
            setView('paper'); // Switch immediately to show streaming content
            
            for await (const chunk of stream) {
                setPaperContent(prev => prev + chunk);
            }
        } catch (e) {
            console.error("Error generating paper", e);
            setPaperContent("An error occurred while generating the paper. Please try again.");
        }
    };

    const handleShare = () => {
        if (paperContent) {
            const textToShare = `*${paperTitle}: ${topic}*\n\n${paperContent}`;
            const encodedText = encodeURIComponent(textToShare);
            window.open(`https://wa.me/?text=${encodedText}`);
        }
    };

    if (view === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LoadingSpinner />
                <p className="text-lg text-[color:var(--text-secondary)] mt-4">Preparing your <strong className="font-bold text-[color:var(--accent-primary)] dark:text-green-400">{paperTitle}</strong>...<br/>This may take a moment.</p>
            </div>
        );
    }

    if (view === 'paper') {
        return (
            <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => setView('hub')} className="flex items-center gap-2 text-[color:var(--accent-primary)] dark:text-green-400 hover:text-opacity-80 font-medium mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
                        Back to Test Corner
                    </button>
                    <div className="text-center mb-6">
                        <p className="text-sm text-[color:var(--text-secondary)]">{chapter} - {topic}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)]">{paperTitle}</h1>
                    </div>
                    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)]">
                         <div className="flex justify-end p-4 border-b border-[var(--card-border)]">
                                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)] rounded-lg hover:bg-[var(--button-secondary-hover-bg)] transition-colors">
                                    <WhatsAppIcon /> Share
                                </button>
                            </div>
                         <div id="paper-content" className="p-6 prose prose-sm max-w-none">
                             {paperContent ? (
                                <div dangerouslySetInnerHTML={renderMarkdown(paperContent)} />
                             ) : (
                                <div className="flex justify-center p-8">
                                    <LoadingSpinner />
                                </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>
        );
    }
    
    const ExamSection: React.FC<{ title: string; examType: ExamType; onSelect: (examType: ExamType, paperType: PaperType) => void; }> = ({ title, examType, onSelect }) => (
      <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg border border-[var(--card-border)]">
        <h3 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{title}</h3>
        <div className="space-y-3">
            <button 
                onClick={() => onSelect(examType, 'Sample Paper')} 
                className="w-full text-left p-4 rounded-xl bg-white/80 dark:bg-slate-800 bg-white dark:bg-slate-800 border border-teal-100 dark:border-slate-700 text-teal-900 dark:text-teal-100 font-medium shadow-sm hover:shadow-[var(--icon-hover-shadow)] transition-all"
            >
                Generate Sample Paper
            </button>
            <button 
                onClick={() => onSelect(examType, 'Previous Year Paper')} 
                className="w-full text-left p-4 rounded-xl bg-white/80 dark:bg-slate-800 bg-white dark:bg-slate-800 border border-teal-100 dark:border-slate-700 text-teal-900 dark:text-teal-100 font-medium shadow-sm hover:shadow-[var(--icon-hover-shadow)] transition-all"
            >
                Simulate Last Year's Paper
            </button>
            <button 
                onClick={() => onSelect(examType, 'Important Questions')} 
                className="w-full text-left p-4 rounded-xl bg-white/80 dark:bg-slate-800 bg-white dark:bg-slate-800 border border-teal-100 dark:border-slate-700 text-teal-900 dark:text-teal-100 font-medium shadow-sm hover:shadow-[var(--icon-hover-shadow)] transition-all"
            >
                Get Important Questions
            </button>
        </div>
      </div>
    );


    // Hub View
    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-[color:var(--text-primary)]">Test Corner</h1>
                <p className="text-lg text-[color:var(--text-secondary)] mt-2">Prepare for your exams with tailored practice papers.</p>
            </div>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
               <ExamSection title="Karnataka Board Prep" examType="Boards" onSelect={handleGeneratePaper} />
               <ExamSection title="Competitive Corner" examType="Competitive" onSelect={handleGeneratePaper} />
            </div>
        </div>
    );
};

export default TestCornerScreen;