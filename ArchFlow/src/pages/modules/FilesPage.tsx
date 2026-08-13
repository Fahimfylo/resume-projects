import React, { useMemo, useState } from 'react';
import { FolderTree, FileCode, FileText, ArrowDownUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectGraph } from '../../hooks/useProjectGraph';
import { ModulePage } from '../../components/modules/ModulePage';
import { CategoryBadge, EmptyState } from '../../components/modules/shared';

const complexityColor = (c?: string) => {
  switch (c) {
    case 'High':
      return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    case 'Medium':
      return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    default:
      return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
  }
};

export const FilesPage: React.FC = () => {
  const { files, moduleSummaries, edges, loading, error, refresh } = useProjectGraph();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const inbound = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of edges) map.set(e.target, (map.get(e.target) || 0) + 1);
    return map;
  }, [edges]);

  const totalLines = useMemo(
    () => files.reduce((acc, f) => acc + (f.data.stats?.lines || 0), 0),
    [files]
  );

  const moduleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return moduleSummaries
      .map((m) => {
        const rows = m.files
          .filter((f) => {
            if (!q) return true;
            return (
              f.data.label.toLowerCase().includes(q) ||
              (f.data.filePath || '').toLowerCase().includes(q) ||
              m.node.data.label.toLowerCase().includes(q)
            );
          })
          .slice()
          .sort((a, b) => (b.data.stats?.lines || 0) - (a.data.stats?.lines || 0));
        return { module: m, rows };
      })
      .filter((m) => m.rows.length > 0);
  }, [moduleSummaries, search]);

  const stats = [
    { label: 'Files', value: files.length, icon: <FileCode className="h-3.5 w-3.5" /> },
    { label: 'Modules', value: moduleSummaries.length, icon: <FolderTree className="h-3.5 w-3.5" /> },
    { label: 'Total Lines', value: totalLines.toLocaleString(), icon: <FileText className="h-3.5 w-3.5" /> },
    { label: 'Relationships', value: edges.length, icon: <ArrowDownUp className="h-3.5 w-3.5" /> },
  ];

  return (
    <ModulePage
      title="File Explorer"
      description="Every analyzed source file with size, complexity, and inbound dependency counts, grouped by module."
      icon={<FolderTree className="h-6 w-6" />}
      stats={stats}
      search={{ value: search, onChange: setSearch, placeholder: 'Search files, paths, or modules…' }}
      loading={loading}
      error={error}
      onRetry={refresh}
      empty={
        files.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="h-6 w-6" />}
            title="No files analyzed"
            message="Upload and analyze a codebase to populate the file explorer."
          />
        ) : moduleRows.length === 0 ? (
          <EmptyState
            icon={<FileCode className="h-6 w-6" />}
            title="No matches"
            message={`No files match "${search}". Try a different query.`}
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        {moduleRows.map(({ module, rows }) => {
          const key = module.node.id;
          const isCollapsed = collapsed[key] ?? false;
          const lines = rows.reduce((a, r) => a + (r.data.stats?.lines || 0), 0);
          return (
            <div
              key={key}
              className="overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)]"
            >
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [key]: !isCollapsed }))}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[var(--bg-row)]/60 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[var(--text-strong)]">
                      {module.node.data.label}
                    </div>
                    <div className="truncate text-[11px] text-[var(--text-4)]">
                      {module.node.data.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-[11px] font-semibold text-[var(--text-3)]">
                  <span>{rows.length} files</span>
                  <span>{lines.toLocaleString()} lines</span>
                </div>
              </button>

              {!isCollapsed && (
                <div className="border-t border-[var(--border-soft)]">
                  {rows.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--bg-row)]/60 transition-colors"
                    >
                      <CategoryBadge category={f.data.category} compact />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-[var(--text-2)]">
                          {f.data.label}
                        </div>
                        <div className="truncate font-mono text-[10px] text-[var(--text-4)]">
                          {f.data.filePath}
                        </div>
                      </div>
                      <span
                        className={`hidden w-16 shrink-0 rounded-md border px-1.5 py-0.5 text-center text-[10px] font-bold sm:inline-block ${
                          complexityColor(f.data.stats?.complexity)
                        }`}
                      >
                        {f.data.stats?.complexity || 'Low'}
                      </span>
                      <span className="w-16 shrink-0 text-right text-[11px] font-semibold text-[var(--text-3)]">
                        {f.data.stats?.lines || 0} lines
                      </span>
                      <span
                        className={`w-12 shrink-0 text-right text-[11px] font-semibold ${
                          inbound.get(f.id) ? 'text-[var(--text-2)]' : 'text-[var(--text-4)]'
                        }`}
                      >
                        {inbound.get(f.id) || 0} in
                      </span>
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
