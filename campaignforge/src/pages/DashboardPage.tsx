import React from 'react';
import { useApp } from '../context/useApp';
import { parseBudget, formatCurrency } from '../lib/utils';
import { StatsRow } from '../components/dashboard/StatsRow';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { CreateProjectCard } from '../components/dashboard/CreateProjectCard';

export function DashboardPage() {
  const { projects, tasks, navigateTo, setActiveProjectId, user, deleteProject } = useApp();
  const displayName = user?.name || (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ') : 'there');

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalBudget = formatCurrency(projects.reduce((acc, p) => acc + parseBudget(p.budget), 0));

  return (
    <div className="flex-1 p-6 md:p-12 space-y-10">
      <div>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-neutral-900 leading-none">Good morning, {displayName}.</h1>
        <p className="text-sm text-neutral-500 mt-2 font-medium">{activeCount} active campaigns · {tasks.filter((t) => !t.completed).length} items remaining on your checklists</p>
      </div>

      <StatsRow activeCount={activeCount} taskPercentage={taskPercentage} completedTasks={completedTasks} totalTasks={totalTasks} totalBudgetFormatted={totalBudget} />

      <div className="flex items-center justify-between border-b border-black/5 pb-3">
        <h3 className="text-lg font-bold tracking-tight text-neutral-900 uppercase font-mono">Your Workspaces</h3>
        {projects.length < 1 && <button onClick={() => navigateTo('/onboarding')} className="text-xs font-mono font-bold tracking-wider text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer">Add workspace ↗</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <ProjectCard key={proj.id} project={proj} onClick={() => { setActiveProjectId(proj.id); navigateTo('/workspace', { id: proj.id }); }} onDelete={deleteProject} />
        ))}
        {projects.length < 1 && <CreateProjectCard onClick={() => navigateTo('/onboarding')} />}
      </div>
    </div>
  );
}
