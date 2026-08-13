import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  useEffect(() => {
    if (status === 'idle') useAuthStore.getState().init();
  }, [status]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-app)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--text-strong)] shadow-lg shadow-indigo-600/30">
            <Boxes className="h-6 w-6" />
          </div>
          <div className="text-xs font-semibold text-[var(--text-3)]">Loading ArchFlow...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
