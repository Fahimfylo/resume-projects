import crypto from 'crypto';
import { Session, type ISession } from './auth.model';

export const authRepository = {
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  async createSession(data: Partial<ISession>): Promise<ISession> {
    return Session.create(data);
  },

  async findSessionByTokenHash(hash: string): Promise<ISession | null> {
    return Session.findOne({ refreshTokenHash: hash, revoked: false }).populate('user');
  },

  async revokeSession(sessionId: string): Promise<ISession | null> {
    return Session.findByIdAndUpdate(sessionId, { revoked: true }, { new: true });
  },

  async revokeAllUserSessions(
    userId: string,
    excludeSessionId?: string
  ): Promise<void> {
    const filter: Record<string, unknown> = { user: userId, revoked: false };
    if (excludeSessionId) {
      filter._id = { $ne: excludeSessionId };
    }
    await Session.updateMany(filter, { revoked: true });
  },

  async getActiveSessions(userId: string): Promise<ISession[]> {
    return Session.find({ user: userId, revoked: false })
      .select('device browser os ip lastUsed createdAt expiresAt')
      .sort({ lastUsed: -1 });
  },

  async revokeExpiredSessions(): Promise<number> {
    const result = await Session.updateMany(
      { expiresAt: { $lt: new Date() }, revoked: false },
      { revoked: true }
    );
    return result.modifiedCount;
  },
};
