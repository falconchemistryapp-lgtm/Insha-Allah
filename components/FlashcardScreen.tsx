import React, { useState, useEffect } from 'react';
import { getFlashcards } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import type { Flashcard } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';

interface FlashcardScreenProps {
    chapter: string;
    topic: string;
}

const FlashcardScreen: React.FC<FlashcardScreenProps> = ({ chapter, topic }) => {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const fetchFlashcards = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getFlashcards(chapter, topic);
                if (result && result.length > 0) {
                    setFlashcards(result);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                } else {
                    setError('Could not generate flashcards for this topic. Please try another one.');
                }
            } catch (err) {
                setError('An error occurred while communicating with the AI tutor.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFlashcards();
    }, [chapter, topic]);

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setIsFlipped(false);
            // Allow flip animation to reset before changing card
            setTimeout(() => {
                 setCurrentIndex(prev => prev + 1);
            }, 150);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
             setIsFlipped(false);
             setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
            }, 150);
        }
    };
    
    const card = flashcards[currentIndex];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LoadingSpinner />
                <p className="text-lg text-[color:var(--text-secondary)] mt-4">Distilling key concepts into flashcards for<br /><strong className="font-bold text-[color:var(--accent-primary)]">{topic}</strong>...</p>
            </div>
        );
    }
    
     if (error) {
        return (
            <div className="flex items-center justify-center h-full text-center p-4">
                <div className="bg-[var(--card-bg)] p-8 rounded-xl shadow-lg border border-[var(--card-border)] text-red-500 dark:text-red-400">
                    <p className="font-semibold text-lg">Oops! Something went wrong.</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full animate-fadeIn">
            <div className="text-center mb-6 w-full max-w-2xl">
                <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">Flash Cards: {topic}</h1>
            </div>

            {/* Card Perspective Container */}
            <div className="w-full max-w-2xl h-[40vh] md:h-[50vh]" style={{ perspective: '1200px' }}>
                {card && (
                    <div 
                        className="relative w-full h-full cursor-pointer transition-transform duration-500"
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                        aria-live="polite"
                    >
                        {/* Front of Card */}
                        <div className="absolute w-full h-full p-6 flex items-center justify-center text-center glassmorphism rounded-2xl" style={{ backfaceVisibility: 'hidden' }}>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-[color:var(--text-primary)]">{card.term}</h2>
                                <p className="text-sm text-[color:var(--text-secondary)] mt-4">(Click to reveal definition)</p>
                            </div>
                        </div>
                        {/* Back of Card */}
                         <div className="absolute w-full h-full p-6 flex items-center justify-center glassmorphism rounded-2xl overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={renderMarkdown(card.definition)} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Navigation and Progress */}
            <div className="flex items-center justify-between w-full max-w-2xl mt-6">
                <button 
                    onClick={handlePrev} 
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg font-semibold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[color:var(--text-primary)]"
                    aria-label="Previous card"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
                    Prev
                </button>
                <p className="font-medium text-[color:var(--text-secondary)]">{currentIndex + 1} / {flashcards.length}</p>
                <button 
                    onClick={handleNext} 
                    disabled={currentIndex === flashcards.length - 1}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg font-semibold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[color:var(--text-primary)]"
                    aria-label="Next card"
                >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
                </button>
            </div>
        </div>
    );
};

export default FlashcardScreen;
