import { z } from 'zod';

export const createContentSchema = {
  body: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
    platform: z.enum(['Twitter', 'LinkedIn', 'Instagram', 'Email']),
    contentType: z.string().min(1).max(100),
    text: z.string().min(1).max(10000),
  }),
};

export const contentQuerySchema = {
  query: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
    platform: z.enum(['Twitter', 'LinkedIn', 'Instagram', 'Email']).optional(),
  }),
};

export const contentIdSchema = {
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid content ID'),
  }),
};
