import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import * as taskService from '../services/task.service.js';

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const task = await taskService.createTask({ ...req.body, userId });
  sendCreated(res, task, 'Task created');
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const projectId = req.query.projectId as string;
  const tasks = await taskService.getProjectTasks(projectId, userId);
  sendSuccess(res, tasks);
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { status } = req.body;
  const task = await taskService.updateTaskStatus(req.params.id as string, userId, status);
  sendSuccess(res, task, 'Task status updated');
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  await taskService.deleteTask(req.params.id as string, userId);
  sendSuccess(res, null, 'Task deleted');
});
