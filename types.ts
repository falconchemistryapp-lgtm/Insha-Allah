
export type Sender = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface NumericalProblem {
  problem: string;
  solution: string;
}

export interface SiUnit {
  quantity: string;
  unit: string;
  symbol: string;
}

export interface TopicSiUnits {
    topicName: string;
    units: SiUnit[];
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface QuizResult {
  chapter: string;
  topic: string;
  score: number;
  total: number;
  date: string; // ISO string date
}

export interface UserProfile {
  name: string;
  quizHistory: QuizResult[];
}