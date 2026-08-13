import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import * as calendarService from '../services/calendar.service.js';

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const event = await calendarService.createEvent({ ...req.body, userId });
  sendCreated(res, event, 'Event created');
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const projectId = req.query.projectId as string;
  const { startDate, endDate } = req.query as Record<string, string | undefined>;
  const events = await calendarService.getProjectEvents(projectId, userId, startDate, endDate);
  sendSuccess(res, events);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  await calendarService.deleteEvent(req.params.id as string, userId);
  sendSuccess(res, null, 'Event deleted');
});
