import { Router } from 'express';
import { cookieAuth } from '../../common/middleware/cookieAuth';
import { authorize } from '../../common/middleware/authorize';
import { Roles } from '../user/user.constants';
import { tableController } from './table.controller';

const router = Router();

router.use(cookieAuth);

router.post('/', authorize(Roles.ADMIN, Roles.MANAGER), tableController.create);
router.get('/', authorize(Roles.ADMIN, Roles.MANAGER, Roles.CASHIER, Roles.CHEF), tableController.getAll);
router.put('/:id', authorize(Roles.ADMIN, Roles.MANAGER), tableController.update);

export default router;
