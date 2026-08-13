import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { logger } from './config/logger';
import { globalLimiter } from './common/middleware/rateLimiter';
import { mongoSanitize } from './common/middleware/sanitize';
import { errorHandler } from './common/middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import legacyAuthRoutes from './modules/auth/auth.legacy.routes';
import orderRoutes from './modules/order/order.routes';
import tableRoutes from './modules/table/table.routes';
import paymentRoutes from './modules/payment/payment.routes';
import menuRoutes from './modules/menu/menu.routes';
import adminUserRoutes from './modules/user/user.admin.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [env.CORS_ORIGIN, 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize);
app.use(globalLimiter);

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'POS Server is running',
    data: { uptime: process.uptime() },
  });
});

// New sushi frontend routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Legacy POS frontend routes (backward-compatible)
app.use('/api/user', legacyAuthRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin/users', adminUserRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

export { app };
export default app;
