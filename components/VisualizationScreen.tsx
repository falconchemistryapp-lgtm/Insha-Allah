import React, { useState, useEffect, useCallback } from 'react';
import { getVisualizationPrompt } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface VisualizationScreenProps {
    chapter: string;
    topic: string;
}

export const VisualizationScreen: React.FC<VisualizationScreenProps> = ({ chapter, topic }) => {
    const [editedPrompt, setEditedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedButton, setCopiedButton] = useState<'gemini' | 'meta' | null>(null);

    useEffect(() => {
        const fetchPrompt = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getVisualizationPrompt(chapter, topic);
                if (result) {
                    setEditedPrompt(result);
                } else {
                    setError('Could not generate a prompt. The AI tutor might be busy. Please try again.');
                }
            } catch (err) {
                setError('An error occurred while communicating with the AI tutor.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrompt();
    }, [chapter, topic]);

    const handleCopyAndOpen = useCallback((platform: 'gemini' | 'meta') => {
        if (!editedPrompt) return;

        let timer: number;

        if (platform === 'gemini') {
            navigator.clipboard.writeText(editedPrompt).then(() => {
                setCopiedButton('gemini');
                timer = window.setTimeout(() => setCopiedButton(null), 2500);

                const url = `https://gemini.google.com/app?prompt=${encodeURIComponent(editedPrompt)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }).catch(err => {
                console.error('Failed to copy prompt for Gemini:', err);
                const url = `https://gemini.google.com/app?prompt=${encodeURIComponent(editedPrompt)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            });
        } else { // platform === 'meta'
            setCopiedButton('meta');
            timer = window.setTimeout(() => setCopiedButton(null), 2500);
            
            const metaAiPhoneNumber = '13135550002';
            const promptText = `/imagine ${editedPrompt}`;
            const encodedPrompt = encodeURIComponent(promptText);
            const url = `https://wa.me/${metaAiPhoneNumber}?text=${encodedPrompt}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        return () => window.clearTimeout(timer);
    }, [editedPrompt]);

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)]">Concept Visualization Prompt</h1>
                </div>
                <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <LoadingSpinner />
                            <p className="text-lg text-[color:var(--text-secondary)] mt-4 text-center">Dreaming up a visual way to explain<br/><strong className="font-bold text-[color:var(--accent-primary)]">{topic}</strong>...</p>
                        </div>
                    ) : error ? (
                         <div className="text-center p-8 text-red-500 dark:text-red-400">
                            <p className="font-semibold">Oops! Something went wrong.</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-[color:var(--text-secondary)]">Edit the prompt below and use it with an AI image generator to create a visual representation of the concept.</p>
                            <textarea
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                rows={8}
                                className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[color:var(--text-primary)] resize-y transition-colors"
                                aria-label="Concept visualization prompt"
                            />
                            <div className="flex flex-col gap-3">
                                <div>
                                    <button
                                        onClick={() => handleCopyAndOpen('gemini')}
                                        disabled={copiedButton !== null}
                                        className="w-full text-center font-semibold py-3 px-4 rounded-lg bg-cyan-400 text-slate-900 hover:bg-cyan-500 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {copiedButton === 'gemini' ? 'Copied & Opening...' : 'Generate with Gemini'}
                                    </button>
                                    <p className="text-xs text-[color:var(--text-secondary)] mt-1 text-center">Paste the prompt.</p>
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleCopyAndOpen('meta')}
                                        disabled={copiedButton !== null}
                                        className="w-full text-center font-semibold py-3 px-4 rounded-lg bg-green-800 text-white hover:bg-green-900 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-green-600 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {copiedButton === 'meta' ? 'Opening in WhatsApp...' : 'Visualize with Meta AI'}
                                    </button>
                                    <p className="text-xs text-[color:var(--text-secondary)] mt-1 text-center">Opens Meta AI chat in WhatsApp.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};