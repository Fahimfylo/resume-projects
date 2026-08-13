import { Router } from 'express';
import { cookieAuth } from '../../common/middleware/cookieAuth';
import { authorize } from '../../common/middleware/authorize';
import { Roles } from '../user/user.constants';
import { paymentController } from './payment.controller';

const router = Router();

router.get('/', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN), paymentController.listPayments);
router.post('/create-order', cookieAuth, authorize(Roles.ADMIN, Roles.CASHIER), paymentController.createOrder);
router.post('/verify-payment', cookieAuth, authorize(Roles.ADMIN, Roles.CASHIER), paymentController.verifyPayment);
router.post('/webhook-verification', paymentController.webhook);

export default router;
