import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, FileCode, Layers, Workflow, Clock, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Project } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { CardMenu } from '../ui/CardMenu';

interface Props {
  project: Project;
}

export const ProjectCard: React.FC<Props> = ({ project }) => {
  const navigate = useNavigate();
  const setEditingProject = useUIStore((s) => s.setEditingProject);
  const openConfirm = useUIStore((s) => s.openConfirm);
  const deleteProject = useUIStore((s) => s.deleteProject);

  const handleDelete = () => {
    openConfirm({
      title: 'Delete Project?',
      message: `This permanently deletes "${project.name}" and removes its architecture graph (${
        project.stats.filesCount || 0
      } files analyzed). This cannot be undone.`,
      confirmLabel: 'Delete Project',
      variant: 'danger',
      onConfirm: () => deleteProject(project.id),
    });
  };

  return (
    <div
      onClick={() =>
        navigate(`/workspaces/${project.workspaceId}/projects/${project.id}`)
      }
      className="group relative cursor-pointer rounded-2xl border border-[var(--border-2)] bg-[var(--bg-overlay)] p-5 transition-all duration-200 hover:border-[var(--accent-border)] hover:bg-[var(--bg-btn)] hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] group-hover:scale-105 transition-transform">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-strong)] group-hover:text-[var(--accent-text-soft)] transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-[var(--text-3)] line-clamp-2 mt-0.5">
                {project.description}
              </p>
            </div>
          </div>
          <CardMenu
            items={[
              {
                label: 'Edit',
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => setEditingProject(project),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-3.5 w-3.5" />,
                danger: true,
                onClick: handleDelete,
              },
            ]}
          />
        </div>

        {/* Mini Diagram Graphic Banner Preview */}
        <div className="mt-4 flex h-16 w-full items-center justify-center rounded-xl border border-[var(--border-1)] bg-[var(--bg-raised)] px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono">
              FE
            </div>
            <div className="h-[1px] w-6 border-t border-[var(--border-strong)]" />
            <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
              API
            </div>
            <div className="h-[1px] w-6 border-t border-[var(--border-strong)]" />
            <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-mono">
              DB
            </div>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-5 border-t border-[var(--border-1)] pt-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-[var(--text-2)]">
              <FileCode className="h-3.5 w-3.5 text-[var(--accent-text)]" />
              {project.stats.filesCount} files
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-[var(--text-2)]">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              {project.stats.modulesCount} modules
            </span>
          </div>

          <span className="flex items-center gap-1 text-[11px] text-[var(--text-4)]">
            <Clock className="h-3 w-3" />
            {project.stats.lastAnalyzed}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[var(--accent-text)] group-hover:text-[var(--accent-text-soft)] pt-1">
          <span>Open Workflow Canvas</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
