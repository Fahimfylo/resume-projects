import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import * as projectService from '../services/project.service.js';

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const project = await projectService.createProject({ ...req.body, userId });
  sendCreated(res, project, 'Project created');
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await projectService.getUserProjects(userId, page, limit);
  sendPaginated(res, result.projects, result.total, result.page, result.limit);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const project = await projectService.getProjectById(req.params.id as string, userId);
  sendSuccess(res, project);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const project = await projectService.updateProject(req.params.id as string, userId, req.body);
  sendSuccess(res, project, 'Project updated');
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  await projectService.deleteProject(req.params.id as string, userId);
  sendSuccess(res, null, 'Project deleted');
});
