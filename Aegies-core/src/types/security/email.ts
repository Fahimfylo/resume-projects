export type EmailAnalysisInput = {
  subject: string;
  body: string;
  sender: string;
  rawHeaders?: string;
};

export type EmailAnalysisOutput = {
  riskScore: number;
  riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
  reasons: string[];
  recommendedActions: string[];
  spfStatus: 'pass' | 'fail' | 'neutral' | 'none';
  dkimStatus: 'pass' | 'fail' | 'neutral' | 'none';
  dmarcStatus: 'pass' | 'fail' | 'neutral' | 'none';
  urlsFound: EmailUrlFinding[];
  typosquattingDetected: boolean;
  typosquattingMatches: string[];
  keywordFlags: KeywordFlag[];
  aiAssessment?: EmailAiAssessment;
};

export type EmailUrlFinding = {
  url: string;
  riskScore: number;
  riskLabel: string;
};

export type KeywordFlag = {
  keyword: string;
  category: 'urgency' | 'login' | 'financial' | 'personal_info' | 'malicious';
  severity: number;
};

export type EmailAiAssessment = {
  summary: string;
  intent: string;
  socialEngineeringScore: number;
};
