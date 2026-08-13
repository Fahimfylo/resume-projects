import { z } from 'zod';
import { PASSWORD_POLICY } from './user.constants';

const passwordSchema = z
  .string()
  .min(PASSWORD_POLICY.MIN_LENGTH, `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`)
  .max(PASSWORD_POLICY.MAX_LENGTH, `Password must be at most ${PASSWORD_POLICY.MAX_LENGTH} characters`);

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  birthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  preferences: z
    .object({
      favoriteCategories: z.array(z.string()).optional(),
      favoriteFoods: z.array(z.string()).optional(),
      notifications: z
        .object({
          email: z.boolean().optional(),
          sms: z.boolean().optional(),
          push: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  addresses: z.array(addressSchema).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const adminCreateUserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: passwordSchema,
  phone: z.string().optional(),
  role: z.string().min(1),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const completeProfileSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  address: addressSchema,
});
