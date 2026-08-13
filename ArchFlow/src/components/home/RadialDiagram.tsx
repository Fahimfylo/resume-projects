import React from 'react';
import {
  Brain,
  Import,
  Zap,
  Network,
  Database,
  Globe,
  Anchor,
  Workflow,
  Gauge,
  LucideIcon,
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface Satellite {
  label: string;
  icon: LucideIcon;
}

const SATELLITES: Satellite[] = [
  { label: 'Imports', icon: Import },
  { label: 'Function Calls', icon: Zap },
  { label: 'Routes', icon: Network },
  { label: 'DB Models', icon: Database },
  { label: 'External APIs', icon: Globe },
  { label: 'Hooks', icon: Anchor },
  { label: 'Middleware', icon: Workflow },
  { label: 'Confidence Scoring', icon: Gauge },
];

function satellitePosition(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const x = 50 + 48 * Math.cos(angle);
  const y = 50 + 48 * Math.sin(angle);
  return { x, y };
}

export const RadialDiagram: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <SectionHeading
        kicker="Analysis Engine"
        titleStrong="How ArchFlow reads"
        titleMuted="your codebase."
        subtitle="Deterministic Core, AI Enrichment"
      />

      {/* Circular diagram — md+ */}
      <div className="relative mx-auto hidden h-[460px] w-[460px] md:block">
        {/* Connecting lines */}
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          {SATELLITES.map((_, i) => {
            const { x, y } = satellitePosition(i, SATELLITES.length);
            return (
              <line
                key={i}
                x1="50%"
                y1="50%"
                x2={`${x}%`}
                y2={`${y}%`}
                className="stroke-[var(--border-2)]"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Center node */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="homepage-glow absolute -inset-12 rounded-full bg-[var(--accent-bg)] blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--bg-inset)] shadow-xl">
            <Brain className="h-10 w-10 text-[var(--accent-text)]" />
          </div>
          <div className="relative mt-3 text-center">
            <div className="text-sm font-bold text-[var(--text-strong)]">ArchFlow Core</div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-text)]">
              AST + AI
            </div>
          </div>
        </div>

        {/* Satellite tiles */}
        {SATELLITES.map((sat, i) => {
          const { x, y } = satellitePosition(i, SATELLITES.length);
          const Icon = sat.icon;
          const isLeftHalf = x < 50;
          return (
            <div
              key={sat.label}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-2)] bg-[var(--bg-inset)] text-[var(--text-3)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent-text)]">
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-4)] ${
                  isLeftHalf ? 'text-right' : 'text-left'
                } max-w-[96px]`}
              >
                {sat.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stacked list — small screens */}
      <div className="mx-auto flex max-w-md flex-col gap-3 md:hidden">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--bg-inset)]">
            <Brain className="h-6 w-6 text-[var(--accent-text)]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-strong)]">ArchFlow Core</div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-text)]">
              AST + AI
            </div>
          </div>
        </div>
        {SATELLITES.map((sat, i) => {
          const Icon = sat.icon;
          return (
            <React.Fragment key={sat.label}>
              {i > 0 && <div className="mx-auto h-3 w-px bg-[var(--border-2)]" />}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-2)] bg-[var(--bg-inset)] text-[var(--text-3)]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-sm font-semibold text-[var(--text-1)]">{sat.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
