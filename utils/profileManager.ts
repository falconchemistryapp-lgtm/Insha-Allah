import type { UserProfile, QuizResult } from '../types';

const PROFILE_KEY = 'physIQProfile';

export function getProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to parse profile from localStorage", error);
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save profile to localStorage", error);
  }
}

export function addQuizResult(result: QuizResult): void {
  let profile = getProfile();
  if (!profile) {
    profile = { name: 'Student', quizHistory: [] };
  }
  // Avoid adding duplicate results if user re-opens the result screen
  const lastResult = profile.quizHistory[profile.quizHistory.length - 1];
  if (lastResult && lastResult.date === result.date && lastResult.topic === result.topic) {
      return;
  }

  profile.quizHistory.push(result);
  saveProfile(profile);
}