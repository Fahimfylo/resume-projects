import React from 'react';

interface SectionHeadingProps {
  kicker: string;
  titleStrong: string;
  titleMuted: string;
  subtitle?: string;
}

/**
 * Shared section header used across the homepage: a tracked-out uppercase
 * kicker, a two-tone headline (leading words in --text-strong, trailing words
 * in muted --text-4), and a right-aligned muted subtitle on the same line.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  kicker,
  titleStrong,
  titleMuted,
  subtitle,
}) => {
  return (
    <div className="mb-10 flex flex-col gap-4 border-b border-[var(--border-soft)] pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-4)]">
          {kicker}
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[var(--text-strong)] md:text-4xl">
          {titleStrong} <span className="text-[var(--text-4)]">{titleMuted}</span>
        </h2>
      </div>
      {subtitle && (
        <div className="shrink-0 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-4)] md:text-right">
          {subtitle}
        </div>
      )}
    </div>
  );
};
