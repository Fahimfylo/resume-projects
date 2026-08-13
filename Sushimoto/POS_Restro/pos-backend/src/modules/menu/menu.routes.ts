import { Router } from 'express';
import { menuController } from './menu.controller';
import { cookieAuth } from '../../common/middleware/cookieAuth';
import { authorize } from '../../common/middleware/authorize';
import { validate } from '../../common/middleware/validate';
import { Roles } from '../user/user.constants';
import {
  createCategorySchema,
  updateCategorySchema,
  createFoodItemSchema,
  updateFoodItemSchema,
} from './menu.validation';

const router = Router();

// Categories
router.get('/categories', menuController.getCategories);
router.get('/categories/:id', menuController.getCategory);
router.post('/categories', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER), validate(createCategorySchema), menuController.createCategory);
router.put('/categories/:id', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.WAITER), validate(updateCategorySchema), menuController.updateCategory);
router.delete('/categories/:id', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN), menuController.deleteCategory);

// Food Items
router.get('/items', menuController.getFoodItems);
router.get('/items/:id', menuController.getFoodItem);
router.post('/items', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.WAITER), validate(createFoodItemSchema), menuController.createFoodItem);
router.put('/items/:id', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.WAITER), validate(updateFoodItemSchema), menuController.updateFoodItem);
router.delete('/items/:id', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN), menuController.deleteFoodItem);

export default router;
