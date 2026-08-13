import { z } from 'zod';

export const generateWorkspaceSchema = {
  body: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
  }),
};

export const chatSchema = {
  body: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
    message: z.string().min(1, 'Message is required').max(2000),
  }),
};

export const regenerateContentSchema = {
  body: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
    contentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid content ID').optional(),
    platform: z.enum(['Twitter', 'LinkedIn', 'Instagram', 'Email']).optional(),
    instructions: z.string().max(1000).optional(),
  }),
};
