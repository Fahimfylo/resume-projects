import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export const ConfirmDialog: React.FC = () => {
  const confirm = useUIStore((s) => s.confirm);
  const closeConfirm = useUIStore((s) => s.closeConfirm);

  if (!confirm.open) return null;

  const handleConfirm = async () => {
    const fn = confirm.onConfirm;
    closeConfirm();
    try {
      if (fn) await fn();
    } catch {
      // Error is surfaced through the store's apiError banner.
    }
  };

  const isDanger = confirm.variant !== 'default';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 text-[var(--text-high)] shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isDanger
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  : 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]'
              }`}
            >
              {isDanger ? <AlertTriangle className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-strong)]">{confirm.title}</h2>
            </div>
          </div>
          <button
            onClick={closeConfirm}
            className="rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-[var(--text-2)] whitespace-pre-line">{confirm.message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={closeConfirm}
            className="rounded-lg border border-[var(--border-4)] bg-[var(--bg-btn)] px-4 py-2 font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)]"
          >
            {confirm.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 font-semibold text-white shadow-lg transition-all ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-indigo-600/30 text-[var(--text-strong)]'
            }`}
          >
            {confirm.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
