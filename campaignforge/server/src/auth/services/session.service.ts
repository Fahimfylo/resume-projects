import crypto from 'crypto';
import { Request } from 'express';
import { Session } from '../models/Session.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDevice(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}

export async function createSession(
  userId: string,
  refreshToken: string,
  req?: Request
) {
  const userAgent = req?.headers['user-agent'] || '';
  const ip = req?.ip || req?.socket?.remoteAddress || '';
  const device = parseDevice(userAgent);

  const expiryMs = parseExpiry(env.jwt.refreshExpiresIn);
  const expiresAt = new Date(Date.now() + expiryMs);

  const session = await Session.create({
    userId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent,
    ip,
    device,
  });

  return session;
}

export async function validateSession(userId: string, refreshToken: string) {
  const hash = hashToken(refreshToken);
  const session = await Session.findOne({
    userId,
    refreshTokenHash: hash,
    revoked: false,
    expiresAt: { $gt: new Date() },
  }).select('+refreshTokenHash');

  if (!session) {
    return null;
  }

  session.lastUsedAt = new Date();
  await session.save({ validateBeforeSave: false });

  return session;
}

export async function revokeSession(sessionId: string, reason?: string) {
  await Session.findByIdAndUpdate(sessionId, {
    revoked: true,
    revokedReason: reason || 'logout',
  });
}

export async function revokeAllUserSessions(userId: string, reason?: string) {
  await Session.updateMany(
    { userId, revoked: false },
    { revoked: true, revokedReason: reason || 'revoke_all' }
  );
  logger.info(`All sessions revoked for user: ${userId}`);
}

export async function getActiveSessions(userId: string) {
  return Session.find({
    userId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  }).sort({ lastUsedAt: -1 });
}

function parseExpiry(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] || 24 * 60 * 60 * 1000);
}
