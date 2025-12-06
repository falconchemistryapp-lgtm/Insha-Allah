import React, { useState, useRef, useEffect } from 'react';
import { getWhiteboardAssistanceStream } from '../services/geminiService';
import { ChatMessageComponent } from './ChatMessage';
import { LoadingSpinner } from './LoadingSpinner';
import type { ChatMessage } from '../types';

interface WhiteboardProps {
    chapter: string;
    topic: string;
}

const whiteboardTemplate = `Given:
- 

To Find:
- 

Formula:
- 

Solution:
- `;

export const Whiteboard: React.FC<WhiteboardProps> = ({ chapter, topic }) => {
    const [problemStatement, setProblemStatement] = useState('');
    const [whiteboardText, setWhiteboardText] = useState(whiteboardTemplate);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTutorResponding, setIsTutorResponding] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleTutorRequest = async (userQuery: string, isQuickAction: boolean = false) => {
        if (!problemStatement.trim()) {
            alert("Please enter the problem statement first.");
            return;
        }
        
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userQuery };
        setMessages(prev => [...prev, userMessage]);
        setIsTutorResponding(true);
        
        // Create a placeholder for the AI message
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

        try {
            const stream = getWhiteboardAssistanceStream(problemStatement, whiteboardText, userQuery, chapter, topic);
            let accumulatedText = '';

            for await (const chunk of stream) {
                accumulatedText += chunk;
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
                ));
            }
        } catch (error) {
            console.error("Stream error", error);
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId ? { ...msg, text: "I encountered an error. Please try again." } : msg
            ));
        } finally {
            setIsTutorResponding(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full p-4 md:p-6">
            {/* Left Panel: Whiteboard */}
            <div className="flex-grow lg:w-3/5 flex flex-col">
                 <div className="mb-4">
                    <label htmlFor="problem-statement" className="block text-lg font-semibold text-[color:var(--text-primary)] mb-2">Problem Statement</label>
                    <textarea
                        id="problem-statement"
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        placeholder="Type or paste the full numerical problem here..."
                        className="w-full p-3 bg-[var(--card-bg)] text-[color:var(--text-primary)] rounded-lg border-2 border-[var(--accent-secondary)] placeholder-slate-500/70 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] transition-shadow"
                        rows={3}
                    />
                </div>
                <label htmlFor="whiteboard-area" className="block text-lg font-semibold text-[color:var(--text-primary)] mb-2">Your Workspace</label>
                <textarea
                    id="whiteboard-area"
                    value={whiteboardText}
                    onChange={(e) => setWhiteboardText(e.target.value)}
                    className="w-full flex-grow p-4 bg-[var(--card-bg)] text-[color:var(--text-primary)] rounded-lg border border-[var(--card-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] font-mono text-sm"
                    aria-label="Problem solving workspace"
                />
            </div>

            {/* Right Panel: AI Tutor */}
            <div className="flex-shrink-0 lg:w-2/5 bg-stone-50/50 dark:bg-slate-900/50 rounded-2xl shadow-lg border border-[var(--card-border)] flex flex-col h-[70vh] lg:h-auto">
                <div className="p-4 border-b border-[var(--card-border)] text-center">
                    <h2 className="text-xl font-bold text-[color:var(--text-primary)]">AI Tutor</h2>
                </div>
                <div className="flex-grow overflow-y-auto p-4">
                    {messages.length === 0 && (
                        <div className="text-center text-[color:var(--text-secondary)] h-full flex flex-col justify-center">
                             <p className="mb-4">Start working on the problem. When you need help, use the buttons below!</p>
                             <div className="text-3xl animate-bounce">👇</div>
                        </div>
                    )}
                    {messages.map(msg => <ChatMessageComponent key={msg.id} message={msg} />)}
                    {isTutorResponding && messages.length > 0 && messages[messages.length - 1].text === '' && (
                        <div className="flex justify-start"><LoadingSpinner /></div>
                    )}
                     <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-[var(--card-border)] bg-white/50 dark:bg-black/30 rounded-b-2xl">
                     <div className="grid grid-cols-2 gap-3 mb-3">
                        <button 
                            onClick={() => handleTutorRequest("Give me a hint for the next step.", true)}
                            disabled={isTutorResponding}
                            className="w-full p-2.5 flex items-center justify-center gap-2 bg-teal-900 dark:bg-slate-700 text-white rounded-lg hover:bg-teal-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13a6 6 0 0 1-6 6 6 6 0 0 1-6-6 6 6 0 0 1 6-6V2l4 4-4 4V7a4 4 0 0 0-4 4 4 4 0 0 0 4 4"/><line x1="12" y1="13" x2="12" y2="13.01"/></svg>
                           Get a Hint
                        </button>
                        <button 
                            onClick={() => handleTutorRequest("Please check my work so far.", true)}
                            disabled={isTutorResponding}
                            className="w-full p-2.5 flex items-center justify-center gap-2 bg-teal-900 dark:bg-slate-700 text-white rounded-lg hover:bg-teal-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                            Check My Work
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};