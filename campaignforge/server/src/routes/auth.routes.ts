import { Router } from 'express';
import * as authController from '../auth/controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from '../auth/validators/auth.validator.js';
import passport from '../config/passport.js';

const router = Router();

router.use(authLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.delete('/me', authenticate, authController.deleteAccount);

router.get('/google', authController.googleAuth);
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.APP_URL || 'http://localhost:3000'}/sign-in?error=google_auth_failed` }), authController.googleCallback);

router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
