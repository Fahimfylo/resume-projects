import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().max(100).optional(),
    businessName: z
      .string()
      .min(1, 'Business name is required')
      .max(100, 'Business name too long'),
    businessType: z.string().optional().default('Services'),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required').optional(),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
};

export const updateProfileSchema = {
  body: z.object({
    name: z.string().max(100).optional(),
    businessName: z.string().min(1).max(100).optional(),
    businessType: z.string().max(100).optional(),
    avatarUrl: z.string().max(500).optional().nullable(),
  }),
};
