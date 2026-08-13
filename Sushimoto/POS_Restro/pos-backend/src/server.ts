import { app } from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

async function start() {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB');
    app.listen(env.PORT, () => {
      logger.info(`POS Server running on http://localhost:${env.PORT}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
