import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Pin,
  X,
} from 'lucide-react';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { getCategoryConfig } from './EntityNode';
import { GroupRowData } from '../../../types';
import { LIST_PAGE_SIZE, LIST_ROW_H } from '../../../utils/canvasHierarchy';

const rowIconCls = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border';
const rowIconText = 'h-3 w-3';

export const GroupNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const searchFilter = useCanvasStore((s) => s.searchFilter);
  const pinnedIds = useCanvasStore((s) => s.pinnedIds);
  const listFilterOverrides = useCanvasStore((s) => s.listFilterOverrides);
  const toggleExpand = useCanvasStore((s) => s.toggleExpand);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setPinned = useCanvasStore((s) => s.setPinned);
  const setListFilter = useCanvasStore((s) => s.setListFilter);
  const updateNodeSize = useCanvasStore((s) => s.updateNodeSize);

  const isSelected = selected || selectedNodeId === id;
  const config = getCategoryConfig(data.category);
  const Icon = config.icon;

  // Pause the afx-animated width/height/transform transition while a resize
  // handle is being dragged so the container tracks the cursor without lag.
  const toggleResizing = (event: unknown, on: boolean) => {
    const handle = (event as { currentTarget?: HTMLElement | null } | null)?.currentTarget;
    handle?.closest('.react-flow__node')?.classList.toggle('resizing', on);
  };
  const handleResizeStart = (event: unknown) => toggleResizing(event, true);
  const handleResizeEnd = (event: unknown, params: { width: number; height: number }) => {
    toggleResizing(event, false);
    updateNodeSize(id, { width: params.width, height: params.height });
  };

  const expanded = data.expanded === true;
  const listMode = data.listMode === true;
  const childCount = Number(data.nodeCount) || Number(data.childCount) || 0;
  const rows: GroupRowData[] = Array.isArray(data.rows) ? data.rows : [];
  const pinnedSet = new Set(pinnedIds);

  const matchesFilter =
    !searchFilter ||
    String(data.label || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    String(data.subtitle || '').toLowerCase().includes(searchFilter.toLowerCase());

  const query = listFilterOverrides[id] ?? '';
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [query]);

  const filteredRows = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.label.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / LIST_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filteredRows.slice(safePage * LIST_PAGE_SIZE, safePage * LIST_PAGE_SIZE + LIST_PAGE_SIZE);
  const rangeStart = filteredRows.length ? safePage * LIST_PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min((safePage + 1) * LIST_PAGE_SIZE, filteredRows.length);

  const onToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(id);
  };

  const handleTargetLeft = (
    <Handle
      type="target"
      position={Position.Left}
      id="t-l"
      className="!h-3 !w-3 !border-2 !border-[var(--bg-overlay)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]"
    />
  );
  const handleSourceRight = (
    <Handle
      type="source"
      position={Position.Right}
      id="s-r"
      className="!h-3 !w-3 !border-2 !border-[var(--bg-overlay)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]"
    />
  );

  // --- Collapsed: compact card (replaces the old EntityNode appearance) ---
  if (!expanded) {
    return (
      <>
        <NodeResizer
          isVisible={isSelected}
          minWidth={260}
          minHeight={64}
          color="var(--accent-hover)"
          onResizeStart={handleResizeStart}
          onResizeEnd={handleResizeEnd}
        />
        <div
          className={`group relative h-full w-full min-w-[260px] rounded-xl border transition-all duration-200 ${
            isSelected
              ? 'border-[var(--accent-border)] bg-[var(--bg-selected)] shadow-lg shadow-indigo-500/20 ring-2 ring-[var(--accent-border)]'
              : 'border-[var(--border-4)] bg-[var(--bg-node)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-node-hover)]'
          } ${!matchesFilter ? 'opacity-30 blur-[0.5px]' : 'opacity-100'}`}
        >
        <Handle type="target" position={Position.Left} id="t-l" className="!h-3.5 !w-3.5 !border-2 !border-[var(--bg-node)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]" />
        <Handle type="target" position={Position.Top} id="t-t" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
        <Handle type="target" position={Position.Bottom} id="t-b" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
        <Handle type="target" position={Position.Right} id="t-r" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />

        <div className="flex items-center gap-3 p-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.border}`}>
            <Icon className={`h-5 w-5 ${config.text}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-wide text-[var(--text-high)]">{data.label}</div>
            <div className="truncate text-xs font-medium text-[var(--text-3)]">{data.subtitle || config.label}</div>
          </div>

          {childCount > 0 && (
            <button
              onClick={onToggle}
              title={`Expand to show ${childCount} nested ${childCount === 1 ? 'node' : 'nodes'}`}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-text)] transition-all hover:bg-[var(--accent-hover)] hover:text-[var(--text-strong)]"
            >
              <ChevronDown className="h-3 w-3" />
              {childCount} inside
            </button>
          )}
        </div>

        {data.filePath && (
          <div className="flex items-center justify-between border-t border-[var(--border-3)] bg-[var(--bg-inset)]/80 px-3 py-1.5 text-[11px] text-[var(--text-3)] rounded-b-xl">
            <span className="truncate font-mono text-[10.5px] text-[var(--text-3)]" title={data.filePath}>
              {data.filePath}
            </span>
            {data.stats?.lines && (
              <span className="ml-2 shrink-0 font-sans text-[10px] text-[var(--text-4)]">{data.stats.lines} lines</span>
            )}
          </div>
        )}

        <Handle type="source" position={Position.Right} id="s-r" className="!h-3.5 !w-3.5 !border-2 !border-[var(--bg-node)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]" />
        <Handle type="source" position={Position.Bottom} id="s-b" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
        <Handle type="source" position={Position.Top} id="s-t" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
        <Handle type="source" position={Position.Left} id="s-l" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      </div>
      </>
    );
  }

  // --- Expanded: bounded container ---
  return (
    <>
      <NodeResizer
        isVisible={isSelected}
        minWidth={420}
        minHeight={120}
        color="var(--accent-hover)"
        onResizeStart={handleResizeStart}
        onResizeEnd={handleResizeEnd}
      />
      <div
        className={`group relative flex h-full w-full flex-col rounded-2xl border transition-colors duration-200 ${
        isSelected
          ? 'border-[var(--accent-border)] bg-[var(--bg-selected)]/60 ring-2 ring-[var(--accent-border)]'
          : 'border-[var(--accent-border-soft)] bg-[var(--bg-overlay)]/40 hover:border-[var(--accent-border)]'
      }`}
    >
      {handleTargetLeft}
      {handleSourceRight}

      {/* Header */}
      <div className="flex h-[44px] shrink-0 items-center gap-2.5 border-b border-[var(--border-soft)] px-3 py-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.border}`}>
          <Icon className={`h-4 w-4 ${config.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold tracking-wide text-[var(--text-high)]">{data.label}</div>
          <div className="truncate text-[10px] font-medium text-[var(--text-3)]">{data.subtitle || config.label}</div>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--border-3)] bg-[var(--bg-inset)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-3)]">
          {childCount} inside
        </span>
        <button
          onClick={onToggle}
          title="Collapse"
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[var(--border-3)] text-[var(--text-3)] transition-colors hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>

      {listMode && (
        <>
          {/* Inline filter */}
          <div className="flex h-[42px] shrink-0 items-center px-3 pt-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-4)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setListFilter(id, e.target.value)}
                placeholder={`Filter ${filteredRows.length} ${filteredRows.length === 1 ? 'node' : 'nodes'}...`}
                className="nodrag nopan w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-inset)] py-1 pl-7 pr-7 text-[11px] text-[var(--text-1)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-hover)]"
              />
              {query && (
                <button
                  onClick={() => setListFilter(id, '')}
                  title="Clear filter"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--text-4)] hover:text-[var(--text-strong)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Compact rows */}
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {pageRows.length === 0 && (
              <div className="py-6 text-center text-[11px] text-[var(--text-4)]">No matching nodes</div>
            )}
            {pageRows.map((r) => {
              const rcfg = getCategoryConfig(r.category);
              const RIcon = rcfg.icon;
              const isPinned = pinnedSet.has(r.id);
              return (
                <div
                  key={r.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectNode(r.id);
                  }}
                  style={{ height: LIST_ROW_H }}
                  className="nodrag nopan group/row flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 transition-colors hover:bg-[var(--bg-hover-strong)]"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${rcfg.bg} ${rcfg.border}`}>
                    <RIcon className={`${rowIconText} ${rcfg.text}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold leading-tight text-[var(--text-1)]">{r.label}</span>
                    <span className="block truncate text-[10px] leading-tight text-[var(--text-3)]">{r.subtitle}</span>
                  </span>
                  {r.childCount > 0 && (
                    <span className="shrink-0 rounded-full border border-[var(--border-3)] bg-[var(--bg-inset)] px-1.5 text-[9px] font-bold text-[var(--text-3)]">
                      {r.childCount}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinned(r.id, !isPinned);
                    }}
                    title={isPinned ? 'Unpin from canvas' : 'Pin as canvas node'}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[var(--text-4)] transition-all ${
                      isPinned ? 'bg-[var(--accent-bg)] text-[var(--accent-text)]' : 'opacity-0 group-hover/row:opacity-100 hover:text-[var(--text-strong)]'
                    }`}
                  >
                    <Pin className={`h-3 w-3 ${isPinned ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination footer */}
          <div className="flex h-[32px] shrink-0 items-center justify-between border-t border-[var(--border-soft)] px-3">
            <span className="font-mono text-[10px] text-[var(--text-4)]">
              {filteredRows.length ? `${rangeStart}\u2013${rangeEnd} of ${filteredRows.length}` : '0 results'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border-3)] text-[var(--text-3)] transition-colors hover:bg-[var(--bg-hover-strong)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronsLeft className="h-3 w-3" />
              </button>
              <span className="font-mono text-[10px] text-[var(--text-3)]">
                {safePage + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border-3)] text-[var(--text-3)] transition-colors hover:bg-[var(--bg-hover-strong)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronsRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Grid-mode children render as sibling React Flow nodes positioned inside
          this container (see computeRenderGraph). Nothing else to draw here. */}
    </div>
    </>
  );
});

GroupNode.displayName = 'GroupNode';
