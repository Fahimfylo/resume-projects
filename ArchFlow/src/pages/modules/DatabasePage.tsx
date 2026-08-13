import React, { useMemo, useState } from 'react';
import { Database, Table, FileCode, ArrowUpDown, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useProjectGraph } from '../../hooks/useProjectGraph';
import { ModulePage } from '../../components/modules/ModulePage';
import { CategoryBadge, EmptyState } from '../../components/modules/shared';

interface TableRow {
  id: string;
  label: string;
  category: string;
  filePath?: string;
  lines: number;
  moduleLabel: string;
  writers: string[];
  readers: string[];
}

export const DatabasePage: React.FC = () => {
  const { nodes, edges, moduleLabelOf, loading, error, refresh } = useProjectGraph();
  const [search, setSearch] = useState('');

  const tables = useMemo<TableRow[]>(() => {
    const labelById = new Map<string, string>();
    for (const n of nodes) labelById.set(n.id, n.data.label);

    const rows: TableRow[] = [];
    for (const n of nodes) {
      const cat = n.data.category;
      if (cat !== 'model' && cat !== 'db-table') continue;
      rows.push({
        id: n.id,
        label: n.data.label,
        category: cat,
        filePath: n.data.filePath,
        lines: n.data.stats?.lines || 0,
        moduleLabel: moduleLabelOf(n.id) || 'External / Root',
        writers: [],
        readers: [],
      });
    }

    const rowById = new Map(rows.map((r) => [r.id, r]));
    for (const e of edges) {
      const row = rowById.get(e.target);
      if (!row) continue;
      const rel = e.data?.relationshipType;
      const sourceLabel = labelById.get(e.source) || e.source;
      if (rel === 'WRITES_TO') row.writers.push(sourceLabel);
      else if (rel === 'READS_FROM') row.readers.push(sourceLabel);
    }

    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (!q) return true;
        return (
          r.label.toLowerCase().includes(q) ||
          (r.filePath || '').toLowerCase().includes(q) ||
          r.moduleLabel.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.writers.length + b.readers.length - (a.writers.length + a.readers.length));
  }, [nodes, edges, moduleLabelOf, search]);

  const modelCount = tables.filter((t) => t.category === 'model').length;
  const tableCount = tables.filter((t) => t.category === 'db-table').length;
  const accessed = tables.filter((t) => t.writers.length + t.readers.length > 0).length;

  return (
    <ModulePage
      title="Database Schema Map"
      description="ORM models and database tables with which files read or write them, derived from analysis edges."
      icon={<Database className="h-6 w-6" />}
      stats={[
        { label: 'ORM Models', value: modelCount, icon: <Database className="h-3.5 w-3.5" /> },
        { label: 'DB Tables', value: tableCount, icon: <Table className="h-3.5 w-3.5" /> },
        { label: 'Actively Accessed', value: accessed, icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
        { label: 'Modules Touching Data', value: new Set(tables.map((t) => t.moduleLabel)).size, icon: <FileCode className="h-3.5 w-3.5" /> },
      ]}
      search={{ value: search, onChange: setSearch, placeholder: 'Search models, tables, or modules…' }}
      loading={loading}
      error={error}
      onRetry={refresh}
      empty={
        tables.length === 0 ? (
          <EmptyState
            icon={<Database className="h-6 w-6" />}
            title="No data layer detected"
            message="Models and database tables are discovered during codebase analysis."
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        {tables.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <CategoryBadge category={t.category} compact />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[var(--text-strong)]">
                    {t.label}
                  </div>
                  <div className="truncate font-mono text-[10px] text-[var(--text-4)]">
                    {t.filePath || `${t.moduleLabel} (aggregate)`}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-[11px] font-semibold text-[var(--text-3)]">
                <span className="flex items-center gap-1">
                  <ArrowUpFromLine className="h-3.5 w-3.5 text-emerald-400" />
                  {t.writers.length}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowDownToLine className="h-3.5 w-3.5 text-cyan-400" />
                  {t.readers.length}
                </span>
                <span>{t.lines} lines</span>
              </div>
            </div>

            {(t.writers.length > 0 || t.readers.length > 0) && (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-[var(--bg-row)] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    <ArrowUpFromLine className="h-3 w-3" /> Writers
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.writers.map((w) => (
                      <span
                        key={`w-${w}`}
                        className="rounded-md border border-[var(--border-1)] bg-[var(--bg-card)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-2)]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--bg-row)] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    <ArrowDownToLine className="h-3 w-3" /> Readers
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.readers.map((r) => (
                      <span
                        key={`r-${r}`}
                        className="rounded-md border border-[var(--border-1)] bg-[var(--bg-card)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-2)]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ModulePage>
  );
};
