import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  BookOpen,
  FileCode,
  Network,
  Database,
  Sparkles,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Cpu,
  Table,
  Globe,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useProjectGraph } from '../../hooks/useProjectGraph';
import { ModulePage } from '../../components/modules/ModulePage';
import { CategoryBadge, EmptyState } from '../../components/modules/shared';

interface ProjectMeta {
  name: string;
  description: string;
  lastAnalyzedAt?: string | null;
  stats?: { filesCount: number; modulesCount: number; lastAnalyzed?: string };
}

interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

const insightChip = {
  critical: 'text-rose-300 bg-rose-500/15 border-rose-500/40',
  warning: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
  info: 'text-sky-300 bg-sky-500/15 border-sky-500/40',
};

export const DocsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { moduleSummaries, files, edges, nodes, moduleLabelOf, loading, error, refresh } =
    useProjectGraph();
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!projectId) return;
    api
      .get<ProjectMeta>(`/projects/${projectId}`)
      .then(setMeta)
      .catch(() => setMeta(null));
    api
      .get<{ insights: Insight[] }>(`/projects/${projectId}/ai/insights`)
      .then((res) => setInsights(res.insights || []))
      .catch(() => setInsights([]));
  }, [projectId]);

  const totalLines = useMemo(
    () => files.reduce((acc, f) => acc + (f.data.stats?.lines || 0), 0),
    [files]
  );

  const apis = useMemo(() => {
    return nodes
      .filter((n) => n.data.category === 'route' || n.data.category === 'controller')
      .map((n) => ({
        id: n.id,
        label: n.data.label,
        category: n.data.category,
        filePath: n.data.filePath,
        module: moduleLabelOf(n.id),
      }))
      .filter((a) => a.module);
  }, [nodes, moduleLabelOf]);

  const dataLayer = useMemo(() => {
    return nodes
      .filter((n) => n.data.category === 'model' || n.data.category === 'db-table')
      .map((n) => ({
        id: n.id,
        label: n.data.label,
        category: n.data.category,
        filePath: n.data.filePath,
        module: moduleLabelOf(n.id),
      }))
      .filter((d) => d.module);
  }, [nodes, moduleLabelOf]);

  const hasData = moduleSummaries.length > 0 || files.length > 0;

  return (
    <ModulePage
      title="Automated Documentation"
      description="Generated project readme, module docs, API reference, data layer notes, and AI insights."
      icon={<FileText className="h-6 w-6" />}
      stats={[
        { label: 'Modules', value: moduleSummaries.length, icon: <Network className="h-3.5 w-3.5" /> },
        { label: 'Files', value: files.length, icon: <FileCode className="h-3.5 w-3.5" /> },
        { label: 'Total Lines', value: totalLines.toLocaleString(), icon: <BookOpen className="h-3.5 w-3.5" /> },
        { label: 'AI Insights', value: insights.length, icon: <Sparkles className="h-3.5 w-3.5" /> },
      ]}
      loading={loading}
      error={error}
      onRetry={refresh}
      empty={
        !hasData ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No documentation yet"
            message="Analyze a project codebase to auto-generate this documentation."
          />
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* README overview */}
        <section className="rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
            <BookOpen className="h-3.5 w-3.5" />
            Project Readme
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--text-strong)]">
            {meta?.name || 'Project'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-3)]">
            {meta?.description || 'No project description provided.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-[var(--text-3)]">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Last analyzed: {meta?.stats?.lastAnalyzed || 'Not analyzed'}
            </span>
            <span>{files.length} source files</span>
            <span>{moduleSummaries.length} modules</span>
            <span>{totalLines.toLocaleString()} lines</span>
            <span>{edges.length} relationships</span>
          </div>
        </section>

        {/* Module documentation */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
            <Network className="h-4 w-4" />
            Module Documentation
          </div>
          {moduleSummaries.map((m) => {
            const isCollapsed = collapsed[m.node.id] ?? false;
            return (
              <div
                key={m.node.id}
                className="overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)]"
              >
                <button
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [m.node.id]: !isCollapsed }))
                  }
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
                        {m.node.data.label}
                      </div>
                      <div className="truncate text-[11px] text-[var(--text-3)]">
                        {m.node.data.summary || m.node.data.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <CategoryBadge category={m.node.data.category} compact />
                    <span className="text-[11px] font-semibold text-[var(--text-3)]">
                      {m.files.length} files
                    </span>
                  </div>
                </button>

                {!isCollapsed && m.files.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 border-t border-[var(--border-soft)] p-4 md:grid-cols-2">
                    {m.files.map((f) => (
                      <div
                        key={f.id}
                        className="rounded-xl border border-[var(--border-1)] bg-[var(--bg-app)] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold text-[var(--text-strong)]">
                            {f.data.label}
                          </span>
                          <CategoryBadge category={f.data.category} compact />
                        </div>
                        <div className="mt-1 truncate font-mono text-[10px] text-[var(--text-4)]">
                          {f.data.filePath}
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-3)]">
                          {f.data.summary || 'No summary available for this file.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* API reference */}
        {apis.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              <Cpu className="h-4 w-4" />
              API Reference
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-4 border-b border-[var(--border-soft)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-4)]">
              <span>Endpoint / Handler</span>
              <span>Module</span>
            </div>
            {apis.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-[1fr_120px] items-center gap-4 border-b border-[var(--border-soft)] px-5 py-2.5 last:border-b-0 hover:bg-[var(--bg-row)]/60 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CategoryBadge category={a.category} compact />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-[var(--text-2)]">
                      {a.label}
                    </div>
                    <div className="truncate font-mono text-[10px] text-[var(--text-4)]">
                      {a.filePath}
                    </div>
                  </div>
                </div>
                <span className="truncate text-[11px] font-semibold text-[var(--text-3)]">
                  {a.module}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Data layer */}
        {dataLayer.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              <Database className="h-4 w-4" />
              Data Layer
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {dataLayer.map((d) => (
                <span
                  key={d.id}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-1)] bg-[var(--bg-row)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-2)]"
                >
                  {d.category === 'db-table' ? (
                    <Table className="h-3.5 w-3.5 text-purple-400" />
                  ) : (
                    <Database className="h-3.5 w-3.5 text-cyan-400" />
                  )}
                  {d.label}
                  <span className="text-[10px] font-normal text-[var(--text-4)]">{d.module}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* AI insights */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
            <Sparkles className="h-4 w-4 text-[var(--accent-text)]" />
            AI-Generated Insights
          </div>
          {insights.length === 0 ? (
            <div className="flex items-center gap-2 p-5 text-[11px] text-[var(--text-4)]">
              <Globe className="h-4 w-4" />
              No insights generated yet — they are created when a project is analyzed.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
              {insights.map((ins) => (
                <div key={ins.id} className="flex items-start gap-3 px-5 py-4">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold capitalize ${insightChip[ins.severity]}`}
                  >
                    {ins.severity}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-strong)]">{ins.title}</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-3)]">
                      {ins.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ModulePage>
  );
};
