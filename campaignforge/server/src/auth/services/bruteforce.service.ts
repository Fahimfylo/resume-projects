import { logger } from '../../utils/logger.js';

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BASE_LOCKOUT_MS = 15 * 60 * 1000;

function key(email: string, ip: string): string {
  return `${email}:${ip}`;
}

export function trackFailedAttempt(email: string, ip: string): void {
  const k = key(email, ip);
  const now = Date.now();
  const record = attempts.get(k);

  if (record && now - record.firstAttempt < WINDOW_MS) {
    record.count += 1;
    const multiplier = Math.pow(2, record.count - MAX_ATTEMPTS);
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + BASE_LOCKOUT_MS * Math.max(1, multiplier);
      logger.warn(`Brute force lockout for ${email} (${ip}): ${record.count} attempts, locked until ${new Date(record.lockedUntil).toISOString()}`);
    }
  } else {
    attempts.set(k, { count: 1, firstAttempt: now, lockedUntil: null });
  }
}

export function isLockedOut(email: string, ip: string): boolean {
  const k = key(email, ip);
  const record = attempts.get(k);
  if (!record) return false;
  if (record.lockedUntil && Date.now() < record.lockedUntil) return true;
  if (Date.now() - record.firstAttempt > WINDOW_MS) {
    attempts.delete(k);
    return false;
  }
  return false;
}

export function resetAttempts(email: string, ip: string): void {
  const k = key(email, ip);
  attempts.delete(k);
}
