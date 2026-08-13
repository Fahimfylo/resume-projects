import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const SKIP_CSRF_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/google', '/auth/google/callback'];

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: env.cookie.secure,
      sameSite: 'lax' as const,
      path: '/',
    });
  }

  const isExempt = SKIP_CSRF_PATHS.some((p) => req.path.startsWith(p));
  if (isExempt) {
    next();
    return;
  }

  if (SAFE_METHODS.includes(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw ApiError.forbidden('Invalid CSRF token');
  }

  next();
}
