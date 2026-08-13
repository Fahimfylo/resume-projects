import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { api, ApiError } from '../../api/client';

interface AnalysisStatus {
  jobId?: string;
  status: string;
  progress: number;
  currentStep: string;
  error: string | null;
}

const POLL_MS = 2000;

export const AnalysisOverlay: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [dismissedJobId, setDismissedJobId] = useState<string | null>(null);

  useEffect(() => {
    setStatus(null);
    let active = true;
    let first = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      let snap: AnalysisStatus | null = null;
      try {
        snap = await api.get<AnalysisStatus>(`/projects/${projectId}/analysis/status`);
      } catch (err) {
        if (!(err instanceof ApiError)) return;
      }
      if (!active) return;

      if (!snap) {
        setStatus(null);
        return;
      }

      if (first && (snap.status === 'idle' || snap.status === 'completed')) {
        first = false;
        setStatus(null);
        return;
      }
      first = false;

      // A previously dismissed failure must not reappear on later polls.
      if (snap.status === 'failed' && snap.jobId && snap.jobId === dismissedJobId) {
        setStatus(null);
        return;
      }

      setStatus(snap);

      if (snap.status === 'completed') {
        if (interval) clearInterval(interval);
        await useCanvasStore.getState().resetToRoot();
        hideTimer = setTimeout(() => {
          if (active) setStatus(null);
        }, 1500);
      }
    };

    poll();
    interval = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      if (interval) clearInterval(interval);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [projectId, dismissedJobId]);

  if (!status || status.status === 'idle') return null;

  const busy = status.status === 'queued' || status.status === 'starting' || status.status === 'running';
  const failed = status.status === 'failed';
  const progress = Math.max(0, Math.min(100, status.progress || 0));

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-app)]/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 shadow-2xl space-y-4">
        {failed && status.jobId && (
          <button
            onClick={() => setDismissedJobId(status.jobId || null)}
            title="Dismiss"
            className="absolute right-3 top-3 rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-3">
          {failed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <XCircle className="h-5 w-5" />
            </div>
          ) : busy ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-strong)]">
              {failed ? 'Analysis failed' : busy ? 'Analyzing codebase' : 'Analysis complete'}
            </h3>
            <p className="text-xs text-[var(--text-3)] capitalize">{status.currentStep || '…'}</p>
          </div>
        </div>

        {failed ? (
          <p className="text-xs text-rose-400 break-words">{status.error || 'Something went wrong during analysis.'}</p>
        ) : (
          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover-strong)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-[var(--text-3)]">
              <span>Parsing with ts-morph AST</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
