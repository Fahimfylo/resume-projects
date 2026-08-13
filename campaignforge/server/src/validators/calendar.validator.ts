import { z } from 'zod';

export const createEventSchema = {
  body: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
    title: z.string().min(1).max(200),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    type: z.enum(['task', 'content']),
    details: z.string().max(1000).optional().default(''),
  }),
};

export const eventQuerySchema = {
  query: z.object({
    projectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date')
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date')
      .optional(),
  }),
};

export const eventIdSchema = {
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid event ID'),
  }),
};
