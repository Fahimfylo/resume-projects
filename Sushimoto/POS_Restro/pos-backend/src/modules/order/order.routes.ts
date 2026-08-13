import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { cookieAuth } from '../../common/middleware/cookieAuth';
import { authorize } from '../../common/middleware/authorize';
import { Roles } from '../user/user.constants';
import { orderController } from './order.controller';

const router = Router();

// Customer route (sushi frontend, Bearer token)
router.get('/mine', authenticate, orderController.getMyOrders);

// Staff routes (POS frontend, cookie auth)
router.use(cookieAuth);

router.post('/', authorize(Roles.ADMIN, Roles.MANAGER, Roles.CASHIER), orderController.create);
router.get('/', authorize(Roles.ADMIN, Roles.MANAGER, Roles.CHEF, Roles.CASHIER), orderController.getAll);
router.get('/:id', authorize(Roles.ADMIN, Roles.MANAGER, Roles.CHEF, Roles.CASHIER), orderController.getById);
router.put('/:id', authorize(Roles.ADMIN, Roles.MANAGER, Roles.CHEF), orderController.updateStatus);

export default router;
