import type { Request, Response, NextFunction } from 'express';
import { forbidden } from '../errors/HttpError';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(forbidden('Authentication required'));
    }
    if (req.user.role === 'superadmin') {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(forbidden('Insufficient permissions'));
    }
    next();
  };
}
