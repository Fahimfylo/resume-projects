import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error: any) {
    if (attempt <= MAX_RETRIES) {
      logger.warn(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error?.message ?? error}. Retrying in ${RETRY_DELAY_MS}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      return connectWithRetry(attempt + 1);
    }
    logger.error('MongoDB connection failed after all retries', error);
    process.exit(1);
  }
}

export async function connectDatabase(): Promise<void> {
  await connectWithRetry();

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}
