import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Request } from 'express';
import { User } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { JwtPayload } from '../../types/index.js';
// import * as emailService from '../../services/email.service.js';
import * as sessionService from './session.service.js';
import * as bruteforceService from './bruteforce.service.js';
import * as auditService from './audit.service.js';

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
  });
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  });
}

function generateTokens(userId: string, email: string) {
  const payload: JwtPayload = { userId, email };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function registerUser(
  email: string,
  password: string,
  name: string | undefined,
  businessName: string,
  businessType: string,
  req?: Request
) {
  logger.info(`Registration attempt: ${email}`);

  const existing = await User.findOne({ email });
  if (existing) {
    logger.warn(`Registration failed — email already exists: ${email}`);
    auditService.logAudit({ action: 'register', email, outcome: 'failure', metadata: { reason: 'email_exists' }, req });
    throw ApiError.conflict('Email already registered');
  }

  const user = await User.create({
    email,
    password,
    name: name || email.split('@')[0],
    businessName,
    businessType,
    isEmailVerified: true,
  });

  const tokens = generateTokens(user._id.toString(), user.email);
  await sessionService.createSession(user._id.toString(), tokens.refreshToken, req);

  logger.info(`User registered: ${email}`);
  auditService.logAudit({ action: 'register', userId: user._id.toString(), email, outcome: 'success', req });

  return { user, ...tokens };
}

export async function loginUser(email: string, password: string, req?: Request) {
  const ip = req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`Login attempt: ${email} from ${ip}`);

  if (bruteforceService.isLockedOut(email, ip)) {
    logger.warn(`Login blocked — account locked: ${email} from ${ip}`);
    auditService.logAudit({ action: 'login', email, outcome: 'failure', metadata: { reason: 'locked_out' }, req });
    throw ApiError.tooMany('Too many attempts. Account temporarily locked.');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    bruteforceService.trackFailedAttempt(email, ip);
    logger.warn(`Login failed — user not found: ${email} from ${ip}`);
    auditService.logAudit({ action: 'login', email, outcome: 'failure', metadata: { reason: 'user_not_found' }, req });
    throw ApiError.unauthorized('Invalid credentials. Please sign up first.');
  }
  if (!(await user.comparePassword(password))) {
    bruteforceService.trackFailedAttempt(email, ip);
    logger.warn(`Login failed — invalid credentials: ${email} from ${ip}`);
    auditService.logAudit({ action: 'login', email, outcome: 'failure', metadata: { reason: 'invalid_credentials' }, req });
    throw ApiError.unauthorized('Invalid email or password');
  }

  bruteforceService.resetAttempts(email, ip);

  const tokens = generateTokens(user._id.toString(), user.email);

  await sessionService.createSession(user._id.toString(), tokens.refreshToken, req);

  auditService.logAudit({ action: 'login', userId: user._id.toString(), email, outcome: 'success', req });

  return { user, ...tokens };
}

export async function refreshAccessToken(token: string, req?: Request) {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;

    const session = await sessionService.validateSession(decoded.userId, token);
    if (!session) {
      logger.warn(`Token refresh failed — invalid/expired/revoked session for user: ${decoded.userId}`);
      auditService.logAudit({ action: 'refresh_token', userId: decoded.userId, outcome: 'failure', metadata: { reason: 'invalid_session' }, req });
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn(`Token refresh failed — user not found: ${decoded.userId}`);
      auditService.logAudit({ action: 'refresh_token', userId: decoded.userId, outcome: 'failure', metadata: { reason: 'user_not_found' }, req });
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokens = generateTokens(user._id.toString(), user.email);

    await sessionService.revokeSession(session._id.toString(), 'rotated');
    await sessionService.createSession(user._id.toString(), tokens.refreshToken, req);

    auditService.logAudit({ action: 'refresh_token', userId: user._id.toString(), email: user.email, outcome: 'success', req });

    return tokens;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`Token refresh error: ${(error as Error).message}`);
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}

export async function logoutUser(userId: string) {
  logger.info(`Logout: ${userId}`);
  await sessionService.revokeAllUserSessions(userId, 'logout');
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    logger.warn(`User not found: ${userId}`);
    throw ApiError.notFound('User not found');
  }
  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: { name?: string; businessName?: string; businessType?: string; avatarUrl?: string | null }
) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.businessName !== undefined) user.businessName = updates.businessName;
  if (updates.businessType !== undefined) user.businessType = updates.businessType;
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl || undefined;

  await user.save();

  logger.info(`Profile updated: ${userId}`);
  return user;
}

export async function handleGoogleAuth(userId: string, email: string, req?: Request) {
  logger.info(`Google auth success: ${email}`);
  const tokens = generateTokens(userId, email);
  await sessionService.revokeAllUserSessions(userId, 'oauth_relogin');
  await sessionService.createSession(userId, tokens.refreshToken, req);
  const user = await User.findById(userId);
  auditService.logAudit({ action: 'google_oauth', userId, email, outcome: 'success', req });
  return { user, ...tokens };
}

export async function forgotPassword(email: string) {
  logger.info(`Password reset requested: ${email}`);
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn(`Password reset requested for unknown email: ${email}`);
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  logger.info(`Password reset token for ${user.email}: ${resetToken}`);
  auditService.logAudit({ action: 'forgot_password', userId: user._id.toString(), email: user.email, outcome: 'success' });
}

export async function resetPassword(token: string, newPassword: string) {
  logger.info(`Password reset attempt`);

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    logger.warn(`Password reset failed — invalid/expired token`);
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await sessionService.revokeAllUserSessions(user._id.toString(), 'password_reset');

  logger.info(`Password reset successful: ${user.email}`);
  auditService.logAudit({ action: 'reset_password', userId: user._id.toString(), email: user.email, outcome: 'success' });
  return user;
}
