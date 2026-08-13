import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  generateWorkspaceSchema,
  chatSchema,
  regenerateContentSchema,
} from '../validators/ai.validator.js';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);
router.post('/generate-workspace', validate(generateWorkspaceSchema), aiController.generateWorkspace);
router.post('/chat', validate(chatSchema), aiController.chat);
router.post('/regenerate-content', validate(regenerateContentSchema), aiController.regenerateContent);

export default router;
