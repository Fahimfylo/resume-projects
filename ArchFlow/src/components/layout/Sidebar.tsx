import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Workflow,
  Network,
  FolderTree,
  Code2,
  Database,
  PackageCheck,
  FileText,
  Sparkles,
  AlertCircle,
  GitCompare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export const Sidebar: React.FC = () => {
  const { workspaceId, projectId } = useParams();
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  if (!workspaceId || !projectId) return null;

  const baseUrl = `/workspaces/${workspaceId}/projects/${projectId}`;

  const overviewNav = [
    { to: baseUrl, label: 'Workflow', icon: Workflow, end: true },
    { to: `${baseUrl}/architecture`, label: 'Architecture', icon: Network },
    { to: `${baseUrl}/files`, label: 'Files', icon: FolderTree },
    { to: `${baseUrl}/apis`, label: 'APIs', icon: Code2 },
    { to: `${baseUrl}/database`, label: 'Database', icon: Database },
    { to: `${baseUrl}/dependencies`, label: 'Dependencies', icon: PackageCheck },
    { to: `${baseUrl}/docs`, label: 'Docs', icon: FileText },
  ];

  const intelligenceNav = [
    { to: `${baseUrl}/ai-insights`, label: 'AI Insights', icon: Sparkles, badge: 'AI' },
    { to: `${baseUrl}/issues`, label: 'Issues', icon: AlertCircle },
    { to: `${baseUrl}/changes`, label: 'Changes', icon: GitCompare },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-[var(--border-1)] bg-[var(--bg-raised)] text-[var(--text-2)] transition-all duration-200 select-none ${
        isSidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-soft)] px-3.5">
        <NavLink to="/workspaces" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--text-strong)] font-bold shadow-lg shadow-indigo-600/30">
            <Boxes className="h-5 w-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="truncate">
              <span className="font-extrabold text-sm tracking-tight text-[var(--text-strong)]">ArchFlow</span>
              <span className="ml-1 text-[10px] font-mono font-semibold uppercase text-[var(--accent-text)]">v1.0</span>
            </div>
          )}
        </NavLink>

        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)] transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {/* Section: OVERVIEW */}
        <div className="space-y-1">
          {!isSidebarCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-4)]">
              Overview
            </div>
          )}
          {overviewNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--accent-bg)] text-[var(--accent-text-soft)] border border-[var(--accent-border)] shadow-sm'
                      : 'text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)]'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Section: INTELLIGENCE */}
        <div className="space-y-1 border-t border-[var(--border-soft)] pt-4">
          {!isSidebarCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-4)]">
              Intelligence
            </div>
          )}
          {intelligenceNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--accent-bg)] text-[var(--accent-text-soft)] border border-[var(--accent-border)] shadow-sm'
                      : 'text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)]'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 text-[var(--accent-text)]" />
                {!isSidebarCollapsed && (
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="rounded bg-[var(--accent-bg)] px-1.5 py-0.2 font-mono text-[9px] font-bold text-[var(--accent-text-soft)] border border-[var(--accent-border)]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Settings pinned at bottom */}
      <div className="border-t border-[var(--border-soft)] p-2.5">
        <NavLink
          to={`/workspaces/${workspaceId}`}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)] transition-colors ${
            isSidebarCollapsed ? 'justify-center px-0' : ''
          }`}
          title={isSidebarCollapsed ? 'Projects & Settings' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!isSidebarCollapsed && <span>Project Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};
