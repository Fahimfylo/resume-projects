import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ err }, 'Operational error');
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  logger.error({ err }, 'Unexpected error');
  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
