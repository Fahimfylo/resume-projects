import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { ChevronDown, Globe } from 'lucide-react';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { getCategoryConfig } from './EntityNode';

export const GroupChildNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const searchFilter = useCanvasStore((s) => s.searchFilter);
  const toggleExpand = useCanvasStore((s) => s.toggleExpand);
  const updateNodeSize = useCanvasStore((s) => s.updateNodeSize);

  const isSelected = selected || selectedNodeId === id;
  const config = getCategoryConfig(data.category);
  const Icon = config.icon;
  const childCount = Number(data.childCount) || 0;

  const extSubNodes = (data.subNodes || []).filter((s: any) => s.category === 'external-api');

  const matchesFilter =
    !searchFilter ||
    String(data.label || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    String(data.subtitle || '').toLowerCase().includes(searchFilter.toLowerCase());

  // Pause the afx-animated transition while a resize handle is being dragged.
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
        minWidth={180}
        minHeight={56}
        color="var(--accent-hover)"
        onResizeStart={handleResizeStart}
        onResizeEnd={handleResizeEnd}
      />
      <div
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
        isSelected
          ? 'border-[var(--accent-border)] bg-[var(--bg-selected)] ring-1 ring-[var(--accent-border)]'
          : 'border-[var(--border-3)] bg-[var(--bg-node)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-node-hover)]'
      } ${!matchesFilter ? 'opacity-30 blur-[0.5px]' : 'opacity-100'}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="t-l"
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--bg-node)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]"
      />
      <Handle type="target" position={Position.Top} id="t-t" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="target" position={Position.Bottom} id="t-b" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="target" position={Position.Right} id="t-r" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />

      <div className="flex min-w-0 flex-1 items-center gap-2 p-2.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.border}`}>
          <Icon className={`h-4 w-4 ${config.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold tracking-wide text-[var(--text-high)]">{data.label}</div>
          <div className="truncate text-[10px] font-medium text-[var(--text-3)]">{data.subtitle || config.label}</div>
        </div>
        {childCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(id);
            }}
            title={`Expand ${childCount} nested ${childCount === 1 ? 'node' : 'nodes'}`}
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] transition-all hover:bg-[var(--accent-hover)] hover:text-[var(--text-strong)]"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {data.filePath && (
        <div className="truncate border-t border-[var(--border-3)] bg-[var(--bg-inset)]/80 px-2.5 py-1 font-mono text-[9.5px] text-[var(--text-4)]" title={data.filePath}>
          {data.filePath}
        </div>
      )}

      {/* Compact external-dependency chips (dashed-satellite subNodes collapsed to a pill row) */}
      {extSubNodes.length > 0 && (
        <div className="flex shrink-0 items-center gap-1 overflow-hidden border-t border-[var(--border-3)] bg-[var(--bg-inset)]/60 px-2 py-1">
          <Globe className="h-3 w-3 shrink-0 text-rose-400" />
          {extSubNodes.slice(0, 3).map((s: any) => (
            <span
              key={s.id}
              title={s.label}
              className="truncate rounded-full border border-rose-500/20 bg-rose-500/10 px-1.5 text-[8.5px] font-semibold leading-4 text-rose-300"
            >
              {s.label}
            </span>
          ))}
          {extSubNodes.length > 3 && (
            <span className="shrink-0 text-[8.5px] font-semibold text-[var(--text-4)]">
              +{extSubNodes.length - 3}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="s-r"
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--bg-node)] !bg-[var(--bg-selected-strong)] transition-colors hover:!bg-[var(--accent-hover)]"
      />
      <Handle type="source" position={Position.Bottom} id="s-b" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="source" position={Position.Top} id="s-t" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
      <Handle type="source" position={Position.Left} id="s-l" className="!h-1 !w-1 !min-w-0 !min-h-0 !border-0 !bg-transparent !opacity-0 !pointer-events-none !cursor-default" />
    </div>
    </>
  );
});

GroupChildNode.displayName = 'GroupChildNode';
