import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { HeroCanvas } from './HeroCanvas';

export const HomeHero: React.FC = () => {
  const status = useAuthStore((s) => s.status);
  const isAuthed = status === 'authenticated';

  const primaryLabel = isAuthed ? 'Go to Dashboard' : 'Get Started Free';
  const primaryHref = isAuthed ? '/workspaces' : '/signup';

  return (
    <section className="relative overflow-hidden">
      {/* Ambient accent glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--accent-bg)] blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--accent-text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-text)]" />
            Codebase Intelligence
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-[var(--text-strong)] md:text-6xl">
            See your codebase <span className="text-[var(--text-4)]">the way it's built.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-[var(--text-3)] md:text-lg">
            Drop in a codebase — get an interactive architecture map out, with every
            connection explained by real evidence, not guesswork.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primaryHref}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all hover:bg-[var(--accent-hover)]"
            >
              <span>{primaryLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#live-canvas"
              className="flex items-center gap-2 rounded-xl border border-[var(--border-3)] bg-[var(--bg-inset)] px-6 py-3 text-sm font-bold text-[var(--text-2)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)]"
            >
              <Play className="h-4 w-4" />
              See a live example
            </a>
          </div>
        </div>

        {/* Live canvas demo */}
        <div id="live-canvas" className="relative mt-16">
          <div className="relative h-[420px] overflow-hidden rounded-2xl border border-[var(--border-2)] bg-[var(--bg-canvas)] shadow-2xl md:h-[520px]">
            <HeroCanvas />

            {/* Live badge */}
            <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--bg-overlay)]/90 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--accent-text)] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live · NEXUS Web Platform
            </div>

            {/* Soft edge fade so the canvas blends into the page */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[var(--bg-app)]/60 to-transparent" />
          </div>

          <p className="mt-4 text-center text-xs text-[var(--text-4)]">
            The NEXUS Web Platform — a real system-level map rendered with the actual ArchFlow canvas.
          </p>
        </div>
      </div>
    </section>
  );
};
