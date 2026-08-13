import { menuCategoryRepository, foodItemRepository } from './menu.repository';

export const menuService = {
  // --- Categories ---
  async getCategories(activeOnly = true) {
    return menuCategoryRepository.findAll(activeOnly);
  },

  async getCategory(id: string) {
    const category = await menuCategoryRepository.findById(id);
    if (!category) {
      const { notFound } = await import('../../common/errors/HttpError');
      throw notFound('Category not found');
    }
    return category;
  },

  async createCategory(data: { name: string; icon?: string; bgColor?: string; sortOrder?: number }) {
    const existing = await menuCategoryRepository.findBySlug(
      data.name.toLowerCase().replace(/\s+/g, '-')
    );
    if (existing) {
      const { conflict } = await import('../../common/errors/HttpError');
      throw conflict('Category with this name already exists');
    }
    return menuCategoryRepository.create(data);
  },

  async updateCategory(id: string, data: Record<string, unknown>) {
    await this.getCategory(id);
    return menuCategoryRepository.update(id, data);
  },

  async deleteCategory(id: string) {
    await this.getCategory(id);
    const itemCount = await foodItemRepository.countByCategory(id);
    if (itemCount > 0) {
      await foodItemRepository.softDeleteByCategory(id);
    }
    return menuCategoryRepository.softDelete(id);
  },

  // --- Food Items ---
  async getFoodItems(activeOnly = true, categoryId?: string) {
    return foodItemRepository.findAll(activeOnly, categoryId);
  },

  async getFoodItemsPaginated(activeOnly: boolean, categoryId: string | undefined, page: number, limit: number) {
    return foodItemRepository.findAllPaginated(activeOnly, categoryId, page, limit);
  },

  async getFoodItem(id: string) {
    const item = await foodItemRepository.findById(id);
    if (!item) {
      const { notFound } = await import('../../common/errors/HttpError');
      throw notFound('Food item not found');
    }
    return item;
  },

  async createFoodItem(data: {
    name: string;
    price: number;
    menuCategory: string;
    description?: string;
    image?: string;
    images?: string[];
    cookingTime?: string;
    spiceLevel?: number;
    category?: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    ingredients?: string[];
    preparationNotes?: string;
    isAvailable?: boolean;
    isChefRecommendation?: boolean;
  }) {
    const cat = await menuCategoryRepository.findById(data.menuCategory);
    if (!cat) {
      const { badRequest } = await import('../../common/errors/HttpError');
      throw badRequest('Invalid menu category');
    }
    return foodItemRepository.create(data as any);
  },

  async updateFoodItem(id: string, data: Record<string, unknown>) {
    const item = await foodItemRepository.findById(id);
    if (!item) {
      const { notFound } = await import('../../common/errors/HttpError');
      throw notFound('Food item not found');
    }
    if (data.menuCategory) {
      const cat = await menuCategoryRepository.findById(data.menuCategory as string);
      if (!cat) {
        const { badRequest } = await import('../../common/errors/HttpError');
        throw badRequest('Invalid menu category');
      }
    }
    return foodItemRepository.update(id, data);
  },

  async deleteFoodItem(id: string) {
    const item = await foodItemRepository.findById(id);
    if (!item) {
      const { notFound } = await import('../../common/errors/HttpError');
      throw notFound('Food item not found');
    }
    return foodItemRepository.softDelete(id);
  },
};
