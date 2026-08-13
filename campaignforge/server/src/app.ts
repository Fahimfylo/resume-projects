import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { csrfProtection } from './auth/middleware/csrf.middleware.js';
import { ApiError } from './utils/ApiError.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.cors.origin, credentials: true }));
app.use(cookieParser(env.cookie.secret));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use(generalLimiter);

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Momentum API is running', timestamp: new Date().toISOString() });
});

app.use('/api/v1', csrfProtection, routes);

app.use((_req, _res, next) => {
  next(ApiError.notFound('Route not found'));
});

app.use(errorHandler);

export default app;
