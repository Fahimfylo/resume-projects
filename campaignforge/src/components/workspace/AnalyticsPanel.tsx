import React, { useMemo } from 'react';
import { useApp } from '../../context/useApp';
import { TrendingUp, BarChart3, Lightbulb } from 'lucide-react';

interface AnalyticsPanelProps {
  projectId: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: 'bg-neutral-900',
  Twitter: 'bg-sky-600',
  Instagram: 'bg-pink-600',
  Email: 'bg-amber-600',
};

export function AnalyticsPanel({ projectId }: AnalyticsPanelProps) {
  const { tasks, contentItems, calendarEvents } = useApp();

  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === projectId), [tasks, projectId]);
  const projectContent = useMemo(() => contentItems.filter((c) => c.projectId === projectId), [contentItems, projectId]);
  const projectEvents = useMemo(() => calendarEvents.filter((e) => e.projectId === projectId), [calendarEvents, projectId]);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; completed: number; total: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - w * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const weekTasks = projectTasks.filter((t) => {
        const d = new Date(t.dueDate);
        return d >= start && d <= end;
      });
      weeks.push({
        label: `Week ${4 - w}`,
        completed: weekTasks.filter((t) => t.completed).length,
        total: weekTasks.length,
      });
    }
    return weeks;
  }, [projectTasks]);

  const platformMetrics = useMemo(() => {
    const platforms = ['LinkedIn', 'Twitter', 'Instagram', 'Email'] as const;
    const total = projectContent.length || 1;
    return platforms.map((p) => {
      const count = projectContent.filter((c) => c.platform === p).length;
      return { label: p, count, percent: Math.round((count / total) * 100) };
    });
  }, [projectContent]);

  const completionRate = useMemo(() => {
    if (projectTasks.length === 0) return 0;
    return Math.round((projectTasks.filter((t) => t.completed).length / projectTasks.length) * 100);
  }, [projectTasks]);

  const maxChartVal = Math.max(...weeklyData.map((w) => w.total || 1), 1);
  const svgPoints = weeklyData.map((w, i) => {
    const x = 80 + i * 80;
    const y = 130 - (w.completed / maxChartVal) * 100;
    return { x, y: Math.max(y, 10) };
  });
  const svgPath = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const svgAreaPath = svgPath + ` L${svgPoints[svgPoints.length - 1].x},140 L80,140 Z`;

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const totalTasks = projectTasks.length;
    const doneTasks = projectTasks.filter((t) => t.completed).length;

    if (totalTasks > 0 && doneTasks / totalTasks < 0.3) {
      recs.push('Task completion rate is below 30% — consider breaking large tasks into smaller subtasks and reassigning priorities to accelerate momentum.');
    }

    const linkedInCount = projectContent.filter((c) => c.platform === 'LinkedIn').length;
    const emailCount = projectContent.filter((c) => c.platform === 'Email').length;
    if (linkedInCount > emailCount * 2 && emailCount > 0) {
      recs.push('Content distribution skews heavily toward LinkedIn. Balancing with more Email newsletters could capture a wider conversion funnel.');
    } else if (linkedInCount === 0 && projectContent.length > 0) {
      recs.push('Your content library is missing LinkedIn posts — adding professional network content can expand B2B reach and authority signals.');
    }

    const contentEvents = projectEvents.filter((e) => e.type === 'content').length;
    const taskEvents = projectEvents.filter((e) => e.type === 'task').length;
    if (contentEvents > 0 && taskEvents === 0) {
      recs.push('Calendar contains content releases but no task deadlines. Adding task-based milestones improves accountability and timeline adherence.');
    }

    if (recs.length === 0) {
      recs.push('Workspace metrics look healthy. Continue monitoring weekly conversion trends and consider A/B testing your top-performing content platforms.');
    }

    return recs.slice(0, 3);
  }, [projectTasks, projectContent, projectEvents]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 space-y-2">
          <div className="flex items-center gap-2 text-neutral-400"><BarChart3 size={14} /><span className="text-[10px] font-mono font-black uppercase">Tasks Completed</span></div>
          <div className="text-3xl font-black font-display text-neutral-900">{projectTasks.filter((t) => t.completed).length}<span className="text-base font-medium text-neutral-400">/{projectTasks.length}</span></div>
          <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-900 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
          </div>
          <span className="text-[10px] font-mono text-neutral-400 font-bold">{completionRate}% completion rate</span>
        </div>
        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 space-y-2">
          <div className="flex items-center gap-2 text-neutral-400"><TrendingUp size={14} /><span className="text-[10px] font-mono font-black uppercase">Content Drafts</span></div>
          <div className="text-3xl font-black font-display text-neutral-900">{projectContent.length}</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {platformMetrics.map((m) => (
              <span key={m.label} className="text-[9px] font-mono font-bold bg-black/5 px-1.5 py-0.5 rounded uppercase text-neutral-500">{m.label} {m.count}</span>
            ))}
          </div>
        </div>
        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 space-y-2">
          <div className="flex items-center gap-2 text-neutral-400"><Lightbulb size={14} /><span className="text-[10px] font-mono font-black uppercase">Events Scheduled</span></div>
          <div className="text-3xl font-black font-display text-neutral-900">{projectEvents.length}</div>
          <div className="flex gap-2 text-[10px] font-mono font-bold text-neutral-400 mt-1">
            <span className="bg-[#B45309]/10 text-[#B45309] px-1.5 py-0.5 rounded">{projectEvents.filter((e) => e.type === 'task').length} tasks</span>
            <span className="bg-neutral-900/10 text-neutral-800 px-1.5 py-0.5 rounded">{projectEvents.filter((e) => e.type === 'content').length} content</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h4 className="text-xs font-mono font-black text-neutral-400 uppercase">— WEEKLY TASK COMPLETION TREND</h4>
            <TrendingUp size={14} className="text-neutral-400" />
          </div>
          <div className="h-48 w-full bg-[#1A1A1A]/3 border border-black/5 rounded-xl flex items-end p-4 relative overflow-hidden select-none">
            <div className="absolute inset-x-0 top-1/4 border-b border-black/5" />
            <div className="absolute inset-x-0 top-2/4 border-b border-black/5" />
            <div className="absolute inset-x-0 top-3/4 border-b border-black/5" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              {svgPoints.length > 0 && (
                <>
                  <path d={svgPath} fill="none" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
                  <path d={svgAreaPath} fill="url(#chart-grad)" opacity="0.06" />
                </>
              )}
              <defs>
                <linearGradient id="chart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1A1A1A" />
                  <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-2 inset-x-4 flex justify-between text-[10px] font-mono text-neutral-400">
              {weeklyData.map((w) => (
                <span key={w.label}>{w.label} ({w.completed}/{w.total})</span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h4 className="text-xs font-mono font-black text-neutral-400 uppercase">— PLATFORM CONTENT DISTRIBUTION</h4>
            <span className="text-xs font-mono text-neutral-400 font-bold">{projectContent.length} PIECES</span>
          </div>
          <div className="h-48 w-full bg-[#1A1A1A]/3 border border-black/5 rounded-xl flex flex-col justify-around p-5 select-none">
            {platformMetrics.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-neutral-500 font-bold">
                  <span>{m.label}</span>
                  <span>{m.count} ({m.percent}%)</span>
                </div>
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className={`h-full ${PLATFORM_COLORS[m.label] || 'bg-neutral-900'} rounded-full transition-all duration-500`} style={{ width: `${m.percent}%` }} />
                </div>
              </div>
            ))}
            {projectContent.length === 0 && (
              <div className="text-center text-[10px] font-mono text-neutral-400 italic">No content drafts yet. Create your first post to see distribution.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A]/4 border border-black/10 p-6 rounded-2xl space-y-4">
        <h4 className="text-xs font-mono font-black text-neutral-400 uppercase flex items-center gap-2"><Lightbulb size={13} /> AI AUDIT RECOMMENDATIONS</h4>
        <ul className="space-y-3 text-xs text-neutral-600 leading-relaxed font-sans font-medium">
          {recommendations.length > 0 ? recommendations.map((rec, i) => (
            <li key={i}><span className="font-bold text-neutral-900">{i + 1}.</span> {rec}</li>
          )) : (
            <li className="text-neutral-400 italic">Not enough data to generate recommendations. Start creating tasks and content to unlock AI insights.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
