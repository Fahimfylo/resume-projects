import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw ApiError.badRequest('No file provided');
  }

  const url = `/uploads/avatars/${file.filename}`;

  const userId = (req as any).user?.id || (req as any).user?._id;
  if (userId) {
    await User.findByIdAndUpdate(userId, { avatarUrl: url }, { new: true });
  }

  sendSuccess(res, { url }, 'Avatar uploaded');
});
