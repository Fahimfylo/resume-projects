import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as projService from '../services/projectService.js';
import * as graphService from '../services/graphService.js';
import * as storage from '../storage/storageAdapter.js';
import { parseSource, makeExcerpt } from '../services/analysis/parser.js';
import * as ai from '../services/analysis/aiEnrichment.js';
import { GraphNode, GraphEdge } from '../models/index.js';

const router = Router();

const levelQuery = z.object({ level: z.enum(['system', 'modules', 'components', 'files']).optional().default('components') });

router.post('/projects/:id/ai/explain-node/:nodeId', validate(levelQuery, 'query'), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    const node = await graphService.getNode(proj._id, req.query.level, req.params.nodeId);

    let summary = node.summary;
    if (node.filePath) {
      const rec = parseSource(node.filePath, await readSourceSafe(proj._id, node.filePath));
      const excerpt = makeExcerpt(
        await readSourceSafe(proj._id, node.filePath),
        rec.routes[0]?.lineNumber || rec.callSites[0]?.lineNumber || 1,
        3
      );
      summary = await ai.generateNodeSummary(rec, excerpt);
    } else {
      summary = ai.deterministicSummary({
        relativePath: node.filePath || `${node.label.toLowerCase().replace(/\s+/g, '-')}.ts`,
        category: node.category,
        lineCount: node.stats?.lines || 0,
        components: [],
        routes: [],
        models: [],
        functions: [],
        hooks: [],
        externalCalls: [],
      });
    }

    await GraphNode.updateOne(
      { projectId: proj._id, abstractionLevel: req.query.level, reactFlowId: req.params.nodeId },
      { $set: { 'data.summary': summary } }
    );

    res.json({ summary });
  } catch (e) {
    next(e);
  }
});

router.post('/projects/:id/ai/explain-edge/:edgeId', validate(levelQuery, 'query'), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    const edge = await graphService.getEdge(proj._id, req.query.level, req.params.edgeId);
    res.json({
      relationshipType: edge.relationshipType,
      evidence: edge.evidence || null,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id/ai/insights', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    let insights = proj.insights || [];

    if (!insights.length) {
      const filesLevel = await graphService.getGraph(proj._id, 'files');
      const records = filesLevel.nodes.map((n) => ({
        relativePath: n.data.filePath || n.data.label,
        lineCount: n.data.stats?.lines || 0,
        inboundCalls: filesLevel.edges.filter((e) => e.target === n.id).length,
      }));
      insights = await ai.generateInsights({ nodeCount: filesLevel.nodes.length, edgeCount: filesLevel.edges.length, moduleCount: proj.moduleCount || 0 }, records);
      await projService.updateProject(proj._id, { insights }, req.ownerId);
    }

    res.json({ insights });
  } catch (e) {
    next(e);
  }
});

async function readSourceSafe(projectId, filePath) {
  try {
    const buf = await storage.readFile(projectId, filePath);
    return buf.toString('utf-8');
  } catch {
    return '';
  }
}

export default router;
