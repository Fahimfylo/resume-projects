import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { authLimiter, sensitiveLimiter } from '../../common/middleware/rateLimiter';
import { authController } from './auth.controller';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validation';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', sensitiveLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', sensitiveLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/session/:id', authenticate, authController.revokeSession);
router.post('/verify-email', authenticate, validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);

export default router;
