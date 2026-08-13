import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { unauthorized } from '../errors/HttpError';

export function cookieAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next(unauthorized('No authentication token'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}
