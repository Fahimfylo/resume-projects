import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { sendSuccess, sendCreated, sendError } from '../../common/responses/apiResponse';
import { userService } from './user.service';

export const userController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.userId);
    sendSuccess(res, user, 'Profile retrieved');
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, user, 'Profile updated');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user!.userId, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  }),

  completeProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.completeProfile(req.user!.userId, req.body);
    sendSuccess(res, user, 'Profile completed');
  }),

  // Backward-compatible: pos-frontend expects { success: true, data: user }
  getProfileLegacy: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.userId);
    res.status(200).json({ success: true, data: user });
  }),

  // --- Admin User Management ---
  adminListUsers: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await userService.adminListUsers(req.user!.role, page, limit);
    sendSuccess(res, result, 'Users retrieved');
  }),

  adminGetUser: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await userService.adminGetUser(req.user!.role, id);
    sendSuccess(res, user, 'User retrieved');
  }),

  adminCreateUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.adminCreateUser(req.user!.role, req.body);
    sendCreated(res, user, 'User created');
  }),

  adminUpdateUser: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await userService.adminUpdateUser(req.user!.role, id, req.body);
    sendSuccess(res, user, 'User updated');
  }),

  adminDeleteUser: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await userService.adminDeleteUser(req.user!.role, id);
    sendSuccess(res, null, 'User deleted');
  }),
};
