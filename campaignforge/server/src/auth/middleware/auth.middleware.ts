import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { AuthRequest, JwtPayload } from '../../types/index.js';
import { User } from '../../models/User.js';

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

function extractRefreshToken(req: Request): string | null {
  if (req.cookies?.refreshToken) {
    return req.cookies.refreshToken;
  }
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }
  return null;
}

async function validateUserExists(payload: JwtPayload): Promise<void> {
  const user = await User.findById(payload.userId);
  if (!user) {
    throw ApiError.unauthorized('User account no longer exists');
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    await validateUserExists(decoded);
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    await validateUserExists(decoded);
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    next();
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!(req as AuthRequest).user) {
      throw ApiError.unauthorized();
    }
    if (roles.length > 0 && !roles.includes('*')) {
      // role check placeholder for future RBAC
    }
    next();
  };
}

export { extractToken, extractRefreshToken };
