import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { menuService } from './menu.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/responses/apiResponse';

export const menuController = {
  // --- Categories ---
  getCategories: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await menuService.getCategories();
    sendSuccess(res, categories);
  }),

  getCategory: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await menuService.getCategory(id);
    sendSuccess(res, category);
  }),

  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await menuService.createCategory(req.body);
    sendCreated(res, category, 'Category created');
  }),

  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await menuService.updateCategory(id, req.body);
    sendSuccess(res, category, 'Category updated');
  }),

  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await menuService.deleteCategory(id);
    sendSuccess(res, null, 'Category deleted');
  }),

  // --- Food Items ---
  getFoodItems: asyncHandler(async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 13));
    const { items, total } = await menuService.getFoodItemsPaginated(true, categoryId, page, limit);
    sendPaginated(res, items, total, page, limit);
  }),

  getFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const item = await menuService.getFoodItem(id);
    sendSuccess(res, item);
  }),

  createFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await menuService.createFoodItem(req.body);
    sendCreated(res, item, 'Food item created');
  }),

  updateFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const item = await menuService.updateFoodItem(id, req.body);
    sendSuccess(res, item, 'Food item updated');
  }),

  deleteFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await menuService.deleteFoodItem(id);
    sendSuccess(res, null, 'Food item deleted');
  }),
};
