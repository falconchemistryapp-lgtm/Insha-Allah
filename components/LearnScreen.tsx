import React, { useState, useEffect, useRef } from 'react';
import { getTopicExplanationStream } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { renderMarkdown } from '../utils/markdownRenderer';

interface LearnScreenProps {
    chapter: string;
    topic: string;
}

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    </svg>
);

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
};

export const LearnScreen: React.FC<LearnScreenProps> = ({ chapter, topic }) => {
    const [explanation, setExplanation] = useState('');
    const [isStreaming, setIsStreaming] = useState(true);
    const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
    const [streamError, setStreamError] = useState<string | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


    // Cleanup speech on component unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        // Cancel any speech from previous topic when a new one is selected
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        setSpeechStatus('idle');
        utteranceRef.current = null;

        const fetchExplanation = async () => {
            setExplanation('');
            setIsStreaming(true);
            setStreamError(null);
            
            try {
                const stream = getTopicExplanationStream(chapter, topic);
                for await (const chunk of stream) {
                    setExplanation(prev => prev + chunk);
                }
            } catch (error) {
                console.error("Error fetching explanation:", error);
                setStreamError("Failed to load explanation. Please try again.");
            } finally {
                setIsStreaming(false);
            }
        };

        fetchExplanation();
    }, [chapter, topic]);

    const handlePlay = async () => {
        if (!explanation || window.speechSynthesis.speaking) return;

        const cleanText = explanation
            .replace(/\*\*/g, '') // Remove bold asterisks
            .replace(/#/g, '')    // Remove heading hashes
            .replace(/\[EXAMPLE\]/g, 'For example: ') // Replace example tag with text
            .replace(/\[\/EXAMPLE\]/g, '') // Remove closing tag
            .replace(/\[.*?\]/g, '') // Remove references
            .replace(/`/g, '');   // Remove code ticks
            
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utteranceRef.current = utterance;
        
        const voices = await loadVoices();
        const preferredMale =
            voices.find(v => v.name.includes("Google UK English Male")) ||
            voices.find(v => v.name.includes("Google US English Male")) ||
            voices.find(v => v.lang === "en-GB" && (v as any).gender === "male") ||
            voices.find(v => v.lang === "en-US" && (v as any).gender === "male") ||
            voices.find(v => v.name.includes("Male") && v.lang.startsWith("en")) ||
            voices.find(v => v.lang.startsWith("en"));

        if (preferredMale) {
            utterance.voice = preferredMale;
        }

        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;

        utterance.onstart = () => setSpeechStatus('playing');
        utterance.onpause = () => setSpeechStatus('paused');
        utterance.onresume = () => setSpeechStatus('playing');
        utterance.onend = () => setSpeechStatus('idle');
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e.error);
            setSpeechStatus('idle');
        };

        window.speechSynthesis.speak(utterance);
    };
    
    const handlePause = () => {
        window.speechSynthesis.pause();
    };

    const handleResume = () => {
        window.speechSynthesis.resume();
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)]">{topic}</h1>
                </div>

                <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] min-h-[50vh] relative flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-[var(--card-border)] bg-black/20 rounded-t-xl">
                        <div className="text-sm text-[color:var(--text-secondary)] font-medium">
                            {isStreaming ? 'AI Tutor is explaining...' : 'Explanation'}
                        </div>
                        <div className="flex items-center gap-2">
                             {speechStatus === 'idle' && (
                                <button
                                    onClick={handlePlay}
                                    disabled={!explanation || isStreaming}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PlayIcon /> Read Aloud
                                </button>
                            )}
                            {speechStatus === 'playing' && (
                                <>
                                    <button onClick={handlePause} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30">
                                        <PauseIcon /> Pause
                                    </button>
                                    <button onClick={handleStop} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30">
                                        <StopIcon /> Stop
                                    </button>
                                </>
                            )}
                            {speechStatus === 'paused' && (
                                <>
                                    <button onClick={handleResume} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm bg-emerald-50/20 text-green-400 border border-green-500/50 hover:bg-emerald-100/30">
                                        <PlayIcon /> Resume
                                    </button>
                                    <button onClick={handleStop} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30">
                                        <StopIcon /> Stop
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-6 md:p-8 flex-grow">
                        {streamError ? (
                            <div className="text-red-400 text-center p-4">{streamError}</div>
                        ) : (
                            <>
                                <div className="prose prose-lg max-w-none prose-headings:text-[color:var(--text-heading)] prose-p:text-[color:var(--text-primary)] prose-strong:text-[color:var(--accent-primary)] prose-li:text-[color:var(--text-primary)]" 
                                    dangerouslySetInnerHTML={renderMarkdown(explanation)} 
                                />
                                {isStreaming && (
                                    <div className="mt-4 flex justify-center">
                                        <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce mx-1"></div>
                                        <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce mx-1 delay-100"></div>
                                        <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce mx-1 delay-200"></div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
