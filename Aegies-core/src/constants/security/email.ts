export const URGENCY_KEYWORDS = [
  'urgent', 'immediate action', 'account suspended', 'verify now',
  'login now', 'click here', 'update required', 'security alert',
  'unusual activity', 'limited time', 'expire', 'deadline',
  'act now', 'confirm identity', 'payment required', 'overdue',
];

export const LOGIN_KEYWORDS = [
  'login', 'sign in', 'password', 'credential', 'username',
  'account', 'verify account', 'reset password', 'change password',
  'unlock account', 'secure your account',
];

export const FINANCIAL_KEYWORDS = [
  'invoice', 'payment', 'refund', 'transaction', 'bank',
  'credit card', 'paypal', 'wire transfer', 'money', 'billing',
  'subscription', 'charge', 'fee',
];

export const PERSONAL_INFO_KEYWORDS = [
  'ssn', 'social security', 'date of birth', 'address',
  'phone number', 'mother\'s maiden name', 'passport',
  'driver license', 'national id',
];

export const MALICIOUS_KEYWORDS = [
  'attachment', 'download', 'zip file', 'open attached',
  'macro', 'enable content', 'enable editing', 'invoice.pdf',
  'document', 'spreadsheet',
];

export const SUSPICIOUS_TLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.date', '.men'];

export const TRUSTED_DOMAINS = [
  'google.com', 'facebook.com', 'microsoft.com', 'apple.com',
  'amazon.com', 'paypal.com', 'netflix.com', 'linkedin.com',
  'twitter.com', 'instagram.com', 'github.com', 'dropbox.com',
  'chase.com', 'wellsfargo.com', 'bankofamerica.com',
];

export const SIMULATED_SPF_RECORDS: Record<string, string> = {
  'google.com': 'v=spf1 include:_spf.google.com ~all',
  'microsoft.com': 'v=spf1 include:spf.protection.outlook.com -all',
  'paypal.com': 'v=spf1 include:spf.paypal.com ~all',
  'amazon.com': 'v=spf1 include:amazonses.com -all',
};
