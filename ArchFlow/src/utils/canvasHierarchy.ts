import { Node, Edge } from '@xyflow/react';
import { EntityNodeData, RelationshipEdgeData } from '../types';
import type { NodeVisibility } from '../store/useCanvasStore';
import { nodeTagKeys, tagLabel } from './nodeFilters';

// --- Layout constants ---

export const GRID_CARD_W = 240;
export const GRID_CARD_H = 92;
export const GRID_GAP = 16;
export const GRID_PAD = 20;
export const GRID_INNER_MAX = 600;
export const GRID_MIN_W = 640;
export const GROUP_HEADER_H = 44;
export const LIST_CONTAINER_W = 380;
export const LIST_ROW_H = 30;
export const LIST_FILTER_H = 42;
export const LIST_BODY_H = 420;
export const LIST_FOOTER_H = 32;
export const LIST_PAGE_SIZE = 30;
export const LIST_PAD = 12;

export interface ChildPosMap {
  [id: string]: { x: number; y: number };
}

export interface ComputeRenderParams {
  nodes: Node<EntityNodeData>[];
  edges: Edge<RelationshipEdgeData>[];
  expandedIds: string[];
  pinnedIds: string[];
  childPositions: ChildPosMap;
  listFilterOverrides: Record<string, string>;
  listModeThreshold: number;
  visibility: NodeVisibility;
  tags: string[];
  focusNodeId: string | null;
}

interface Size {
  w: number;
  h: number;
}

export function estimateNodeSize(data: EntityNodeData | undefined) {
  const labelLen = String(data?.label || '').length;
  const width = Math.min(340, Math.max(260, 120 + labelLen * 7.5));
  let height = 96;
  if (data?.filePath) height += 28;
  if (data?.subNodes && data.subNodes.length > 0) height += 56;
  return { width, height };
}

// A node carries an explicit manual size (set by the user dragging a resize
// handle) in its `data.width` / `data.height`. When present it wins over any
// computed/estimated size so the resize survives recomputes and reloads.
function manualSizeOf(data: unknown): Size | null {
  const d = data as { width?: unknown; height?: unknown } | undefined;
  const w = typeof d?.width === 'number' && Number.isFinite(d.width) ? d.width : 0;
  const h = typeof d?.height === 'number' && Number.isFinite(d.height) ? d.height : 0;
  return w > 0 && h > 0 ? { w, h } : null;
}

// Compact external-dependency chips on mini-cards (see GroupChildNode) need a
// small height bump so they don't clip against the overflow-hidden card.
function externalSubNodeCount(data: unknown): number {
  const d = data as { subNodes?: { category?: string }[] } | undefined;
  return (d?.subNodes || []).filter((s) => s.category === 'external-api').length;
}

// Content-aware size for the compact grid cards. Width scales with the label so
// long titles get room and short ones pack tighter; height grows with the extra
// footer rows (file path, external-dependency chips) the card actually renders.
function gridChildSize(data: unknown): Size {
  const manual = manualSizeOf(data);
  if (manual) return manual;
  const d = data as { label?: string; filePath?: string } | undefined;
  const labelLen = String(d?.label || '').length;
  const width = Math.min(300, Math.max(200, 120 + labelLen * 7));
  let height = 56;
  if (d?.filePath) height += 24;
  if (externalSubNodeCount(data) > 0) height += 24;
  return { w: width, h: height };
}

// Collapsed container cards render a taller header row than mini-cards, so they
// keep the classic card proportions while still scaling to long labels.
function collapsedContainerSize(data: unknown): Size {
  const base = gridChildSize(data);
  return { w: Math.max(base.w, GRID_CARD_W), h: Math.max(base.h, GRID_CARD_H) };
}

// List containers grow with the number of rows so the border hugs its items,
// then cap out (remaining rows scroll inside the container).
function listBodyHeight(count: number): number {
  return Math.min(Math.max(count, 1) * LIST_ROW_H, LIST_BODY_H);
}

/**
 * Computes the node/edge set handed to React Flow from the full store graph.
 *
 * - Nodes whose ancestor containers are not all expanded are hidden.
 * - Expanded containers become `groupNode`s (bounded, dashed containers);
 *   their children are either `groupChildNode` mini-cards laid out in an
 *   internal grid, or (over the list-mode threshold) compact DOM rows inside
 *   the container with an inline filter + pagination.
 * - Positions are expressed relative to the nearest expanded container and
 *   children use `parentId` + `extent: 'parent'` so they move with their
 *   container and can't be dragged outside it.
 */
export function computeRenderGraph(params: ComputeRenderParams): {
  renderNodes: Node<Record<string, unknown>>[];
  renderEdges: Edge<RelationshipEdgeData>[];
} {
  const {
    nodes,
    edges,
    expandedIds,
    pinnedIds,
    childPositions,
    listFilterOverrides,
    listModeThreshold,
    visibility,
    tags,
    focusNodeId,
  } = params;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenById = new Map<string, Node<EntityNodeData>[]>();
  for (const n of nodes) {
    const pid = (n.data as EntityNodeData).parentNodeId;
    if (pid && pid !== n.id && byId.has(pid)) {
      if (!childrenById.has(pid)) childrenById.set(pid, []);
      childrenById.get(pid)!.push(n);
    }
  }
  const expandedSet = new Set(expandedIds);
  const pinnedSet = new Set(pinnedIds);
  const topLevel = nodes.filter((n) => {
    const pid = (n.data as EntityNodeData).parentNodeId;
    return !pid || !byId.has(pid);
  });

  const passes = (n: Node<EntityNodeData>): boolean => {
    const d = n.data as EntityNodeData;
    if (visibility === 'parents' && !(Number(d.childCount) > 0)) return false;
    if (visibility === 'children' && Number(d.childCount) > 0) return false;
    if (tags.length) {
      const keys = nodeTagKeys(d);
      if (!keys.some((k) => tags.includes(tagLabel(k)))) return false;
    }
    return true;
  };

  // --- Visible set (ancestors fully expanded) ---
  const visible = new Set<string>();
  const markVisible = (n: Node<EntityNodeData>, force = false) => {
    if (visible.has(n.id)) return;
    if (!force && !passes(n)) return;
    visible.add(n.id);
    const kids = childrenById.get(n.id);
    if (kids && (force || expandedSet.has(n.id))) {
      for (const k of kids) markVisible(k);
    }
  };
  for (const n of topLevel) markVisible(n);
  for (const id of pinnedIds) {
    const n = byId.get(id);
    if (n) markVisible(n, true);
  }

  const isContainer = (id: string) => (childrenById.get(id)?.length || 0) > 0;

  // --- Measure pass (bottom-up; sizes only, independent of origin) ---
  const measureCache = new Map<string, Size>();
  const measure = (id: string): Size => {
    const cached = measureCache.get(id);
    if (cached) return cached;
    const n = byId.get(id);
    const manual = manualSizeOf(n?.data);
    if (manual) {
      measureCache.set(id, manual);
      return manual;
    }
    const kids = childrenById.get(id);
    const expanded = !!n && !!kids && kids.length > 0 && expandedSet.has(id) && visible.has(id);
    let size: Size;
    if (!expanded) {
      size = collapsedContainerSize(n?.data);
    } else if (kids.length > listModeThreshold) {
      size = {
        w: LIST_CONTAINER_W,
        h: GROUP_HEADER_H + LIST_FILTER_H + listBodyHeight(kids.length) + LIST_FOOTER_H + LIST_PAD * 2,
      };
    } else {
      size = measureGrid(kids, measure);
    }
    measureCache.set(id, size);
    return size;
  };

  const renderNodes: Node<Record<string, unknown>>[] = [];
  const renderNodeIds = new Set<string>();
  const pushNode = (rn: Node<Record<string, unknown>>) => {
    if (renderNodeIds.has(rn.id)) return;
    renderNodeIds.add(rn.id);
    renderNodes.push(rn);
  };

  const makeGroupNode = (
    n: Node<EntityNodeData>,
    origin: { x: number; y: number },
    w: number,
    h: number,
    flags: { expanded: boolean; listMode?: boolean; childIds?: string[]; rows?: unknown[] }
  ): Node<Record<string, unknown>> => {
    const d = n.data as EntityNodeData;
    const listMode = flags.listMode ?? false;
    const containerId = n.id;
    return {
      id: n.id,
      type: 'groupNode',
      position: origin,
      draggable: true,
      style: { width: w, height: h },
      className: 'afx-animated',
      data: {
        ...(d as unknown as Record<string, unknown>),
        expanded: flags.expanded,
        listMode,
        nodeCount: flags.childIds?.length ?? (Number(d.childCount) || 0),
        childIds: flags.childIds ?? [],
        rows: flags.rows ?? [],
        filterQuery: flags.expanded && listMode ? listFilterOverrides[containerId] ?? '' : undefined,
      },
    };
  };

  const makeMiniCard = (
    n: Node<EntityNodeData>,
    rel: { x: number; y: number },
    parentId: string
  ): Node<Record<string, unknown>> => {
    const size = gridChildSize(n.data);
    return {
      id: n.id,
      type: 'groupChildNode',
      position: rel,
      parentId,
      extent: 'parent',
      draggable: true,
      style: { width: size.w, height: size.h },
      className: 'afx-animated',
      data: n.data as unknown as Record<string, unknown>,
    };
  };

  const makeEntityNode = (
    n: Node<EntityNodeData>,
    pos: { x: number; y: number }
  ): Node<Record<string, unknown>> => {
    const est = estimateNodeSize(n.data as EntityNodeData | undefined);
    const manual = manualSizeOf(n.data);
    return {
      id: n.id,
      type: 'entityNode',
      position: pos,
      draggable: true,
      style: { width: manual?.w ?? est.width, height: manual?.h ?? est.height },
      data: n.data as unknown as Record<string, unknown>,
    };
  };

  const layoutContainer = (
    id: string,
    origin: { x: number; y: number }
  ): Size => {
    const n = byId.get(id);
    if (!n) return { w: GRID_CARD_W, h: GRID_CARD_H };
    const kids = childrenById.get(id) || [];
    const expanded = kids.length > 0 && expandedSet.has(id) && visible.has(id);

    if (!expanded) {
      const size = collapsedContainerSize(n.data);
      pushNode(makeGroupNode(n, origin, size.w, size.h, { expanded: false }));
      return size;
    }

    if (kids.length > listModeThreshold) {
      const w = LIST_CONTAINER_W;
      const h = GROUP_HEADER_H + LIST_FILTER_H + listBodyHeight(kids.length) + LIST_FOOTER_H + LIST_PAD * 2;
      const rows = kids.map((k) => {
        const kd = k.data as EntityNodeData;
        return {
          id: k.id,
          label: kd.label ?? k.id,
          subtitle: kd.subtitle ?? '',
          category: kd.category ?? 'component',
          childCount: Number(kd.childCount) || 0,
        };
      });
      pushNode(makeGroupNode(n, origin, w, h, { expanded: true, listMode: true, childIds: kids.map((k) => k.id), rows }));
      return { w, h };
    }

    // Grid mode: strip-pack children into rows, then grow the container to
    // enclose every child (the auto-grid slots, any previously saved drag
    // position, and nested containers that grew for their own children) so no
    // node ever gets pinned under the border and gaps are always preserved.
    const items = kids.map((k) => ({ node: k, size: measure(k.id) }));
    let top = GROUP_HEADER_H + GRID_PAD;
    let rowW = 0;
    let rowH = 0;
    let maxRowW = 0;
    const slots = new Map<string, { x: number; y: number }>();
    for (const it of items) {
      if (rowW > 0 && rowW + GRID_GAP + it.size.w > GRID_INNER_MAX) {
        top += rowH + GRID_GAP;
        rowW = 0;
        rowH = 0;
      }
      slots.set(it.node.id, { x: GRID_PAD + rowW, y: top });
      rowW = rowW > 0 ? rowW + GRID_GAP + it.size.w : it.size.w;
      rowH = Math.max(rowH, it.size.h);
      maxRowW = Math.max(maxRowW, rowW);
    }
    let width = Math.max(GRID_MIN_W, maxRowW + GRID_PAD * 2);
    let height = top + rowH + GRID_PAD;

    // Lay nested expanded containers out first so their real (possibly grown)
    // final size is known before the parent's bounds are locked in.
    const rects = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const it of items) {
      const slot = slots.get(it.node.id)!;
      if (isContainer(it.node.id) && expandedSet.has(it.node.id) && visible.has(it.node.id)) {
        const subSize = layoutContainer(it.node.id, { x: origin.x + slot.x, y: origin.y + slot.y });
        rects.set(it.node.id, { ...slot, w: subSize.w, h: subSize.h });
      } else {
        rects.set(it.node.id, { ...slot, w: it.size.w, h: it.size.h });
      }
    }

    // Enclose saved drag positions and account for any child that overflowed
    // its slot, so the section always fits its nodes.
    for (const it of items) {
      const rect = rects.get(it.node.id)!;
      const cp = childPositions[it.node.id];
      if (cp) {
        rect.x = cp.x - origin.x;
        rect.y = cp.y - origin.y;
      }
      width = Math.max(width, rect.x + rect.w + GRID_PAD);
      height = Math.max(height, rect.y + rect.h + GRID_PAD);
    }

    // A previously saved manual container size may only ENLARGE the section,
    // never shrink it below its content.
    const manual = manualSizeOf(n.data);
    const effW = Math.max(width, manual?.w ?? 0);
    const effH = Math.max(height, manual?.h ?? 0);
    pushNode(
      makeGroupNode(n, origin, effW, effH, {
        expanded: true,
        listMode: false,
        childIds: kids.map((k) => k.id),
      })
    );

    for (const it of items) {
      const rect = rects.get(it.node.id)!;
      if (isContainer(it.node.id) && expandedSet.has(it.node.id) && visible.has(it.node.id)) continue;
      let rel: { x: number; y: number };
      const cp = childPositions[it.node.id];
      if (cp) {
        rel = { x: cp.x - origin.x, y: cp.y - origin.y };
        const maxX = effW - it.size.w - GRID_PAD;
        const maxY = effH - it.size.h - GRID_PAD;
        rel.x = Math.max(GRID_PAD, Math.min(rel.x, maxX));
        rel.y = Math.max(GROUP_HEADER_H, Math.min(rel.y, maxY));
      } else {
        rel = { x: rect.x, y: rect.y };
      }
      pushNode(makeMiniCard(it.node, rel, id));
    }
    return { w: effW, h: effH };
  };

  // --- Focus mode: show only the selected node and its direct neighbors ---
  if (focusNodeId && byId.has(focusNodeId)) {
    const focusIds = new Set<string>([focusNodeId]);
    for (const e of edges) {
      if (e.source === focusNodeId && e.target !== focusNodeId) focusIds.add(e.target);
      if (e.target === focusNodeId && e.source !== focusNodeId) focusIds.add(e.source);
    }

    // Compact ring layout around the focused node. Reusing the full-graph
    // positions scatters the small subset across a huge area, so instead the
    // neighbors are spread evenly around the focus node to keep the view tight.
    const centerNode = byId.get(focusNodeId)!;
    const center = childPositions[focusNodeId] ?? { x: centerNode.position.x, y: centerNode.position.y };
    const FOCUS_R = 320;
    const neighbors = [...focusIds]
      .filter((id) => id !== focusNodeId)
      .sort((a, b) => (a < b ? -1 : 1))
      .map((id, i) => ({
        id,
        angle: (i / Math.max(focusIds.size - 1, 1)) * Math.PI * 2 - Math.PI / 2,
      }));
    const focusPos = new Map<string, { x: number; y: number }>([
      [focusNodeId, { x: center.x, y: center.y }],
    ]);
    for (const nb of neighbors) {
      focusPos.set(nb.id, {
        x: center.x + Math.cos(nb.angle) * FOCUS_R,
        y: center.y + Math.sin(nb.angle) * FOCUS_R,
      });
    }

    for (const id of focusIds) {
      const n = byId.get(id);
      if (!n) continue;
      const pos = focusPos.get(id)!;
      const kids = childrenById.get(id);
      if (kids && kids.length > 0) {
        pushNode(makeGroupNode(n, pos, GRID_CARD_W, GRID_CARD_H, { expanded: false }));
      } else {
        pushNode(makeEntityNode(n, pos));
      }
    }
    const sizeOf = buildSizeOf(renderNodes);
    const renderEdges = edges
      .filter((e) => focusIds.has(e.source) && focusIds.has(e.target) && e.source !== e.target)
      .map((e) => routeEdgeHandles(e, renderNodes, sizeOf));
    return { renderNodes, renderEdges };
  }

  for (const n of topLevel) {
    if (!visible.has(n.id)) continue;
    if (isContainer(n.id)) {
      layoutContainer(n.id, { x: n.position.x, y: n.position.y });
    } else {
      pushNode(makeEntityNode(n, { x: n.position.x, y: n.position.y }));
    }
  }

  // Pinned nodes that aren't already rendered (parent collapsed or list mode).
  for (const id of pinnedIds) {
    if (renderNodeIds.has(id)) continue;
    const n = byId.get(id);
    if (!n || !visible.has(id)) continue;
    const pos = childPositions[id] ?? { x: n.position.x, y: n.position.y };
    if (isContainer(id)) {
      layoutContainer(id, pos);
    } else {
      pushNode(makeEntityNode(n, pos));
    }
  }

  // --- Edges: keep only when both endpoints are rendered ---
  const renderIdSet = new Set(renderNodes.map((rn) => rn.id));
  const sizeOf = buildSizeOf(renderNodes);

  const renderEdges = edges
    .filter((e) => {
      if (!renderIdSet.has(e.source) || !renderIdSet.has(e.target)) return false;
      const src = byId.get(e.source);
      const srcExpanded = src && expandedSet.has(e.source) && childrenById.has(e.source);
      if ((e.data as RelationshipEdgeData)?.scopeEdge && srcExpanded) {
        if ((childrenById.get(e.source) || []).some((k) => k.id === e.target)) return false;
      }
      return true;
    })
    .map((e) => routeEdgeHandles(e, renderNodes, sizeOf));

  return { renderNodes, renderEdges };
}

function buildSizeOf(renderNodes: Node<Record<string, unknown>>[]): Map<string, Size> {
  const sizeOf = new Map<string, Size>();
  for (const rn of renderNodes) {
    const style = rn.style as { width?: number; height?: number } | undefined;
    if (rn.type === 'groupNode' && style?.width && style?.height) {
      sizeOf.set(rn.id, { w: style.width, h: style.height });
    } else if (rn.type === 'groupChildNode') {
      const s = rn.style as { width?: number; height?: number } | undefined;
      sizeOf.set(rn.id, {
        w: s?.width ?? GRID_CARD_W,
        h: s?.height ?? GRID_CARD_H,
      });
    } else {
      const manual = manualSizeOf(rn.data);
      if (manual) {
        sizeOf.set(rn.id, { w: manual.w, h: manual.h });
      } else {
        const est = estimateNodeSize(rn.data as EntityNodeData | undefined);
        sizeOf.set(rn.id, { w: est.width, h: est.height });
      }
    }
  }
  return sizeOf;
}

function measureGrid(kids: Node<EntityNodeData>[], measure: (id: string) => Size): Size {
  let top = GROUP_HEADER_H + GRID_PAD;
  let rowW = 0;
  let rowH = 0;
  let maxRowW = 0;
  for (const k of kids) {
    const s = measure(k.id);
    if (rowW > 0 && rowW + GRID_GAP + s.w > GRID_INNER_MAX) {
      top += rowH + GRID_GAP;
      rowW = 0;
      rowH = 0;
    }
    rowW = rowW > 0 ? rowW + GRID_GAP + s.w : s.w;
    rowH = Math.max(rowH, s.h);
    maxRowW = Math.max(maxRowW, rowW);
  }
  return { w: Math.max(GRID_MIN_W, maxRowW + GRID_PAD * 2), h: top + rowH + GRID_PAD };
}

// Pick closest source/target handle sides so every wire attaches to a real
// side and never collapses into a zero-length stub.
function routeEdgeHandles(
  e: Edge<RelationshipEdgeData>,
  renderNodes: Node<Record<string, unknown>>[],
  sizeOf: Map<string, Size>
): Edge<RelationshipEdgeData> {
  const posOf = new Map<string, { x: number; y: number }>();
  for (const rn of renderNodes) posOf.set(rn.id, rn.position);

  const sp = posOf.get(e.source);
  const tp = posOf.get(e.target);
  const sSize = sizeOf.get(e.source);
  const tSize = sizeOf.get(e.target);
  if (!sp || !tp || !sSize || !tSize) return e;

  const scx = sp.x + sSize.w / 2;
  const scy = sp.y + sSize.h / 2;
  const tcx = tp.x + tSize.w / 2;
  const tcy = tp.y + tSize.h / 2;
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
}
