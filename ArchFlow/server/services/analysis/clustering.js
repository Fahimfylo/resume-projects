import path from 'path';

const SKIP_STRUCTURAL = new Set([
  'components', 'pages', 'screens', 'views', 'features', 'modules', 'contexts',
  'context', 'lib', 'utils', 'helpers', 'hooks', 'store', 'stores', 'types',
  'type', 'db', 'constants', 'assets', 'public', 'config', 'generated',
]);

const SUFFIX_STRIP = /(Service|Controller|Models?|Routes?|Page|Hook|Store|Form|Context|Client|Utils?|Config|Schema|Types?|Repo|Repository|Provider|Actions?|Api)$/i;

const EXTERNAL_PREFIX = '@external:';

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'entity';
}

export function titleCase(value) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function moduleKeyFor(relativePath) {
  const parts = relativePath.split('/');
  let idx = 0;
  if (['src', 'server', 'app', 'api', 'client', 'backend', 'frontend', 'packages'].includes(parts[0])) idx = 1;

  if (idx === 0) return 'core';

  while (idx < parts.length - 1 && SKIP_STRUCTURAL.has(parts[idx])) idx++;

  const seg = parts[idx] ?? 'core';
  if (seg.includes('.')) {
    let base = seg.replace(/\.[^.]+$/, '');
    base = base.replace(SUFFIX_STRIP, '');
    if (!base || ['index', 'app', 'main', 'server', 'entry', 'vite', 'global', 'config'].includes(base.toLowerCase())) return 'core';
    return base.toLowerCase();
  }
  return seg.toLowerCase();
}

function moduleDirFor(relativePath) {
  const parts = relativePath.split('/');
  let idx = 0;
  if (['src', 'server', 'app', 'api', 'client', 'backend', 'frontend', 'packages'].includes(parts[0])) idx = 1;
  while (idx < parts.length - 1 && SKIP_STRUCTURAL.has(parts[idx])) idx++;
  const seg = parts[idx];
  if (!seg) return relativePath.split('/')[0];
  if (seg.includes('.')) return parts.slice(0, idx).join('/') || 'src';
  return parts.slice(0, idx + 1).join('/');
}

function isExternalTarget(target) {
  return target.startsWith(EXTERNAL_PREFIX);
}

function externalName(target) {
  return target.slice(EXTERNAL_PREFIX.length);
}

function complexityFor(lines) {
  if (lines > 600) return 'High';
  if (lines > 200) return 'Medium';
  return 'Low';
}

function gridPosition(index, perRow = 4, cellW = 300, cellH = 160) {
  const col = index % perRow;
  const row = Math.floor(index / perRow);
  return { x: col * cellW, y: row * cellH };
}

// --- File-level (and components-level) node/edge construction ---

export function buildFileLevel(files, records, edges, { includeFiles = true } = {}) {
  const nodes = [];
  const nodeByRelPath = new Map();

  const recByPath = new Map(records.map((r) => [r.relativePath, r]));

  const includedRecs = includeFiles
    ? records
    : records.filter((r) => path.extname(r.relativePath).toLowerCase() !== '.json');

  let index = 0;
  for (const rec of includedRecs) {
    const id = `file-${slugify(rec.relativePath)}`;
    const isExternal = false;
    const inbound = edges.filter((e) => e.target === rec.relativePath && !isExternalTarget(e.source)).length;
    nodeByRelPath.set(rec.relativePath, id);
    nodes.push({
      id,
      reactFlowId: id,
      type: 'entityNode',
      position: gridPosition(index++),
      data: {
        label: path.basename(rec.relativePath),
        subtitle: categorySubtitle(rec.category),
        category: rec.category,
        filePath: rec.relativePath,
        summary: rec.summary || `Analyzed source file with ${rec.lineCount} lines.`,
        stats: {
          lines: rec.lineCount,
          complexity: complexityFor(rec.lineCount),
          calls: inbound,
        },
      },
      isManual: false,
    });
  }

  // external imports/calls are rendered as `subNodes` on the using file's node
  // (see buildTree), so no separate ext-* tree nodes or edges are produced here.

  const edgesOut = [];
  const seen = new Set();
  for (const edge of edges) {
    if (isExternalTarget(edge.target)) continue;
    const srcId = nodeByRelPath.get(edge.source);
    const tgtId = nodeByRelPath.get(edge.target);
    if (!srcId || !tgtId || srcId === tgtId) continue;
    const key = `${srcId}::${tgtId}::${edge.relationshipType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const edgeId = `e-${slugify(srcId)}-${slugify(tgtId)}-${slugify(edge.relationshipType)}`;
    edgesOut.push({
      id: edgeId,
      reactFlowId: edgeId,
      source: srcId,
      target: tgtId,
      type: 'relationshipEdge',
      data: {
        relationshipType: edge.relationshipType,
        evidence: edge.evidence,
      },
      isManual: false,
    });
  }

  return { nodes, edges: edgesOut, nodeByRelPath };
}

function categorySubtitle(category) {
  switch (category) {
    case 'page': return 'Page View Component';
    case 'component': return 'React Component';
    case 'route': return 'API Route Definition';
    case 'controller': return 'Express Controller';
    case 'service': return 'Service Layer';
    case 'model': return 'Data Model / Schema';
    case 'external-api': return 'External API';
    case 'db-table': return 'Database Table';
    case 'hook': return 'React Hook';
    case 'store': return 'State Store';
    default: return 'Source File';
  }
}

// --- Module level ---

const TYPE_PRIORITY = {
  CALLS: 6,
  ROUTES_TO: 5,
  WRITES_TO: 4,
  READS_FROM: 3,
  DEPENDS_ON: 2,
  USES: 1,
  IMPORTS: 0,
};

export function buildModuleLevel(fileNodes, fileEdges, records) {
  const fileByRel = new Map(records.map((r) => [r.relativePath, r]));

  const fileByNodeId = new Map();
  for (const node of fileNodes) fileByNodeId.set(node.id, node);

  const moduleByFile = new Map(); // relPath -> moduleName
  for (const rec of records) moduleByFile.set(rec.relativePath, moduleKeyFor(rec.relativePath));

  const moduleInfo = new Map(); // name -> { files: string[], dirs: Set, categories: Map }
  for (const rec of records) {
    const name = moduleByFile.get(rec.relativePath);
    if (!moduleInfo.has(name)) moduleInfo.set(name, { files: [], dirs: new Set(), categories: new Map() });
    const info = moduleInfo.get(name);
    info.files.push(rec.relativePath);
    info.dirs.add(moduleDirFor(rec.relativePath));
    info.categories.set(rec.category, (info.categories.get(rec.category) || 0) + 1);
  }

  const nodes = [];
  const modNodeByRel = new Map();
  let index = 0;

  for (const [name, info] of moduleInfo) {
    const id = `mod-${slugify(name)}`;
    const dominantCategory = [...info.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'component';
    const dir = [...info.dirs][0] || name;
    const totalLines = info.files.reduce((sum, f) => sum + (fileByRel.get(f)?.lineCount || 0), 0);

    const subNodes = info.files
      .map((f) => ({ rel: f, rec: fileByRel.get(f) }))
      .sort((a, b) => b.rec.lineCount - a.rec.lineCount)
      .slice(0, 6)
      .map(({ rel, rec }) => ({
        id: `sub-${slugify(rel)}`,
        label: path.basename(rel).replace(/\.[^.]+$/, ''),
        category: rec.category,
        subtitle: rel,
      }));

    for (const f of info.files) modNodeByRel.set(f, id);

    nodes.push({
      id,
      reactFlowId: id,
      type: 'entityNode',
      position: gridPosition(index++),
      data: {
        label: `${titleCase(name)} Module`,
        subtitle: dir,
        category: dominantCategory,
        filePath: dir,
        summary: `Module grouping ${info.files.length} source file(s) under ${dir}.`,
        subNodes,
        stats: {
          lines: totalLines,
          complexity: complexityFor(totalLines),
          calls: 0,
        },
      },
      isManual: false,
    });
  }

  // aggregate module edges. Same-module pairs are intentionally included here:
  // they are not module-level edges (they never render as such), but keeping
  // them lets buildTree's LCA pass decide placement with one consistent rule.
  const edges = [];
  const seen = new Set();
  for (const edge of fileEdges) {
    if (!edge.data) continue;
    const srcRel = edgeSourceRel(edge, fileByNodeId);
    const tgtRel = edgeTargetRel(edge, fileByNodeId);
    if (!srcRel || !tgtRel) continue;
    const sMod = modNodeByRel.get(srcRel);
    const tMod = modNodeByRel.get(tgtRel);
    if (!sMod || !tMod) continue;
    const key = `${sMod}::${tMod}`;
    if (!seen.has(key)) {
      seen.add(key);
      const edgeId = `e-${slugify(sMod)}-${slugify(tMod)}`;
      edges.push({
        id: edgeId,
        reactFlowId: edgeId,
        source: sMod,
        target: tMod,
        type: 'relationshipEdge',
        data: {
          relationshipType: edge.data.relationshipType,
          evidence: edge.data.evidence,
        },
        isManual: false,
      });
    }
  }

  // choose best relationshipType per pair
  const byPair = new Map();
  for (const edge of edges) {
    const key = `${edge.source}::${edge.target}`;
    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key).push(edge);
  }
  const finalized = [];
  for (const list of byPair.values()) {
    const best = list.sort((a, b) => {
      const pa = TYPE_PRIORITY[a.data.relationshipType] ?? 0;
      const pb = TYPE_PRIORITY[b.data.relationshipType] ?? 0;
      if (pa !== pb) return pb - pa;
      return (b.data.evidence?.confidence || 0) - (a.data.evidence?.confidence || 0);
    })[0];
    finalized.push(best);
  }

  return { nodes, edges: finalized, modNodeByRel };
}

function edgeSourceRel(edge, fileByNodeId) {
  const node = fileByNodeId.get(edge.source);
  return node ? node.data.filePath : null;
}
function edgeTargetRel(edge, fileByNodeId) {
  const node = fileByNodeId.get(edge.target);
  return node ? node.data.filePath : null;
}

// --- System level ---

const SYSTEM_BUCKETS = [
  { id: 'frontend', label: 'Frontend Application', subtitle: 'Client Interface & UI State' },
  { id: 'api-gateway', label: 'API Gateway', subtitle: 'Express Route Layer' },
  { id: 'backend', label: 'Backend Services', subtitle: 'Domain Logic & Services' },
  { id: 'database', label: 'Database & Data Stores', subtitle: 'Models, Schemas & Tables' },
  { id: 'external', label: 'External Services', subtitle: 'Third-party APIs & SDKs' },
];

export function bucketForModule(moduleName, subtitle, dominantCategory) {
  const name = moduleName.toLowerCase();
  if (dominantCategory === 'external-api' || /external/.test(name)) return 'external';
  if (dominantCategory === 'model' || dominantCategory === 'db-table') return 'database';
  if (dominantCategory === 'route') return 'api-gateway';
  if (/server|api|backend|gateway/.test(subtitle)) return 'backend';
  return 'frontend';
}

export function buildSystemLevel(moduleNodes, moduleEdges) {
  const bucketOfModule = new Map();
  const members = new Map();
  for (const node of moduleNodes) {
    const bucket = bucketForModule(node.data.label, node.data.subtitle || '', node.data.category);
    bucketOfModule.set(node.id, bucket);
    if (!members.has(bucket)) members.set(bucket, []);
    members.get(bucket).push(node);
  }

  const nodes = SYSTEM_BUCKETS.map((b, i) => {
    const m = members.get(b.id) || [];
    const totalLines = m.reduce((sum, n) => sum + (n.data.stats?.lines || 0), 0);
    const subNodes = m.slice(0, 6).map((n) => ({
      id: `sub-${slugify(n.id)}`,
      label: (n.data.label || '').replace(/ Module$/, ''),
      category: n.data.category,
      subtitle: n.data.subtitle || '',
    }));
    return {
      id: `sys-${b.id}`,
      reactFlowId: `sys-${b.id}`,
      type: 'entityNode',
      position: { x: i * 360, y: 180 },
      data: {
        label: b.label,
        subtitle: b.subtitle,
        category: bucketCategory(b.id),
        filePath: b.id,
        summary: `System bucket for ${m.length} module(s).`,
        subNodes,
        stats: {
          lines: totalLines,
          complexity: complexityFor(totalLines),
          calls: m.reduce((sum, n) => sum + (n.data.stats?.calls || 0), 0),
        },
      },
      isManual: false,
    };
  });

  const edges = [];
  const byPair = new Map();
  for (const edge of moduleEdges) {
    const s = bucketOfModule.get(edge.source);
    const t = bucketOfModule.get(edge.target);
    if (!s || !t) continue;
    const key = `${s}::${t}`;
    if (!byPair.has(key)) byPair.set(key, edge);
    else if ((edge.data.evidence?.confidence || 0) > (byPair.get(key).data.evidence?.confidence || 0)) {
      byPair.set(key, edge);
    }
  }
  for (const [pair, edge] of byPair) {
    const [s, t] = pair.split('::');
    const edgeId = `e-${slugify(s)}-${slugify(t)}`;
    edges.push({
      id: edgeId,
      reactFlowId: edgeId,
      source: `sys-${s}`,
      target: `sys-${t}`,
      type: 'relationshipEdge',
      data: {
        relationshipType: edge.data.relationshipType,
        evidence: edge.data.evidence,
      },
      isManual: false,
    });
  }

  return { nodes, edges };
}

function bucketCategory(bucketId) {
  switch (bucketId) {
    case 'frontend': return 'page';
    case 'api-gateway': return 'route';
    case 'backend': return 'service';
    case 'database': return 'model';
    case 'external': return 'external-api';
    default: return 'component';
  }
}

// --- Recursive drill-down tree ---

function memberKindLabel(kind) {
  switch (kind) {
    case 'method': return 'Class Method';
    case 'component': return 'React Component';
    case 'hook': return 'React Hook';
    default: return 'Function';
  }
}

// Assign an edge's scope to the deepest ancestor shared by its endpoints'
// parent chains (lowest common ancestor). A same-module file edge lands on the
// module, a cross-module-same-bucket edge lands on the bucket, and a genuinely
// cross-branch edge lands at the root (null). Self-edges are not real edges.
function lcaParentId(sourceId, targetId, parentOf) {
  if (!sourceId || !targetId || sourceId === targetId) return null;
  const chain = (id) => {
    const out = [];
    const seen = new Set();
    let cur = id;
    while (cur) {
      if (seen.has(cur)) break;
      seen.add(cur);
      out.push(cur);
      cur = parentOf.get(cur) || null;
    }
    return out;
  };
  const srcChain = chain(sourceId);
  const tgtSet = new Set(chain(targetId));
  for (const id of srcChain) {
    if (id === sourceId || id === targetId) continue;
    if (tgtSet.has(id)) return id;
  }
  return null;
}

export function buildTree(files, records, edges) {
  const componentsLevel = buildFileLevel(files, records, edges, { includeFiles: false });
  const modulesLevel = buildModuleLevel(componentsLevel.nodes, componentsLevel.edges, records);
  const systemLevel = buildSystemLevel(modulesLevel.nodes, modulesLevel.edges);
  const filesLevel = buildFileLevel(files, records, edges, { includeFiles: true });

  const bucketOfModule = new Map();
  for (const node of modulesLevel.nodes) {
    bucketOfModule.set(node.id, bucketForModule(node.data.label, node.data.subtitle || '', node.data.category));
  }

  const fileIdToModuleId = new Map();
  for (const rec of records) {
    const fid = filesLevel.nodeByRelPath.get(rec.relativePath);
    if (!fid) continue;
    fileIdToModuleId.set(fid, `mod-${slugify(moduleKeyFor(rec.relativePath))}`);
  }

  const nodes = [];
  let index = 0;

  // Depth 0: system buckets (root)
  for (const n of systemLevel.nodes) nodes.push({ ...n, parentId: null });

  // Depth 1: modules, parented to their system bucket
  for (const n of modulesLevel.nodes) {
    const bucket = bucketOfModule.get(n.id);
    if (!bucket) continue;
    nodes.push({ ...n, parentId: `sys-${bucket}` });
  }

  // External dependencies used per file: from the parser's externalCalls plus
  // any unresolved-bare-import edges. These render as dashed `subNodes` on the
  // using file's card at every scope, never as prunable tree children.
  const extNamesByRel = new Map();
  for (const rec of records) {
    const names = new Set();
    for (const ext of rec.externalCalls || []) {
      if (ext && ext.name) names.add(ext.name);
    }
    for (const edge of edges) {
      if (edge.source === rec.relativePath && isExternalTarget(edge.target)) {
        names.add(externalName(edge.target));
      }
    }
    if (names.size) extNamesByRel.set(rec.relativePath, [...names].sort());
  }

  // Depth 2: files, parented to their module
  for (const n of filesLevel.nodes) {
    const parentId = fileIdToModuleId.get(n.id);
    if (!parentId) continue;
    const extNames = extNamesByRel.get(n.data.filePath);
    if (extNames && extNames.length) {
      const subNodes = extNames.slice(0, 8).map((name) => ({
        id: `ext-${slugify(name)}`,
        label: name,
        category: 'external-api',
        subtitle: 'External API / SDK Dependency',
      }));
      nodes.push({ ...n, parentId, data: { ...n.data, subNodes } });
    } else {
      nodes.push({ ...n, parentId });
    }
  }

  // Depth 3: functions/methods/components, parented to their file
  const recordByPath = new Map(records.map((r) => [r.relativePath, r]));
  for (const rec of records) {
    const fileNodeId = filesLevel.nodeByRelPath.get(rec.relativePath);
    if (!fileNodeId) continue;
    for (const m of rec.members || []) {
      const lines = Math.max(1, m.lineEnd - m.lineStart + 1);
      const id = `fn-${slugify(fileNodeId)}-${slugify(m.name)}`;
      const category =
        m.kind === 'hook' ? 'hook'
        : m.kind === 'component' ? 'component'
        : rec.category === 'external-api' ? 'external-api'
        : rec.category;
      nodes.push({
        id,
        reactFlowId: id,
        type: 'entityNode',
        position: gridPosition(index++),
        data: {
          label: `${m.name}()`,
          subtitle: memberKindLabel(m.kind),
          category,
          filePath: `${rec.relativePath}#L${m.lineStart}-${m.lineEnd}`,
          summary: `Defined on lines ${m.lineStart}–${m.lineEnd} of ${rec.relativePath}${m.isExported ? ' (exported)' : ''}.`,
          stats: {
            lines,
            complexity: complexityFor(lines),
            calls: (m.callTargets?.length || 0) + (m.dbReadCount || 0) + (m.dbWriteCount || 0) + (m.externalCount || 0),
          },
          childCount: 0,
          isLeaf: true,
        },
        isManual: false,
        parentId: fileNodeId,
      });
    }
  }

  const edgesOut = [];

  // Every edge's scope is the lowest common ancestor (LCA) of its endpoints'
  // parent chains. This single rule replaces the old ad hoc same-module /
  // same-bucket / root assignments: same-module file edges land on the module,
  // cross-module-same-bucket edges land on the bucket, cross-bucket edges land
  // at the root, and intra-file function edges land on their file. Nothing is
  // dropped based on aggregation shortcuts — each edge is just placed where it
  // belongs and renders once that scope is entered.
  const parentOf = new Map();
  for (const n of nodes) parentOf.set(n.reactFlowId, n.parentId || null);

  const scopeEdge = (e) => {
    if (e.source === e.target) return;
    edgesOut.push({ ...e, parentId: lcaParentId(e.source, e.target, parentOf) });
  };

  for (const e of systemLevel.edges) scopeEdge(e);
  for (const e of modulesLevel.edges) scopeEdge(e);
  for (const e of filesLevel.edges) scopeEdge(e);

  // Function CALLS edges within the same file scope
  const seenFunctionEdges = new Set();
  for (const rec of records) {
    const fileNodeId = filesLevel.nodeByRelPath.get(rec.relativePath);
    if (!fileNodeId) continue;
    const members = rec.members || [];
    const memberByName = new Map(members.map((m) => [m.name, m]));
    for (const m of members) {
      const fnId = (name) => `fn-${slugify(fileNodeId)}-${slugify(name)}`;
      for (const target of m.callTargets || []) {
        const dotIdx = target.lastIndexOf('.');
        const tgtName = dotIdx !== -1 ? target.slice(dotIdx + 1) : target;
        const tgtMember = memberByName.get(tgtName);
        if (!tgtMember || tgtMember.name === m.name) continue;
        const key = `${m.name}::${tgtMember.name}`;
        if (seenFunctionEdges.has(key)) continue;
        seenFunctionEdges.add(key);
        const edgeId = `e-${slugify(fileNodeId)}-${slugify(m.name)}-${slugify(tgtMember.name)}`;
        edgesOut.push({
          id: edgeId,
          reactFlowId: edgeId,
          source: fnId(m.name),
          target: fnId(tgtMember.name),
          type: 'relationshipEdge',
          data: {
            relationshipType: 'CALLS',
            evidence: {
              filePath: rec.relativePath,
              lineNumber: m.lineStart,
              codeSnippet: `${m.name}() → ${tgtMember.name}()`,
              confidence: 86,
            },
          },
          isManual: false,
          parentId: lcaParentId(fnId(m.name), fnId(tgtMember.name), parentOf),
        });
      }
    }
  }

  return {
    nodes,
    edges: edgesOut,
    summary: {
      nodeCount: componentsLevel.nodes.length,
      edgeCount: componentsLevel.edges.length,
      moduleCount: modulesLevel.nodes.length,
      recordByPath,
    },
  };
}
