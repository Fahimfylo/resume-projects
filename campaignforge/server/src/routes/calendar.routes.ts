import { Router } from 'express';
import * as calendarController from '../controllers/calendar.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import {
  createEventSchema,
  eventQuerySchema,
  eventIdSchema,
} from '../validators/calendar.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', validate(eventQuerySchema), calendarController.getAll);
router.post('/', validate(createEventSchema), calendarController.create);
router.delete('/:id', validate(eventIdSchema), calendarController.remove);

export default router;
