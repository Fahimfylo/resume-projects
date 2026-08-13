import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface TokenPayload {
  userId: string;
  sessionId: string;
  role: string;
  tokenVersion: number;
  _id?: string;
}

export function signAccessToken(payload: Omit<TokenPayload, '_id'>): string {
  return jwt.sign(
    { ...payload, _id: payload.userId },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
    }
  );
}

export function signRefreshToken(payload: Omit<TokenPayload, '_id'>): string {
  return jwt.sign(
    { ...payload, _id: payload.userId },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
    }
  );
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
  }) as TokenPayload;
}
