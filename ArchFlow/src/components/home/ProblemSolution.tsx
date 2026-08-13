import React from 'react';
import { FileWarning, Hourglass, HelpCircle, LucideIcon, Check } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface ProblemSolution {
  icon: LucideIcon;
  problem: string;
  solution: string;
}

const ITEMS: ProblemSolution[] = [
  {
    icon: FileWarning,
    problem: 'Docs go stale',
    solution: 'ArchFlow re-reads your code every time, so the architecture never drifts from the source.',
  },
  {
    icon: Hourglass,
    problem: 'Onboarding takes weeks',
    solution: 'A codebase turns into an explorable map in minutes — new hires find answers fast.',
  },
  {
    icon: HelpCircle,
    problem: 'Nobody knows why anything connects',
    solution: 'Every edge carries the exact file, line, and code behind it. Ask why, get an answer.',
  },
];

export const ProblemSolution: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <SectionHeading
        kicker="The Problem"
        titleStrong="The pain,"
        titleMuted="and the fix."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.problem}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-panel)] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-2)] bg-[var(--bg-inset)] text-[var(--text-3)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-[var(--text-strong)]">{item.problem}</h3>
              <div className="mt-3 flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" />
                <p className="text-sm leading-relaxed text-[var(--text-3)]">{item.solution}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
