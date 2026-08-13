export type BreachCheckInput = {
  email: string;
};

export type BreachCheckOutput = {
  email: string;
  breachCount: number;
  breaches: BreachRecord[];
  riskSummary: string;
  passwordChangeRecommended: boolean;
};

export type BreachRecord = {
  name: string;
  year: number;
  exposedFields: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
};
