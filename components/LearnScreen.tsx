import React, { useState, useEffect } from 'react';
import { getTopicExplanationStream } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { renderMarkdown } from '../utils/markdownRenderer';

interface LearnScreenProps {
    chapter: string;
    topic: string;
}

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    </svg>
);

// --- TTS LOGIC START ---
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

const speakText = async (text: string, onEnd: () => void, onError: (e: any) => void) => {
    // Stop previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Load and pick the best male voice
    const voices = await loadVoices();

    // PRIORITY MALE VOICES (browser dependent)
    const preferredMale =
        voices.find(v => v.name.includes("Google UK English Male")) ||
        voices.find(v => v.name.includes("Google US English Male")) ||
        voices.find(v => v.lang === "en-GB" && (v as any).gender === "male") ||
        voices.find(v => v.lang === "en-US" && (v as any).gender === "male") ||
        voices.find(v => v.name.includes("Male") && v.lang.startsWith("en")) ||
        voices.find(v => v.lang.startsWith("en")); // fallback

    if (preferredMale) {
        utterance.voice = preferredMale;
    }

    // Make the voice simple + bold + easy to understand
    utterance.rate = 1.0;     // stable speed
    utterance.pitch = 0.9;    // slightly deeper voice
    utterance.volume = 1.0;

    utterance.onend = () => {
        window.speechSynthesis.cancel();
        onEnd();
    };

    utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' are not real errors usually
        if (e.error === 'interrupted' || e.error === 'canceled') {
            onEnd();
            return;
        }
        console.error("Speech synthesis error event:", e);
        console.error("Speech synthesis error message:", e.error); 
        onError(e);
        onEnd();
    };

    window.speechSynthesis.speak(utterance);
};
// --- TTS LOGIC END ---

export const LearnScreen: React.FC<LearnScreenProps> = ({ chapter, topic }) => {
    const [explanation, setExplanation] = useState('');
    const [isStreaming, setIsStreaming] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
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

    const handleSpeakToggle = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            // Strip complex markdown or HTML-like tags for cleaner speech
            const cleanText = explanation
                .replace(/\*\*/g, '') // Remove bold asterisks
                .replace(/#/g, '')    // Remove heading hashes
                .replace(/\[EXAMPLE\]/g, 'For example: ') // Replace example tag with text
                .replace(/\[\/EXAMPLE\]/g, '') // Remove closing tag
                .replace(/\[.*?\]/g, '') // Remove references
                .replace(/`/g, '');   // Remove code ticks
                
            setIsSpeaking(true);
            speakText(
                cleanText, 
                () => setIsSpeaking(false),
                (e) => {
                    // Just log error, don't alert to avoid interrupting flow if it's minor
                    console.warn("TTS Playback issue:", e.error);
                }
            );
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)]">{topic}</h1>
                </div>

                <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] min-h-[50vh] relative flex flex-col">
                    {/* Header/Controls */}
                    <div className="flex justify-between items-center p-4 border-b border-[var(--card-border)] bg-black/20 rounded-t-xl">
                        <div className="text-sm text-[color:var(--text-secondary)] font-medium">
                            {isStreaming ? 'AI Tutor is explaining...' : 'Explanation'}
                        </div>
                        <button 
                            onClick={handleSpeakToggle}
                            disabled={!explanation || isStreaming}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                                isSpeaking 
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                                    : 'bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {isSpeaking ? <><StopIcon /> Stop Reading</> : <><SpeakerIcon /> Read Aloud</>}
                        </button>
                    </div>

                    {/* Content Area */}
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
