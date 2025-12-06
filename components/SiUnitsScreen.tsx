import React, { useState, useEffect } from 'react';
import { getSiUnitsForChapter } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { renderMarkdown } from '../utils/markdownRenderer';
import type { SiUnit } from '../types';

interface SiUnitsScreenProps {
    chapter: string;
    topic: string;
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.001.004 4.971 4.971z" /></svg>
);


const SiUnitsScreen: React.FC<SiUnitsScreenProps> = ({ chapter, topic }) => {
    const [unitsMarkdown, setUnitsMarkdown] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAndFormatUnits = async () => {
            setIsLoading(true);
            setUnitsMarkdown('');
            const chapterUnitsMap = await getSiUnitsForChapter(chapter);
            const topicUnits = chapterUnitsMap.get(topic);

            if (topicUnits && topicUnits.length > 0) {
                let markdownTable = "| Quantity | SI Unit | Symbol |\n";
                markdownTable += "|:---|:---|:---|\n";
                topicUnits.forEach((item: SiUnit) => {
                    // Use an em dash for clarity when a symbol is not applicable.
                    const symbolDisplay = item.symbol ? item.symbol : '—';
                    markdownTable += `| ${item.quantity} | ${item.unit} | ${symbolDisplay} |\n`;
                });
                setUnitsMarkdown(markdownTable);
            } else {
                setUnitsMarkdown("Could not find SI units for this specific topic. The AI tutor might be having trouble, or there may be no specific units to list.");
            }
            setIsLoading(false);
        };
        fetchAndFormatUnits();
    }, [chapter, topic]);

    const handleShare = () => {
       if (unitsMarkdown) {
            const textToShare = `*SI Units: ${topic}*\n\n${unitsMarkdown}`;
            const encodedText = encodeURIComponent(textToShare);
            window.open(`https://wa.me/?text=${encodedText}`);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)]">SI Units: {topic}</h1>
                </div>
                <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6">
                            <LoadingSpinner />
                            <p className="text-lg text-[color:var(--text-secondary)] mt-4 text-center">Organizing all SI units for the chapter<br/><strong className="font-bold text-[color:var(--accent-primary)]">{chapter}</strong>...</p>
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
                                id="si-units-content"
                                className="p-6 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={renderMarkdown(unitsMarkdown)}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SiUnitsScreen;