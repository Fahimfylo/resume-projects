import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  projectQuerySchema,
} from '../validators/project.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', validate(projectQuerySchema), projectController.getAll);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/:id', validate(projectIdSchema), projectController.getById);
router.patch('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id', validate(projectIdSchema), projectController.remove);

export default router;
