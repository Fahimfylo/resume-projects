import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as graphService from '../services/graphService.js';
import * as projService from '../services/projectService.js';

const router = Router();

const levelQuery = z.object({ level: z.enum(['system', 'modules', 'components', 'files']).optional().default('system') });
const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const sizeSchema = z.object({
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

const nodeSchema = z.object({
  label: z.string().min(1, 'Label is required').max(120),
  subtitle: z.string().max(200).optional(),
  category: z.enum([
    'page', 'component', 'route', 'controller', 'service', 'model',
    'external-api', 'db-table', 'hook', 'store',
  ]).optional().default('component'),
  filePath: z.string().max(500).optional(),
  summary: z.string().max(2000).optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  parentId: z.string().max(200).nullable().optional(),
});

const edgeSchema = z.object({
  source: z.string().min(1).max(200),
  target: z.string().min(1).max(200),
  relationshipType: z.string().max(60).optional().default('DEPENDS_ON'),
});

// --- Scope-based drill-down ---

router.get('/projects/:id/graph/root', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(await graphService.getRoot(proj._id));
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id/graph/all', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(await graphService.getFullGraph(proj._id));
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id/graph/:nodeId/children', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(await graphService.getChildren(proj._id, req.params.nodeId));
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id/graph/:nodeId/path', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(await graphService.getPath(proj._id, req.params.nodeId));
  } catch (e) {
    next(e);
  }
});

// --- Node CRUD (scope-aware) ---

router.post('/projects/:id/graph/nodes', validate(nodeSchema), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    const node = await graphService.addNode(proj._id, req.body);
    res.status(201).json(node);
  } catch (e) {
    next(e);
  }
});

router.patch('/projects/:id/graph/nodes/:nodeId/position', validate(positionSchema), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    await graphService.updateNodePosition(proj._id, req.params.nodeId, req.body.x, req.body.y);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.patch('/projects/:id/graph/nodes/:nodeId/size', validate(sizeSchema), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    await graphService.updateNodeSize(proj._id, req.params.nodeId, req.body.width, req.body.height);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.delete('/projects/:id/graph/nodes/:nodeId', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    await graphService.deleteNode(proj._id, req.params.nodeId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id/graph/nodes/:nodeId', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(await graphService.getNode(proj._id, req.params.nodeId));
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id/graph/edges/:edgeId', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(await graphService.getEdge(proj._id, req.params.edgeId));
  } catch (e) {
    next(e);
  }
});

// --- Edge CRUD (manual connections) ---

router.post('/projects/:id/graph/edges', validate(edgeSchema), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    const edge = await graphService.addEdge(proj._id, req.body);
    res.status(201).json(edge);
  } catch (e) {
    next(e);
  }
});

router.delete('/projects/:id/graph/edges/:edgeId', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    await graphService.deleteEdge(proj._id, req.params.edgeId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// --- Deprecated level shim (level -> depth walk) ---

router.get('/projects/:id/graph', validate(levelQuery, 'query'), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    res.json(await graphService.getGraphByDepth(proj._id, req.query.level));
  } catch (e) {
    next(e);
  }
});

export default router;
