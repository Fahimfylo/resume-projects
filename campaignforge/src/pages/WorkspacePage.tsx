import React, { useState, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { RefreshCw, Share2, Plus, Trash2 } from 'lucide-react';
import { WORKSPACE_TABS } from '../constants';
import { WorkspaceTab } from '../types';
import { StrategyPanel } from '../components/workspace/StrategyPanel';
import { TasksBoard } from '../components/workspace/TasksBoard';
import { ContentLibrary } from '../components/workspace/ContentLibrary';
import { CalendarTimeline } from '../components/workspace/CalendarTimeline';
import { AnalyticsPanel } from '../components/workspace/AnalyticsPanel';
import { ChatCopilot } from '../components/workspace/ChatCopilot';

export function WorkspacePage() {
  const { projects, activeProjectId, strategies, navigateTo, addToast, pathParams, deleteProject, confirm } = useApp();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('strategy');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as WorkspaceTab | null;
    if (tabParam && WORKSPACE_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    const tabParam = pathParams.tab as WorkspaceTab | undefined;
    if (tabParam && WORKSPACE_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [pathParams.tab]);

  const project = projects.find((p) => p.id === activeProjectId);
  const strategy = strategies[activeProjectId];

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#F0EEE8]">
        <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <h3 className="text-2xl font-black font-display text-neutral-900 tracking-tight">No Workspace Selected</h3>
        <p className="text-neutral-500 mt-2 max-w-sm text-sm">Create your first campaign workspace to access the task board, content library, 30-day calendar, and performance analytics.</p>
        <button onClick={() => navigateTo('/dashboard')} className="mt-4 inline-flex items-center justify-center px-[28px] py-[14px] rounded-[9999px] bg-transparent text-neutral-700 font-semibold text-sm border border-black/10 cursor-pointer transition-all duration-200 hover:bg-black/5 gap-2">
          Back to Dashboard
        </button>
        <button onClick={() => navigateTo('/onboarding')} className="mt-2 inline-flex items-center justify-center px-[28px] py-[14px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-sm border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] gap-2">
          <Plus size={16} /> Create Your First Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F0EEE8]">
      <div className="bg-[#E8E6DF]/80 border-b border-black/5 px-6 md:px-12 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-black font-display text-neutral-900 tracking-tight">{project.name}</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-black/5 border border-black/5 text-neutral-600">{project.budget} BUDGET</span>
          </div>
          <p className="text-xs text-neutral-500 font-medium">Entity: <span className="text-neutral-800 font-bold">{project.businessName}</span> · Category: {project.businessType}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => confirm({
            title: 'Delete Workspace',
            message: `Are you sure you want to delete "${project.name}"? All strategy, tasks, content, and calendar data will be permanently removed.`,
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm: () => deleteProject(activeProjectId),
          })}
            className="p-2 bg-white/50 border border-black/5 rounded-full hover:bg-white text-neutral-400 hover:text-red-500 cursor-pointer transition-all"
            title="Delete workspace">
            <Trash2 size={15} />
          </button>
          <button onClick={() => addToast('Link Shared', 'Campaign control link copied to your clipboard.', 'success')}
            className="p-2 bg-white/50 border border-black/5 rounded-full hover:bg-white text-neutral-600 cursor-pointer transition-all hover:scale-105" title="Share Campaign"><Share2 size={15} /></button>
          <button onClick={() => { addToast('Regenerating Plan', 'Re-assessing marketing parameters...', 'info'); setTimeout(() => addToast('Workspace Synchronized', 'AI updated strategic phases based on trends.', 'success'), 1500); }}
            className="px-4 py-2 bg-white/60 hover:bg-white text-neutral-800 border border-black/10 rounded-full text-xs font-semibold tracking-tight transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer">
            <RefreshCw size={12} /> Sync AI Setup
          </button>
        </div>
      </div>

      <div className="border-b border-black/5 bg-[#E8E6DF]/30 px-6 md:px-12 flex items-center overflow-x-auto gap-6 scrollbar-none">
        {WORKSPACE_TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-3.5 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${active ? 'border-neutral-900 text-neutral-900 font-black' : 'border-transparent text-neutral-400 hover:text-neutral-800'}`}>
              {tab}
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeTab === 'strategy' && strategy && <StrategyPanel strategy={strategy} />}
        {activeTab === 'tasks' && <TasksBoard projectId={activeProjectId} />}
        {activeTab === 'content' && <ContentLibrary projectId={activeProjectId} />}
        {activeTab === 'calendar' && <CalendarTimeline projectId={activeProjectId} />}
        {activeTab === 'analytics' && <AnalyticsPanel projectId={activeProjectId} />}
        {activeTab === 'chat' && <ChatCopilot projectId={activeProjectId} projectGoal={project.goal} />}
      </div>
    </div>
  );
}
