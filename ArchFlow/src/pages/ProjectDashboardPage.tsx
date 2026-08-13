import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  Building2,
  FolderGit2,
  Plus,
  Search,
  ChevronRight,
  ArrowLeft,
  FileCode,
  Layers,
  Workflow,
} from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { CreateProjectModal } from '../components/dashboard/CreateProjectModal';
import { CardMenu } from '../components/ui/CardMenu';
import { UserMenu } from '../components/layout/UserMenu';
import { Pencil, Trash2 } from 'lucide-react';

export const ProjectDashboardPage: React.FC = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const workspaces = useUIStore((s) => s.workspaces);
  const projects = useUIStore((s) => s.projects);
  const apiError = useUIStore((s) => s.apiError);
  const setIsAddProjectOpen = useUIStore((s) => s.setIsAddProjectOpen);
  const setEditingWorkspace = useUIStore((s) => s.setEditingWorkspace);
  const openConfirm = useUIStore((s) => s.openConfirm);
  const deleteWorkspace = useUIStore((s) => s.deleteWorkspace);

  const [search, setSearch] = useState('');

  useEffect(() => {
    useUIStore.getState().refresh();
  }, [workspaceId]);

  const currentWorkspace =
    workspaces.find((w) => w.id === workspaceId) || workspaces[0];

  const handleDeleteWorkspace = () => {
    if (!currentWorkspace) return;
    const count = projects.filter((p) => p.workspaceId === currentWorkspace.id).length;
    openConfirm({
      title: 'Delete Workspace?',
      message: `This permanently deletes "${currentWorkspace.name}" and all ${count} project${
        count === 1 ? '' : 's'
      } inside it, including their architecture graphs. This cannot be undone.`,
      confirmLabel: 'Delete Workspace',
      variant: 'danger',
      onConfirm: () => {
        deleteWorkspace(currentWorkspace.id);
        navigate('/workspaces');
      },
    });
  };

  const workspaceProjects = projects.filter(
    (p) =>
      p.workspaceId === workspaceId &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()))
  );

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

      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        <NavLink
          to="/workspaces"
          className="flex items-center gap-1.5 text-[var(--text-3)] hover:text-[var(--text-strong)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Workspaces</span>
        </NavLink>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-5)]" />
        <span className="text-[var(--accent-text)]">{currentWorkspace?.name}</span>
      </div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">
                {currentWorkspace?.name}
              </h1>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                {currentWorkspace?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <UserMenu />
          <CardMenu
            items={[
              {
                label: 'Edit Workspace',
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => {
                  if (currentWorkspace) setEditingWorkspace(currentWorkspace);
                },
              },
              {
                label: 'Delete Workspace',
                icon: <Trash2 className="h-3.5 w-3.5" />,
                danger: true,
                onClick: handleDeleteWorkspace,
              },
            ]}
          />
          <button
            onClick={() => setIsAddProjectOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2.5 text-xs font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects by name or description..."
          className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-xs text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
        />
      </div>

      {/* Project Cards Grid */}
      {workspaceProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaceProjects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-3)] p-12 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-row)] text-[var(--text-3)]">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-1)]">No projects in this workspace yet</h3>
            <p className="text-xs text-[var(--text-4)] mt-1">
              Create a new project and upload a codebase to visualize its architecture graph.
            </p>
          </div>
          <button
            onClick={() => setIsAddProjectOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--text-strong)] hover:bg-[var(--accent-hover)] shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Project</span>
          </button>
        </div>
      )}

      {/* Modal */}
      <CreateProjectModal />
    </div>
  );
};
