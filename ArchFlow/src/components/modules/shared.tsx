import React from 'react';
import { getCategoryConfig } from '../canvas/nodes/EntityNode';
import { NodeCategory } from '../../types';

export const CategoryBadge: React.FC<{
  category?: string;
  compact?: boolean;
}> = ({ category, compact }) => {
  const cfg = getCategoryConfig((category || 'component') as NodeCategory);
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border ${cfg.bg} ${cfg.border} px-1.5 py-0.5 text-[10px] font-bold ${cfg.text}`}
    >
      <Icon className="h-3 w-3" />
      {!compact && cfg.label}
    </span>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  message: string;
}> = ({ icon, title, message }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-3)] bg-[var(--bg-card)] p-12 text-center space-y-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-row)] text-[var(--text-3)]">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-bold text-[var(--text-1)]">{title}</h3>
      <p className="mt-1 text-xs text-[var(--text-4)]">{message}</p>
    </div>
  </div>
);
