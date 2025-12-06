import React, { useState, useEffect, useRef } from 'react';
import { getTopicExplanationStream, getTextToSpeech } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { renderMarkdown } from '../utils/markdownRenderer';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface LearnScreenProps {
    chapter: string;
    topic: string;
}

const SpeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>;
const AudioLoadingIcon = () => <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>;

// Helper to clean text for TTS (remove formatting like **bold**, ## headers, and [EXAMPLE] tags)
const cleanTextForTTS = (markdown: string): string => {
    return markdown
        // Remove [EXAMPLE]...[/EXAMPLE] blocks completely to read ONLY the explanation part
        .replace(/\[EXAMPLE\][\s\S]*?\[\/EXAMPLE\]/g, "")
        // Remove markdown bold/italic
        .replace(/[*#_]/g, "")
        // Remove markdown links
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        // Remove other special chars if needed
        .trim();
};

export const LearnScreen: React.FC<LearnScreenProps> = ({ chapter, topic }) => {
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [initialExplanation, setInitialExplanation] = useState<string>('');
    const [audioState, setAudioState] = useState<'idle' | 'generating' | 'playing'>('idle');
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const playbackRateRef = useRef(1.0); 

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const explanationRef = useRef<string>('');
    const isPlayingRef = useRef(false);
    
    // Refs to manage chunked TTS playback
    const audioChunksRef = useRef<string[]>([]);
    const currentChunkIndexRef = useRef(0);
    
    // Look-ahead buffer ref
    const nextAudioBufferRef = useRef<AudioBuffer | null>(null);
    const isPreloadingRef = useRef(false);

    // Sync playback rate state to ref and active audio source
    useEffect(() => {
        playbackRateRef.current = playbackRate;
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.playbackRate.value = playbackRate;
            } catch (e) {
                // Ignore errors if source is invalid
            }
        }
    }, [playbackRate]);

    const togglePlaybackSpeed = () => {
        // Updated rates to exclude 2.0x as requested
        const rates = [1.0, 1.25, 1.5];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
    };

    const cleanupAudio = () => {
        isPlayingRef.current = false;
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.onended = null; // Prevent chained playback on manual stop
                audioSourceRef.current.stop();
                audioSourceRef.current.disconnect();
            } catch (e) {
                // Ignore errors if source is already stopped
            } finally {
                audioSourceRef.current = null;
            }
        }
        currentChunkIndexRef.current = 0;
        audioChunksRef.current = [];
        nextAudioBufferRef.current = null;
        setAudioState('idle');
    };
    
    const fetchAndDecodeAudio = async (textChunk: string, ctx: AudioContext): Promise<AudioBuffer | null> => {
        try {
            const base64Audio = await getTextToSpeech(textChunk);
            if (!base64Audio) return null;
            const decodedBytes = decode(base64Audio);
            return await decodeAudioData(decodedBytes, ctx, 24000, 1);
        } catch (e) {
            console.error("Error fetching audio chunk:", e);
            return null;
        }
    };

    // Preloads the next chunk into the buffer ref
    const preloadNextChunk = async (nextIndex: number) => {
        if (nextIndex >= audioChunksRef.current.length || isPreloadingRef.current) return;
        
        isPreloadingRef.current = true;
        try {
             if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
             
             const nextChunk = audioChunksRef.current[nextIndex];
             const buffer = await fetchAndDecodeAudio(nextChunk, audioContextRef.current);
             if (buffer) {
                 nextAudioBufferRef.current = buffer;
             }
        } finally {
            isPreloadingRef.current = false;
        }
    };

    const playNextAudioChunk = async () => {
        if (!isPlayingRef.current || currentChunkIndexRef.current >= audioChunksRef.current.length) {
            cleanupAudio(); // All chunks have been played or stopped
            return;
        }

        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                 audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioContext = audioContextRef.current;
            const currentIndex = currentChunkIndexRef.current;

            // Show generating spinner only for the very first chunk if we are waiting
            if (currentIndex === 0 && !nextAudioBufferRef.current) {
                setAudioState('generating');
            }
            
            let bufferToPlay: AudioBuffer | null = null;

            // Strategy: Use preloaded buffer if available, otherwise fetch immediately
            if (nextAudioBufferRef.current) {
                bufferToPlay = nextAudioBufferRef.current;
                nextAudioBufferRef.current = null; // Consume the buffer
            } else {
                 const chunk = audioChunksRef.current[currentIndex];
                 bufferToPlay = await fetchAndDecodeAudio(chunk, audioContext);
            }

            // If user clicked stop while we were fetching/waiting
            if (!isPlayingRef.current) return;

            if (!bufferToPlay) {
                console.warn("Skipping a text chunk that produced no audio.");
                currentChunkIndexRef.current++;
                playNextAudioChunk();
                return;
            }

            // Start preloading the NEXT chunk immediately while current is setting up
            preloadNextChunk(currentIndex + 1);

            const source = audioContext.createBufferSource();
            source.buffer = bufferToPlay;
            source.playbackRate.value = playbackRateRef.current; 
            source.connect(audioContext.destination);
            
            source.onended = () => {
                currentChunkIndexRef.current++;
                playNextAudioChunk();
            };
            
            source.start();
            audioSourceRef.current = source;
            setAudioState('playing');

        } catch (error) {
            console.error("Failed to play audio chunk:", error);
            alert("An error occurred during audio playback. Please try again.");
            cleanupAudio();
        }
    };

    const handleAudioToggle = async () => {
        if (isPlayingRef.current) {
            cleanupAudio();
            return;
        }

        if (isStreaming || !explanationRef.current) {
            return;
        }

        // Clean the text before splitting
        const cleanText = cleanTextForTTS(explanationRef.current);

        // Split the full text into smaller, more manageable chunks (e.g., sentences and clauses)
        // to ensure a fast initial response for Text-to-Speech.
        const paragraphs = cleanText.split(/\n\s*\n/);
        const chunks = paragraphs.flatMap(p => 
            // Enhanced splitting: Split by sentence terminators (.?!) OR commas/semicolons followed by space for even faster first chunk
            // Added comma to delimiters to improve latency
            p.replace(/([.?!;:,])\s+/g, "$1|")
             .split("|")
        )
        .map(chunk => chunk.trim())
        .filter(chunk => chunk.length > 0);

        if (chunks.length === 0) {
            alert("There is no text to read aloud.");
            return;
        }
        
        isPlayingRef.current = true;
        audioChunksRef.current = chunks;
        currentChunkIndexRef.current = 0;
        nextAudioBufferRef.current = null; // Reset buffer
        
        // Optimization: Start fetching the second chunk immediately in parallel with the first to reduce gap risk
        if (chunks.length > 1) {
             preloadNextChunk(1);
        }

        playNextAudioChunk(); // Start the playback chain (fetches chunk 0)
    };
    
    // Effect for fetching explanation
    useEffect(() => {
        const fetchContent = async () => {
            setIsLoadingInitial(true);
            setIsStreaming(true);
            setInitialExplanation('');
            explanationRef.current = '';

            const stream = getTopicExplanationStream(chapter, topic);
            let firstChunk = true;
            for await (const chunk of stream) {
                if (firstChunk) {
                    setIsLoadingInitial(false);
                    firstChunk = false;
                }
                explanationRef.current += chunk;
                setInitialExplanation(prev => prev + chunk);
            }
            setIsStreaming(false);

            if (firstChunk) {
                setIsLoadingInitial(false);
            }
        };
        fetchContent();

        // Cleanup on component unmount or dependency change
        return () => {
            cleanupAudio();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(e => console.error("Error closing AudioContext", e));
                audioContextRef.current = null;
            }
        };
    }, [chapter, topic]);
    
    return (
        <div className="min-h-screen">
            <div className="p-4 md:p-6 pb-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                        <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--accent-primary)]">{topic}</h1>
                    </div>
                    {isLoadingInitial ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh]">
                            <LoadingSpinner />
                            <p className="text-lg text-[color:var(--text-secondary)] mt-4 text-center">Preparing your lesson on {topic}...</p>
                        </div>
                    ) : (
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-[color:var(--text-secondary)]">Explanation</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={togglePlaybackSpeed}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all uppercase tracking-wide min-w-[3rem]"
                                        aria-label="Change playback speed"
                                    >
                                        {playbackRate}x
                                    </button>
                                    <button
                                        onClick={handleAudioToggle}
                                        disabled={isStreaming}
                                        className="p-2 rounded-full text-[color:var(--text-primary)] hover:bg-[var(--icon-hover-bg)] hover:text-[color:var(--icon-hover-text)] transition-all duration-300 disabled:opacity-50"
                                        aria-label={audioState === 'playing' || audioState === 'generating' ? "Stop reading" : "Read explanation aloud"}
                                    >
                                        {/* FIX: Corrected icon display logic to handle all audio states ('idle', 'generating', 'playing') distinctly. This resolves the unreachable code error and ensures the loading icon is displayed during audio generation. */}
                                        {audioState === 'generating' ? <AudioLoadingIcon /> : audioState === 'playing' ? <StopIcon /> : <SpeakerIcon />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg border border-[var(--card-border)]">
                                <div className="prose prose-lg max-w-none text-[color:var(--text-primary)]" dangerouslySetInnerHTML={renderMarkdown(initialExplanation)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};