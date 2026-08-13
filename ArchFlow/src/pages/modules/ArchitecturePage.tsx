import React, { useMemo, useState } from 'react';
import { Network, FolderTree, FileCode, GitBranch, Boxes, ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectGraph } from '../../hooks/useProjectGraph';
import { ModulePage } from '../../components/modules/ModulePage';
import { CategoryBadge, EmptyState } from '../../components/modules/shared';

export const ArchitecturePage: React.FC = () => {
  const { buckets, modules, files, edges, moduleSummaries, loading, error, refresh } = useProjectGraph();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totalLines = useMemo(
    () => files.reduce((acc, f) => acc + (f.data.stats?.lines || 0), 0),
    [files]
  );

  const bucketsWithModules = useMemo(() => {
    const all = new Map<string | null, typeof moduleSummaries>();
    for (const m of moduleSummaries) {
      const key = m.bucketId;
      const arr = all.get(key) || [];
      arr.push(m);
      all.set(key, arr);
    }
    return [...all.entries()].map(([bucketId, mods]) => {
      const bucket = buckets.find((b) => b.id === bucketId);
      const bucketFiles = mods.reduce((acc, m) => acc + m.files.length, 0);
      const bucketLines = mods.reduce((acc, m) => acc + m.totalLines, 0);
      return { bucketId, bucket, mods, bucketFiles, bucketLines };
    });
  }, [buckets, moduleSummaries]);

  const stats = [
    { label: 'System Buckets', value: buckets.length, icon: <Boxes className="h-3.5 w-3.5" /> },
    { label: 'Modules', value: modules.length, icon: <Network className="h-3.5 w-3.5" /> },
    { label: 'Files', value: files.length, icon: <FileCode className="h-3.5 w-3.5" /> },
    { label: 'Total Lines', value: totalLines.toLocaleString(), icon: <GitBranch className="h-3.5 w-3.5" /> },
  ];

  const hasData = buckets.length > 0 || modules.length > 0;

  return (
    <ModulePage
      title="Architecture Overview"
      description="High-level module topology grouped by system boundary, derived from the analyzed codebase."
      icon={<Network className="h-6 w-6" />}
      stats={stats}
      loading={loading}
      error={error}
      onRetry={refresh}
      empty={
        !hasData ? (
          <EmptyState
            icon={<FolderTree className="h-6 w-6" />}
            title="No architecture data yet"
            message="Analyze a project codebase to populate the system, module, and file topology."
          />
        ) : undefined
      }
    >
      <div className="space-y-6">
        {bucketsWithModules.map(({ bucketId, bucket, mods, bucketFiles, bucketLines }) => {
          const isCollapsed = collapsed[bucketId || 'root'] ?? false;
          const bucketName = bucket?.data?.label || (bucketId ? bucketId : 'Root System');
          const bucketSubtitle = bucket?.data?.subtitle || (bucketId ? 'System boundary' : 'Cross-cutting root scope');

          return (
            <div
              key={bucketId || 'root'}
              className="overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)]"
            >
              <button
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [bucketId || 'root']: !isCollapsed }))
                }
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[var(--bg-row)]/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-3)]" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-[var(--text-strong)]">{bucketName}</div>
                    <div className="text-[11px] text-[var(--text-4)]">{bucketSubtitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold text-[var(--text-3)]">
                  <span>{mods.length} modules</span>
                  <span>{bucketFiles} files</span>
                  <span>{bucketLines.toLocaleString()} lines</span>
                </div>
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-1 gap-4 border-t border-[var(--border-soft)] p-5 md:grid-cols-2 lg:grid-cols-3">
                  {mods.map((m) => (
                    <div
                      key={m.node.id}
                      className="rounded-xl border border-[var(--border-1)] bg-[var(--bg-app)] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-[var(--text-strong)]">
                            {m.node.data.label}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[var(--text-4)]">
                            {m.node.data.subtitle}
                          </div>
                        </div>
                        <CategoryBadge category={m.node.data.category} compact />
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-[var(--text-3)]">
                        <span>{m.files.length} files</span>
                        <span>{m.totalLines.toLocaleString()} lines</span>
                        <span className="flex items-center gap-1">
                          <Network className="h-3 w-3" />
                          {edges.filter((e) => {
                            const src = m.files.find((f) => f.id === e.source) || m.node.id === e.source;
                            const tgt = m.files.find((f) => f.id === e.target) || m.node.id === e.target;
                            return src || tgt;
                          }).length}
                        </span>
                      </div>

                      {m.files.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {m.files.slice(0, 4).map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center justify-between gap-2 rounded-md bg-[var(--bg-row)] px-2 py-1"
                            >
                              <span className="flex min-w-0 items-center gap-1.5">
                                <FileCode className="h-3 w-3 shrink-0 text-[var(--text-3)]" />
                                <span className="truncate text-[11px] text-[var(--text-2)]">
                                  {f.data.label}
                                </span>
                              </span>
                              <span className="shrink-0 text-[10px] text-[var(--text-4)]">
                                {f.data.stats?.lines || 0}L
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModulePage>
  );
};
