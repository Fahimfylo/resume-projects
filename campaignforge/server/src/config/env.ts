import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// ── SMTP temporarily disabled ──
// function smtpPass(key: string): string {
//   const value = process.env[key];
//   if (!value || value === 'your-app-password') {
//     console.warn(`⚠ WARNING: ${key} is not configured. Emails will not be sent. Set a real Gmail App Password.`);
//     return value || '';
//   }
//   return value;
// }

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '4000'), 10),
  mongodbUri: required('MONGODB_URI'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  gemini: {
    apiKey: required('GEMINI_API_KEY'),
    model: optional('GEMINI_MODEL', 'gemini-2.0-flash'),
    fallbackModel: optional('GEMINI_FALLBACK_MODEL', 'gemini-2.0-flash-lite'),
  },
  cors: {
    origin: optional('CORS_ORIGIN', 'http://localhost:3000'),
  },
  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX', '200'), 10),
  },
  google: {
    clientId: required('GOOGLE_CLIENT_ID'),
    clientSecret: required('GOOGLE_CLIENT_SECRET'),
    callbackUrl: (() => {
      const raw = required('GOOGLE_CALLBACK_URL');
      if (raw.endsWith('/api/v1/auth/google/callback')) return raw;
      return `${raw.replace(/\/+$/, '')}/api/v1/auth/google/callback`;
    })(),
  },
  // ── SMTP temporarily disabled ──
  // smtp: {
  //   host: required('SMTP_HOST'),
  //   port: parseInt(required('SMTP_PORT'), 10),
  //   user: required('SMTP_USER'),
  //   pass: smtpPass('SMTP_PASS'),
  //   from: required('SMTP_FROM'),
  // },
  appUrl: required('APP_URL'),
  cookie: {
    secret: optional('COOKIE_SECRET', 'campaignforge-cookie-secret-dev'),
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'lax' : 'lax') as 'lax' | 'strict' | 'none',
  },
} as const;
