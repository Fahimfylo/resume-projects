import { MenuCategory, FoodItem } from './menu.model';
import type { IMenuCategory, IFoodItem } from './menu.model';

export const menuCategoryRepository = {
  async findAll(activeOnly = true) {
    const filter = activeOnly ? { isActive: true } : {};
    return MenuCategory.find(filter).sort({ sortOrder: 1, name: 1 });
  },

  async findById(id: string) {
    return MenuCategory.findById(id);
  },

  async findBySlug(slug: string) {
    return MenuCategory.findOne({ slug });
  },

  async create(data: Partial<IMenuCategory>) {
    return MenuCategory.create(data);
  },

  async update(id: string, data: Partial<IMenuCategory>) {
    return MenuCategory.findByIdAndUpdate(id, data, { new: true });
  },

  async softDelete(id: string) {
    return MenuCategory.findByIdAndUpdate(id, { isActive: false }, { new: true });
  },
};

export const foodItemRepository = {
  async findAll(activeOnly = true, categoryId?: string) {
    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.isActive = true;
    if (categoryId) filter.menuCategory = categoryId;
    return FoodItem.find(filter).populate('menuCategory', 'name slug icon bgColor').sort({ name: 1 });
  },

  async findAllPaginated(activeOnly: boolean, categoryId: string | undefined, page: number, limit: number) {
    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.isActive = true;
    if (categoryId) filter.menuCategory = categoryId;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      FoodItem.find(filter).populate('menuCategory', 'name slug icon bgColor').sort({ name: 1 }).skip(skip).limit(limit),
      FoodItem.countDocuments(filter),
    ]);
    return { items, total };
  },

  async findById(id: string) {
    return FoodItem.findById(id).populate('menuCategory', 'name slug icon bgColor');
  },

  async findBySlug(slug: string) {
    return FoodItem.findOne({ slug }).populate('menuCategory', 'name slug icon bgColor');
  },

  async findByCategory(categoryId: string) {
    return FoodItem.find({ menuCategory: categoryId, isActive: true }).sort({ name: 1 });
  },

  async create(data: Partial<IFoodItem>) {
    return FoodItem.create(data);
  },

  async update(id: string, data: Partial<IFoodItem>) {
    return FoodItem.findByIdAndUpdate(id, data, { new: true });
  },

  async softDelete(id: string) {
    return FoodItem.findByIdAndUpdate(id, { isActive: false }, { new: true });
  },

  async countByCategory(categoryId: string) {
    return FoodItem.countDocuments({ menuCategory: categoryId, isActive: true });
  },

  async softDeleteByCategory(categoryId: string) {
    return FoodItem.updateMany({ menuCategory: categoryId }, { isActive: false });
  },
};
