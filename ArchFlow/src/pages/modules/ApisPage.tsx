import React, { useMemo, useState } from 'react';
import { Network, Cpu, Globe, ArrowDownUp } from 'lucide-react';
import { useProjectGraph } from '../../hooks/useProjectGraph';
import { ModulePage } from '../../components/modules/ModulePage';
import { CategoryBadge, EmptyState } from '../../components/modules/shared';

interface Endpoint {
  id: string;
  label: string;
  category: string;
  filePath?: string;
  lines: number;
  summary?: string;
  moduleLabel: string;
}

export const ApisPage: React.FC = () => {
  const { nodes, edges, moduleLabelOf, loading, error, refresh } = useProjectGraph();
  const [search, setSearch] = useState('');

  const endpoints = useMemo<Endpoint[]>(() => {
    const out: Endpoint[] = [];
    for (const n of nodes) {
      const cat = n.data.category;
      if (cat !== 'route' && cat !== 'controller') continue;
      const moduleLabel = moduleLabelOf(n.id);
      if (!moduleLabel) continue;
      out.push({
        id: n.id,
        label: n.data.label,
        category: cat,
        filePath: n.data.filePath,
        lines: n.data.stats?.lines || 0,
        summary: n.data.summary,
        moduleLabel,
      });
    }

    const q = search.trim().toLowerCase();
    return out
      .filter((e) => {
        if (!q) return true;
        return (
          e.label.toLowerCase().includes(q) ||
          (e.filePath || '').toLowerCase().includes(q) ||
          e.moduleLabel.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel) || b.lines - a.lines);
  }, [nodes, moduleLabelOf, search]);

  const routeCount = endpoints.filter((e) => e.category === 'route').length;
  const controllerCount = endpoints.filter((e) => e.category === 'controller').length;
  const inboundCount = edges.length;

  return (
    <ModulePage
      title="API Endpoints & Contracts"
      description="Discovered route handlers and controllers with their locations and size, grouped by module."
      icon={<Network className="h-6 w-6" />}
      stats={[
        { label: 'Routes', value: routeCount, icon: <Network className="h-3.5 w-3.5" /> },
        { label: 'Controllers', value: controllerCount, icon: <Cpu className="h-3.5 w-3.5" /> },
        { label: 'Graph Relations', value: inboundCount, icon: <ArrowDownUp className="h-3.5 w-3.5" /> },
        { label: 'Modules Exposed', value: new Set(endpoints.map((e) => e.moduleLabel)).size, icon: <Globe className="h-3.5 w-3.5" /> },
      ]}
      search={{ value: search, onChange: setSearch, placeholder: 'Search routes, files, or modules…' }}
      loading={loading}
      error={error}
      onRetry={refresh}
      empty={
        endpoints.length === 0 ? (
          <EmptyState
            icon={<Network className="h-6 w-6" />}
            title="No API surface found"
            message="Route handlers and controllers are detected during codebase analysis."
          />
        ) : undefined
      }
    >
      <div className="overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)]">
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--border-soft)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-4)] md:grid-cols-[1fr_140px_90px_70px]">
          <span>Endpoint</span>
          <span className="hidden md:block">Module</span>
          <span className="hidden text-right md:block">Complexity</span>
          <span className="text-right">Lines</span>
        </div>
        {endpoints.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[var(--border-soft)] px-5 py-3 last:border-b-0 hover:bg-[var(--bg-row)]/60 transition-colors md:grid-cols-[1fr_140px_90px_70px]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <CategoryBadge category={e.category} compact />
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-[var(--text-strong)]">{e.label}</div>
                <div className="truncate font-mono text-[10px] text-[var(--text-4)]">
                  {e.filePath}
                </div>
                {e.summary && (
                  <div className="mt-0.5 line-clamp-1 text-[10px] text-[var(--text-3)]">
                    {e.summary}
                  </div>
                )}
              </div>
            </div>
            <span className="hidden truncate text-[11px] font-semibold text-[var(--text-3)] md:block">
              {e.moduleLabel}
            </span>
            <span className="hidden text-right text-[11px] text-[var(--text-3)] md:block">
              {e.lines > 200 ? 'High' : e.lines > 60 ? 'Medium' : 'Low'}
            </span>
            <span className="text-right text-[11px] font-semibold text-[var(--text-2)]">
              {e.lines}
            </span>
          </div>
        ))}
      </div>
    </ModulePage>
  );
};
