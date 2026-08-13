import 'dotenv/config';

export const env = Object.freeze({
  PORT: parseInt(process.env.PORT || '8000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pos-db',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  JWT_SECRET: process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'sushimoto',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '50', 10),
  SENSITIVE_RATE_LIMIT_MAX: parseInt(process.env.SENSITIVE_RATE_LIMIT_MAX || '20', 10),

  ACCOUNT_LOCK_THRESHOLD: parseInt(process.env.ACCOUNT_LOCK_THRESHOLD || '5', 10),
  ACCOUNT_LOCK_DURATION_MS: parseInt(process.env.ACCOUNT_LOCK_DURATION_MS || '900000', 10),

  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
});
