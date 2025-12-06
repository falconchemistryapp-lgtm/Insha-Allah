import React, { useState, useEffect } from 'react';
import { Toolbar } from './Toolbar';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onToolbarAction: (action: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onToolbarAction, isLoading }) => {
  const [message, setMessage] = useState('');
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState('Ask questions regarding this topic');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlaceholder('');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-teal-50/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[var(--card-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-none transition-all duration-300">
      {isToolbarOpen && <Toolbar onAction={(action) => {
          onToolbarAction(action);
          setIsToolbarOpen(false);
      }} />}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setIsToolbarOpen(prev => !prev)}
          className="p-2.5 bg-teal-900/90 dark:bg-slate-800 text-orange-400 dark:text-lime-300 rounded-lg hover:bg-teal-900 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500 dark:focus:ring-green-400"
          aria-label="Toggle tools"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isToolbarOpen ? 'rotate-45' : 'rotate-0'}`}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2.5 bg-[var(--card-bg)] text-[color:var(--text-primary)] rounded-lg border border-[var(--card-border)] placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] disabled:opacity-50 transition-all duration-500"
          disabled={isLoading}
          aria-label="Chat input"
        />
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="p-2.5 bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] rounded-lg disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--accent-secondary)]"
          aria-label="Send message"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  );
};