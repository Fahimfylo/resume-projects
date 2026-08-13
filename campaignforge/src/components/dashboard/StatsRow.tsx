import React from 'react';
import { StatsCard } from './StatsCard';
import { Target, Award, FolderOpen, DollarSign } from 'lucide-react';

interface StatsRowProps {
  activeCount: number;
  taskPercentage: number;
  completedTasks: number;
  totalTasks: number;
  totalBudgetFormatted: string;
}

export function StatsRow({ activeCount, taskPercentage, completedTasks, totalTasks, totalBudgetFormatted }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard label="ACTIVE CAMPAIGNS" value={String(activeCount)} subtitle="↑ 100% execution" icon={Target} />
      <StatsCard label="TASK COMPLETION" value={`${taskPercentage}%`} subtitle={`${completedTasks}/${totalTasks} checklists items done`} icon={Award} />
      <StatsCard label="TOTAL CHANNELS" value="4 Platforms" subtitle="Twitter, LinkedIn, IG, Email" icon={FolderOpen} />
      <StatsCard label="BUDGET ALLOTMENT" value={totalBudgetFormatted} subtitle="Assigned marketing funds" icon={DollarSign} />
    </div>
  );
}
