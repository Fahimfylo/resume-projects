import React from 'react';
import { SectionHeading } from './SectionHeading';

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: '7', label: 'Languages & Frameworks Supported' },
  { value: '4', label: 'Abstraction Levels' },
  { value: '100%', label: 'Evidence-Backed Connections' },
  { value: '<5 MIN', label: 'Analysis Time, Mid-Size Repo' },
];

export const StatsBand: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <SectionHeading
        kicker="Live Statistics"
        titleStrong="Product capability,"
        titleMuted="not promises."
        subtitle="Why It Matters"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-6 py-8 text-center transition-colors hover:border-[var(--border-2)]"
          >
            <div className="text-4xl font-black tracking-tight text-[var(--text-strong)] md:text-5xl">
              {stat.value}
            </div>
            <div className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
