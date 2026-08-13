import React from 'react';
import {
  X,
  FileCode,
  Sparkles,
  ExternalLink,
  Code2,
  CheckCircle2,
  Layers,
  ArrowRightLeft,
  Activity,
  Box,
  GitFork,
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { getCategoryConfig } from './nodes/EntityNode';

export const InspectorPanel: React.FC = () => {
  const isInspectorOpen = useCanvasStore((s) => s.isInspectorOpen);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const closeInspector = useCanvasStore((s) => s.closeInspector);
  const setFocusNode = useCanvasStore((s) => s.setFocusNode);

  if (!isInspectorOpen) return null;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // If edge selected, get source & target node labels
  const sourceNode = selectedEdge ? nodes.find((n) => n.id === selectedEdge.source) : null;
  const targetNode = selectedEdge ? nodes.find((n) => n.id === selectedEdge.target) : null;

  return (
    <div className="absolute right-0 top-0 bottom-0 z-20 w-96 border-l border-[var(--border-3)] bg-[var(--bg-panel)]/95 backdrop-blur-md text-[var(--text-1)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-2)] px-4 py-3 bg-[var(--bg-topbar)]">
        <div className="flex items-center gap-2">
          {selectedNode && (
            <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
          )}
          {selectedEdge && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
            {selectedNode ? 'Node Inspector' : 'Connection Inspector'}
          </h3>
        </div>
        <button
          onClick={closeInspector}
          className="rounded-md p-1 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-high)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Inspector Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {selectedNode && (
          <>
            {/* Title & Category Badge */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-strong)] tracking-tight">
                    {selectedNode.data.label}
                  </h2>
                  <p className="text-xs text-[var(--text-3)] font-medium mt-0.5">
                    {selectedNode.data.subtitle}
                  </p>
                </div>
                {(() => {
                  const cfg = getCategoryConfig(selectedNode.data.category);
                  const Icon = cfg.icon;
                  return (
                    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cfg.label}</span>
                    </div>
                  );
                })()}
              </div>

              {selectedNode.data.filePath && (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-2)] bg-[var(--bg-row)] p-2 text-xs font-mono text-[var(--text-2)]">
                  <FileCode className="h-4 w-4 text-[var(--accent-text)] shrink-0" />
                  <span className="truncate">{selectedNode.data.filePath}</span>
                </div>
              )}
            </div>

            {/* AI Summary Block */}
            <div className="rounded-xl border border-[var(--accent-border-soft)] bg-[var(--accent-bg)] p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text-soft)]">
                <Sparkles className="h-4 w-4 text-[var(--accent-text)]" />
                <span>AI Architecture Overview</span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-2)]">
                {selectedNode.data.summary ||
                  'No static summary available for this node.'}
              </p>
            </div>

            {/* Stats Row */}
            {selectedNode.data.stats && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[var(--border-2)] bg-[var(--bg-inset)] p-2.5 text-center">
                  <div className="text-[10px] text-[var(--text-3)] uppercase font-semibold">Lines</div>
                  <div className="text-sm font-bold text-[var(--text-high)] mt-0.5">
                    {selectedNode.data.stats.lines || '-'}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border-2)] bg-[var(--bg-inset)] p-2.5 text-center">
                  <div className="text-[10px] text-[var(--text-3)] uppercase font-semibold">Complexity</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {selectedNode.data.stats.complexity || 'Low'}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border-2)] bg-[var(--bg-inset)] p-2.5 text-center">
                  <div className="text-[10px] text-[var(--text-3)] uppercase font-semibold">Calls</div>
                  <div className="text-sm font-bold text-[var(--accent-text)] mt-0.5">
                    {selectedNode.data.stats.calls || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-node satellites list if present */}
            {selectedNode.data.subNodes && selectedNode.data.subNodes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-2)]">
                  <Box className="h-3.5 w-3.5 text-[var(--text-3)]" />
                  <span>Linked Internal Satellites ({selectedNode.data.subNodes.length})</span>
                </div>
                <div className="space-y-1.5">
                  {selectedNode.data.subNodes.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--border-2)] bg-[var(--bg-row)] p-2 text-xs"
                    >
                      <span className="font-medium text-[var(--text-1)]">{sub.label}</span>
                      <span className="text-[11px] font-mono text-[var(--text-3)]">{sub.subtitle || sub.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  closeInspector();
                  setFocusNode(selectedNodeId);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[var(--border-4)] bg-[var(--bg-btn)] hover:bg-[var(--bg-hover-strong)] py-2 px-3 text-xs font-semibold text-[var(--text-1)] transition-colors"
              >
                <GitFork className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                <span>Show Connected Nodes</span>
              </button>
              <button
                onClick={() => alert(`View source for ${selectedNode.data.filePath || selectedNode.data.label}`)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] py-2 px-3 text-xs font-semibold text-[var(--text-strong)] transition-colors"
              >
                <span>View Source Code</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}

        {selectedEdge && (
          <div className="space-y-4">
            {/* Relationship Header */}
            <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-4 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-text)] font-bold">
                WHY ARE THESE CONNECTED?
              </div>

              {/* Source -> Target Nodes Flow */}
              <div className="flex items-center justify-between rounded-lg border border-[var(--border-4)] bg-[var(--bg-raised)] p-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-[var(--text-3)] uppercase">From</div>
                  <div className="truncate text-xs font-semibold text-[var(--text-high)]">
                    {sourceNode?.data.label || 'Source'}
                  </div>
                </div>
                <ArrowRightLeft className="h-4 w-4 text-[var(--accent-text)] mx-2 shrink-0" />
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-[10px] text-[var(--text-3)] uppercase">To</div>
                  <div className="truncate text-xs font-semibold text-[var(--text-high)]">
                    {targetNode?.data.label || 'Target'}
                  </div>
                </div>
              </div>

              {/* Relationship Type */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-3)] font-medium">Relationship:</span>
                <span className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--accent-text-soft)]">
                  {selectedEdge.data?.relationshipType || 'USES'}
                </span>
              </div>

              {/* Confidence Score */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-3)] font-medium">Static Confidence:</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {selectedEdge.data?.evidence?.confidence || 98}%
                </span>
              </div>
            </div>

            {/* Code Evidence Section */}
            {selectedEdge.data?.evidence && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-2)]">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-[var(--accent-text)]" />
                    Source AST Evidence
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-3)]">
                    Line {selectedEdge.data.evidence.lineNumber}
                  </span>
                </div>

                <div className="text-xs font-mono text-[var(--text-3)] truncate">
                  {selectedEdge.data.evidence.filePath}
                </div>

                <div className="rounded-lg border border-[var(--border-3)] bg-[var(--bg-code)] p-3 overflow-x-auto">
                  <pre className="text-[11.5px] font-mono text-emerald-300 leading-relaxed whitespace-pre">
                    {selectedEdge.data.evidence.codeSnippet}
                  </pre>
                </div>
              </div>
            )}

            {/* View Source Link */}
            <button
              onClick={() =>
                alert(
                  `Opening ${
                    selectedEdge.data?.evidence?.filePath || 'source file'
                  } at line ${selectedEdge.data?.evidence?.lineNumber}`
                )
              }
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-[var(--border-4)] bg-[var(--bg-btn)] hover:bg-[var(--bg-hover-strong)] py-2 px-3 text-xs font-semibold text-[var(--text-1)] transition-colors"
            >
              <span>Inspect Source Line</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
