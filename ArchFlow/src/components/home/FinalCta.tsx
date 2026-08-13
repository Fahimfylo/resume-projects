import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const FinalCta: React.FC = () => {
  const status = useAuthStore((s) => s.status);
  const isAuthed = status === 'authenticated';

  const primaryLabel = isAuthed ? 'Go to Dashboard' : 'Get Started Free';
  const primaryHref = isAuthed ? '/workspaces' : '/signup';

  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 md:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-6 py-16 text-center md:py-20">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--accent-bg)] blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--bg-overlay)]/60 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--accent-text)]">
            <Sparkles className="h-3.5 w-3.5" />
            Free while in beta
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[var(--text-strong)] md:text-5xl">
            Your codebase has a story. <span className="text-[var(--text-4)]">Read it.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm text-[var(--text-3)] md:text-base">
            No credit card required during beta. Upload a codebase, get your architecture map,
            and start asking "why" about every connection.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primaryHref}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all hover:bg-[var(--accent-hover)]"
            >
              <span>{primaryLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-[var(--border-3)] bg-[var(--bg-inset)] px-6 py-3 text-sm font-bold text-[var(--text-2)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)]"
            >
              I have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
