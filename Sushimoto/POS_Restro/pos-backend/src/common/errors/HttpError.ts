import { AppError } from './AppError';

export function badRequest(message: string, code?: string): AppError {
  return new AppError(message, 400, code || 'BAD_REQUEST');
}

export function unauthorized(message = 'Unauthorized', code?: string): AppError {
  return new AppError(message, 401, code || 'UNAUTHORIZED');
}

export function forbidden(message = 'Forbidden', code?: string): AppError {
  return new AppError(message, 403, code || 'FORBIDDEN');
}

export function notFound(message = 'Resource not found', code?: string): AppError {
  return new AppError(message, 404, code || 'NOT_FOUND');
}

export function conflict(message: string, code?: string): AppError {
  return new AppError(message, 409, code || 'CONFLICT');
}

export function tooManyRequests(message = 'Too many requests', code?: string): AppError {
  return new AppError(message, 429, code || 'TOO_MANY_REQUESTS');
}

export function internal(message = 'Internal server error', code?: string): AppError {
  return new AppError(message, 500, code || 'INTERNAL_ERROR', false);
}
