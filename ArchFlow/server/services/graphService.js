import { GraphNode, GraphEdge } from '../models/index.js';
import { AppError } from '../middleware/error.js';

const LEVELS = ['system', 'modules', 'components', 'files'];
const LEVEL_DEPTH = { system: 0, modules: 1, components: 2, files: 3 };

export function normalizeLevel(level) {
  if (!LEVELS.includes(level)) throw new AppError('Invalid abstraction level', 'VALIDATION_ERROR', 400);
  return level;
}

export function toFrontendNode(n) {
  return {
    id: n.reactFlowId,
    type: n.type,
    position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
    parentNodeId: n.parentId || null,
    data: n.data || {},
  };
}

export function toFrontendEdge(e) {
  return {
    id: e.reactFlowId,
    source: e.source,
    target: e.target,
    type: e.type || 'relationshipEdge',
    data: e.data || {},
  };
}

// --- Scope-based graph (root / children / path) ---

export async function getRoot(projectId) {
  const [nodes, edges] = await Promise.all([
    GraphNode.find({ projectId, parentId: null }).sort({ 'position.y': 1, 'position.x': 1 }).lean(),
    GraphEdge.find({ projectId, parentId: null }).lean(),
  ]);
  return {
    nodes: nodes.map(toFrontendNode),
    edges: filterDanglingEdges(nodes, edges).map(toFrontendEdge),
  };
}

export async function getChildren(projectId, nodeId) {
  const parent = await GraphNode.findOne({ projectId, reactFlowId: nodeId }).lean();
  if (!parent) throw new AppError('Node not found', 'NOT_FOUND', 404);

  const [nodes, edges] = await Promise.all([
    GraphNode.find({ projectId, parentId: nodeId }).sort({ 'position.y': 1, 'position.x': 1 }).lean(),
    GraphEdge.find({ projectId, parentId: nodeId }).lean(),
  ]);

  return {
    node: { id: parent.reactFlowId, ...(parent.data || {}) },
    nodes: nodes.map(toFrontendNode),
    edges: filterDanglingEdges(nodes, edges).map(toFrontendEdge),
  };
}

export async function getPath(projectId, nodeId) {
  const path = [];
  let current = nodeId;
  const seen = new Set();

  while (current) {
    if (seen.has(current)) break;
    seen.add(current);
    const node = await GraphNode.findOne({ projectId, reactFlowId: current }).lean();
    if (!node) throw new AppError('Node not found', 'NOT_FOUND', 404);
    path.unshift({ id: node.reactFlowId, label: node.data?.label || node.reactFlowId });
    current = node.parentId;
  }

  return { path };
}

// --- Node CRUD (scope-aware) ---

function filterDanglingEdges(nodes, edges) {
  const nodeIds = new Set(nodes.map((n) => n.reactFlowId));
  return edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
}

// --- Full-system overview (every node + every edge) ---

export async function getFullGraph(projectId) {
  const [allNodes, allEdges] = await Promise.all([
    GraphNode.find({ projectId }).lean(),
    GraphEdge.find({ projectId }).lean(),
  ]);

  const idToNode = new Map(allNodes.map((n) => [n.reactFlowId, n]));
  const depthOf = new Map();
  for (const n of allNodes) {
    let d = 0;
    let cur = n;
    const seen = new Set();
    while (cur.parentId && idToNode.has(cur.parentId) && !seen.has(cur.parentId)) {
      seen.add(cur.parentId);
      d += 1;
      cur = idToNode.get(cur.parentId);
    }
    depthOf.set(n.reactFlowId, d);
  }

  return {
    nodes: allNodes.map((n) => ({
      ...toFrontendNode(n),
      data: { ...(n.data || {}), depth: depthOf.get(n.reactFlowId), parentNodeId: n.parentId },
    })),
    edges: filterDanglingEdges(allNodes, allEdges).map(toFrontendEdge),
  };
}

async function refreshChildCount(projectId, parentId) {
  if (!parentId) return;
  const count = await GraphNode.countDocuments({ projectId, parentId });
  await GraphNode.updateMany(
    { projectId, reactFlowId: parentId },
    { $set: { 'data.childCount': count, 'data.isLeaf': count === 0 } }
  );
}

export async function addNode(projectId, { label, subtitle, category, filePath, summary, x, y, parentId }) {
  const normalizedParentId = parentId || null;
  if (normalizedParentId) {
    const parent = await GraphNode.findOne({ projectId, reactFlowId: normalizedParentId }).lean();
    if (!parent) throw new AppError('Parent scope not found', 'NOT_FOUND', 404);
  }

  const reactFlowId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const node = await GraphNode.create({
    projectId,
    parentId: normalizedParentId,
    reactFlowId,
    type: 'entityNode',
    position: { x: x ?? 100, y: y ?? 100 },
    data: {
      label,
      subtitle: subtitle || 'Custom Code Node',
      category,
      filePath: filePath || `src/custom/${label.toLowerCase().replace(/\s+/g, '-')}.ts`,
      summary: summary || 'User annotated node added to architecture diagram.',
      stats: { lines: 120, complexity: 'Low', calls: 1 },
      childCount: 0,
      isLeaf: true,
    },
    isManual: true,
  });

  await refreshChildCount(projectId, normalizedParentId);
  return toFrontendNode(node);
}

export async function updateNodePosition(projectId, nodeId, x, y) {
  const res = await GraphNode.updateOne(
    { projectId, reactFlowId: nodeId },
    { $set: { 'position.x': x, 'position.y': y } }
  );
  if (res.matchedCount === 0) throw new AppError('Node not found', 'NOT_FOUND', 404);
}

export async function updateNodeSize(projectId, nodeId, width, height) {
  const res = await GraphNode.updateOne(
    { projectId, reactFlowId: nodeId },
    { $set: { 'data.width': width, 'data.height': height } }
  );
  if (res.matchedCount === 0) throw new AppError('Node not found', 'NOT_FOUND', 404);
}

async function collectSubtreeIds(projectId, rootId) {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length) {
    const kids = await GraphNode.find({ projectId, parentId: { $in: frontier } }).select('reactFlowId').lean();
    frontier = kids.map((k) => k.reactFlowId);
    ids.push(...frontier);
  }
  return ids;
}

export async function deleteNode(projectId, nodeId) {
  const node = await GraphNode.findOne({ projectId, reactFlowId: nodeId }).lean();
  if (!node) throw new AppError('Node not found', 'NOT_FOUND', 404);

  const subtreeIds = await collectSubtreeIds(projectId, nodeId);

  await GraphEdge.deleteMany({
    projectId,
    $or: [
      { parentId: { $in: subtreeIds } },
      {
        parentId: node.parentId || null,
        $or: [{ source: { $in: subtreeIds } }, { target: { $in: subtreeIds } }],
      },
    ],
  });
  await GraphNode.deleteMany({ projectId, reactFlowId: { $in: subtreeIds } });

  await refreshChildCount(projectId, node.parentId);
}

export async function getNode(projectId, nodeId) {
  const node = await GraphNode.findOne({ projectId, reactFlowId: nodeId }).lean();
  if (!node) throw new AppError('Node not found', 'NOT_FOUND', 404);
  return { id: node.reactFlowId, ...(node.data || {}) };
}

export async function getEdge(projectId, edgeId) {
  const edge = await GraphEdge.findOne({ projectId, reactFlowId: edgeId }).lean();
  if (!edge) throw new AppError('Edge not found', 'NOT_FOUND', 404);
  return { id: edge.reactFlowId, source: edge.source, target: edge.target, ...(edge.data || {}) };
}

export async function addEdge(projectId, { source, target, relationshipType }) {
  if (source === target) throw new AppError('Cannot connect a node to itself', 'VALIDATION_ERROR', 400);

  const nodes = await GraphNode.find({ projectId }).select('reactFlowId parentId').lean();
  const byId = new Map(nodes.map((n) => [n.reactFlowId, n]));
  if (!byId.has(source)) throw new AppError('Source node not found', 'NOT_FOUND', 404);
  if (!byId.has(target)) throw new AppError('Target node not found', 'NOT_FOUND', 404);

  const existing = await GraphEdge.findOne({ projectId, source, target, isManual: true }).lean();
  if (existing) throw new AppError('These nodes are already connected', 'CONFLICT', 409);

  // Scope the edge to the deepest shared ancestor of its endpoints so it
  // appears in the same scope view as both nodes (mirrors analysis edges).
  const parentOf = new Map(nodes.map((n) => [n.reactFlowId, n.parentId || null]));
  const seen = new Set();
  let cur = source;
  while (cur) {
    seen.add(cur);
    cur = parentOf.get(cur);
  }
  let parentId = null;
  cur = target;
  while (cur) {
    if (seen.has(cur)) {
      parentId = cur;
      break;
    }
    cur = parentOf.get(cur);
  }

  const reactFlowId = `edge-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const edge = await GraphEdge.create({
    projectId,
    parentId,
    reactFlowId,
    source,
    target,
    type: 'relationshipEdge',
    data: { relationshipType: relationshipType || 'DEPENDS_ON', evidence: null },
    isManual: true,
  });
  return toFrontendEdge(edge);
}

export async function deleteEdge(projectId, edgeId) {
  const res = await GraphEdge.deleteOne({ projectId, reactFlowId: edgeId });
  if (res.deletedCount === 0) throw new AppError('Edge not found', 'NOT_FOUND', 404);
}

// --- Deprecated level shim (level -> depth walk over the tree) ---

export async function getGraphByDepth(projectId, level) {
  const depth = LEVEL_DEPTH[normalizeLevel(level)];

  const [allNodes, allEdges] = await Promise.all([
    GraphNode.find({ projectId }).lean(),
    GraphEdge.find({ projectId }).lean(),
  ]);

  const idToNode = new Map(allNodes.map((n) => [n.reactFlowId, n]));
  const depthOf = new Map();
  for (const n of allNodes) {
    let d = 0;
    let cur = n;
    const seen = new Set();
    while (cur.parentId && idToNode.has(cur.parentId) && !seen.has(cur.parentId)) {
      seen.add(cur.parentId);
      d += 1;
      cur = idToNode.get(cur.parentId);
    }
    depthOf.set(n.reactFlowId, d);
  }

  const nodeIds = new Set(allNodes.filter((n) => depthOf.get(n.reactFlowId) === depth).map((n) => n.reactFlowId));
  const nodes = allNodes
    .filter((n) => nodeIds.has(n.reactFlowId))
    .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0))
    .map(toFrontendNode);
  const edges = allEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)).map(toFrontendEdge);

  return { nodes, edges };
}
