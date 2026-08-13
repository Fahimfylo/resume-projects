import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Home, Layers, ChevronDown } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUIStore } from '../../store/useUIStore';
import { AbstractionLevel } from '../../types';

const levels: { id: AbstractionLevel; label: string }[] = [
  { id: 'full', label: 'Full System' },
  { id: 'system', label: 'System' },
  { id: 'modules', label: 'Modules' },
  { id: 'components', label: 'Components' },
  { id: 'files', label: 'Files' },
];

export const BreadcrumbBar: React.FC = () => {
  const breadcrumb = useCanvasStore((s) => s.breadcrumb);
  const abstractionLevel = useCanvasStore((s) => s.abstractionLevel);
  const activeProjectId = useCanvasStore((s) => s.activeProjectId);
  const viewIndex = useCanvasStore((s) => s.viewIndex);
  const viewHistory = useCanvasStore((s) => s.viewHistory);
  const goBack = useCanvasStore((s) => s.goBack);
  const goForward = useCanvasStore((s) => s.goForward);
  const goToBreadcrumb = useCanvasStore((s) => s.goToBreadcrumb);
  const resetToRoot = useCanvasStore((s) => s.resetToRoot);
  const jumpToLevel = useCanvasStore((s) => s.jumpToLevel);
  const projects = useUIStore((s) => s.projects);
  const [levelOpen, setLevelOpen] = useState(false);

  const canGoBack = viewIndex > 0;
  const canGoForward = viewIndex < viewHistory.length - 1;
  const projectName = projects.find((p) => p.id === activeProjectId)?.name || 'Project';

  const toggleLevelMenu = () => setLevelOpen((open) => !open);
  const closeLevelMenu = () => setLevelOpen(false);

  const handleLevelPick = (level: AbstractionLevel) => {
    closeLevelMenu();
    jumpToLevel(level);
  };

  return (
    <div className="pointer-events-auto flex items-center rounded-xl border border-[var(--border-3)] bg-[var(--bg-overlay)]/90 p-1 backdrop-blur-md shadow-xl">
      {/* Back / forward arrows */}
      <button
        onClick={goBack}
        disabled={!canGoBack}
        title={canGoBack ? 'Go back' : 'No previous view'}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
          canGoBack
            ? 'text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
            : 'cursor-not-allowed text-[var(--text-4)]'
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        onClick={goForward}
        disabled={!canGoForward}
        title={canGoForward ? 'Go forward' : 'No next view'}
        className={`mr-1 flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
          canGoForward
            ? 'text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
            : 'cursor-not-allowed text-[var(--text-4)]'
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Breadcrumb segments */}
      <div className="flex items-center gap-0.5 max-w-[40vw] overflow-x-auto">
        {breadcrumb.map((crumb, index) => {
          const isLast = index === breadcrumb.length - 1;
          const label = index === 0 ? projectName : crumb.label;
          return (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-4)]" />}
              {index === 0 ? (
                <button
                  onClick={() => resetToRoot()}
                  title="Back to full system view"
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
                    isLast
                      ? 'text-[var(--text-strong)]'
                      : 'text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-1)]'
                  }`}
                >
                  <Home className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                  <span className="max-w-[160px] truncate">{label}</span>
                </button>
              ) : (
                <button
                  onClick={() => goToBreadcrumb(index)}
                  disabled={isLast}
                  className={`max-w-[160px] truncate rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
                    isLast
                      ? 'text-[var(--text-strong)]'
                      : 'text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-1)]'
                  }`}
                >
                  {label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Jump-to-depth dropdown */}
      <div className="relative ml-1">
        <button
          onClick={toggleLevelMenu}
          className="flex items-center gap-1 rounded-lg border-l border-[var(--border-3)] px-2 py-1 text-xs font-semibold text-[var(--text-3)] transition-all hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-1)]"
          title="Jump to depth"
        >
          <Layers className="h-3.5 w-3.5 text-[var(--accent-text)]" />
          <span className="hidden sm:inline">{levels.find((l) => l.id === abstractionLevel)?.label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {levelOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeLevelMenu} />
            <div className="absolute left-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-[var(--border-3)] bg-[var(--bg-overlay)] shadow-2xl backdrop-blur-md">
              {levels.map((lvl) => {
                const isActive = abstractionLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => handleLevelPick(lvl.id)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--accent)] text-[var(--text-strong)]'
                        : 'text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
                    }`}
                  >
                    {lvl.label}
                    {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
