import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Search,
  Settings,
  RefreshCw,
  FolderGit2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { api, ApiError } from '../../api/client';
import { UserMenu } from './UserMenu';

export const Topbar: React.FC = () => {
  const { workspaceId, projectId } = useParams();
  const workspaces = useUIStore((s) => s.workspaces);
  const projects = useUIStore((s) => s.projects);
  const setIsSettingsOpen = useUIStore((s) => s.setIsSettingsOpen);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === workspaceId) || workspaces[0];
  const currentProject = projects.find((p) => p.id === projectId) || projects[0];

  const handleReanalyze = async () => {
    if (!projectId || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      await api.post(`/projects/${projectId}/analyze`);
    } catch (err) {
      if (err instanceof ApiError) console.warn('[topbar] Re-analyze failed:', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <header className="z-10 flex h-14 w-full items-center justify-between border-b border-[var(--border-1)] bg-[var(--bg-topbar)] px-4 text-[var(--text-1)] select-none">
      {/* Breadcrumb Left */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        <NavLink
          to="/workspaces"
          className="flex items-center gap-1.5 text-[var(--text-3)] hover:text-[var(--text-high)] transition-colors"
        >
          <Building2 className="h-3.5 w-3.5 text-[var(--accent-text)]" />
          <span className="truncate max-w-[140px]">{currentWorkspace?.name || 'Workspace'}</span>
        </NavLink>

        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-5)] shrink-0" />

        {currentWorkspace?.id ? (
          <NavLink
            to={`/workspaces/${currentWorkspace.id}`}
            className="flex items-center gap-1.5 text-[var(--text-high)] hover:text-[var(--accent-text-soft)] transition-colors"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-[var(--accent-text)]" />
            <span className="truncate max-w-[180px]">{currentProject?.name || 'Project'}</span>
          </NavLink>
        ) : (
          <span className="flex items-center gap-1.5 text-[var(--text-high)]">
            <FolderGit2 className="h-3.5 w-3.5 text-[var(--accent-text)]" />
            <span className="truncate max-w-[180px]">{currentProject?.name || 'Project'}</span>
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Re-analyze codebase */}
        <button
          onClick={handleReanalyze}
          disabled={isAnalyzing}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[var(--border-3)] bg-[var(--bg-inset)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-2)] transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[var(--accent-text)] ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Re-analyzing AST...' : 'Re-analyze'}</span>
        </button>

        {/* Search Command Palette Trigger */}
        <button
          onClick={() => alert('Search command palette opened (Press Esc or search above)')}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-3)] bg-[var(--bg-inset)] px-3 py-1.5 text-xs text-[var(--text-3)] hover:border-[var(--border-strong)] hover:text-[var(--text-1)] transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search codebase...</span>
          <kbd className="hidden sm:inline-block rounded bg-[var(--bg-hover-strong)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-3)] border border-[var(--border-4)]">
            ⌘K
          </kbd>
        </button>

        {/* Project settings button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="rounded-lg p-2 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition-colors"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* User account menu */}
        <UserMenu />
      </div>
    </header>
  );
};
