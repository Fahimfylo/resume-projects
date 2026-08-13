import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Plus, Search, Layers, FolderGit2, FileCode } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { WorkspaceCard } from '../components/dashboard/WorkspaceCard';
import { CreateWorkspaceModal } from '../components/dashboard/CreateWorkspaceModal';
import { UserMenu } from '../components/layout/UserMenu';

export const WorkspaceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const workspaces = useUIStore((s) => s.workspaces);
  const apiError = useUIStore((s) => s.apiError);
  const setIsAddWorkspaceOpen = useUIStore((s) => s.setIsAddWorkspaceOpen);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      useUIStore.getState().refresh();
    } else if (status === 'unauthenticated') {
      useUIStore.getState().clearData();
    }
  }, [status]);

  const handleNewWorkspace = () => {
    if (status !== 'authenticated') {
      toast.error('Sign up or log in to create a workspace');
      navigate('/login', { state: { from: '/workspaces' } });
      return;
    }
    setIsAddWorkspaceOpen(true);
  };

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalProjects = workspaces.reduce((acc, w) => acc + w.stats.projectsCount, 0);
  const totalFiles = workspaces.reduce((acc, w) => acc + w.stats.filesCount, 0);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-high)] p-6 md:p-10 max-w-7xl mx-auto space-y-8 select-none">
      {apiError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>
            Couldn't reach the API — data may be out of date. Start the backend with{' '}
            <code className="font-mono">npm run server</code> and retry.
          </span>
          <button
            onClick={() => useUIStore.getState().refresh()}
            className="shrink-0 rounded-lg border border-rose-500/40 px-2.5 py-1 font-semibold hover:bg-rose-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">Workspaces</h1>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                Manage organization codebases and microservice architecture maps
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl border border-[var(--border-3)] bg-[var(--bg-inset)] px-4 py-2.5 text-xs font-bold text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent-border)] transition-all"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2.5 text-xs font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all"
              >
                Sign up
              </button>
            </div>
          )}
          <button
            onClick={handleNewWorkspace}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2.5 text-xs font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Workspace</span>
          </button>
        </div>
      </div>

      {/* Global Stat Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border-soft)]">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-4)]">
              Active Workspaces
            </div>
            <div className="text-xl font-extrabold text-[var(--text-strong)] mt-0.5">{workspaces.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-4)]">
              Total Projects
            </div>
            <div className="text-xl font-extrabold text-[var(--text-strong)] mt-0.5">{totalProjects}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileCode className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-4)]">
              Analyzed Files
            </div>
            <div className="text-xl font-extrabold text-[var(--text-strong)] mt-0.5">{totalFiles}</div>
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter workspaces by name or description..."
          className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-xs text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
        />
      </div>

      {/* Workspace Cards Grid */}
      {filteredWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      ) : user ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-3)] p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-row)] text-[var(--text-3)]">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-1)]">No workspaces match your search</h3>
          <p className="text-xs text-[var(--text-4)]">Try clearing your search filter or create a new workspace.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-3)] p-12 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
            <Layers className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-strong)]">Welcome to ArchFlow</h3>
            <p className="text-xs text-[var(--text-3)] mt-1.5">
              Sign up to create your first workspace and start mapping your architecture.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 py-2.5 text-xs font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all"
            >
              Get started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl border border-[var(--border-3)] bg-[var(--bg-inset)] px-5 py-2.5 text-xs font-bold text-[var(--text-2)] hover:bg-[var(--bg-hover)] transition-all"
            >
              I have an account
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <CreateWorkspaceModal />
    </div>
  );
};
