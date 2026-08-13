import { userRepository } from '../user/user.repository';
import { authRepository } from './auth.repository';
import { comparePassword, hashPassword } from '../../common/utils/password';
import { signAccessToken, signRefreshToken, verifyToken } from '../../common/utils/jwt';
import {
  badRequest,
  unauthorized,
  notFound,
  conflict,
} from '../../common/errors/HttpError';
import { env } from '../../config/env';
import type { IUser } from '../user/user.model';

interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

function parseClientInfo(info?: ClientInfo) {
  const ua = info?.userAgent || '';
  const browsers = ['Chrome', 'Firefox', 'Safari'];
  const browser = browsers.find((b) => ua.includes(b)) || (ua ? 'Unknown' : undefined);
  const oss = ['Windows', 'macOS', 'Linux'];
  const os = oss.find((o) => ua.includes(o)) || (ua ? 'Unknown' : undefined);
  return { device: ua ? 'Web' : undefined, browser, os, ip: info?.ip };
}

export const authService = {
  async register(
    data: { firstName: string; lastName: string; email: string; password: string },
    clientInfo?: ClientInfo
  ) {
    const emailExists = await userRepository.existsByEmail(data.email);
    if (emailExists) throw conflict('Email already registered');

    const user = await userRepository.create({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: data.password,
      role: 'customer',
    });

    const sessionInfo = parseClientInfo(clientInfo);
    const { accessToken, refreshToken, session } = await this._createSession(
      user,
      sessionInfo
    );

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken,
      session,
    };
  },

  async login(email: string, password: string, clientInfo?: ClientInfo) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) throw unauthorized('Invalid email or password');

    if (!user.isActive) throw unauthorized('Account is deactivated');

    if (user.isLocked()) {
      throw unauthorized('Account is temporarily locked. Try again later.');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      await user.incrementFailedAttempts();
      throw unauthorized('Invalid email or password');
    }

    await user.resetFailedAttempts();
    user.lastLogin = new Date();
    await user.save();

    const sessionInfo = parseClientInfo(clientInfo);
    const { accessToken, refreshToken, session } = await this._createSession(
      user,
      sessionInfo
    );

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken,
      session,
    };
  },

  async refresh(refreshToken: string) {
    let payload: ReturnType<typeof verifyToken>;
    try {
      payload = verifyToken(refreshToken);
    } catch {
      throw unauthorized('Invalid refresh token');
    }

    const tokenHash = authRepository.hashToken(refreshToken);
    const session = await authRepository.findSessionByTokenHash(tokenHash);
    if (!session) throw unauthorized('Session not found or revoked');

    if (session.expiresAt < new Date()) {
      await authRepository.revokeSession(session._id as string);
      throw unauthorized('Session expired');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) throw unauthorized('User not found or inactive');

    // Rotate session
    await authRepository.revokeSession(session._id as string);
    const sessionInfo = {
      device: session.device,
      browser: session.browser,
      os: session.os,
      ip: session.ip,
    };
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await this._createSession(user, sessionInfo);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string, sessionId: string) {
    await authRepository.revokeSession(sessionId);
  },

  async logoutAll(userId: string, currentSessionId: string) {
    await authRepository.revokeAllUserSessions(userId, currentSessionId);
  },

  async getSessions(userId: string) {
    return authRepository.getActiveSessions(userId);
  },

  async revokeSession(userId: string, sessionId: string) {
    const session = await authRepository.findSessionByTokenHash('');

    // Find session directly to verify ownership
    const { Session } = await import('./auth.model');
    const targetSession = await Session.findById(sessionId);
    if (!targetSession || targetSession.user.toString() !== userId) {
      throw notFound('Session not found');
    }
    await authRepository.revokeSession(sessionId);
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If the email exists, a reset link has been sent.' };
    }
    // TODO: implement email sending
    return { message: 'If the email exists, a reset link has been sent.' };
  },

  async resetPassword(token: string, _newPassword: string) {
    // TODO: implement password reset with token
    return { message: 'Password has been reset successfully.' };
  },

  async verifyEmail(token: string) {
    // TODO: implement email verification
    return { message: 'Email verified successfully.' };
  },

  async resendVerification(_userId: string) {
    // TODO: implement resend verification
    return { message: 'Verification email sent.' };
  },

  async _createSession(
    user: IUser,
    sessionInfo: { device?: string; browser?: string; os?: string; ip?: string }
  ) {
    const session = await authRepository.createSession({
      user: user._id as any,
      refreshTokenHash: 'placeholder',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...sessionInfo,
    });

    const tokenPayload = {
      userId: (user._id as string).toString(),
      sessionId: (session._id as string).toString(),
      role: user.role,
      tokenVersion: 1,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const refreshHash = authRepository.hashToken(refreshToken);
    session.refreshTokenHash = refreshHash;
    await session.save();

    user.refreshTokenHash = refreshHash;
    await user.save();

    return { accessToken, refreshToken, session };
  },

  _sanitizeUser(user: IUser) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isProfileComplete: user.isProfileComplete(),
    };
  },
};
