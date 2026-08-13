import React, { useEffect, useRef, useState } from 'react';
import { Search, Plus, LayoutGrid, MoveHorizontal, MoveVertical, ChevronDown, Check, GitFork, ArrowLeft, X } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUIStore } from '../../store/useUIStore';
import { BreadcrumbBar } from './BreadcrumbBar';
import { NodeFilterMenu } from './NodeFilterMenu';

export const CanvasToolbar: React.FC = () => {
  const searchFilter = useCanvasStore((s) => s.searchFilter);
  const setSearchFilter = useCanvasStore((s) => s.setSearchFilter);
  const revealSearchMatch = useCanvasStore((s) => s.revealSearchMatch);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const layoutDirection = useCanvasStore((s) => s.layoutDirection);
  const setLayoutDirection = useCanvasStore((s) => s.setLayoutDirection);
  const focusNodeId = useCanvasStore((s) => s.focusNodeId);
  const setFocusNode = useCanvasStore((s) => s.setFocusNode);
  const goBack = useCanvasStore((s) => s.goBack);
  const viewIndex = useCanvasStore((s) => s.viewIndex);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setIsAddNodeModalOpen = useUIStore((s) => s.setIsAddNodeModalOpen);

  const focusNode = focusNodeId ? nodes.find((n) => n.id === focusNodeId) ?? null : null;
  const focusNeighborIds = new Set<string>();
  edges.forEach((e) => {
    if (!focusNodeId) return;
    if (e.source === focusNodeId) focusNeighborIds.add(e.target);
    if (e.target === focusNodeId) focusNeighborIds.add(e.source);
  });
  focusNeighborIds.delete(focusNodeId);
  const focusNeighborCount = focusNeighborIds.size;

  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) {
        setIsLayoutOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search reveal: auto-expands ancestor folders so a deep match
  // becomes visible on the canvas, then pans to it.
  useEffect(() => {
    const q = searchFilter.trim();
    if (!q) return;
    const timer = setTimeout(() => revealSearchMatch(), 300);
    return () => clearTimeout(timer);
  }, [searchFilter, revealSearchMatch]);

  return (
    <>
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Breadcrumb + depth navigation (Left) */}
      <BreadcrumbBar />

      {/* Controls & Search (Right) */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search nodes..."
            className="w-40 sm:w-52 rounded-xl border border-[var(--border-3)] bg-[var(--bg-overlay)]/90 py-1.5 pl-8 pr-3 text-xs text-[var(--text-1)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-hover)] backdrop-blur-md shadow-xl"
          />
        </div>

        {/* Auto Arrange Layout Button + axis dropdown */}
        <div
          ref={layoutRef}
          className="flex items-center rounded-xl border border-[var(--border-3)] bg-[var(--bg-overlay)]/90 backdrop-blur-md shadow-xl"
        >
          {/* Re-arrange with current axis */}
          <button
            onClick={() => autoLayout()}
            title="Auto arrange nodes"
            className="flex items-center gap-1.5 rounded-l-xl px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition-all"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-[var(--accent-text)]" />
            <span className="hidden sm:inline">Auto-arrange</span>
          </button>
          {/* Axis selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLayoutOpen((v) => !v)}
              title="Choose layout axis"
              className={`flex items-center rounded-r-xl border-l border-[var(--border-3)] px-2 py-1.5 text-xs font-semibold transition-all ${
                isLayoutOpen
                  ? 'bg-[var(--bg-hover-strong)] text-[var(--text-strong)]'
                  : 'text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
              }`}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {isLayoutOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-[var(--border-4)] bg-[var(--bg-overlay)] shadow-2xl">
                <button
                  onClick={() => {
                    setLayoutDirection('LR');
                    setIsLayoutOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold transition-all ${
                    layoutDirection === 'LR'
                      ? 'bg-[var(--accent-bg)] text-[var(--accent-text-soft)]'
                      : 'text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
                  }`}
                >
                  <MoveHorizontal className="h-3.5 w-3.5" />
                  X axis
                  {layoutDirection === 'LR' && <Check className="ml-auto h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setLayoutDirection('TB');
                    setIsLayoutOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 border-t border-[var(--border-3)] px-3 py-2 text-xs font-semibold transition-all ${
                    layoutDirection === 'TB'
                      ? 'bg-[var(--accent-bg)] text-[var(--accent-text-soft)]'
                      : 'text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
                  }`}
                >
                  <MoveVertical className="h-3.5 w-3.5" />
                  Y axis
                  {layoutDirection === 'TB' && <Check className="ml-auto h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter nodes menu */}
        <NodeFilterMenu />

        {/* Add Node Button */}
        <button
          onClick={() => setIsAddNodeModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-strong)] backdrop-blur-md shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Node</span>
        </button>
      </div>
      </div>

      {/* Focus-mode banner: only the selected node + direct neighbors are shown */}
      {focusNode && (
        <div className="pointer-events-auto absolute top-[4.4rem] left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-[var(--accent-border)] bg-[var(--bg-overlay)]/95 px-4 py-1.5 text-xs text-[var(--text-1)] shadow-2xl backdrop-blur-md">
          {viewIndex > 0 && (
            <button
              onClick={() => goBack()}
              title="Back to previous view"
              className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-bg)] px-2 py-0.5 font-semibold text-[var(--accent-text)] transition-colors hover:bg-[var(--accent-hover)] hover:text-[var(--text-strong)]"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          )}
          <GitFork className="h-3.5 w-3.5 shrink-0 text-[var(--accent-text)]" />
          <span className="truncate">
            Showing direct connections of{' '}
            <b className="text-[var(--text-strong)]">{focusNode.data.label}</b>
            <span className="text-[var(--text-3)]">
              {' '}· {focusNeighborCount} connected {focusNeighborCount === 1 ? 'node' : 'nodes'}
            </span>
          </span>
          <button
            onClick={() => setFocusNode(null)}
            className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-bg)] px-2 py-0.5 font-semibold text-[var(--accent-text)] transition-colors hover:bg-[var(--accent-hover)] hover:text-[var(--text-strong)]"
          >
            <X className="h-3 w-3" />
            Show all
          </button>
        </div>
      )}
    </>
  );
};
