import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as wsService from '../services/workspaceService.js';
import { serializeWorkspace } from '../services/serializers.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).optional().default(''),
});

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
});

router.get('/workspaces', async (req, res, next) => {
  try {
    const items = await wsService.listWorkspaces(req.ownerId);
    res.json(items.map(({ ws, stats }) => ({ ...serializeWorkspace(ws), stats })));
  } catch (e) {
    next(e);
  }
});

router.post('/workspaces', validate(createSchema), async (req, res, next) => {
  try {
    const ws = await wsService.createWorkspace({ ...req.body, ownerId: req.ownerId });
    const { stats } = await wsService.getWorkspace(ws._id, req.ownerId);
    res.status(201).json({ ...serializeWorkspace(ws), stats });
  } catch (e) {
    next(e);
  }
});

router.get('/workspaces/:id', async (req, res, next) => {
  try {
    const { ws, stats } = await wsService.getWorkspace(req.params.id, req.ownerId);
    res.json({ ...serializeWorkspace(ws), stats });
  } catch (e) {
    next(e);
  }
});

router.patch('/workspaces/:id', validate(patchSchema), async (req, res, next) => {
  try {
    const { ws, stats } = await wsService.updateWorkspace(req.params.id, req.body, req.ownerId);
    res.json({ ...serializeWorkspace(ws), stats });
  } catch (e) {
    next(e);
  }
});

router.delete('/workspaces/:id', async (req, res, next) => {
  try {
    await wsService.deleteWorkspace(req.params.id, req.ownerId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
