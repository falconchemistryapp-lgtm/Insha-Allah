import React, { useState, useEffect } from 'react';

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mrbrgvwr';

interface FeedbackProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Feedback: React.FC<FeedbackProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setIsSubmitted(false);
            setName('');
            setFeedbackText('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const feedback = feedbackText.trim();
        const userName = name.trim();
        if (!feedback || !userName) return;
        
        setIsSubmitting(true);

        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    name: userName,
                    feedback: feedback,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                setIsSubmitted(true);
                setTimeout(() => {
                    onClose();
                }, 2500); // Auto-close after showing success message
            } else {
                alert('There was an error submitting your feedback. Please try again later.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Could not send feedback. Please check your network connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
        >
            <div
                className="relative glassmorphism p-8 rounded-2xl w-full max-w-lg m-4 animate-pop-in"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 rounded-full text-[color:var(--text-secondary)] hover:bg-[var(--icon-hover-bg)] transition-colors"
                    aria-label="Close feedback form"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {isSubmitted ? (
                    <div className="text-center p-8">
                        <div className="flex justify-center text-[color:var(--accent-primary)] mb-4">
                            <CheckIcon />
                        </div>
                        <h2 id="feedback-title" className="text-2xl font-bold text-[color:var(--text-primary)]">Thank You!</h2>
                        <p className="text-[color:var(--text-secondary)] mt-2">Your feedback has been received.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <h2 id="feedback-title" className="text-2xl font-bold text-[color:var(--text-primary)] mb-2">Share Your Feedback</h2>
                            <p className="text-[color:var(--text-secondary)]">Encountered an issue or have a suggestion? We'd love to hear from you.</p>
                        </div>
                        <div>
                            <label htmlFor="feedback-name" className="block text-sm font-medium text-[color:var(--text-primary)] mb-1">Your Name</label>
                            <input
                                type="text"
                                id="feedback-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[color:var(--text-primary)] transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="feedback-text" className="block text-sm font-medium text-[color:var(--text-primary)] mb-1">Feedback</label>
                            <textarea
                                id="feedback-text"
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Describe the issue or your idea..."
                                className="w-full h-32 p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[color:var(--text-primary)] resize-y transition-colors"
                                aria-label="Feedback input"
                                required
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 bg-transparent border border-[var(--button-secondary-border)] text-[color:var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--button-secondary-hover-bg)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !name.trim() || !feedbackText.trim()}
                                className="px-6 py-2.5 bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center"
                            >
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div>}
                                Submit
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};