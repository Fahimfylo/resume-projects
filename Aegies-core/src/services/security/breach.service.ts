import type { BreachCheckInput, BreachCheckOutput, BreachRecord } from '@/types/security';
import { MOCK_BREACH_DATABASE, COMMON_BREACH_NAMES } from '@/constants/security';

function hashEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function simulateBreachLookup(email: string): BreachRecord[] {
  const lowerEmail = email.toLowerCase();

  if (MOCK_BREACH_DATABASE[lowerEmail]) {
    return MOCK_BREACH_DATABASE[lowerEmail].map(b => ({
      name: b.name,
      year: b.year,
      exposedFields: b.fields,
      severity: b.year < 2015 ? 'critical' : b.year < 2020 ? 'high' : 'medium',
    }));
  }

  const emailHash = hashEmail(email);
  const hashNum = parseInt(emailHash.slice(0, 4), 16);
  const seededIndex = hashNum % COMMON_BREACH_NAMES.length;

  // Deterministic simulation based on email hash
  if (hashNum % 10 < 3) {
    return [{
      name: COMMON_BREACH_NAMES[seededIndex],
      year: 2018 + (hashNum % 5),
      exposedFields: ['email', 'password'],
      severity: 'high',
    }];
  }

  if (hashNum % 10 < 5) {
    return [
      {
        name: COMMON_BREACH_NAMES[seededIndex],
        year: 2016 + (hashNum % 4),
        exposedFields: ['email'],
        severity: 'medium',
      },
      {
        name: COMMON_BREACH_NAMES[(seededIndex + 3) % COMMON_BREACH_NAMES.length],
        year: 2019 + (hashNum % 3),
        exposedFields: ['email', 'password', 'name'],
        severity: 'high',
      },
    ];
  }

  return [];
}

export function checkBreach(input: BreachCheckInput): BreachCheckOutput {
  const breaches = simulateBreachLookup(input.email);

  const breachCount = breaches.length;

  let riskSummary: string;
  if (breachCount === 0) {
    riskSummary = 'Good news! Your email was not found in our breach database.';
  } else if (breachCount <= 2) {
    riskSummary = `Your email was found in ${breachCount} data breach(es). Review your accounts and update passwords.`;
  } else {
    riskSummary = `Your email was found in ${breachCount} data breach(es). Immediate action recommended — your data is widely exposed.`;
  }

  const passwordChangeRecommended = breaches.some(b =>
    b.exposedFields.includes('password') && b.severity !== 'low'
  );

  return {
    email: input.email,
    breachCount,
    breaches,
    riskSummary,
    passwordChangeRecommended,
  };
}
