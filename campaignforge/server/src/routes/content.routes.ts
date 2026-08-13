import { Router } from 'express';
import * as contentController from '../controllers/content.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import {
  createContentSchema,
  contentQuerySchema,
  contentIdSchema,
} from '../validators/content.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', validate(contentQuerySchema), contentController.getAll);
router.post('/', validate(createContentSchema), contentController.create);
router.delete('/:id', validate(contentIdSchema), contentController.remove);

export default router;
