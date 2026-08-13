import { Router } from 'express';
import { cookieAuth } from '../../common/middleware/cookieAuth';
import { authorize } from '../../common/middleware/authorize';
import { validate } from '../../common/middleware/validate';
import { userController } from './user.controller';
import { Roles } from './user.constants';
import { adminCreateUserSchema, adminUpdateUserSchema } from './user.validation';

const router = Router();

router.use(cookieAuth);

router.get('/', authorize(Roles.SUPERADMIN, Roles.ADMIN, Roles.WAITER), userController.adminListUsers);
router.get('/:id', authorize(Roles.SUPERADMIN, Roles.ADMIN), userController.adminGetUser);
router.post('/', authorize(Roles.SUPERADMIN, Roles.ADMIN), validate(adminCreateUserSchema), userController.adminCreateUser);
router.put('/:id', authorize(Roles.SUPERADMIN, Roles.ADMIN, Roles.WAITER), validate(adminUpdateUserSchema), userController.adminUpdateUser);
router.delete('/:id', authorize(Roles.SUPERADMIN, Roles.ADMIN), userController.adminDeleteUser);

export default router;
