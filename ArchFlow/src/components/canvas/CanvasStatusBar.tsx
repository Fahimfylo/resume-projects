import React from 'react';
import { Activity, Clock, Layers, GitBranch, ShieldCheck } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';

export const CanvasStatusBar: React.FC = () => {
  const nodes = useCanvasStore((s) => s.renderNodes);
  const edges = useCanvasStore((s) => s.renderEdges);
  const totalNodes = useCanvasStore((s) => s.nodes.length);
  const abstractionLevel = useCanvasStore((s) => s.abstractionLevel);

  return (
    <div className="flex h-8 w-full items-center justify-between border-t border-[var(--border-1)] bg-[var(--bg-raised)] px-4 text-[11px] font-mono text-[var(--text-3)] select-none">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[var(--text-2)] font-semibold">
          <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span>
            {nodes.length} Visible {totalNodes !== nodes.length && <span className="text-[var(--text-4)]">/ {totalNodes} total</span>}
          </span>
        </span>
        <span className="text-[var(--text-5)]">•</span>
        <span className="flex items-center gap-1.5 text-[var(--text-2)]">
          <GitBranch className="h-3 w-3 text-[var(--accent-text)]" />
          <span>{edges.length} Connections</span>
        </span>
        <span className="text-[var(--text-5)]">•</span>
        <span className="flex items-center gap-1.5 text-[var(--text-2)]">
          <Layers className="h-3 w-3 text-amber-400" />
          <span className="capitalize">{abstractionLevel} View</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[var(--text-3)]">
          <ShieldCheck className="h-3 w-3 text-[var(--accent-text)]" />
          <span>AST Verified</span>
        </span>
        <span className="text-[var(--text-5)]">•</span>
        <span className="flex items-center gap-1.5 text-[var(--text-3)]">
          <Clock className="h-3 w-3 text-[var(--text-4)]" />
          <span>Last analyzed 2m ago</span>
        </span>
      </div>
    </div>
  );
};
