import React from 'react';
import { Project } from '../../types';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { useApp } from '../../context/useApp';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete }) => {
  const { confirm } = useApp();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirm({
      title: 'Delete Workspace',
      message: `Are you sure you want to delete "${project.name}"? All strategy, tasks, content, and calendar data will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => onDelete(project.id),
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl flex flex-col justify-between border border-black/5 hover:border-black/15 hover:shadow-lg hover:translate-y-[-3px] transition-all duration-300 cursor-pointer group relative"
    >
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all z-10"
        title="Delete workspace"
      >
        <Trash2 size={13} />
      </button>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider uppercase bg-black/5 text-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
            ACTIVE
          </span>
          <span className="text-neutral-400 text-xs font-mono">{project.createdAt}</span>
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-bold tracking-tight text-neutral-900 group-hover:text-black transition-colors">{project.name}</h4>
          <p className="text-xs text-neutral-400 uppercase tracking-wide font-medium font-sans">
            {project.businessName} · <span className="text-neutral-500">{project.businessType}</span>
          </p>
        </div>
        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{project.goal}</p>
        <div className="space-y-1.5 pt-2">
          <ProgressBar value={project.progress} label="LAUNCH READINESS" showLabel />
          <div className="text-[10px] font-mono text-neutral-400 text-right mt-1">
            {project.tasksCount.completed} / {project.tasksCount.total} action items completed
          </div>
        </div>
      </div>
      <div className="border-t border-black/5 mt-5 pt-4 flex justify-between items-center">
        <span className="text-xs font-mono text-neutral-400">BUDGET: {project.budget}</span>
        <span className="text-xs font-bold text-neutral-500 group-hover:text-black flex items-center gap-1 transition-colors">
          Open Workspace <ArrowUpRight size={13} />
        </span>
      </div>
    </div>
  );
}
