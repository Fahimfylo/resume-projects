import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { motion } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../../types';
import { FilterChip } from '../ui/FilterChip';

interface TasksBoardProps {
  projectId: string;
}

const columns: { status: TaskStatus; label: string; dot: string }[] = [
  { status: 'todo', label: 'To Do', dot: 'bg-neutral-400' },
  { status: 'progress', label: 'In Progress', dot: 'bg-[#1A1A1A]' },
  { status: 'done', label: 'Completed', dot: 'bg-[#2D6A4F]' },
];

const priorityColors: Record<TaskPriority, string> = {
  high: 'border-l-[#B91C1C]',
  medium: 'border-l-[#B45309]',
  low: 'border-l-neutral-400',
};

export function TasksBoard({ projectId }: TasksBoardProps) {
  const { tasks, addTask, deleteTask, updateTaskStatus } = useApp();
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState('Marketing');

  const filteredTasks = tasks.filter((t) => {
    if (t.projectId !== projectId) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) updateTaskStatus(taskId, targetStatus);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <FilterChip key={p} label={p === 'all' ? 'All priorities' : `${p} priority`} active={priorityFilter === p} onClick={() => setPriorityFilter(p)} />
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] gap-1">
          <Plus size={14} /> Add Campaign Task
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-5 rounded-xl max-w-md border border-black/10 space-y-4 mb-4 shadow-lg">
          <h4 className="text-xs font-mono font-black uppercase text-neutral-500">NEW TASK ASSIGNMENT</h4>
          <div className="space-y-3">
            <input type="text" placeholder="E.g., Design cold brew canister render variations..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[#1A1A1A]/5 border border-black/10 rounded-lg p-2.5 text-sm outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <select value={newPriority} onChange={(e: any) => setNewPriority(e.target.value)}
                className="bg-[#1A1A1A]/5 border border-black/10 rounded-lg p-2.5 text-xs outline-none cursor-pointer">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input type="text" placeholder="Category (e.g., Design)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="bg-[#1A1A1A]/5 border border-black/10 rounded-lg p-2.5 text-xs outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs pt-1">
            <button onClick={() => setShowForm(false)} className="inline-flex items-center justify-center px-5 py-2 rounded-[9999px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)]">Cancel</button>
            <button onClick={() => { if (!newTitle.trim()) return; addTask(projectId, newTitle, newPriority, newCategory, new Date().toISOString().split('T')[0]); setNewTitle(''); setShowForm(false); }}
              className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333]">Create Task</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(({ status, label, dot }) => {
          const columnTasks = filteredTasks.filter((t) => t.status === status);
          return (
            <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}
              className="bg-[#1A1A1A]/3 border border-black/4 p-4 rounded-2xl min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-xs font-mono font-black uppercase tracking-wider text-neutral-800">{label}</span>
                </div>
                <span className="text-[10px] font-mono bg-black/5 text-neutral-500 px-1.5 py-0.5 rounded-full">{columnTasks.length}</span>
              </div>
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {columnTasks.map((t) => (
                  <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}
                    className={`bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-4 rounded-xl border border-black/5 border-l-4 ${priorityColors[t.priority]} hover:border-black/15 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="text-xs font-bold text-neutral-900 leading-snug">{t.title}</h5>
                        <button onClick={() => deleteTask(t.id)} className="text-neutral-400 hover:text-[#B91C1C] transition-colors shrink-0"><Trash2 size={11} /></button>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold text-neutral-400 pt-1.5 border-t border-black/5">
                        <span className="bg-black/5 px-1.5 py-0.5 rounded uppercase">{t.category}</span>
                        <span>{t.dueDate}</span>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1.5 text-[10px] font-mono font-bold">
                        {status !== 'todo' && <button onClick={() => updateTaskStatus(t.id, 'todo')} className="text-neutral-400 hover:text-black hover:underline">Move to Todo</button>}
                        {status !== 'progress' && <button onClick={() => updateTaskStatus(t.id, 'progress')} className="text-neutral-500 hover:text-black hover:underline">Set Active</button>}
                        {status !== 'done' && <button onClick={() => updateTaskStatus(t.id, 'done')} className="text-[#2D6A4F] hover:underline">Mark Done ✓</button>}
                      </div>
                    </div>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex-1 border border-dashed border-neutral-300 rounded-xl flex items-center justify-center p-6 text-center py-12">
                    <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">No items in column</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
