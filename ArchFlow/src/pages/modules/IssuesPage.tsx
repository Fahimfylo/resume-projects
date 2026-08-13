import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Repeat,
  FileWarning,
  Ghost,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useProjectGraph } from '../../hooks/useProjectGraph';
import { ModulePage } from '../../components/modules/ModulePage';
import { EmptyState } from '../../components/modules/shared';

interface Issue {
  id: string;
  type: 'cycle' | 'monolith' | 'dead' | 'hotspot';
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  meta: string;
}

type Severity = Issue['severity'];

const severityConfig: Record<Severity, { label: string; chip: string; border: string; icon: typeof AlertTriangle }> = {
  high: {
    label: 'High',
    chip: 'text-rose-300 bg-rose-500/15 border-rose-500/40',
    border: 'border-rose-500/30',
    icon: AlertTriangle,
  },
  medium: {
    label: 'Medium',
    chip: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
  },
  low: {
    label: 'Low',
    chip: 'text-sky-300 bg-sky-500/15 border-sky-500/40',
    border: 'border-sky-500/30',
    icon: AlertTriangle,
  },
};

function findCycles(adj: Map<string, string[]>, labelOf: (id: string) => string): string[][] {
  const cycles: string[][] = [];
  const inStack = new Set<string>();
  const visited = new Set<string>();

  const visit = (start: string, path: string[]) => {
    visited.add(start);
    inStack.add(start);
    path.push(start);
    const nexts = adj.get(start) || [];
    for (const n of nexts) {
      if (inStack.has(n)) {
        const idx = path.indexOf(n);
        if (idx !== -1) {
          const cycle = path.slice(idx).map(labelOf);
          cycles.push(cycle);
        }
      } else if (!visited.has(n)) {
        visit(n, path);
      }
    }
    path.pop();
    inStack.delete(start);
  };

  for (const v of adj.keys()) {
    if (!visited.has(v)) visit(v, []);
  }

  const key = (c: string[]) => {
    const minIdx = c.indexOf([...c].sort()[0]);
    const rotated = [...c.slice(minIdx), ...c.slice(0, minIdx)];
    return rotated.join(' -> ');
  };
  const seen = new Set<string>();
  return cycles.filter((c) => {
    const k = key(c);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const IssuesPage: React.FC = () => {
  const { nodes, edges, modules, files, byId, loading, error, refresh } = useProjectGraph();
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const issues = useMemo<Issue[]>(() => {
    const out: Issue[] = [];
    const moduleIds = new Set(modules.map((m) => m.id));
    const labelById = new Map<string, string>();
    for (const n of nodes) labelById.set(n.id, n.data.label);

    const moduleOf = (id: string): string | null => {
      const n = byId.get(id);
      if (!n) return null;
      if (moduleIds.has(id)) return id;
      if (n.parentNodeId && moduleIds.has(n.parentNodeId)) return n.parentNodeId;
      return null;
    };

    // 1. Circular module dependencies
    const modAdj = new Map<string, string[]>();
    for (const e of edges) {
      const s = moduleOf(e.source);
      const t = moduleOf(e.target);
      if (!s || !t || s === t) continue;
      const arr = modAdj.get(s) || [];
      if (!arr.includes(t)) arr.push(t);
      modAdj.set(s, arr);
    }
    const modLabel = (id: string) => labelById.get(id) || id;
    const cycles = findCycles(modAdj, modLabel);
    for (const [i, cycle] of cycles.entries()) {
      out.push({
        id: `cycle-${i}`,
        type: 'cycle',
        severity: 'high',
        title: 'Circular module dependency',
        detail: `${cycle.join(' → ')} → ${cycle[0]}`,
        meta: `${cycle.length} modules involved`,
      });
    }

    // 2. Monolithic files
    const MONOLITH_LINES = 400;
    for (const f of files) {
      const lines = f.data.stats?.lines || 0;
      if (lines >= MONOLITH_LINES) {
        out.push({
          id: `monolith-${f.id}`,
          type: 'monolith',
          severity: lines > 600 ? 'high' : 'medium',
          title: 'Monolithic source file',
          detail: `${f.data.label} is ${lines} lines long`,
          meta: f.data.filePath || '',
        });
      }
    }

    // 3. Dead code (no inbound edges, not manual)
    const inbound = new Set<string>();
    for (const e of edges) inbound.add(e.target);
    for (const f of files) {
      if (inbound.has(f.id) || f.isManual) continue;
      const lines = f.data.stats?.lines || 0;
      if (lines < 10) continue;
      out.push({
        id: `dead-${f.id}`,
        type: 'dead',
        severity: 'low',
        title: 'Unreferenced file',
        detail: `${f.data.label} has no inbound dependencies`,
        meta: f.data.filePath || '',
      });
    }

    // 4. Complexity hotspots
    for (const f of files) {
      if (f.data.stats?.complexity === 'High') {
        out.push({
          id: `hot-${f.id}`,
          type: 'hotspot',
          severity: 'medium',
          title: 'Complexity hotspot',
          detail: `${f.data.label} exceeds the high-complexity threshold`,
          meta: `${f.data.stats?.lines || 0} lines`,
        });
      }
    }

    return out;
  }, [nodes, edges, modules, files, byId]);

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
    for (const i of issues) c[i.severity] += 1;
    return c;
  }, [issues]);

  const filtered = issues.filter((i) => filter === 'all' || i.severity === filter);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const totalScore = counts.high * 3 + counts.medium * 2 + counts.low;

  return (
    <ModulePage
      title="Architectural Issues"
      description="Heuristic findings computed from the analyzed graph: cycles, oversized files, unreferenced code, and hotspots."
      icon={<AlertTriangle className="h-6 w-6" />}
      stats={[
        { label: 'High', value: counts.high, icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> },
        { label: 'Medium', value: counts.medium, icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> },
        { label: 'Low', value: counts.low, icon: <AlertTriangle className="h-3.5 w-3.5 text-sky-400" /> },
        { label: 'Health Score', value: Math.max(0, 100 - totalScore * 4), icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> },
      ]}
      loading={loading}
      error={error}
      onRetry={refresh}
      empty={
        issues.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="No issues detected"
            message="The analyzed graph is clean — no cycles, oversized files, or unreferenced code found."
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Severity filter */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold capitalize transition-colors ${
                filter === s
                  ? 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]'
                  : 'border-[var(--border-2)] bg-[var(--bg-card)] text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              {s} ({s === 'all' ? issues.length : counts[s]})
            </button>
          ))}
        </div>

        {filtered.map((issue) => {
          const cfg = severityConfig[issue.severity];
          const SeverityIcon = cfg.icon;
          const isCollapsed = collapsed[issue.id] ?? false;
          const typeConfig = {
            cycle: { icon: Repeat, color: 'text-rose-400', label: 'Circular Dependency' },
            monolith: { icon: FileWarning, color: 'text-amber-400', label: 'Monolithic File' },
            dead: { icon: Ghost, color: 'text-sky-400', label: 'Dead Code' },
            hotspot: { icon: Flame, color: 'text-orange-400', label: 'Complexity Hotspot' },
          }[issue.type];
          const TypeIcon = typeConfig.icon;

          return (
            <div
              key={issue.id}
              className={`overflow-hidden rounded-2xl border ${cfg.border} bg-[var(--bg-card)]`}
            >
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [issue.id]: !isCollapsed }))}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[var(--bg-row)]/60 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
                  )}
                  <TypeIcon className={`h-4 w-4 shrink-0 ${typeConfig.color}`} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[var(--text-strong)]">
                      {issue.title}
                    </div>
                    <div className="truncate text-[11px] text-[var(--text-3)]">{issue.detail}</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${cfg.chip}`}>
                    {cfg.label}
                  </span>
                </div>
              </button>
              {!isCollapsed && (
                <div className="flex items-center justify-between gap-3 border-t border-[var(--border-soft)] px-5 py-2.5 text-[11px]">
                  <span className="font-semibold text-[var(--text-2)]">{typeConfig.label}</span>
                  <span className="truncate font-mono text-[10px] text-[var(--text-4)]">
                    {issue.meta}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModulePage>
  );
};
