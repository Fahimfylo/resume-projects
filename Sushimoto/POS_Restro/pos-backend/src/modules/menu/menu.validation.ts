import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  icon: z.string().optional(),
  bgColor: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  icon: z.string().optional(),
  bgColor: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const createFoodItemSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().optional(),
  price: z.number().positive(),
  menuCategory: z.string().min(1),
  category: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  cookingTime: z.string().optional(),
  spiceLevel: z.number().int().min(0).max(5).optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  fat: z.number().optional(),
  carbs: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
  preparationNotes: z.string().optional(),
  isAvailable: z.boolean().optional(),
  isChefRecommendation: z.boolean().optional(),
});

export const updateFoodItemSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  menuCategory: z.string().optional(),
  category: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  cookingTime: z.string().optional(),
  spiceLevel: z.number().int().min(0).max(5).optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  fat: z.number().optional(),
  carbs: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
  preparationNotes: z.string().optional(),
  isAvailable: z.boolean().optional(),
  isChefRecommendation: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
