import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { createTaskSchema, updateTaskSchema, taskIdSchema } from '../validators/task.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', taskController.getAll);
router.post('/', validate(createTaskSchema), taskController.create);
router.patch('/:id', validate(updateTaskSchema), taskController.updateStatus);
router.delete('/:id', validate(taskIdSchema), taskController.remove);

export default router;
