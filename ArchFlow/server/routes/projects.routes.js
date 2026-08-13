import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as projService from '../services/projectService.js';
import { serializeProject } from '../services/serializers.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).optional().default(''),
});

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
});

router.get('/workspaces/:workspaceId/projects', async (req, res, next) => {
  try {
    const projects = await projService.listProjects(req.params.workspaceId, req.ownerId);
    res.json(projects.map(serializeProject));
  } catch (e) {
    next(e);
  }
});

router.post('/workspaces/:workspaceId/projects', validate(createSchema), async (req, res, next) => {
  try {
    const proj = await projService.createProject({
      ...req.body,
      workspaceId: req.params.workspaceId,
      ownerId: req.ownerId,
    });
    res.status(201).json(serializeProject(proj));
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(serializeProject(proj));
  } catch (e) {
    next(e);
  }
});

router.patch('/projects/:id', validate(patchSchema), async (req, res, next) => {
  try {
    const proj = await projService.updateProject(req.params.id, req.body, req.ownerId);
    res.json(serializeProject(proj));
  } catch (e) {
    next(e);
  }
});

router.delete('/projects/:id', async (req, res, next) => {
  try {
    await projService.deleteProject(req.params.id, req.ownerId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
