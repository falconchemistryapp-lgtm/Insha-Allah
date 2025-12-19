import React, { useState, useEffect } from "react";
import { getVisualizationPrompt } from "../services/geminiService";
import { LoadingSpinner } from "./LoadingSpinner";

interface VisualizationScreenProps {
  chapter: string;
  topic: string;
}

export const VisualizationScreen: React.FC<VisualizationScreenProps> = ({
  chapter,
  topic,
}) => {
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGeminiFallback, setShowGeminiFallback] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getVisualizationPrompt(chapter, topic);
        if (result) {
          setEditedPrompt(result);
        } else {
          setError("Could not generate a prompt. Please try again.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while communicating with the AI tutor.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompt();
  }, [chapter, topic]);
  
  const legacyCopy = (text: string) => {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    } catch (err) {
        console.error('Fallback copy method failed:', err);
    }
  };

  const copyPromptToClipboard = (promptText: string) => {
      if (navigator.clipboard) {
          navigator.clipboard.writeText(promptText).catch(err => {
              console.error('Could not copy text using navigator.clipboard: ', err);
              legacyCopy(promptText);
          });
      } else {
          legacyCopy(promptText);
      }
  };

  const handleCopyAndGiveFeedback = () => {
    if (!editedPrompt) return;
    copyPromptToClipboard(editedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const geminiUrl = 'https://gemini.google.com/app';
  const metaUrl = `https://wa.me/13135550002?text=${encodeURIComponent(`/imagine ${editedPrompt}`)}`;

  const handleOpenGemini = () => {
    setShowGeminiFallback(false);
    const newWindow = window.open(geminiUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        setShowGeminiFallback(true);
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
      {showGeminiFallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="relative glassmorphism p-8 rounded-2xl w-full max-w-md m-4 text-center animate-pop-in"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Failed to Open Gemini</h2>
            <p className="text-[color:var(--text-secondary)] mb-6">
              Your browser may have blocked the pop-up tab for Gemini.
              Kindly paste the prompt manually in your Gemini app.
            </p>
            <button
              onClick={() => setShowGeminiFallback(false)}
              className="px-8 py-2 bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] font-bold rounded-lg hover:bg-opacity-90"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-sm text-[color:var(--text-secondary)]">
            {chapter}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)]">
            Concept Visualization Prompt
          </h1>
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
              <p className="text-sm text-[color:var(--text-secondary)]">
                Edit the prompt below, then use the buttons to copy it and open an AI image generator.
              </p>

              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={8}
                className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[color:var(--text-primary)] resize-y transition-colors"
                aria-label="Concept visualization prompt"
              />

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleCopyAndGiveFeedback}
                  className={`w-full text-center font-bold py-3 px-4 rounded-lg shadow-md transition-all ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] hover:bg-opacity-90"
                  }`}
                >
                  {copied ? "✓ Prompt Copied!" : "1. Copy Prompt"}
                </button>
                
                <p className="text-xs text-center text-[color:var(--text-secondary)]">
                    Then, open an AI generator below and paste the prompt.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={handleOpenGemini}
                      role="button"
                      className="block text-center w-full font-semibold py-3 px-4 rounded-lg bg-cyan-400 text-slate-900 hover:bg-cyan-500 transition-colors shadow-sm"
                    >
                      2. Open Gemini
                    </button>

                    <a
                      href={metaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="button"
                      className="block text-center w-full font-semibold py-3 px-4 rounded-lg bg-green-800 text-white hover:bg-green-900 transition-colors shadow-sm"
                    >
                      Visualize with Meta AI
                    </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
