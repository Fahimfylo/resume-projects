export type PhishingSimulation = {
  id: string;
  emailSubject: string;
  emailSender: string;
  emailBody: string;
  isPhishing: boolean;
  explanation: string;
  indicators: string[];
  difficulty: 'easy' | 'medium' | 'hard';
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: 'phishing' | 'malware' | 'password' | 'social_engineering' | 'general';
};

export type TrainingSession = {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  simulationsAnswered: number;
  simulationsCorrect: number;
  completedAt: string;
  categories: Record<string, { correct: number; total: number }>;
};
