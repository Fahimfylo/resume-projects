import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const AuthLayout: React.FC<Props> = ({ title, subtitle, children, footer }) => {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[var(--bg-app)] p-4 text-[var(--text-1)] select-none overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--accent)] opacity-5 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--text-strong)] shadow-lg shadow-indigo-600/40">
            <Boxes className="h-6 w-6" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight text-[var(--text-strong)]">ArchFlow</div>
            <div className="mt-1 text-xs text-[var(--text-3)]">Visual architecture maps for real codebases</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 shadow-2xl space-y-5">
          <div>
            <h1 className="text-lg font-bold text-[var(--text-strong)]">{title}</h1>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-4)]">{footer}</p>
      </div>
    </div>
  );
};

export const AuthField: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}> = ({ label, type = 'text', value, onChange, placeholder, autoComplete }) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-sm text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none"
      />
    </div>
  );
};

export const AuthLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="font-semibold text-[var(--accent-text)] hover:text-[var(--accent-text-soft)] transition-colors">
    {children}
  </Link>
);
