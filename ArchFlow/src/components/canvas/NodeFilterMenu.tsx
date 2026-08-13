import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, Check, X } from 'lucide-react';
import { useCanvasStore, NodeVisibility } from '../../store/useCanvasStore';
import { EntityNodeData } from '../../types';
import { nodeTagKeys, tagLabel } from '../../utils/nodeFilters';

const visibilityOptions: { id: NodeVisibility; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'parents', label: 'Parents only' },
  { id: 'children', label: 'Children only' },
];

export const NodeFilterMenu: React.FC = () => {
  const nodes = useCanvasStore((s) => s.nodes);
  const nodeFilters = useCanvasStore((s) => s.nodeFilters);
  const setNodeVisibility = useCanvasStore((s) => s.setNodeVisibility);
  const toggleNodeTag = useCanvasStore((s) => s.toggleNodeTag);
  const clearNodeFilters = useCanvasStore((s) => s.clearNodeFilters);
  const [open, setOpen] = useState(false);

  const tags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const n of nodes) {
      for (const key of nodeTagKeys(n.data as EntityNodeData)) {
        const label = tagLabel(key);
        if (!seen.has(label)) seen.set(label, key);
      }
    }
    return [...seen.keys()].sort((a, b) => a.localeCompare(b));
  }, [nodes]);

  const activeCount = nodeFilters.tags.length + (nodeFilters.visibility !== 'all' ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md shadow-xl transition-all ${
          activeCount > 0
            ? 'border-[var(--accent-border)] bg-[var(--accent)] text-[var(--text-strong)]'
            : 'border-[var(--border-3)] bg-[var(--bg-overlay)]/90 text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
        }`}
        title="Filter nodes by type, folder, or depth"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-bold leading-4">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--border-3)] bg-[var(--bg-overlay)] shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[var(--border-3)] px-3 py-2">
              <span className="text-xs font-bold text-[var(--text-strong)]">Filter nodes</span>
              <button
                onClick={clearNodeFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-3)] transition-all hover:text-[var(--text-1)]"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            </div>

            {/* Depth visibility */}
            <div className="border-b border-[var(--border-3)] px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-4)]">
                Show
              </span>
              <div className="mt-1 flex gap-1">
                {visibilityOptions.map((opt) => {
                  const isActive = nodeFilters.visibility === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setNodeVisibility(opt.id)}
                      className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                        isActive
                          ? 'bg-[var(--accent)] text-[var(--text-strong)]'
                          : 'bg-[var(--bg-inset)] text-[var(--text-3)] hover:text-[var(--text-1)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic type / folder tags */}
            <div className="px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-4)]">
                Type / folder
              </span>
              <div className="mt-1.5 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {tags.length === 0 && (
                  <span className="text-[11px] text-[var(--text-4)]">No nodes to filter yet.</span>
                )}
                {tags.map((label) => {
                  const isActive = nodeFilters.tags.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleNodeTag(label)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        isActive
                          ? 'border-[var(--accent-border)] bg-[var(--accent)] text-[var(--text-strong)]'
                          : 'border-[var(--border-3)] bg-[var(--bg-inset)] text-[var(--text-3)] hover:border-[var(--accent-border)] hover:text-[var(--text-1)]'
                      }`}
                    >
                      {isActive && <Check className="h-3 w-3" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
