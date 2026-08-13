import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';

export interface ModuleStat {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
}

interface ModulePageProps {
  title: string;
  description: string;
  icon: ReactNode;
  stats?: ModuleStat[];
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
  };
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: ReactNode;
  children: ReactNode;
}

export const ModulePage: React.FC<ModulePageProps> = ({
  title,
  description,
  icon,
  stats,
  search,
  loading,
  error,
  onRetry,
  empty,
  children,
}) => {
  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-app)] text-[var(--text-high)] select-none">
      <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--border-soft)] pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              {icon}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[var(--text-strong)]">{title}</h1>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">{description}</p>
            </div>
          </div>
          {search && (
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder}
                className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg-card)] py-2 pl-9 pr-4 text-xs text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Stat cards */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-card)] p-4"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {s.icon}
                  <span>{s.label}</span>
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)]">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/40 px-2.5 py-1 font-semibold hover:bg-rose-500/20"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Loading / Empty / Content */}
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-[var(--border-3)] bg-[var(--bg-card)] p-12">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-3)]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading project graph…
            </div>
          </div>
        ) : empty ? (
          empty
        ) : (
          children
        )}
      </div>
    </div>
  );
};
