import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import * as strategyService from '../services/strategy.service.js';

export const getByProject = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const strategy = await strategyService.getStrategy(req.params.projectId as string, userId);
  sendSuccess(res, strategy);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const strategy = await strategyService.createOrUpdateStrategy({
    ...req.body,
    userId,
    projectId: req.params.projectId as string,
  });
  sendSuccess(res, strategy, 'Strategy updated');
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  await strategyService.deleteStrategy(req.params.projectId as string, userId);
  sendSuccess(res, null, 'Strategy deleted');
});
