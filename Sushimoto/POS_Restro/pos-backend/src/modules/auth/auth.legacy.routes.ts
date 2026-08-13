import { Router } from 'express';
import { authController } from './auth.controller';
import { authLimiter } from '../../common/middleware/rateLimiter';
import { cookieAuth } from '../../common/middleware/cookieAuth';
import { authorize } from '../../common/middleware/authorize';
import { Roles } from '../user/user.constants';

const router = Router();

// Backward-compatible routes for pos-frontend (old API style)
router.post('/register', cookieAuth, authorize(Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER), authLimiter, authController.registerLegacy);
router.post('/login', authLimiter, authController.loginLegacy);
router.post('/logout', cookieAuth, authController.logoutLegacy);
router.get('/', cookieAuth, authController.getMe);

export default router;
