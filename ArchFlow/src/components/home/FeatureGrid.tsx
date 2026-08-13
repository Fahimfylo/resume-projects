import React from 'react';
import { NodeCategory } from '../../types';
import { categoryTileConfig } from './categoryTiles';
import { SectionHeading } from './SectionHeading';

interface Feature {
  number: string;
  title: string;
  description: string;
  category: NodeCategory;
}

const FEATURES: Feature[] = [
  {
    number: '01',
    title: 'Interactive Architecture Canvas',
    description: 'Drag, zoom, and explore your real structure like a workflow diagram — not a static diagram.',
    category: 'store',
  },
  {
    number: '02',
    title: 'Evidence-Backed Connections',
    description: 'Every edge shows the exact file, line, and code behind it. No more guessing why things connect.',
    category: 'route',
  },
  {
    number: '03',
    title: 'Root-to-Leaf Drill-Down',
    description: 'Go from system architecture down to a single function without ever losing context.',
    category: 'controller',
  },
  {
    number: '04',
    title: 'AI-Written Summaries',
    description: 'Plain-English explanations for every entity in your codebase — your architecture, explained.',
    category: 'external-api',
  },
  {
    number: '05',
    title: 'Structured Folder Groups',
    description: 'Controllers, models, middleware, and routes, organized the way your editor already organizes them.',
    category: 'db-table',
  },
  {
    number: '06',
    title: 'Re-Analyze Anytime',
    description: 'Keep the map current as your code changes. Fresh upload, fresh architecture.',
    category: 'hook',
  },
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="product" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 md:py-24">
      <SectionHeading
        kicker="The Platform"
        titleStrong="Everything ArchFlow"
        titleMuted="does."
        subtitle="Six Ways to Understand Your Code"
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const config = categoryTileConfig[feature.category];
          const Icon = config.icon;
          return (
            <div
              key={feature.number}
              className="group rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[var(--border-2)] hover:bg-[var(--bg-panel)]"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${config.bg} ${config.border} transition-transform group-hover:scale-105`}
                >
                  <Icon className={`h-5 w-5 ${config.tint}`} />
                </div>
                <span className="font-mono text-xs font-bold text-[var(--text-5)]">
                  {feature.number}
                </span>
              </div>
              <h3 className="mt-5 text-base font-bold text-[var(--text-strong)]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-3)]">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
