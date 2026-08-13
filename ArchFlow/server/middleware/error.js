import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', status = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND', 404));
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: err.issues[0]?.message || 'Invalid request body',
        code: 'VALIDATION_ERROR',
        issues: err.issues,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message, code: err.code } });
  }

  if (err?.name === 'MulterError') {
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR';
    return res.status(400).json({ error: { message: err.message, code } });
  }

  if (err?.name === 'CastError') {
    return res.status(404).json({
      error: { message: `Resource not found: ${err.value}`, code: 'NOT_FOUND' },
    });
  }

  console.error('[error]', err);
  return res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
}
