import React from 'react';

interface Tool {
  label: string;
  action: string;
  icon: React.ReactNode;
}

const tools: Tool[] = [
  { label: 'Formulas', action: 'generate a concise formula sheet', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
  { label: 'SI Units', action: 'list all relevant SI units and their symbols', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C20.2 10.7 20 10.3 20 10V8c0-1.1-.9-2-2-2h-2"></path><path d="M5 17H3c-.6 0-1-.4 1-1v-3c0-.9.7-1.7 1.5-1.9C3.8 10.7 4 10.3 4 10V8c0-1.1.9-2 2-2h2"></path><path d="M12 6V4h3"></path><path d="M12 12V10h3"></path><path d="M12 18V16h3"></path></svg> },
  { label: 'Dimensions', action: 'provide the dimensional formulas for key quantities', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> },
  { label: 'Quiz', action: 'create a short multiple-choice quiz with 3 questions and provide the answers at the end', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"></path><path d="M12 11.15c.81 0 1.5-.6 1.5-1.65A2.85 2.85 0 0 0 12 7a2.85 2.85 0 0 0-1.5 2.5c0 1.05.69 1.65 1.5 1.65z"></path></svg> },
  { label: 'Numericals', action: 'provide 2 numerical problems based on real-life examples with step-by-step solutions', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg> }
];

interface ToolbarProps {
  onAction: (action: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAction }) => {
  return (
    <div className="px-4 pb-3">
        <div className="grid grid-cols-5 gap-2 max-w-4xl mx-auto">
            {tools.map((tool) => (
                <button
                    key={tool.label}
                    onClick={() => onAction(tool.action)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-teal-900/90 dark:bg-slate-800/80 hover:bg-teal-900 dark:hover:bg-slate-700 text-slate-100 dark:text-slate-300 hover:text-white dark:hover:text-white transition-colors group"
                    aria-label={tool.label}
                >
                    <div className="mb-1 text-orange-400 dark:text-lime-300 group-hover:text-orange-300 dark:group-hover:text-lime-200">{tool.icon}</div>
                    <span className="text-xs text-center font-medium">{tool.label}</span>
                </button>
            ))}
        </div>
    </div>
  );
};