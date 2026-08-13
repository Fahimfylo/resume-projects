import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User, RefreshToken } from '../models/index.js';
import { AppError } from '../middleware/error.js';
import { requireAuth, ACCESS_COOKIE, REFRESH_COOKIE } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { saveAvatar, AVATAR_MIME_TYPES, MAX_AVATAR_BYTES } from '../services/avatarService.js';

// TODO(auth): non-goals for this pass — no email verification, no "forgot password"/password
// reset flow, no OAuth/social login, no brute-force rate limiting on login/signup.
// These are tracked follow-ups, deliberately not built here.

const router = Router();

const signupSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(1, 'Name is required').max(120),
});

const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password required'),
});

const profileSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120).optional(),
    email: z.string().email('A valid email is required').optional(),
    currentPassword: z.string().min(1, 'Current password required').optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  })
  .refine((d) => Boolean(d.newPassword) === Boolean(d.currentPassword), {
    message: 'Current and new password must be provided together',
    path: ['currentPassword'],
  });

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: (req, file, cb) => {
    if (AVATAR_MIME_TYPES[file.mimetype]) return cb(null, true);
    cb(new AppError('Unsupported image type (use JPEG, PNG, WebP or GIF)', 'INVALID_AVATAR', 400));
  },
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign({ email: user.email }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`,
  });
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    // Scoped to /api/auth so it's only sent on auth endpoints (refresh, logout),
    // never on every request.
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: env.ACCESS_TOKEN_TTL_MIN * 60 * 1000,
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, accessCookieOptions());
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}

async function issueRefreshToken(user, userAgent) {
  const raw = crypto.randomBytes(48).toString('base64url');
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    userAgent: userAgent || null,
  });
  return raw;
}

async function revokeTokenFamily(userId) {
  await RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

async function rotateRefreshToken(rawToken, userAgent) {
  const hash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash: hash });
  if (!existing) {
    throw new AppError('Invalid refresh token', 'UNAUTHENTICATED', 401);
  }
  if (existing.revokedAt || existing.expiresAt < new Date()) {
    // Reuse of a revoked/expired token → revoke the whole token family for that user.
    await revokeTokenFamily(existing.userId);
    throw new AppError('Invalid refresh token', 'UNAUTHENTICATED', 401);
  }

  const raw = crypto.randomBytes(48).toString('base64url');
  const newHash = hashToken(raw);
  await RefreshToken.create({
    userId: existing.userId,
    tokenHash: newHash,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    userAgent: userAgent || null,
  });
  await RefreshToken.updateOne(
    { _id: existing._id },
    { $set: { revokedAt: new Date(), replacedByTokenHash: newHash } }
  );
  return { raw, userId: existing.userId };
}

function serialize(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name || '',
    avatarUrl: user.avatarUrl || null,
  };
}

router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) throw new AppError('Email already registered', 'CONFLICT', 409);

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      email: req.body.email,
      passwordHash,
      name: req.body.name,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user, req.headers['user-agent']);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ user: serialize(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 'UNAUTHENTICATED', 401);
    }

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user, req.headers['user-agent']);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ user: serialize(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken) {
      clearAuthCookies(res);
      throw new AppError('Not authenticated', 'UNAUTHENTICATED', 401);
    }

    const { raw: nextRefresh, userId } = await rotateRefreshToken(rawToken, req.headers['user-agent']);
    const user = await User.findById(userId);
    if (!user) {
      await revokeTokenFamily(userId);
      clearAuthCookies(res);
      throw new AppError('Not authenticated', 'UNAUTHENTICATED', 401);
    }

    setAuthCookies(res, signAccessToken(user), nextRefresh);
    res.json({ user: serialize(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (rawToken) {
      await RefreshToken.updateOne(
        { tokenHash: hashToken(rawToken), revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    clearAuthCookies(res);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('Not authenticated', 'UNAUTHENTICATED', 401);
    res.json({ user: serialize(user) });
  } catch (e) {
    next(e);
  }
});

router.patch('/profile', requireAuth, validate(profileSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('Not authenticated', 'UNAUTHENTICATED', 401);

    const { name, email, currentPassword, newPassword } = req.body;

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const taken = await User.findOne({ email });
      if (taken) throw new AppError('Email already registered', 'CONFLICT', 409);
      user.email = email;
    }
    if (name !== undefined) user.name = name;

    if (newPassword) {
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 400);
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ user: serialize(user) });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/profile/avatar',
  requireAuth,
  avatarUpload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No image uploaded (expected multipart field "avatar")', 'UPLOAD_ERROR', 400);
      }
      const avatarUrl = await saveAvatar(req.user.id, req.file);
      const user = await User.findByIdAndUpdate(req.user.id, { avatarUrl }, { new: true });
      res.json({ user: serialize(user) });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
