import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import * as authService from '../services/auth.service.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import { extractRefreshToken } from '../middleware/auth.middleware.js';
import passport from '../../config/passport.js';
import { env } from '../../config/env.js';
import { User } from '../../models/User.js';
import { Project } from '../../models/Project.js';
import { Strategy } from '../../models/Strategy.js';
import { Task } from '../../models/Task.js';
import { ContentItem } from '../../models/ContentItem.js';
import { CalendarEvent } from '../../models/CalendarEvent.js';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name, businessName, businessType } = req.body;
  const result = await authService.registerUser(email, password, name, businessName, businessType, req);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendCreated(res, { user: result.user }, 'Account created successfully');
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password, req);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendSuccess(res, { user: result.user }, 'Login successful');
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = extractRefreshToken(req) || req.body?.refreshToken;
  if (!token) {
    return sendSuccess(res, null, 'No refresh token');
  }
  const tokens = await authService.refreshAccessToken(token, req);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendSuccess(res, null, 'Token refreshed');
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (userId) await authService.logoutUser(userId);
  clearAuthCookies(res);
  sendSuccess(res, null, 'Logged out successfully');
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const user = await authService.getCurrentUser(userId);
  sendSuccess(res, user);
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const user = await authService.updateUserProfile(userId, req.body);
  sendSuccess(res, user, 'Profile updated');
});

export const googleAuth = passport.authenticate('google', {
  session: false,
  scope: ['profile', 'email'],
});

export const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.redirect(`${env.appUrl}/sign-in?error=google_auth_failed`);
  }
  const result = await authService.handleGoogleAuth(user._id.toString(), user.email, req);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  return res.redirect(`${env.appUrl}/dashboard`);
});



export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  sendSuccess(res, null, 'If that email is registered, a reset link has been sent');
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  sendSuccess(res, null, 'Password reset successfully');
});

export const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;

  const projects = await Project.find({ userId }).select('_id');
  const projectIds = projects.map((p) => p._id);

  await Promise.all([
    Strategy.deleteMany({ userId }),
    Strategy.deleteMany({ projectId: { $in: projectIds } }),
    Task.deleteMany({ userId }),
    Task.deleteMany({ projectId: { $in: projectIds } }),
    ContentItem.deleteMany({ userId }),
    ContentItem.deleteMany({ projectId: { $in: projectIds } }),
    CalendarEvent.deleteMany({ userId }),
    CalendarEvent.deleteMany({ projectId: { $in: projectIds } }),
    Project.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  clearAuthCookies(res);
  sendSuccess(res, null, 'Account deleted permanently');
});
