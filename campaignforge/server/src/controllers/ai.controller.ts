import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import * as geminiService from '../services/gemini.service.js';
import * as projectService from '../services/project.service.js';
import * as strategyService from '../services/strategy.service.js';
import * as taskService from '../services/task.service.js';
import * as contentService from '../services/content.service.js';
import * as calendarService from '../services/calendar.service.js';

const VALID_PLATFORMS = ['Twitter', 'LinkedIn', 'Instagram', 'Email'] as const;
const VALID_EVENT_TYPES = ['task', 'content'] as const;

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

export const generateWorkspace = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { projectId } = req.body;

  const project = await projectService.getProjectById(projectId, userId);

  let result: any;
  try {
    result = await geminiService.generateWorkspace({
      businessName: project.businessName,
      businessType: project.businessType,
      goal: project.goal,
      targetAudience: project.targetAudience,
      budget: project.budget,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.warn(`AI generation failed: ${errMsg}. Creating fallback workspace`);
    result = null;
  }

  if (!result) {
    try {
      await strategyService.createOrUpdateStrategy({
        projectId,
        userId,
        executiveSummary: `Marketing campaign for ${project.businessName}`,
        corePillars: [{ title: 'Brand Awareness', desc: 'Establish a strong market presence' }],
        targetPersonas: [],
        timelinePhases: [{ name: 'Launch', duration: '30 days', description: 'Initial campaign launch' }],
      });
    } catch (strategyErr) {
      logger.error('Fallback strategy creation failed', strategyErr);
    }

    const defaultTasks = [
      { title: 'Define target audience segments', priority: 'high' as const, category: 'Strategy', dueDate: new Date(Date.now() + 7 * 86400000) },
      { title: 'Create content calendar', priority: 'medium' as const, category: 'Content', dueDate: new Date(Date.now() + 14 * 86400000) },
      { title: 'Launch first campaign', priority: 'high' as const, category: 'Execution', dueDate: new Date(Date.now() + 21 * 86400000) },
    ];
    for (const t of defaultTasks) {
      try { await taskService.createTask({ projectId, userId, ...t }); } catch { /* skip */ }
    }

    const defaultContent = [
      { platform: 'LinkedIn' as const, contentType: 'Post', text: `Excited to announce the launch of ${project.businessName}! Stay tuned for updates.` },
      { platform: 'Twitter' as const, contentType: 'Post', text: `Big things are happening at ${project.businessName}. Follow along for the journey!` },
    ];
    for (const c of defaultContent) {
      try { await contentService.createContent({ projectId, userId, ...c }); } catch { /* skip */ }
    }

    const defaultEvents = [
      { title: `${project.businessName} Launch`, date: new Date(Date.now() + 21 * 86400000), type: 'task' as const, details: 'Campaign launch date' },
      { title: 'Content Review', date: new Date(Date.now() + 7 * 86400000), type: 'task' as const, details: 'Review first batch of content' },
    ];
    for (const e of defaultEvents) {
      try { await calendarService.createEvent({ projectId, userId, ...e }); } catch { /* skip */ }
    }

    sendSuccess(res, { strategy: { executiveSummary: `Marketing campaign for ${project.businessName}` } }, 'Workspace created with fallback strategy');
    return;
  }

  if (result.strategy) {
    await strategyService.createOrUpdateStrategy({
      projectId,
      userId,
      executiveSummary: result.strategy.executiveSummary || '',
      corePillars: result.strategy.corePillars || [],
      targetPersonas: result.strategy.targetPersonas || [],
      timelinePhases: result.strategy.timelinePhases || [],
    });
  }

  if (result.tasks) {
    for (const task of result.tasks) {
      const dueDate = new Date(task.dueDate);
      if (!isValidDate(dueDate)) {
        logger.warn(`Skipping task "${task.title || '(untitled)'}" due to invalid dueDate: ${task.dueDate}`);
        continue;
      }
      try {
        await taskService.createTask({
          projectId,
          userId,
          title: task.title,
          priority: task.priority || 'medium',
          category: task.category || 'General',
          dueDate,
        });
      } catch (err) {
        logger.warn('Failed to create task from AI response', err);
      }
    }
  }

  if (result.content) {
    for (const item of result.content) {
      if (!item.platform || !VALID_PLATFORMS.includes(item.platform)) {
        logger.warn(`Skipping content with invalid platform: ${item.platform}`);
        continue;
      }
      if (!item.text) {
        logger.warn('Skipping content with empty text');
        continue;
      }
      try {
        await contentService.createContent({
          projectId,
          userId,
          platform: item.platform,
          contentType: item.contentType || 'Post',
          text: item.text,
        });
      } catch (err) {
        logger.warn('Failed to create content from AI response', err);
      }
    }
  }

  if (result.calendarEvents) {
    for (const event of result.calendarEvents) {
      const eventDate = new Date(event.date);
      if (!isValidDate(eventDate)) {
        logger.warn(`Skipping calendar event "${event.title || '(untitled)'}" due to invalid date: ${event.date}`);
        continue;
      }
      if (event.type && !VALID_EVENT_TYPES.includes(event.type)) {
        logger.warn(`Skipping calendar event "${event.title}" due to invalid type: ${event.type}`);
        continue;
      }
      try {
        await calendarService.createEvent({
          projectId,
          userId,
          title: event.title,
          date: eventDate,
          type: event.type || 'task',
          details: event.details || '',
        });
      } catch (err) {
        logger.warn('Failed to create calendar event from AI response', err);
      }
    }
  }

  sendSuccess(res, result, 'Workspace generated');
});

export const chat = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { projectId, message } = req.body;

  const project = await projectService.getProjectById(projectId, userId);

  let response: any;
  try {
    response = await geminiService.chatWithAi(message, {
      businessName: project.businessName,
      goal: project.goal,
    });
  } catch (err) {
    logger.warn('AI chat failed, returning fallback response', err);
    response = {
      type: 'text',
      data: "I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment. If the issue persists, check that the API key is configured correctly.",
    };
  }

  sendSuccess(res, { response, projectId });
});

export const regenerateContent = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { projectId, contentId, platform, instructions } = req.body;

  const existingContent = contentId
    ? (await contentService.getProjectContent(projectId, userId)).filter(
        (c) => c._id.toString() === contentId
      )[0]?.text || ''
    : (await contentService.getProjectContent(projectId, userId, platform))
        .map((c) => c.text)
        .join('\n');

  let result: any;
  try {
    result = await geminiService.regenerateContent(existingContent, instructions);
  } catch (err) {
    logger.warn('AI content regeneration failed', err);
    sendSuccess(res, null, 'AI generation failed. Please try again later.', 502);
    return;
  }
  sendSuccess(res, result, 'Content regenerated');
});
