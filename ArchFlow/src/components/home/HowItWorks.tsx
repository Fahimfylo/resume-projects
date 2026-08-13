import React from 'react';
import { Scan, Braces, Workflow, Network, Sparkles, Eye } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Upload your codebase',
    description: 'Zip it up or point us at a repo — no config, no setup, no YAML to write.',
  },
  {
    number: '02',
    title: 'ArchFlow parses it',
    description:
      'Imports, routes, models, calls — deterministic AST analysis of your actual source, not guesses.',
  },
  {
    number: '03',
    title: 'Explore the map',
    description: 'Drill down, filter by category, and ask "why" about any connection you see.',
  },
];

const PIPELINE = [
  { icon: Scan, label: 'Scan' },
  { icon: Braces, label: 'Parse' },
  { icon: Workflow, label: 'Resolve' },
  { icon: Network, label: 'Cluster' },
  { icon: Sparkles, label: 'AI Enrich' },
  { icon: Eye, label: 'Render' },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 md:py-24">
      <SectionHeading
        kicker="How It Works"
        titleStrong="Three steps to"
        titleMuted="understanding."
        subtitle="From Upload to Understanding"
      />

      <div className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[var(--border-2)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-2)] bg-[var(--bg-inset)] text-lg font-black text-[var(--text-strong)]">
              {step.number}
            </div>
            <h3 className="mt-5 text-base font-bold text-[var(--text-strong)]">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-3)]">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Pipeline strip */}
      <div className="mt-10 flex items-center justify-center gap-2 overflow-x-auto py-2 md:gap-3">
        {PIPELINE.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.label}>
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-2)] bg-[var(--bg-inset)] text-[var(--text-3)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-4)]">
                  {stage.label}
                </span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="mb-5 h-px w-6 shrink-0 bg-[var(--border-2)] md:w-10" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
