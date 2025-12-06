import React from 'react';
import type { ChatMessage } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';

interface ChatMessageProps {
  message: ChatMessage;
}

const AiIcon = () => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 dark:from-green-400 dark:to-green-600 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
    </div>
);

const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-gray-800 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    </div>
);


export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const bubbleStyles = isUser
    ? 'bg-[var(--accent-primary)] rounded-br-none'
    : 'bg-[var(--card-bg)] text-[color:var(--text-primary)] rounded-bl-none shadow-md border border-[var(--card-border)]';
  
  // For user messages, explicitly set prose colors to be dark to ensure readability on the accent background,
  // regardless of theme. This overrides any potentially inherited `prose-invert` styles.
  // AI messages now use the default prose styling, which is handled globally.
  const proseClasses = isUser 
    ? '[--tw-prose-body:theme(colors.slate.800)] [--tw-prose-headings:theme(colors.slate.900)]' 
    : '';

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <AiIcon />}
      <div 
        className={`p-3 rounded-xl max-w-2xl ${bubbleStyles}`}
      >
        <div className={`prose prose-sm prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 whitespace-pre-wrap ${proseClasses}`} dangerouslySetInnerHTML={renderMarkdown(message.text)} />
      </div>
       {isUser && <UserIcon />}
    </div>
  );
};