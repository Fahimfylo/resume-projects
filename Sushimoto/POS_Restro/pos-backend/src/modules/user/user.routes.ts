import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { userController } from './user.controller';
import {
  updateProfileSchema,
  changePasswordSchema,
  completeProfileSchema,
} from './user.validation';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.patch('/change-password', validate(changePasswordSchema), userController.changePassword);
router.post('/complete-profile', validate(completeProfileSchema), userController.completeProfile);

export default router;
