import { Router } from 'express';
import * as strategyController from '../controllers/strategy.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { strategyProjectIdSchema } from '../validators/project.validator.js';

const router = Router();

router.use(authenticate);
router.get('/:projectId', validate(strategyProjectIdSchema), strategyController.getByProject);
router.put('/:projectId', validate(strategyProjectIdSchema), strategyController.update);
router.delete('/:projectId', validate(strategyProjectIdSchema), strategyController.remove);

export default router;
