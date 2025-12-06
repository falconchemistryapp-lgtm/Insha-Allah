import React, { useState, useEffect } from 'react';
import { getProfile, saveProfile } from '../utils/profileManager';
import { getStudyTips } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import type { UserProfile } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow-md border border-[var(--card-border)] flex items-center gap-4">
        <div className="p-3 bg-teal-100 dark:bg-slate-900 rounded-full text-teal-600 dark:text-green-400">
            {icon}
        </div>
        <div>
            <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
            <p className="text-2xl font-bold text-[color:var(--text-primary)]">{value}</p>
        </div>
    </div>
);

export const ProfileScreen: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [tips, setTips] = useState<string>('');
    const [isLoadingTips, setIsLoadingTips] = useState(false);

    useEffect(() => {
        const userProfile = getProfile();
        if (userProfile) {
            setProfile(userProfile);
            setNameInput(userProfile.name);
        } else {
             // First time user, prompt for name
            setIsEditingName(true);
        }
    }, []);
    
    const handleSaveName = () => {
        if (nameInput.trim()) {
            const newProfile: UserProfile = profile || { name: nameInput.trim(), quizHistory: [] };
            newProfile.name = nameInput.trim();
            saveProfile(newProfile);
            setProfile(newProfile);
            setIsEditingName(false);
        }
    };
    
    const handleGetStudyTips = async () => {
        if (!profile) return;
        setIsLoadingTips(true);
        setTips('');
        const generatedTips = await getStudyTips(profile.quizHistory);
        setTips(generatedTips);
        setIsLoadingTips(false);
    };

    const stats = React.useMemo(() => {
        if (!profile || profile.quizHistory.length === 0) {
            return { quizzesTaken: 0, averageScore: 0 };
        }
        const totalQuizzes = profile.quizHistory.length;
        const totalPercentage = profile.quizHistory.reduce((acc, curr) => {
            return acc + (curr.score / curr.total) * 100;
        }, 0);
        const average = totalQuizzes > 0 ? Math.round(totalPercentage / totalQuizzes) : 0;
        return { quizzesTaken: totalQuizzes, averageScore: average };
    }, [profile]);
    
    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* User Welcome Card */}
                <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg border border-[var(--card-border)]">
                    {isEditingName ? (
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full p-2 bg-[var(--input-bg)] text-[color:var(--text-primary)] rounded-lg border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)]"
                                aria-label="Name input"
                            />
                            <button onClick={handleSaveName} className="px-6 py-2 bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] font-bold rounded-lg hover:bg-opacity-90 transition-colors">Save</button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">Welcome, {profile?.name}!</h1>
                                <p className="text-[color:var(--text-secondary)]">Here's a summary of your progress.</p>
                            </div>
                            <button onClick={() => setIsEditingName(true)} className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--icon-hover-bg)] rounded-full" aria-label="Edit name">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard label="Quizzes Taken" value={stats.quizzesTaken.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>} />
                    <StatCard label="Average Score" value={`${stats.averageScore}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>} />
                </div>
                
                {/* AI Study Tips */}
                <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg border border-[var(--card-border)]">
                    <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">Personalized Study Tips</h2>
                    {isLoadingTips ? (
                        <div className="flex flex-col items-center justify-center p-8">
                             <LoadingSpinner />
                             <p className="text-lg text-[color:var(--text-secondary)] mt-4">Your AI tutor is analyzing your progress...</p>
                        </div>
                    ) : tips ? (
                         <div className="prose prose-sm max-w-none prose-p:my-2" dangerouslySetInnerHTML={renderMarkdown(tips)} />
                    ) : (
                        <div className="text-center p-4">
                            <p className="text-[color:var(--text-secondary)] mb-4">Get AI-powered feedback on how to improve based on your quiz results.</p>
                            <button onClick={handleGetStudyTips} className="px-8 py-3 bg-[var(--accent-primary)] text-[color:var(--accent-text-primary)] font-bold rounded-lg hover:bg-opacity-90 transition-transform hover:scale-105" disabled={stats.quizzesTaken === 0}>
                                {stats.quizzesTaken > 0 ? 'Generate My Tips' : 'Take a Quiz to Get Tips'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};