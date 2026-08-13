import { z } from 'zod';

const targetAudienceSchema = z.object({
  age: z.string().optional().default('25-40'),
  gender: z.string().optional().default('All'),
  interests: z.array(z.string()).optional().default([]),
});

export const createProjectSchema = {
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(200),
    businessName: z.string().min(1, 'Business name is required'),
    businessType: z.string().min(1, 'Business type is required'),
    goal: z.string().min(1, 'Goal is required').max(2000),
    targetAudience: targetAudienceSchema.optional().default({}),
    budget: z.string().optional().default('$1,000'),
  }),
};

export const updateProjectSchema = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    businessName: z.string().min(1).optional(),
    businessType: z.string().min(1).optional(),
    goal: z.string().min(1).max(2000).optional(),
    targetAudience: targetAudienceSchema.optional(),
    budget: z.string().optional(),
    status: z.enum(['active', 'completed', 'draft']).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
  }),
};

export const projectIdSchema = {
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
  }),
};

export const strategyProjectIdSchema = {
  params: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
};

export const projectQuerySchema = {
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
  }),
};
