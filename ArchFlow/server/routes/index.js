import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import workspacesRouter from './workspaces.routes.js';
import projectsRouter from './projects.routes.js';
import uploadRouter from './upload.routes.js';
import analysisRouter from './analysis.routes.js';
import graphRouter from './graph.routes.js';
import aiRouter from './ai.routes.js';
import authRouter from './auth.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use(requireAuth);
router.use(workspacesRouter);
router.use(projectsRouter);
router.use(uploadRouter);
router.use(analysisRouter);
router.use(graphRouter);
router.use(aiRouter);

export default router;
