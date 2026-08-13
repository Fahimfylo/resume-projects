import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FolderGit2, FileCode, Workflow, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Workspace } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { CardMenu } from '../ui/CardMenu';

interface Props {
  workspace: Workspace;
}

export const WorkspaceCard: React.FC<Props> = ({ workspace }) => {
  const navigate = useNavigate();
  const setEditingWorkspace = useUIStore((s) => s.setEditingWorkspace);
  const openConfirm = useUIStore((s) => s.openConfirm);
  const deleteWorkspace = useUIStore((s) => s.deleteWorkspace);

  const handleDelete = () => {
    openConfirm({
      title: 'Delete Workspace?',
      message: `This permanently deletes "${workspace.name}" and all ${workspace.stats.projectsCount} project${
        workspace.stats.projectsCount === 1 ? '' : 's'
      } inside it, including their architecture graphs. This cannot be undone.`,
      confirmLabel: 'Delete Workspace',
      variant: 'danger',
      onConfirm: () => deleteWorkspace(workspace.id),
    });
  };

  return (
    <div
      onClick={() => navigate(`/workspaces/${workspace.id}`)}
      className="group relative cursor-pointer rounded-2xl border border-[var(--border-2)] bg-[var(--bg-overlay)] p-5 transition-all duration-200 hover:border-[var(--accent-border)] hover:bg-[var(--bg-btn)] hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] group-hover:scale-105 transition-transform">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-strong)] group-hover:text-[var(--accent-text-soft)] transition-colors">
              {workspace.name}
            </h3>
            <p className="text-xs text-[var(--text-3)] line-clamp-1 mt-0.5">
              {workspace.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <CardMenu
            items={[
              {
                label: 'Edit',
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => setEditingWorkspace(workspace),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-3.5 w-3.5" />,
                danger: true,
                onClick: handleDelete,
              },
            ]}
          />
          <ChevronRight className="h-5 w-5 text-[var(--text-4)] group-hover:text-[var(--accent-text)] group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--border-1)] pt-4 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-4)] font-semibold">
            Projects
          </span>
          <span className="flex items-center gap-1 font-bold text-[var(--text-1)] mt-0.5">
            <FolderGit2 className="h-3.5 w-3.5 text-[var(--accent-text)]" />
            {workspace.stats.projectsCount}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-4)] font-semibold">
            Analyzed Files
          </span>
          <span className="flex items-center gap-1 font-bold text-[var(--text-1)] mt-0.5">
            <FileCode className="h-3.5 w-3.5 text-emerald-400" />
            {workspace.stats.filesCount}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-4)] font-semibold">
            Workflows
          </span>
          <span className="flex items-center gap-1 font-bold text-[var(--text-1)] mt-0.5">
            <Workflow className="h-3.5 w-3.5 text-amber-400" />
            {workspace.stats.workflowsCount}
          </span>
        </div>
      </div>
    </div>
  );
};
