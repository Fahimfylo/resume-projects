import React, { useMemo, useState } from 'react';
import { Globe, PackageCheck, Package, FileCode, ArrowUpDown } from 'lucide-react';
import { useProjectGraph } from '../../hooks/useProjectGraph';
import { ModulePage } from '../../components/modules/ModulePage';
import { CategoryBadge, EmptyState } from '../../components/modules/shared';

interface Dependency {
  label: string;
  usingFiles: string[];
  usingModules: string[];
}

export const DependenciesPage: React.FC = () => {
  const { nodes, moduleLabelOf, loading, error, refresh } = useProjectGraph();
  const [search, setSearch] = useState('');

  const deps = useMemo<Dependency[]>(() => {
    const agg = new Map<string, Dependency>();
    for (const n of nodes) {
      const subs = n.data.subNodes || [];
      for (const s of subs) {
        if (s.category !== 'external-api') continue;
        const dep = agg.get(s.label);
        const moduleLabel = moduleLabelOf(n.id);
        if (dep) {
          if (!dep.usingFiles.includes(n.data.label)) dep.usingFiles.push(n.data.label);
          if (moduleLabel && !dep.usingModules.includes(moduleLabel)) dep.usingModules.push(moduleLabel);
        } else {
          agg.set(s.label, {
            label: s.label,
            usingFiles: [n.data.label],
            usingModules: moduleLabel ? [moduleLabel] : [],
          });
        }
      }
    }

    const q = search.trim().toLowerCase();
    return [...agg.values()]
      .filter((d) => {
        if (!q) return true;
        return (
          d.label.toLowerCase().includes(q) ||
          d.usingFiles.some((f) => f.toLowerCase().includes(q)) ||
          d.usingModules.some((m) => m.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.usingFiles.length - a.usingFiles.length || a.label.localeCompare(b.label));
  }, [nodes, moduleLabelOf, search]);

  const totalUsages = deps.reduce((acc, d) => acc + d.usingFiles.length, 0);

  return (
    <ModulePage
      title="Dependencies & External Surface"
      description="External packages and SDKs consumed by the codebase, aggregated across all analyzed files."
      icon={<PackageCheck className="h-6 w-6" />}
      stats={[
        { label: 'Unique Dependencies', value: deps.length, icon: <Package className="h-3.5 w-3.5" /> },
        { label: 'Total Usages', value: totalUsages, icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
        { label: 'Files Depending', value: new Set(deps.flatMap((d) => d.usingFiles)).size, icon: <FileCode className="h-3.5 w-3.5" /> },
        { label: 'Modules Touched', value: new Set(deps.flatMap((d) => d.usingModules)).size, icon: <Globe className="h-3.5 w-3.5" /> },
      ]}
      search={{ value: search, onChange: setSearch, placeholder: 'Search packages or using files…' }}
      loading={loading}
      error={error}
      onRetry={refresh}
      empty={
        deps.length === 0 ? (
          <EmptyState
            icon={<PackageCheck className="h-6 w-6" />}
            title="No external dependencies found"
            message="External imports and API calls are detected during codebase analysis."
          />
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {deps.map((d) => (
          <div
            key={d.label}
            className="rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="truncate font-mono text-xs font-bold text-[var(--text-strong)]">
                  {d.label}
                </span>
              </div>
              <CategoryBadge category="external-api" compact />
            </div>

            <div className="mt-1 text-[10px] font-semibold text-[var(--text-4)]">
              Used by {d.usingFiles.length} file{d.usingFiles.length === 1 ? '' : 's'}
              {d.usingModules.length > 0 && (
                <> across {d.usingModules.length} module{d.usingModules.length === 1 ? '' : 's'}</>
              )}
            </div>

            {d.usingFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.usingFiles.slice(0, 10).map((f) => (
                  <span
                    key={f}
                    className="rounded-md border border-[var(--border-1)] bg-[var(--bg-row)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-2)]"
                  >
                    {f}
                  </span>
                ))}
                {d.usingFiles.length > 10 && (
                  <span className="px-1 text-[10px] font-semibold text-[var(--text-4)]">
                    +{d.usingFiles.length - 10} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ModulePage>
  );
};
