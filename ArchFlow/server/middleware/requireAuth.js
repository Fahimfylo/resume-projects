import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './error.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    return next(new AppError('Authentication required', 'UNAUTHENTICATED', 401));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (!payload?.sub) throw new Error('missing subject');
    req.user = { id: payload.sub, email: payload.email || '' };
    req.ownerId = payload.sub;
    next();
  } catch {
    next(new AppError('Not authenticated', 'UNAUTHENTICATED', 401));
  }
}
