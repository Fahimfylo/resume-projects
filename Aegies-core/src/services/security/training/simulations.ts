import type { PhishingSimulation, QuizQuestion, TrainingSession } from '@/types/security/training';

export const PHISHING_SIMULATIONS: PhishingSimulation[] = [
  {
    id: 'phish-1',
    emailSubject: 'URGENT: Your account has been compromised',
    emailSender: 'security@paypaI-security.com',
    emailBody: `Dear valued customer,

We have detected unusual activity on your account. Your account has been temporarily suspended.

To restore access, please verify your identity immediately:
https://paypaI-security.com/verify

Failure to do so within 24 hours will result in permanent account closure.

Sincerely,
PayPal Security Team`,
    isPhishing: true,
    explanation: 'This is a classic phishing email. The sender domain "paypaI-security.com" uses a capital "I" to mimic "l" (typosquatting). Real PayPal emails come from @paypal.com. The urgent tone and threat of account closure are social engineering tactics.',
    indicators: ['Typosquatting domain (paypaI vs paypal)', 'Urgency and threat of account closure', 'Suspicious link', 'Generic greeting "Dear valued customer"'],
    difficulty: 'easy',
  },
  {
    id: 'phish-2',
    emailSubject: 'Your Amazon Order #AZ-84921-2 Has Shipped',
    emailSender: 'ship-confirm@amazon.com',
    emailBody: `Hello,

Your order #AZ-84921-2 has been shipped and is on its way!

Track your package: https://www.amazon.com/tracking/84921-2

Estimated delivery: June 15-17

Thank you for shopping with us!
Amazon Customer Service`,
    isPhishing: false,
    explanation: 'This is a legitimate order confirmation email. The sender domain is the real amazon.com, the tracking link goes to the real Amazon domain, and there is no urgent request for personal information or unusual demands.',
    indicators: ['Legitimate sender domain (@amazon.com)', 'No request for personal information', 'Real tracking link', 'Professional formatting'],
    difficulty: 'easy',
  },
  {
    id: 'phish-3',
    emailSubject: 'Action Required: Microsoft 365 Password Expiration Notice',
    emailSender: 'admin@microsoft365-verify.net',
    emailBody: `Dear User,

Your Microsoft 365 password will expire in 48 hours.

To continue using your email and services without interruption, please keep your current password by signing in below:

https://microsoft365-verify.net/signin

If you do not update, you may lose access to emails and files.

Thank you,
IT Administration`,
    isPhishing: true,
    explanation: 'Phishing email impersonating Microsoft 365 admin. The domain "microsoft365-verify.net" is not a Microsoft-owned domain. Microsoft never asks you to click a link to keep your current password.',
    indicators: ['Fake domain (microsoft365-verify.net)', 'Password expiration is a common phishing lure', 'Asks to click link to "keep password"', 'Generic "Dear User" greeting'],
    difficulty: 'medium',
  },
  {
    id: 'phish-4',
    emailSubject: 'Meeting Invitation: Q3 Strategy Review',
    emailSender: 'sarah.johnson@company.com',
    emailBody: `Hi Team,

Please find attached the agenda and materials for our Q3 strategy review meeting scheduled for Friday at 2pm.

Best,
Sarah Johnson
VP of Strategy`,
    isPhishing: false,
    explanation: 'This is a legitimate internal business email. It includes a specific name and title, is from a company domain, and contains no urgent requests, suspicious links, or unusual elements.',
    indicators: ['Legitimate company domain', 'Specific sender identity', 'No urgent or threatening language', 'Legitimate business context'],
    difficulty: 'easy',
  },
  {
    id: 'phish-5',
    emailSubject: 'Invoice PAST DUE — Immediate Payment Required',
    emailSender: 'billing@accounts-payable.org',
    emailBody: `ATTENTION,

Our records show that Invoice #INV-44921 remains unpaid. To avoid service interruption and late fees, please remit payment immediately.

Click here to view and pay your invoice:
http://accounts-payable.org/invoice/pay

This is your FINAL notice.

Accounts Payable Department`,
    isPhishing: true,
    explanation: 'This phishing email uses financial fear and urgency to trick recipients. The domain "accounts-payable.org" is suspicious, and the "FINAL notice" language is a common pressure tactic used in billing scams.',
    indicators: ['Financial urgency and fear tactics', 'FINAL notice language', 'Suspicious domain', 'Generic department signature', 'Request to click link for payment'],
    difficulty: 'medium',
  },
  {
    id: 'phish-6',
    emailSubject: 'Congratulations! You\'ve Been Selected for a Free iPhone 15',
    emailSender: 'winner@prize-rewards.top',
    emailBody: `Congratulations!

You have been randomly selected to receive a FREE iPhone 15 Pro Max!

To claim your prize, simply:
1. Click the link below
2. Enter your shipping address
3. Pay a small $4.95 shipping fee

https://prize-rewards.top/claim?id=38491

Offer expires in 24 hours!

Prize Fulfillment Team`,
    isPhishing: true,
    explanation: 'Classic advance-fee phishing scam. The ".top" TLD is commonly used for malicious sites. Free high-value prizes are always scams, and legitimate promotions never ask you to pay a "shipping fee" with your credit card first.',
    indicators: ['.top TLD (suspicious)', 'Unsolicited prize notification', 'Request for shipping fee payment', '24-hour expiration pressure', 'Too good to be true'],
    difficulty: 'easy',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the most reliable way to verify a link in an email is safe?',
    options: ['Click it and see where it goes', 'Hover over the link to preview the actual URL', 'It has https so it must be safe', 'The email looks professional'],
    correctAnswer: 1,
    explanation: 'Hovering over a link reveals the true destination URL in the status bar. Phishers often display one URL in the email text but link to a different malicious address.',
    category: 'phishing',
  },
  {
    id: 'q2',
    question: 'What does "typosquatting" mean in cybersecurity?',
    options: ['Correcting typos in code', 'Registering domains with common misspellings of popular sites', 'A typing speed test', 'A type of encryption'],
    correctAnswer: 1,
    explanation: 'Typosquatting involves registering domain names that are common misspellings or variations of legitimate domains (e.g., gooogle.com or paypaI.com) to trick users.',
    category: 'phishing',
  },
  {
    id: 'q3',
    question: 'Which of the following is a strong password?',
    options: ['Password123!', 'Il0v3MyD0g!2024', 'Qwerty123', 'Admin'],
    correctAnswer: 1,
    explanation: '"Il0v3MyD0g!2024" is strong because it uses a mix of uppercase, lowercase, numbers, special characters, and is not a common word or pattern.',
    category: 'password',
  },
  {
    id: 'q4',
    question: 'What is social engineering?',
    options: ['Building social networks', 'Manipulating people to divulge confidential information', 'Engineering social media platforms', 'A type of firewall'],
    correctAnswer: 1,
    explanation: 'Social engineering is the psychological manipulation of people into performing actions or divulging confidential information. It is a common tactic in cyberattacks.',
    category: 'social_engineering',
  },
  {
    id: 'q5',
    question: 'What should you do if you suspect a phishing email?',
    options: ['Reply asking if it\'s real', 'Click the link to investigate', 'Report it to your security team and delete it', 'Forward it to friends to warn them'],
    correctAnswer: 2,
    explanation: 'Always report suspected phishing to your security team so they can analyze and block the threat. Never click links, reply, or forward the email.',
    category: 'phishing',
  },
  {
    id: 'q6',
    question: 'What does "malware" stand for?',
    options: ['Malicious software', 'Malfunctioning hardware', 'Malware email', 'System tool'],
    correctAnswer: 0,
    explanation: 'Malware is short for "malicious software" — any software intentionally designed to cause damage to a computer, server, or network.',
    category: 'malware',
  },
  {
    id: 'q7',
    question: 'What is the best defense against ransomware?',
    options: ['Pay the ransom immediately', 'Regular offline backups', 'Install more RAM', 'Use a different browser'],
    correctAnswer: 1,
    explanation: 'Regular offline backups are the most effective defense against ransomware. If your data is backed up and not accessible from the infected system, you can restore without paying.',
    category: 'malware',
  },
  {
    id: 'q8',
    question: 'What is MFA (Multi-Factor Authentication)?',
    options: ['A type of antivirus', 'Using two or more verification methods to log in', 'A firewall rule', 'A password manager'],
    correctAnswer: 1,
    explanation: 'MFA requires two or more verification factors (something you know, something you have, something you are) to authenticate, providing much stronger security than passwords alone.',
    category: 'general',
  },
  {
    id: 'q9',
    question: 'What is a "zero-day" vulnerability?',
    options: ['A bug found on day zero of testing', 'A vulnerability unknown to the vendor with no available patch', 'A vulnerability that was fixed on day one', 'An exploit from the year 2000'],
    correctAnswer: 1,
    explanation: 'A zero-day vulnerability is a security flaw that is unknown to the software vendor and has no patch available. It is "zero days" since the vendor became aware of it.',
    category: 'general',
  },
  {
    id: 'q10',
    question: 'Which HTTP security header helps prevent clickjacking?',
    options: ['Content-Security-Policy', 'X-Frame-Options', 'Strict-Transport-Security', 'Referrer-Policy'],
    correctAnswer: 1,
    explanation: 'X-Frame-Options prevents a page from being displayed in an iframe, protecting against clickjacking attacks where an attacker embeds your site in a hidden frame.',
    category: 'general',
  },
];

export function getRandomSimulations(count: number = 3): PhishingSimulation[] {
  const shuffled = [...PHISHING_SIMULATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getRandomQuestions(count: number = 5): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function calculateTrainingScore(
  simulationResults: { id: string; isPhishing: boolean; userAnswer: boolean }[],
  quizResults: { id: string; selectedAnswer: number }[],
): Omit<TrainingSession, 'id' | 'completedAt'> {
  const simCorrect = simulationResults.filter(r => r.isPhishing === r.userAnswer).length;
  const quizCorrect = quizResults.filter(r => {
    const q = QUIZ_QUESTIONS.find(q => q.id === r.id);
    return q && q.correctAnswer === r.selectedAnswer;
  }).length;

  const total = simulationResults.length + quizResults.length;
  const correct = simCorrect + quizCorrect;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  const categories: Record<string, { correct: number; total: number }> = {};
  for (const r of quizResults) {
    const q = QUIZ_QUESTIONS.find(q => q.id === r.id);
    if (q) {
      if (!categories[q.category]) categories[q.category] = { correct: 0, total: 0 };
      categories[q.category].total++;
      if (q.correctAnswer === r.selectedAnswer) categories[q.category].correct++;
    }
  }

  return {
    score,
    totalQuestions: total,
    correctAnswers: correct,
    simulationsAnswered: simulationResults.length,
    simulationsCorrect: simCorrect,
    categories,
  };
}
