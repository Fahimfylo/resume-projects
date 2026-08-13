import path from 'path';
import { scanProject } from './scanner.js';
import { parseSource, makeExcerpt } from './parser.js';
import { buildImportGraph } from './dependencyAnalyzer.js';
import { resolveEdges } from './relationshipResolver.js';
import { buildTree } from './clustering.js';
import { loadProjectConfig } from './projectConfig.js';
import * as ai from './aiEnrichment.js';
import { GraphNode, GraphEdge } from '../../models/index.js';
import { Project } from '../../models/Project.js';
import { readFile } from '../../storage/storageAdapter.js';

const ANALYZABLE_JS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function isJsLike(relativePath) {
  return ANALYZABLE_JS.has(path.extname(relativePath).toLowerCase());
}

async function readSources(projectId, files) {
  const map = new Map();
  for (const f of files) {
    try {
      const buf = await readFile(projectId, f.relativePath);
      map.set(f.relativePath, buf.toString('utf-8'));
    } catch {
      map.set(f.relativePath, '');
    }
  }
  return map;
}

export async function runAnalysis(projectId, onProgress = () => {}) {
  const startedAt = Date.now();

  onProgress(5, 'Scanning files');
  const files = await scanProject(projectId);
  console.log(`[analysis] project ${projectId}: scanned ${files.length} files`);
  if (!files.length) {
    throw new Error('No analyzable files found in the uploaded codebase');
  }

  onProgress(10, 'Reading project config');
  const config = await loadProjectConfig(projectId);
  const externalDeps = [...config.dependencies];

  onProgress(15, 'Reading source files');
  const readSourceMap = await readSources(projectId, files);

  onProgress(25, 'Parsing AST (ts-morph)');
  const records = [];
  for (const f of files) {
    const content = readSourceMap.get(f.relativePath) || '';
    if (isJsLike(f.relativePath)) {
      records.push(parseSource(f.relativePath, content, externalDeps));
    } else {
      records.push({
        relativePath: f.relativePath,
        lineCount: content.split('\n').length,
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        components: [],
        hooks: [],
        routes: [],
        models: [],
        externalCalls: [],
        dbReadCalls: [],
        dbWriteCalls: [],
        callSites: [],
        members: [],
        category: 'component',
      });
    }
  }

  onProgress(40, 'Resolving dependencies');
  const importGraph = buildImportGraph(files, records, config);
  const edges = resolveEdges({ records, importGraph, files, readSourceMap });
  console.log(`[analysis] project ${projectId}: parsed ${records.length} records, resolved ${edges.length} edges`);

  onProgress(55, 'Building drill-down tree');
  const tree = buildTree(files, records, edges);
  console.log(
    `[analysis] project ${projectId}: tree built — ${tree.summary.nodeCount} nodes, ${tree.summary.edgeCount} edges, ${tree.summary.moduleCount} modules`
  );

  onProgress(70, 'Enriching with AI summaries');
  await enrichFiles(projectId, tree, readSourceMap, records);
  await enrichModules(projectId, tree);

  onProgress(82, 'Persisting graph');
  await persistTree(projectId, tree);
  console.log(
    `[analysis] project ${projectId}: persisted ${tree.nodes.length} nodes, ${tree.edges.length} edges to MongoDB`
  );

  const summary = {
    nodeCount: tree.summary.nodeCount,
    edgeCount: tree.summary.edgeCount,
    moduleCount: tree.summary.moduleCount,
  };

  onProgress(90, 'Generating insights');
  const insights = await ai.generateInsights(summary, records);

  await Project.updateOne(
    { _id: projectId },
    {
      $set: {
        status: 'ready',
        lastAnalyzedAt: new Date(),
        fileCount: files.length,
        moduleCount: tree.summary.moduleCount,
        workflowCount: tree.summary.edgeCount,
        insights,
      },
    }
  );

  onProgress(100, 'Analysis complete');
  return { durationMs: Date.now() - startedAt, ...summary, insights };
}

async function enrichFiles(projectId, tree, readSourceMap, records) {
  const recordByPath = new Map(records.map((r) => [r.relativePath, r]));
  const fileNodes = tree.nodes.filter(
    (n) => n.parentId && !n.id.startsWith('sys-') && !n.id.startsWith('fn-') && n.data.filePath && isJsLike(n.data.filePath)
  ).slice(0, 12);

  for (const node of fileNodes) {
    const rec = recordByPath.get(node.data.filePath);
    if (!rec) continue;
    const content = readSourceMap.get(node.data.filePath) || '';
    const excerptLine = rec.routes[0]?.lineNumber || rec.callSites[0]?.lineNumber || 1;
    const excerpt = makeExcerpt(content, excerptLine, 3);
    let summary = node.data.summary;
    try {
      summary = await ai.generateNodeSummary(rec, excerpt || content.slice(0, 400));
    } catch {
      summary = ai.deterministicSummary(rec);
    }
    await GraphNode.updateOne(
      { projectId, reactFlowId: node.id },
      { $set: { 'data.summary': summary } }
    );
  }
}

async function enrichModules(projectId, tree) {
  const moduleNodes = tree.nodes.filter((n) => n.id.startsWith('mod-')).slice(0, 6);
  for (const node of moduleNodes) {
    const members = (node.data.subNodes || []).map((s) => s.subtitle).filter(Boolean);
    try {
      const label = await ai.generateModuleSummary(node.data.label, node.data.subtitle || '', members);
      if (label) {
        await GraphNode.updateOne(
          { projectId, reactFlowId: node.id },
          { $set: { 'data.subtitle': label } }
        );
      }
    } catch {
      /* keep deterministic */
    }
  }
}

async function persistTree(projectId, tree) {
  await GraphNode.deleteMany({ projectId });
  await GraphEdge.deleteMany({ projectId });

  const uniqueBy = (items, keyFn) => [...new Map(items.map((i) => [keyFn(i), i])).values()];
  const nodes = uniqueBy(tree.nodes, (n) => n.reactFlowId);
  const edges = uniqueBy(tree.edges, (e) => e.reactFlowId);

  if (nodes.length) {
    await GraphNode.insertMany(
      nodes.map((n) => ({
        projectId,
        parentId: n.parentId ?? null,
        reactFlowId: n.reactFlowId,
        type: n.type,
        position: n.position,
        data: n.data,
        isManual: n.isManual || false,
      })),
      { ordered: false }
    );
  }

  if (edges.length) {
    await GraphEdge.insertMany(
      edges.map((e) => ({
        projectId,
        parentId: e.parentId ?? null,
        reactFlowId: e.reactFlowId,
        source: e.source,
        target: e.target,
        type: e.type,
        data: e.data,
        isManual: e.isManual || false,
      })),
      { ordered: false }
    );
  }

  // Denormalize childCount / isLeaf on every node
  const counts = await GraphNode.aggregate([
    { $match: { projectId } },
    { $group: { _id: '$parentId', count: { $sum: 1 } } },
  ]);
  const byParent = new Map(counts.map((c) => [c._id ?? null, c.count]));

  const bulk = GraphNode.collection.initializeUnorderedBulkOp();
  for (const node of nodes) {
    const count = byParent.get(node.reactFlowId) || 0;
    bulk.find({ projectId, reactFlowId: node.reactFlowId }).updateOne({
      $set: { 'data.childCount': count, 'data.isLeaf': count === 0 },
    });
  }
  if (bulk.length) await bulk.execute();
}
