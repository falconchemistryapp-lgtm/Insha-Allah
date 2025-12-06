import React, { useState, useEffect } from 'react';
import { getQuizQuestions } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import type { QuizQuestion, QuizResult } from '../types';
import { addQuizResult } from '../utils/profileManager';

interface QuizScreenProps {
    chapter: string;
    topic: string;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const percentage = total > 0 ? ((current + 1) / total) * 100 : 0;
    return (
        <div className="w-full bg-teal-200/50 dark:bg-slate-700 rounded-full h-2.5 mb-6 shadow-inner">
            <div className="bg-gradient-to-r from-teal-400 to-cyan-400 dark:from-green-500 dark:to-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const playCorrectSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);

    oscillator.start(audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
    oscillator.stop(audioCtx.currentTime + 0.1);
};


const QuizScreen: React.FC<QuizScreenProps> = ({ chapter, topic }) => {
    const [quizState, setQuizState] = useState<'loading' | 'in-progress' | 'results'>('loading');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        const startQuiz = async () => {
            setQuizState('loading');
            const fetchedQuestions = await getQuizQuestions(chapter, topic);
            if (fetchedQuestions && fetchedQuestions.length > 0) {
                setQuestions(fetchedQuestions);
                setCurrentQuestionIndex(0);
                setScore(0);
                setSelectedOption(null);
                setQuizState('in-progress');
            } else {
                alert("Failed to load quiz questions. Please check your connection or try another topic.");
            }
        };

        startQuiz();
    }, [chapter, topic]);
    
    useEffect(() => {
        if (quizState === 'results' && questions.length > 0) {
            const result: QuizResult = {
                chapter,
                topic,
                score,
                total: questions.length,
                date: new Date().toISOString(),
            };
            addQuizResult(result);
        }
    }, [quizState, chapter, topic, score, questions]);

    const handleAnswerSelect = (option: string) => {
        if (selectedOption) return;

        setSelectedOption(option);
        const isCorrect = option === questions[currentQuestionIndex].correctAnswer;
        if (isCorrect) {
            setScore(prev => prev + 1);
            playCorrectSound();
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
        } else {
            setQuizState('results');
        }
    };

    if (quizState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LoadingSpinner />
                <p className="text-lg text-[color:var(--text-secondary)] mt-4">Assembling a challenging quiz for you on<br /><strong className="font-bold text-[color:var(--accent-primary)] dark:text-green-400">{topic}</strong>...</p>
            </div>
        );
    }

    if (quizState === 'in-progress' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-full animate-fadeIn">
                <div className="w-full max-w-3xl">
                    <div className="text-center mb-4">
                        <p className="text-sm text-[color:var(--text-secondary)]">{chapter}</p>
                        <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{topic}</h2>
                    </div>
                    <ProgressBar current={currentQuestionIndex} total={questions.length} />
                    <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-xl border border-[var(--card-border)]">
                        <p className="text-lg font-semibold text-[color:var(--text-primary)] mb-6 text-center">({currentQuestionIndex + 1}/{questions.length}) {currentQuestion.question}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options.map((option, index) => {
                                let buttonClass = "w-full p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between ";
                                const isCorrect = option === currentQuestion.correctAnswer;
                                const isSelected = option === selectedOption;

                                if (selectedOption) {
                                    if (isCorrect) {
                                        buttonClass += 'bg-green-100 border-green-600 text-green-900 dark:bg-green-500/20 dark:border-green-500 dark:text-green-200 shadow-lg scale-105';
                                    } else if (isSelected) {
                                        buttonClass += 'bg-red-100 border-red-500 text-red-900 dark:bg-pink-500/20 dark:border-pink-500 dark:text-pink-200';
                                    } else {
                                        buttonClass += 'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 opacity-60';
                                    }
                                } else {
                                    buttonClass += 'bg-white dark:bg-slate-900/50 text-[color:var(--text-primary)] hover:bg-teal-100/70 dark:hover:bg-slate-700 border-[var(--card-border)] hover:border-[var(--accent-secondary)]';
                                }
                                return (
                                    <button key={index} onClick={() => handleAnswerSelect(option)} disabled={!!selectedOption} className={buttonClass}>
                                        <span>{option}</span>
                                        {selectedOption && isCorrect && <span className="animate-pop-in">🎉</span>}
                                    </button>
                                );
                            })}
                        </div>
                         {selectedOption && (
                            <div className="mt-6 p-4 bg-orange-100/50 dark:bg-indigo-900/40 border-l-4 border-teal-500 dark:border-green-400 rounded-r-lg">
                                <h3 className="font-bold text-teal-700 dark:text-green-300 mb-1">Explanation</h3>
                                <p className="text-slate-700 dark:text-slate-300">{currentQuestion.explanation}</p>
                            </div>
                        )}
                    </div>
                    {selectedOption && (
                        <div className="text-center mt-6">
                            <button onClick={handleNextQuestion} className="px-8 py-3 bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] font-bold rounded-lg hover:bg-opacity-90 transition-transform hover:scale-105">
                                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (quizState === 'results') {
        const percentage = Math.round((score / questions.length) * 100);
        const isExcellent = percentage > 85;
        let message = "Keep practicing!";
        if (isExcellent) message = "Excellent work!";
        else if (percentage > 60) message = "Great job!";

        return (
            <div className="container mx-auto p-4 md:p-8 flex items-center justify-center h-full animate-fadeIn">
                <div className="text-center bg-[var(--card-bg)] p-8 rounded-2xl shadow-xl border border-[var(--card-border)] w-full max-w-md">
                    <h2 className="text-3xl font-bold text-[color:var(--text-primary)] mb-2">Quiz Complete!</h2>
                    <p className="text-lg text-[color:var(--text-secondary)] mb-6">{message}</p>
                    <div className="mb-6">
                        <p className={`text-5xl font-bold ${isExcellent ? 'text-amber-500' : 'text-[color:var(--accent-primary)]'} dark:text-green-400`}>{score}<span className={`text-3xl ${isExcellent ? 'text-amber-400' : 'text-[color:var(--text-secondary)]'}`}>{`/${questions.length}`}</span></p>
                        <p className={`text-xl ${isExcellent ? 'text-amber-500' : 'text-[color:var(--accent-primary)]'} dark:text-green-400 font-semibold mt-2`}>{percentage}%</p>
                    </div>
                    <p className="text-sm text-[color:var(--text-secondary)]">Navigate Home to try another topic or module.</p>
                </div>
            </div>
        );
    }

    return null;
};

export default QuizScreen;