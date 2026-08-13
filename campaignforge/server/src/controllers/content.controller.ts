import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import * as contentService from '../services/content.service.js';

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const content = await contentService.createContent({ ...req.body, userId });
  sendCreated(res, content, 'Content created');
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const projectId = req.query.projectId as string;
  const platform = req.query.platform as string | undefined;
  const items = await contentService.getProjectContent(projectId, userId, platform);
  sendSuccess(res, items);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  await contentService.deleteContent(req.params.id as string, userId);
  sendSuccess(res, null, 'Content deleted');
});
