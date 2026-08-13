export type SecurityScoreReport = {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: ScoreCategory[];
  history: ScoreHistoryPoint[];
  recommendations: string[];
  lastUpdated: string;
};

export type ScoreCategory = {
  name: string;
  score: number;
  weight: number;
  icon: string;
  details: string;
};

export type ScoreHistoryPoint = {
  date: string;
  score: number;
};
