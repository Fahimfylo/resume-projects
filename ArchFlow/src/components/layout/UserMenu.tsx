import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronDown, UserRound, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { ProfileModal } from '../settings/ProfileModal';

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!user) return null;

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
      toast.success('Logged out');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 pr-1.5 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition-colors"
        title="Account"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[11px] font-black text-[var(--accent-text)]">
          {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : initials}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 overflow-hidden rounded-xl border border-[var(--border-4)] bg-[var(--bg-overlay)] text-[var(--text-1)] shadow-2xl">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-raised)] px-3.5 py-3">
            <div className="truncate text-xs font-bold text-[var(--text-strong)]">{user.name}</div>
            <div className="truncate text-[11px] text-[var(--text-3)]">{user.email}</div>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              setProfileOpen(true);
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)] transition-colors"
          >
            <UserRound className="h-4 w-4 text-[var(--accent-text)]" />
            Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-[var(--border-soft)] px-3.5 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      )}

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};
