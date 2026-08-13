import { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';

interface AuditInput {
  action: string;
  userId?: string;
  email?: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  req?: Request;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await AuditLog.create({
      action: input.action,
      userId: input.userId,
      email: input.email,
      ip: input.req?.ip || input.req?.socket?.remoteAddress || '',
      userAgent: input.req?.headers['user-agent'] || '',
      outcome: input.outcome,
      metadata: input.metadata,
    });
  } catch {
    // audit failures never throw — non-blocking
  }
}
