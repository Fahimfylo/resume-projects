import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import {
  LayoutTemplate,
  Component,
  Network,
  Cpu,
  Server,
  Database,
  Globe,
  Table,
  Anchor,
  Layers,
  Plus,
  FileCode,
  ChevronsRight,
} from 'lucide-react';
import { EntityNodeData, NodeCategory } from '../../../types';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { useUIStore } from '../../../store/useUIStore';

export const getCategoryConfig = (category: NodeCategory) => {
  switch (category) {
    case 'page':
      return {
        icon: LayoutTemplate,
        bg: 'bg-blue-500/15',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        label: 'Page View',
      };
    case 'component':
      return {
        icon: Component,
        bg: 'bg-violet-500/15',
        border: 'border-violet-500/30',
        text: 'text-violet-400',
        label: 'React Component',
      };
    case 'route':
      return {
        icon: Network,
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        label: 'API Route',
      };
    case 'controller':
      return {
        icon: Cpu,
        bg: 'bg-teal-500/15',
        border: 'border-teal-500/30',
        text: 'text-teal-400',
        label: 'Controller',
      };
    case 'service':
      return {
        icon: Server,
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        label: 'Service',
      };
    case 'model':
      return {
        icon: Database,
        bg: 'bg-cyan-500/15',
        border: 'border-cyan-500/30',
        text: 'text-cyan-400',
        label: 'ORM Model',
      };
    case 'external-api':
      return {
        icon: Globe,
        bg: 'bg-rose-500/15',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        label: 'External API',
      };
    case 'db-table':
      return {
        icon: Table,
        bg: 'bg-purple-500/15',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        label: 'DB Table',
      };
    case 'hook':
      return {
        icon: Anchor,
        bg: 'bg-yellow-500/15',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        label: 'React Hook',
      };
    case 'store':
      return {
        icon: Layers,
        bg: 'bg-[var(--accent-bg)]',
        border: 'border-[var(--accent-border)]',
        text: 'text-[var(--accent-text)]',
        label: 'State Store',
      };
    default:
      return {
        icon: FileCode,
        bg: 'bg-gray-500/15',
        border: 'border-gray-500/30',
        text: 'text-gray-400',
        label: 'Entity',
      };
  }
};

export const EntityNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const searchFilter = useCanvasStore((s) => s.searchFilter);
  const nodes = useCanvasStore((s) => s.nodes);
  const toggleExpand = useCanvasStore((s) => s.toggleExpand);
  const drillInto = useCanvasStore((s) => s.drillInto);
  const setIsAddNodeModalOpen = useUIStore((s) => s.setIsAddNodeModalOpen);
  const updateNodeSize = useCanvasStore((s) => s.updateNodeSize);

  const isSelected = selected || selectedNodeId === id;
  const config = getCategoryConfig(data.category);
  const IconComponent = config.icon;

  const childCount = Number(data.childCount) || 0;
  const isInStore = nodes.some((n) => n.id === id);
  const hasChildrenLoaded = nodes.some((n) => (n.data as EntityNodeData)?.parentNodeId === id);

  // Filter highlighting
  const matchesFilter =
    !searchFilter ||
    data.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    data.subtitle?.toLowerCase().includes(searchFilter.toLowerCase());

  // Pause the afx-animated width/height/transform transition while a resize
  // handle is being dragged so the node tracks the cursor without lag.
  const toggleResizing = (event: unknown, on: boolean) => {
    const handle = (event as { currentTarget?: HTMLElement | null } | null)?.currentTarget;
    handle?.closest('.react-flow__node')?.classList.toggle('resizing', on);
  };
  const handleResizeStart = (event: unknown) => toggleResizing(event, true);
  const handleResizeEnd = (event: unknown, params: { width: number; height: number }) => {
    toggleResizing(event, false);
    updateNodeSize(id, { width: params.width, height: params.height });
  };

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
      {/* Input handles (Left visible, others hidden for wire routing) */}
      <Handle
        type="target"
        position={Position.Left}
        id="t-l"
        className="!h-3.5 !w-3.5 !border-2 !border-[var(--bg-node)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]"
      />
      <Handle type="target" position={Position.Top} id="t-t" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="target" position={Position.Bottom} id="t-b" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="target" position={Position.Right} id="t-r" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />

      {/* Main card body */}
      <div className="flex items-center gap-3 p-3">
        {/* Category icon badge */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.border}`}
        >
          <IconComponent className={`h-5 w-5 ${config.text}`} />
        </div>

        {/* Title and subtitle */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-wide text-[var(--text-high)]">
            {data.label}
          </div>
          <div className="truncate text-xs font-medium text-[var(--text-3)]">
            {data.subtitle || config.label}
          </div>
        </div>

        {/* Expand/drill-in badge: expand in place when children are loaded,
            otherwise drill into the scope (double-click still works too) */}
        {childCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isInStore) return;
              if (hasChildrenLoaded) toggleExpand(id);
              else drillInto(id);
            }}
            title={
              hasChildrenLoaded
                ? `Expand ${childCount} nested ${childCount === 1 ? 'node' : 'nodes'}`
                : `Open ${childCount} nested ${childCount === 1 ? 'node' : 'nodes'}`
            }
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-text)] transition-all hover:bg-[var(--accent-hover)] hover:text-[var(--text-strong)]"
          >
            <ChevronsRight className="h-3 w-3" />
            {childCount} inside
          </button>
        )}
      </div>

      {/* File path badge footer if available */}
      {data.filePath && (
        <div className="flex items-center justify-between border-t border-[var(--border-3)] bg-[var(--bg-inset)]/80 px-3 py-1.5 text-[11px] text-[var(--text-3)] rounded-b-xl">
          <span className="truncate font-mono text-[10.5px] text-[var(--text-3)]" title={data.filePath}>
            {data.filePath}
          </span>
          {data.stats?.lines && (
            <span className="shrink-0 font-sans text-[10px] text-[var(--text-4)] ml-2">
              {data.stats.lines} lines
            </span>
          )}
        </div>
      )}

      {/* Sub-node Satellite items under bottom edge (n8n Agent -> Tools/Memory pattern) */}
      {data.subNodes && data.subNodes.length > 0 && (
        <div className="relative mt-2 flex justify-center gap-4 pt-3">
          {/* Dashed connector lines down */}
          <div className="absolute top-0 left-1/2 h-3 w-[1px] -translate-x-1/2 border-l border-[var(--border-strong)]" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            {data.subNodes.map((sub: any) => {
              const subConfig = getCategoryConfig(sub.category);
              const SubIcon = subConfig.icon;
              return (
                <div
                  key={sub.id}
                  className="flex flex-col items-center gap-1 group/sub"
                  title={`${sub.label} (${sub.subtitle || sub.category})`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border bg-[var(--bg-inset)] shadow-md transition-transform group-hover/sub:scale-110 ${subConfig.border}`}>
                    <SubIcon className={`h-3.5 w-3.5 ${subConfig.text}`} />
                  </div>
                  <span className="max-w-[80px] truncate text-[10px] font-medium text-[var(--text-3)] group-hover/sub:text-[var(--text-1)]">
                    {sub.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Output handles (Right visible, others hidden for wire routing) */}
      <Handle
        type="source"
        position={Position.Right}
        id="s-r"
        className="!h-3.5 !w-3.5 !border-2 !border-[var(--bg-node)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]"
      />
      <Handle type="source" position={Position.Bottom} id="s-b" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="source" position={Position.Top} id="s-t" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="source" position={Position.Left} id="s-l" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />

      {/* Plus button at right output handle hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsAddNodeModalOpen(true);
        }}
        className="absolute -right-7 top-1/2 hidden -translate-y-1/2 flex-none rounded-full border border-[var(--border-strong)] bg-[var(--bg-btn)] p-1 text-[var(--text-2)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-hover)] hover:text-[var(--text-strong)] group-hover:flex"
        title="Add connected node"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
    </>
  );
});

EntityNode.displayName = 'EntityNode';
