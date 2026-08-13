import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { EntityNodeData, RelationshipEdgeData, NodeCategory, AbstractionLevel } from '../types';
import { computeRenderGraph } from '../utils/canvasHierarchy';
import { api, ApiError } from '../api/client';

export interface BreadcrumbItem {
  id: string | null;
  label: string;
}

export interface GraphPayload {
  nodes: Node<EntityNodeData>[];
  edges: Edge<RelationshipEdgeData>[];
}

export type NodeVisibility = 'all' | 'parents' | 'children';

export interface NodeFilters {
  visibility: NodeVisibility;
  tags: string[];
}

export type NavMode = 'push' | 'replace';

export interface CanvasSnapshot {
  id: string;
  scopeId: string | null;
  scopeCrumbId: string | null;
  breadcrumb: BreadcrumbItem[];
  abstractionLevel: AbstractionLevel;
  nodes: Node<EntityNodeData>[];
  edges: Edge<RelationshipEdgeData>[];
  expandedIds: string[];
  pinnedIds: string[];
  childPositions: { [id: string]: { x: number; y: number } };
  listFilterOverrides: Record<string, string>;
  focusNodeId: string | null;
  searchFilter: string;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isInspectorOpen: boolean;
  layoutDirection: 'LR' | 'TB';
  nodeFilters: NodeFilters;
}

let positionSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPosition: { projectId: string | null; nodeId: string; x: number; y: number } | null = null;

function persistPositions(projectId: string | null, nodes: Node<EntityNodeData>[]) {
  if (!projectId || !nodes.length) return;
  const patches = nodes
    .filter((n) => n.position && Number.isFinite(n.position.x) && Number.isFinite(n.position.y))
    .map((n) =>
      api
        .patch(`/projects/${projectId}/graph/nodes/${encodeURIComponent(n.id)}/position`, {
          x: n.position.x,
          y: n.position.y,
        })
        .catch((err) => {
          if (err instanceof ApiError) console.warn('[canvas] Position save skipped:', err.message);
        })
    );
  Promise.all(patches);
}

function estimateNodeSize(node: Node<EntityNodeData>) {
  const data = (node.data || {}) as EntityNodeData;
  const labelLen = String(data.label || '').length;
  const width = Math.min(340, Math.max(260, 120 + labelLen * 7.5));
  let height = 96;
  if (data.filePath) height += 28;
  if (data.subNodes && data.subNodes.length > 0) height += 56;
  return { width, height };
}

function nodeSizeOf(node: Node<EntityNodeData>) {
  const d = (node.data || {}) as EntityNodeData;
  if (
    typeof d.width === 'number' &&
    Number.isFinite(d.width) &&
    d.width > 0 &&
    typeof d.height === 'number' &&
    Number.isFinite(d.height) &&
    d.height > 0
  ) {
    return { width: d.width, height: d.height };
  }
  return estimateNodeSize(node);
}

function isContainerInStore(id: string, nodes: Node<EntityNodeData>[]) {
  return nodes.some((n) => (n.data as EntityNodeData)?.parentNodeId === id);
}

function collectDescendants(id: string, nodes: Node<EntityNodeData>[]) {
  const out: string[] = [];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const n of nodes) {
      if ((n.data as EntityNodeData)?.parentNodeId === cur) {
        out.push(n.id);
        stack.push(n.id);
      }
    }
  }
  return out;
}

// Build scope-hierarchy edges (parent -> child) for the full-system view so the
// tree structure is explicit, renders as visible dashed lines, and drives the layout.
function buildScopeEdges(nodes: Node<EntityNodeData>[]) {
  const byId = new Set(nodes.map((n) => n.id));
  const edges: Edge<RelationshipEdgeData>[] = [];
  for (const n of nodes) {
    const p = (n.data as EntityNodeData).parentNodeId;
    if (p && p !== n.id && byId.has(p)) {
      edges.push({
        id: `scope-${p}-${n.id}`,
        source: p,
        target: n.id,
        type: 'relationshipEdge',
        data: { relationshipType: 'DEPENDS_ON', scopeEdge: true },
      });
    }
  }
  return edges;
}

// After positions are known, pick the closest source/target handle sides so
// every wire attaches to a real side and never collapses into a zero-length stub.
function routeEdgeHandles(
  nodes: Node<EntityNodeData>[],
  edges: Edge<RelationshipEdgeData>[]
): Edge<RelationshipEdgeData>[] {
  const posOf = new Map<string, { x: number; y: number }>();
  const sizeOf = new Map<string, { width: number; height: number }>();
  for (const n of nodes) {
    posOf.set(n.id, n.position);
    sizeOf.set(n.id, nodeSizeOf(n));
  }
  return edges.map((e) => {
    const sp = posOf.get(e.source);
    const tp = posOf.get(e.target);
    if (!sp || !tp) return e;
    const sSize = sizeOf.get(e.source)!;
    const tSize = sizeOf.get(e.target)!;
    const scx = sp.x + sSize.width / 2;
    const scy = sp.y + sSize.height / 2;
    const tcx = tp.x + tSize.width / 2;
    const tcy = tp.y + tSize.height / 2;
    const dx = tcx - scx;
    const dy = tcy - scy;
    let sourceHandle: string;
    let targetHandle: string;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx >= 0) {
        sourceHandle = 's-r';
        targetHandle = 't-l';
      } else {
        sourceHandle = 's-l';
        targetHandle = 't-r';
      }
    } else if (dy >= 0) {
      sourceHandle = 's-b';
      targetHandle = 't-t';
    } else {
      sourceHandle = 's-t';
      targetHandle = 't-b';
    }
    return { ...e, sourceHandle, targetHandle };
  });
}

// Single dagre-based layout for every view. Scope edges (when present, e.g. the
// full-system tree) carry a higher weight so the hierarchy dominates while the
// relationship edges still connect their nodes cleanly.
function layoutNodes(
  nodes: Node<EntityNodeData>[],
  edges: Edge<RelationshipEdgeData>[],
  direction: 'LR' | 'TB'
) {
  if (!nodes.length) return { nodes, edges };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isLR = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: isLR ? 160 : 90,
    nodesep: isLR ? 60 : 50,
    marginx: 40,
    marginy: 40,
  });

  const ids = new Set(nodes.map((n) => n.id));
  const sizes = new Map(nodes.map((n) => [n.id, nodeSizeOf(n)]));
  nodes.forEach((node) => {
    const { width, height } = sizes.get(node.id)!;
    dagreGraph.setNode(node.id, { width, height });
  });
  edges
    .filter((e) => e.source !== e.target && ids.has(e.source) && ids.has(e.target))
    .forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target, {
        weight: (edge.data as RelationshipEdgeData)?.scopeEdge ? 4 : 1,
        minlen: 1,
      });
    });
  dagre.layout(dagreGraph);

  const laidOut = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    if (!pos) return node;
    const { width, height } = sizes.get(node.id)!;
    return {
      ...node,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
    };
  });

  return { nodes: laidOut, edges: routeEdgeHandles(laidOut, edges) };
}

interface CanvasState {
  abstractionLevel: AbstractionLevel;
  activeProjectId: string | null;
  scopeId: string | null;
  breadcrumb: BreadcrumbItem[];
  nodes: Node<EntityNodeData>[];
  edges: Edge<RelationshipEdgeData>[];
  renderNodes: Node<any>[];
  renderEdges: Edge<any>[];
  expandedIds: string[];
  pinnedIds: string[];
  childPositions: { [id: string]: { x: number; y: number } };
  listFilterOverrides: Record<string, string>;
  focusNodeId: string | null;
  viewHistory: CanvasSnapshot[];
  viewIndex: number;
  urlSink: ((snapshot: CanvasSnapshot, mode: NavMode) => void) | null;
  accordionMode: boolean;
  listModeThreshold: number;
  panToNodeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isInspectorOpen: boolean;
  searchFilter: string;
  refreshKey: number;
  layoutDirection: 'LR' | 'TB';
  nodeFilters: NodeFilters;
  loadError: string | null;

  setProjectContext: (projectId: string | null) => void;
  restoreScope: (projectId: string, nodeId: string, opts?: { mode?: NavMode }) => Promise<void>;
  loadFullGraph: (opts?: { mode?: NavMode }) => Promise<void>;
  loadScope: (parentId: string | null, nextBreadcrumb: BreadcrumbItem[], mode?: NavMode) => Promise<void>;
  drillInto: (nodeId: string) => Promise<void>;
  goBack: () => void;
  goForward: () => void;
  goToBreadcrumb: (index: number) => Promise<void>;
  resetToRoot: () => Promise<void>;
  jumpToLevel: (level: AbstractionLevel, mode?: NavMode) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => boolean;
  restoreUrlView: (
    projectId: string,
    opts: { node?: string | null; focus?: string | null; level?: AbstractionLevel | null }
  ) => Promise<void>;
  setUrlSink: (fn: (snapshot: CanvasSnapshot, mode: NavMode) => void) => void;
  _commit: (apply: Partial<CanvasState> | (() => void), mode: NavMode) => void;
  onNodesChange: OnNodesChange<any>;
  onEdgesChange: OnEdgesChange<any>;
  onConnect: (connection: Connection) => void;
  cutEdge: (edgeId: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  closeInspector: () => void;
  updateNodeSize: (nodeId: string, size: { width: number; height: number }) => void;
  setSearchFilter: (query: string) => void;
  recomputeRender: () => void;
  toggleExpand: (nodeId: string) => void;
  revealNode: (nodeId: string) => void;
  revealSearchMatch: () => void;
  setPinned: (nodeId: string, pinned: boolean) => void;
  setListFilter: (containerId: string, query: string) => void;
  setFocusNode: (nodeId: string | null) => void;
  setAccordionMode: (on: boolean) => void;
  setListModeThreshold: (n: number) => void;
  autoLayout: (direction?: 'LR' | 'TB') => void;
  setLayoutDirection: (direction: 'LR' | 'TB') => void;
  setNodeVisibility: (visibility: NodeVisibility) => void;
  toggleNodeTag: (label: string) => void;
  clearNodeFilters: () => void;
  addNode: (nodeData: {
    label: string;
    subtitle: string;
    category: NodeCategory;
    filePath?: string;
    summary?: string;
  }) => void;
}

const ROOT_CRUMB: BreadcrumbItem = { id: null, label: '' };

let snapshotSeq = 0;

function captureSnapshot(s: CanvasState): CanvasSnapshot {
  const lastCrumb = s.breadcrumb[s.breadcrumb.length - 1];
  return {
    id: `v${++snapshotSeq}`,
    scopeId: s.scopeId,
    scopeCrumbId: lastCrumb ? lastCrumb.id : null,
    breadcrumb: [...s.breadcrumb],
    abstractionLevel: s.abstractionLevel,
    nodes: s.nodes,
    edges: s.edges,
    expandedIds: [...s.expandedIds],
    pinnedIds: [...s.pinnedIds],
    childPositions: { ...s.childPositions },
    listFilterOverrides: { ...s.listFilterOverrides },
    focusNodeId: s.focusNodeId,
    searchFilter: s.searchFilter,
    selectedNodeId: s.selectedNodeId,
    selectedEdgeId: s.selectedEdgeId,
    isInspectorOpen: s.isInspectorOpen,
    layoutDirection: s.layoutDirection,
    nodeFilters: { ...s.nodeFilters },
  };
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  abstractionLevel: 'full',
  activeProjectId: null,
  scopeId: null,
  breadcrumb: [ROOT_CRUMB],
  nodes: [],
  edges: [],
  renderNodes: [],
  renderEdges: [],
  expandedIds: [],
  pinnedIds: [],
  childPositions: {},
  listFilterOverrides: {},
  focusNodeId: null,
  viewHistory: [],
  viewIndex: -1,
  urlSink: null,
  accordionMode: true,
  listModeThreshold: 8,
  panToNodeId: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  isInspectorOpen: false,
  searchFilter: '',
  refreshKey: 0,
  layoutDirection: 'TB',
  nodeFilters: { visibility: 'all', tags: [] },
  loadError: null,

  setProjectContext: (projectId) => {
    set({
      activeProjectId: projectId,
      scopeId: null,
      breadcrumb: [ROOT_CRUMB],
      selectedNodeId: null,
      selectedEdgeId: null,
      isInspectorOpen: false,
      expandedIds: [],
      pinnedIds: [],
      childPositions: {},
      listFilterOverrides: {},
      panToNodeId: null,
      focusNodeId: null,
      searchFilter: '',
      viewHistory: [],
      viewIndex: -1,
    });
    get().loadFullGraph({ mode: 'replace' });
  },

  _commit: (apply, mode) => {
    const s = get();
    const prev = captureSnapshot(s);
    if (typeof apply === 'function') {
      apply();
    } else {
      set(apply);
    }
    const cur = captureSnapshot(get());
    const history = [...s.viewHistory.slice(0, s.viewIndex + 1)];
    if (mode === 'push') history.push(prev);
    history.push(cur);
    set({ viewHistory: history, viewIndex: history.length - 1 });
    get().recomputeRender();
    s.urlSink?.(cur, mode);
  },

  loadFullGraph: async (opts) => {
    const mode = opts?.mode ?? 'push';
    const { activeProjectId } = get();

    let graph: GraphPayload | null = null;
    if (activeProjectId) {
      try {
        graph = await api.get<GraphPayload>(`/projects/${activeProjectId}/graph/all`);
      } catch (err) {
        if (err instanceof ApiError) console.warn('[canvas] Full graph load failed:', err.message);
      }
      if (!graph) {
        try {
          const root = await api.get<GraphPayload>(`/projects/${activeProjectId}/graph/root`);
          graph = { nodes: root.nodes, edges: root.edges };
        } catch (err) {
          if (err instanceof ApiError) console.warn('[canvas] Full graph fallback failed:', err.message);
        }
      }
    }
    if (!graph) {
      set({ loadError: 'Could not load the graph â€” start the backend and retry.' });
      graph = { nodes: [], edges: [] };
    } else {
      set({ loadError: null });
    }

    const rawNodes = graph.nodes as Node<EntityNodeData>[];
    const relEdges = graph.edges as Edge<RelationshipEdgeData>[];
    const allEdges = [...relEdges, ...buildScopeEdges(rawNodes)];
    const allAtOrigin = rawNodes.length > 0 && rawNodes.every((n) => n.position.x === 0 && n.position.y === 0);
    let nodes: Node<EntityNodeData>[] = rawNodes;
    let edges: Edge<RelationshipEdgeData>[] = allEdges;
    if (allAtOrigin) {
      ({ nodes, edges } = layoutNodes(rawNodes, allEdges, get().layoutDirection));
    } else {
      edges = routeEdgeHandles(nodes, allEdges);
    }

    // Default overview: expand top-level containers so the module layer is
    // visible in grouped scopes; deeper levels stay collapsed until opened.
    const childParentIds = new Set(nodes.map((n) => (n.data as EntityNodeData).parentNodeId).filter(Boolean));
    const defaultExpanded = nodes
      .filter((n) => !(n.data as EntityNodeData).parentNodeId && childParentIds.has(n.id))
      .map((n) => n.id);

    get()._commit(
      () => {
        set({
          abstractionLevel: 'full',
          scopeId: null,
          breadcrumb: [ROOT_CRUMB],
          nodes,
          edges,
          selectedNodeId: null,
          selectedEdgeId: null,
          isInspectorOpen: false,
          expandedIds: defaultExpanded,
          pinnedIds: [],
          childPositions: {},
          listFilterOverrides: {},
          panToNodeId: null,
          focusNodeId: null,
          searchFilter: '',
          refreshKey: get().refreshKey + 1,
        });
      },
      mode
    );
  },

  restoreScope: async (projectId, nodeId, opts) => {
    const mode = opts?.mode ?? 'replace';
    set({ activeProjectId: projectId, selectedNodeId: null, selectedEdgeId: null, isInspectorOpen: false });

    let path: { id: string; label: string }[] = [];
    try {
      const res = await api.get<{ path: { id: string; label: string }[] }>(
        `/projects/${projectId}/graph/${nodeId}/path`
      );
      path = res.path || [];
    } catch (err) {
      if (err instanceof ApiError) console.warn('[canvas] Deep-link path restore failed:', err.message);
    }

    if (path.length) {
      const breadcrumb: BreadcrumbItem[] = [ROOT_CRUMB, ...path.map((p) => ({ id: p.id, label: p.label }))];
      await get().loadScope(path[path.length - 1].id, breadcrumb, mode);
    } else {
      await get().loadFullGraph({ mode });
    }
  },

  loadScope: async (parentId, nextBreadcrumb, mode = 'push') => {
    const { activeProjectId } = get();

    let graph: GraphPayload | null = null;
    if (activeProjectId) {
      try {
        const res = parentId
          ? await api.get<GraphPayload & { node: unknown }>(`/projects/${activeProjectId}/graph/${parentId}/children`)
          : await api.get<GraphPayload>(`/projects/${activeProjectId}/graph/root`);
        graph = { nodes: res.nodes, edges: res.edges };
      } catch (err) {
        if (err instanceof ApiError) console.warn('[canvas] Scope load failed:', err.message);
      }
    }

    if (!graph) {
      set({ loadError: 'Could not load the graph â€” start the backend and retry.' });
      graph = { nodes: [], edges: [] };
    } else {
      set({ loadError: null });
    }

    let nodes = graph.nodes as Node<EntityNodeData>[];
    let edges = graph.edges as Edge<RelationshipEdgeData>[];
    const allAtOrigin = nodes.length > 0 && nodes.every((n) => n.position.x === 0 && n.position.y === 0);
    if (allAtOrigin) {
      ({ nodes, edges } = layoutNodes(nodes, edges, get().layoutDirection));
    } else {
      edges = routeEdgeHandles(nodes, edges);
    }

    get()._commit(
      () => {
        set({
          scopeId: parentId,
          breadcrumb: nextBreadcrumb,
          nodes,
          edges,
          selectedNodeId: null,
          selectedEdgeId: null,
          isInspectorOpen: false,
          expandedIds: [],
          pinnedIds: [],
          childPositions: {},
          listFilterOverrides: {},
          panToNodeId: null,
          focusNodeId: null,
          searchFilter: '',
          refreshKey: get().refreshKey + 1,
        });
      },
      mode
    );
  },

  drillInto: async (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const label = (node.data?.label as string) || nodeId;
    await get().loadScope(nodeId, [...get().breadcrumb, { id: nodeId, label }], 'push');
  },

  goToBreadcrumb: async (index) => {
    const { breadcrumb } = get();
    if (index < 0 || index >= breadcrumb.length) return;
    const crumb = breadcrumb[index];
    await get().loadScope(crumb.id, breadcrumb.slice(0, index + 1), 'push');
  },

  goBack: () => {
    if (get().viewIndex <= 0) return;
    window.history.back();
  },

  goForward: () => {
    const s = get();
    if (s.viewIndex >= s.viewHistory.length - 1) return;
    window.history.forward();
  },

  resetToRoot: async () => {
    await get().loadFullGraph({ mode: 'push' });
  },

  jumpToLevel: async (level, mode = 'push') => {
    if (level === 'full') {
      await get().loadFullGraph({ mode });
      return;
    }

    const { activeProjectId } = get();
    let graph: GraphPayload | null = null;
    if (activeProjectId) {
      try {
        graph = await api.get<GraphPayload>(`/projects/${activeProjectId}/graph?level=${level}`);
      } catch (err) {
        if (err instanceof ApiError) console.warn('[canvas] Level jump failed:', err.message);
      }
    }
    if (!graph) {
      set({ loadError: 'Could not load the graph â€” start the backend and retry.' });
      graph = { nodes: [], edges: [] };
    } else {
      set({ loadError: null });
    }

    const rawNodes = graph.nodes as Node<EntityNodeData>[];
    let nodes: Node<EntityNodeData>[] = rawNodes;
    let edges = graph.edges as Edge<RelationshipEdgeData>[];
    const allAtOrigin = rawNodes.length > 0 && rawNodes.every((n) => n.position.x === 0 && n.position.y === 0);
    if (allAtOrigin) {
      ({ nodes, edges } = layoutNodes(rawNodes, edges, get().layoutDirection));
    } else {
      edges = routeEdgeHandles(nodes, edges);
    }

    get()._commit(
      () => {
        set({
          abstractionLevel: level,
          scopeId: null,
          breadcrumb: [ROOT_CRUMB],
          nodes,
          edges,
          selectedNodeId: null,
          selectedEdgeId: null,
          isInspectorOpen: false,
          expandedIds: [],
          pinnedIds: [],
          childPositions: {},
          listFilterOverrides: {},
          panToNodeId: null,
          focusNodeId: null,
          searchFilter: '',
          refreshKey: get().refreshKey + 1,
        });
      },
      mode
    );
  },

  onNodesChange: (changes: any) => {
    const { nodes, renderNodes, expandedIds, childPositions, activeProjectId } = get();
    const expandedSet = new Set(expandedIds);
    const nextRender = applyNodeChanges(changes, renderNodes) as Node<any>[];

    const posChanges = (changes as any[]).filter((c) => c.type === 'position' && c.position);
    let nextNodes = nodes;
    let nextChildPos = childPositions;
    if (posChanges.length > 0) {
      const containerAbs = new Map<string, { x: number; y: number }>();
      for (const rn of renderNodes) {
        if (rn.type === 'groupNode' && expandedSet.has(rn.id)) containerAbs.set(rn.id, rn.position);
      }

      const changed = new Set(posChanges.map((c) => c.id));
      nextNodes = nodes.map((n) => {
        if (!changed.has(n.id)) return n;
        const rn = nextRender.find((r) => r.id === n.id);
        if (!rn?.position) return n;
        const pid = (n.data as EntityNodeData)?.parentNodeId;
        const cp = pid ? containerAbs.get(pid) : undefined;
        const abs = cp ? { x: rn.position.x + cp.x, y: rn.position.y + cp.y } : rn.position;
        return { ...n, position: { x: abs.x, y: abs.y } };
      });

      // Remember dragged child positions so a later recompute keeps them.
      for (const pc of posChanges) {
        const node = nextNodes.find((n) => n.id === pc.id);
        const pid = (node?.data as EntityNodeData)?.parentNodeId;
        if (pid && containerAbs.has(pid)) {
          nextChildPos = { ...nextChildPos, [pc.id]: { x: node!.position.x, y: node!.position.y } };
        }
      }

      // When a container is dragged, shift its children's absolute positions.
      for (const pc of posChanges) {
        const before = renderNodes.find((r) => r.id === pc.id);
        const after = nextRender.find((r) => r.id === pc.id);
        if (!before || !after) continue;
        const isContainer = containerAbs.has(pc.id) || isContainerInStore(pc.id, nodes);
        if (!isContainer) continue;
        const dx = after.position.x - before.position.x;
        const dy = after.position.y - before.position.y;
        if (dx === 0 && dy === 0) continue;
        for (const did of collectDescendants(pc.id, nodes)) {
          if (nextChildPos[did]) {
            nextChildPos = {
              ...nextChildPos,
              [did]: { x: nextChildPos[did].x + dx, y: nextChildPos[did].y + dy },
            };
          }
        }
      }
    }

    set({ nodes: nextNodes, renderNodes: nextRender, childPositions: nextChildPos });

    const positionChange = posChanges[0];
    if (positionChange) {
      pendingPosition = {
        projectId: activeProjectId,
        nodeId: positionChange.id,
        x: positionChange.position.x,
        y: positionChange.position.y,
      };
      if (positionSyncTimer) clearTimeout(positionSyncTimer);
      positionSyncTimer = setTimeout(() => {
        const pending = pendingPosition;
        pendingPosition = null;
        if (!pending?.projectId) return;
        const n = get().nodes.find((x) => x.id === pending.nodeId);
        const pid = (n?.data as EntityNodeData)?.parentNodeId;
        if (pid && get().expandedIds.includes(pid)) return;
        api
          .patch(`/projects/${pending.projectId}/graph/nodes/${pending.nodeId}/position`, {
            x: pending.x,
            y: pending.y,
          })
          .catch((err) => {
            if (err instanceof ApiError) console.warn('[canvas] Position sync skipped:', err.message);
          });
      }, 400);
    }
  },

  onEdgesChange: (changes: any) => {
    set({
      renderEdges: applyEdgeChanges(changes, get().renderEdges) as Edge<any>[],
    });
  },

  onConnect: (connection) => {
    const { activeProjectId } = get();
    const source = connection?.source;
    const target = connection?.target;
    if (!source || !target || source === target) return;

    const tempId = `edge-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const edge: Edge<RelationshipEdgeData> = {
      id: tempId,
      source,
      target,
      type: 'relationshipEdge',
      data: { relationshipType: 'DEPENDS_ON' },
    };

    set((s) => ({ edges: [...s.edges, edge] }));
    get().recomputeRender();

    if (!activeProjectId) return;
    api
      .post<{ id: string; source: string; target: string }>(`/projects/${activeProjectId}/graph/edges`, {
        source,
        target,
        relationshipType: 'DEPENDS_ON',
      })
      .then((saved) => {
        if (!saved?.id || saved.id === tempId) return;
        set((s) => ({
          edges: s.edges.map((e) => (e.id === tempId ? { ...e, id: saved.id } : e)),
        }));
        get().recomputeRender();
      })
      .catch((err) => {
        if (err instanceof ApiError) console.warn('[canvas] Edge save failed:', err.message);
        set((s) => ({ edges: s.edges.filter((e) => e.id !== tempId) }));
        get().recomputeRender();
      });
  },

  cutEdge: (edgeId) => {
    const { activeProjectId } = get();
    const target = get().edges.find((e) => e.id === edgeId);
    if (!target) return;

    set((s) => ({
      edges: s.edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId,
      isInspectorOpen: s.selectedEdgeId === edgeId ? false : s.isInspectorOpen,
    }));
    get().recomputeRender();

    if (!activeProjectId) return;
    api
      .del(`/projects/${activeProjectId}/graph/edges/${encodeURIComponent(edgeId)}`)
      .catch((err) => {
        if (err instanceof ApiError) console.warn('[canvas] Edge delete failed:', err.message);
        set((s) => ({
          edges: s.edges.some((e) => e.id === edgeId) ? s.edges : [...s.edges, target],
        }));
        get().recomputeRender();
      });
  },

  selectNode: (id) => {
    set({
      selectedNodeId: id,
      selectedEdgeId: null,
      isInspectorOpen: id !== null,
    });
  },

  selectEdge: (id) => {
    set({
      selectedEdgeId: id,
      selectedNodeId: null,
      isInspectorOpen: id !== null,
    });
  },

  closeInspector: () => {
    set({
      isInspectorOpen: false,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  updateNodeSize: (nodeId, size) => {
    const s = get();
    const w = Math.max(1, Math.round(size.width));
    const h = Math.max(1, Math.round(size.height));
    const nextNodes = s.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...(n.data as EntityNodeData), width: w, height: h } }
        : n
    );
    set({ nodes: nextNodes });
    if (s.activeProjectId) {
      api
        .patch(`/projects/${s.activeProjectId}/graph/nodes/${encodeURIComponent(nodeId)}/size`, {
          width: w,
          height: h,
        })
        .catch((err) => {
          if (err instanceof ApiError) console.warn('[canvas] Size save skipped:', err.message);
        });
    }
    get().recomputeRender();
  },

  setSearchFilter: (query) => {
    if (!query.trim()) {
      set({ searchFilter: query, listFilterOverrides: {} });
      get().recomputeRender();
    } else {
      set({ searchFilter: query });
    }
  },

  recomputeRender: () => {
    const s = get();
    const { renderNodes, renderEdges } = computeRenderGraph({
      nodes: s.nodes,
      edges: s.edges,
      expandedIds: s.expandedIds,
      pinnedIds: s.pinnedIds,
      childPositions: s.childPositions,
      listFilterOverrides: s.listFilterOverrides,
      listModeThreshold: s.listModeThreshold,
      visibility: s.nodeFilters.visibility,
      tags: s.nodeFilters.tags,
      focusNodeId: s.focusNodeId,
    });
    set({ renderNodes, renderEdges });
  },

  toggleExpand: (nodeId) => {
    const { nodes, expandedIds, accordionMode } = get();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const target = byId.get(nodeId);
    if (!target) return;
    const wasExpanded = expandedIds.includes(nodeId);
    if (!wasExpanded && !isContainerInStore(nodeId, nodes)) return;

    let next = wasExpanded
      ? expandedIds.filter((id) => id !== nodeId)
      : [...expandedIds, nodeId];

    if (!wasExpanded && accordionMode) {
      const parentId = (target.data as EntityNodeData).parentNodeId;
      next = next.filter((id) => {
        if (id === nodeId) return true;
        const n = byId.get(id);
        return !(n && (n.data as EntityNodeData).parentNodeId === parentId);
      });
    }

    const removed = expandedIds.filter((id) => !next.includes(id));
    if (removed.length) {
      const selectedNodeId = get().selectedNodeId;
      if (selectedNodeId) {
        let cur = byId.get(selectedNodeId);
        let hidden = false;
        while (cur) {
          const p = (cur.data as EntityNodeData).parentNodeId;
          if (p && removed.includes(p)) {
            hidden = true;
            break;
          }
          cur = p ? byId.get(p) : undefined;
        }
        if (hidden) set({ selectedNodeId: null, selectedEdgeId: null, isInspectorOpen: false });
      }
    }

    set({ expandedIds: next });
    get().recomputeRender();
  },

  revealNode: (nodeId) => {
    const { nodes, expandedIds, accordionMode } = get();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    let walker = byId.get(nodeId);
    if (!walker) return;

    const chain: string[] = [];
    while (walker) {
      const p = (walker.data as EntityNodeData).parentNodeId;
      if (!p || !byId.has(p)) break;
      chain.unshift(p);
      walker = byId.get(p);
    }

    const next = new Set(expandedIds);
    for (const anc of chain) {
      next.add(anc);
      if (accordionMode) {
        const n = byId.get(anc)!;
        const pid = (n.data as EntityNodeData).parentNodeId;
        for (const id of [...next]) {
          if (id === anc) continue;
          const sib = byId.get(id);
          if (sib && (sib.data as EntityNodeData).parentNodeId === pid) next.delete(id);
        }
      }
    }

    set({ expandedIds: [...next], panToNodeId: nodeId });
    get().recomputeRender();
  },

  revealSearchMatch: () => {
    const { nodes, searchFilter, expandedIds, pinnedIds, listModeThreshold } = get();
    const q = searchFilter.trim().toLowerCase();
    if (!q) return;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const expandedSet = new Set(expandedIds);
    const pinnedSet = new Set(pinnedIds);

    for (const n of nodes) {
      const d = n.data as EntityNodeData;
      const label = String(d.label || '').toLowerCase();
      const sub = String(d.subtitle || '').toLowerCase();
      if (!label.includes(q) && !sub.includes(q)) continue;

      const pid = (n.data as EntityNodeData).parentNodeId;
      const parent = pid ? byId.get(pid) : undefined;
      const parentChildren = pid ? nodes.filter((x) => (x.data as EntityNodeData).parentNodeId === pid) : [];
      const parentIsList = !!parent && parentChildren.length > listModeThreshold;

      // Matches inside a compact-list container: reveal the container (rows are
      // not React Flow nodes, so pan to the container itself) and filter its
      // rows to the query.
      if (parentIsList) {
        get().revealNode(pid);
        get().setListFilter(pid, q);
        set({ panToNodeId: pid });
        return;
      }

      // Skip matches that are already fully revealed on the canvas.
      let cur = n;
      let fullyRevealed = true;
      while (cur) {
        const p = (cur.data as EntityNodeData).parentNodeId;
        if (!p || !byId.has(p)) break;
        if (!expandedSet.has(p) && !pinnedSet.has(p)) {
          fullyRevealed = false;
          break;
        }
        cur = byId.get(p);
      }
      if (fullyRevealed) continue;

      get().revealNode(n.id);
      set({ selectedNodeId: n.id, selectedEdgeId: null, isInspectorOpen: true });
      return;
    }
  },

  setPinned: (nodeId, pinned) => {
    const { pinnedIds } = get();
    const next = pinned ? [...new Set([...pinnedIds, nodeId])] : pinnedIds.filter((id) => id !== nodeId);
    set({ pinnedIds: next });
    get().recomputeRender();
  },

  setListFilter: (containerId, query) => {
    set((s) => ({ listFilterOverrides: { ...s.listFilterOverrides, [containerId]: query } }));
  },

  setFocusNode: (nodeId) => {
    const s = get();
    if (nodeId === null) {
      if (!s.focusNodeId) return;
      // "Show all": jump back to the nearest view without focus mode.
      for (let i = s.viewIndex; i >= 0; i--) {
        const snap = s.viewHistory[i];
        if (!snap.focusNodeId) {
          get().restoreSnapshot(snap.id);
          s.urlSink?.(snap, 'replace');
          return;
        }
      }
      get()._commit({ focusNodeId: null }, 'replace');
      return;
    }
    if (nodeId === s.focusNodeId) return;
    get()._commit(
      { focusNodeId: nodeId, selectedNodeId: null, selectedEdgeId: null, isInspectorOpen: false },
      'push'
    );
  },

  restoreSnapshot: (snapshotId) => {
    const s = get();
    const index = s.viewHistory.findIndex((x) => x.id === snapshotId);
    if (index === -1) return false;
    const snap = s.viewHistory[index];
    set({
      scopeId: snap.scopeId,
      breadcrumb: [...snap.breadcrumb],
      abstractionLevel: snap.abstractionLevel,
      nodes: snap.nodes,
      edges: snap.edges,
      expandedIds: [...snap.expandedIds],
      pinnedIds: [...snap.pinnedIds],
      childPositions: { ...snap.childPositions },
      listFilterOverrides: { ...snap.listFilterOverrides },
      focusNodeId: snap.focusNodeId,
      searchFilter: snap.searchFilter,
      selectedNodeId: snap.selectedNodeId,
      selectedEdgeId: snap.selectedEdgeId,
      isInspectorOpen: snap.isInspectorOpen,
      layoutDirection: snap.layoutDirection,
      nodeFilters: { ...snap.nodeFilters },
      panToNodeId: null,
      loadError: null,
      refreshKey: s.refreshKey + 1,
      viewIndex: index,
    });
    get().recomputeRender();
    return true;
  },

  restoreUrlView: async (projectId, opts) => {
    set({
      activeProjectId: projectId,
      selectedNodeId: null,
      selectedEdgeId: null,
      isInspectorOpen: false,
      viewHistory: [],
      viewIndex: -1,
    });
    if (opts.level && opts.level !== 'full') {
      await get().jumpToLevel(opts.level, 'replace');
    } else if (opts.node) {
      await get().restoreScope(projectId, opts.node, { mode: 'replace' });
    } else {
      await get().loadFullGraph({ mode: 'replace' });
    }
    if (opts.focus && get().nodes.some((n) => n.id === opts.focus)) {
      get()._commit({ focusNodeId: opts.focus }, 'replace');
    }
  },

  setUrlSink: (fn) => {
    set({ urlSink: fn });
  },

  setAccordionMode: (on) => {
    set({ accordionMode: on });
  },

  setListModeThreshold: (n) => {
    set({ listModeThreshold: n });
    get().recomputeRender();
  },

  autoLayout: (direction = get().layoutDirection) => {
    const { activeProjectId, nodes, edges } = get();
    const topNodes = nodes.filter((n) => {
      const pid = (n.data as EntityNodeData)?.parentNodeId;
      return !pid || !nodes.some((x) => x.id === pid);
    });
    const topIds = new Set(topNodes.map((n) => n.id));
    const topEdges = edges.filter((e) => topIds.has(e.source) && topIds.has(e.target));
    const laid = layoutNodes(topNodes, topEdges, direction);
    const laidById = new Map(laid.nodes.map((n) => [n.id, n]));
    const nextNodes = nodes.map((n) => laidById.get(n.id) ?? n);
    set({ nodes: nextNodes });
    persistPositions(activeProjectId, laid.nodes);
    get().recomputeRender();
  },

  setLayoutDirection: (direction) => {
    set({ layoutDirection: direction });
    get().autoLayout(direction);
  },

  setNodeVisibility: (visibility) => {
    set((s) => ({ nodeFilters: { ...s.nodeFilters, visibility } }));
    get().recomputeRender();
  },

  toggleNodeTag: (label) => {
    set((s) => ({
      nodeFilters: {
        ...s.nodeFilters,
        tags: s.nodeFilters.tags.includes(label)
          ? s.nodeFilters.tags.filter((t) => t !== label)
          : [...s.nodeFilters.tags, label],
      },
    }));
    get().recomputeRender();
  },

  clearNodeFilters: () => {
    set({ nodeFilters: { visibility: 'all', tags: [] } });
    get().recomputeRender();
  },

  addNode: (data) => {
    const { activeProjectId, scopeId } = get();

    const applyLocal = (node: Node<EntityNodeData>) => {
      set((state) => ({
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        isInspectorOpen: true,
      }));
      get().recomputeRender();
    };

    if (!activeProjectId) return;

    api
      .post<Node<EntityNodeData>>(`/projects/${activeProjectId}/graph/nodes`, {
        label: data.label,
        subtitle: data.subtitle,
        category: data.category,
        filePath: data.filePath,
        summary: data.summary,
        parentId: scopeId,
      })
      .then((node) => applyLocal(node))
      .catch((err) => {
        if (err instanceof ApiError) console.warn('[canvas] addNode failed:', err.message);
        throw err;
      });
  },
}));
