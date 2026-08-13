import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Menu, X, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const HomeNav: React.FC = () => {
  const status = useAuthStore((s) => s.status);
  const isAuthed = status === 'authenticated';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled || menuOpen
          ? 'border-b border-[var(--border-soft)] bg-[var(--bg-app)]/90 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--text-strong)] shadow-lg shadow-indigo-600/30">
            <Boxes className="h-5 w-5" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-[var(--text-strong)]">
            ArchFlow
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase text-[var(--accent-text)]">
            v1.0
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthed ? (
            <Link
              to="/workspaces"
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all hover:bg-[var(--accent-hover)]"
            >
              <span>Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text-high)]"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 transition-all hover:bg-[var(--accent-hover)]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-2 text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)] md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[var(--border-soft)] bg-[var(--bg-app)] px-6 pb-6 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-high)]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border-soft)] pt-4">
            {isAuthed ? (
              <Link
                to="/workspaces"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--text-strong)] transition-all hover:bg-[var(--accent-hover)]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-[var(--border-3)] bg-[var(--bg-inset)] px-4 py-2.5 text-center text-sm font-bold text-[var(--text-2)] transition-colors hover:bg-[var(--bg-hover)]"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-bold text-[var(--text-strong)] transition-all hover:bg-[var(--accent-hover)]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
