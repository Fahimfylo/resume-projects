import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { sendSuccess, sendCreated } from '../../common/responses/apiResponse';
import { env } from '../../config/env';
import { authService } from './auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendCreated(res, { user: result.user, accessToken: result.accessToken }, 'Registration successful');
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 'Login successful');
  }),

  // Backward-compatible login for pos-frontend
  loginLegacy: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password);

    // Set the old-style accessToken cookie that pos-frontend expects
    res.cookie('accessToken', result.accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    // Also set the new refresh token cookie
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'User login successfully!',
      data: {
        _id: (result.user as any).id,
        name: (result.user as any).name,
        email: (result.user as any).email,
        phone: '',
        role: (result.user as any).role,
      },
    });
  }),

  // Backward-compatible register for pos-frontend
  registerLegacy: asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, email, password, role } = req.body;
    const [firstName, ...lastNameParts] = (name || '').split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const result = await authService.register(
      { firstName, lastName, email, password },
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );

    // Update role if provided (pos-frontend allows setting role on register)
    if (role) {
      const { userRepository } = await import('../user/user.repository');
      await userRepository.update((result.user as any).id, { role } as any);
    }

    res.status(201).json({
      success: true,
      message: 'New user created!',
      data: {
        _id: (result.user as any).id,
        name: (result.user as any).name,
        email: (result.user as any).email,
        phone: phone || '',
        role: role || 'customer',
      },
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user!.userId, req.user!.sessionId);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    sendSuccess(res, null, 'Logged out successfully');
  }),

  // Backward-compatible logout for pos-frontend
  logoutLegacy: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user!.userId, req.user!.sessionId);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(200).json({ success: true, message: 'User logout successfully!' });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }

    const result = await authService.refresh(refreshToken);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const { userService } = await import('../user/user.service');
    const user = await userService.getProfile(req.user!.userId);
    sendSuccess(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isProfileComplete: user.isProfileComplete(),
    });
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.userId, req.user!.sessionId);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    sendSuccess(res, null, 'Logged out from all devices');
  }),

  getSessions: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await authService.getSessions(req.user!.userId);
    sendSuccess(res, sessions);
  }),

  revokeSession: asyncHandler(async (req: Request, res: Response) => {
    await authService.revokeSession(req.user!.userId, req.params.id);
    sendSuccess(res, null, 'Session revoked');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, null, result.message);
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, result.message);
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyEmail(req.body.token);
    sendSuccess(res, null, result.message);
  }),

  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resendVerification(req.user!.userId);
    sendSuccess(res, null, result.message);
  }),
};
