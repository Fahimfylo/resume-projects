import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/archflow',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'archflow-local-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'archflow-local-refresh-secret',
  ACCESS_TOKEN_TTL_MIN: Number(process.env.ACCESS_TOKEN_TTL_MIN || 15),
  REFRESH_TOKEN_TTL_DAYS: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
  STORAGE_ADAPTER: process.env.STORAGE_ADAPTER || 'local',
  UPLOAD_DIR: path.resolve(ROOT_DIR, process.env.UPLOAD_DIR || './storage'),
  MAX_UPLOAD_SIZE_MB: Number(process.env.MAX_UPLOAD_SIZE_MB || 200),
  KEEP_SOURCE_FILES: (process.env.KEEP_SOURCE_FILES || 'false') === 'true',
};
