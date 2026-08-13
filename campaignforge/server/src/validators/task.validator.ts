import { z } from 'zod';

export const createTaskSchema = {
  body: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
    title: z.string().min(1, 'Task title is required').max(500),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    category: z.string().optional().default('General'),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  }),
};

export const updateTaskSchema = {
  body: z.object({
    status: z.enum(['todo', 'progress', 'done']),
  }),
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid task ID'),
  }),
};

export const taskIdSchema = {
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid task ID'),
  }),
};
