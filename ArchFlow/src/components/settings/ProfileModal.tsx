import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Camera, User as UserIcon, Save, KeyRound, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError } from '../../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const logout = useAuthStore((s) => s.logout);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [open, user]);

  if (!open || !user) return null;

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await updateAvatar(file);
      toast.success('Avatar updated');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Avatar upload failed.';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        ...(newPassword
          ? { currentPassword, newPassword }
          : {}),
      });
      toast.success(newPassword ? 'Profile and password updated' : 'Profile updated');
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update profile.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onClose();
      toast.success('Logged out');
      navigate('/login', { replace: true });
    }
  };

  const inputCls =
    'w-full rounded-lg border border-[var(--border-3)] bg-[var(--bg-raised)] p-2.5 text-xs text-[var(--text-high)] placeholder-[var(--text-4)] focus:border-[var(--accent-hover)] focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-4)] bg-[var(--bg-overlay)] p-6 text-[var(--text-1)] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-strong)]">Profile</h2>
              <p className="text-xs text-[var(--text-3)]">Manage your account & avatar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-3)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] text-2xl font-black text-[var(--accent-text)]">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload avatar"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-3)] bg-[var(--bg-btn)] text-[var(--text-2)] shadow-lg hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition-all disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1 text-xs text-[var(--text-3)]">
            <div className="font-semibold text-[var(--text-1)]">{user.name}</div>
            <div className="mt-0.5">{user.email}</div>
            <div className="mt-1.5">Click the camera icon to upload a JPEG, PNG, WebP or GIF avatar.</div>
          </div>
        </div>

        {/* Account fields */}
        <div className="space-y-3 border-t border-[var(--border-soft)] pt-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Change password */}
        <div className="space-y-3 border-t border-[var(--border-soft)] pt-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-4)]">
            <KeyRound className="h-3.5 w-3.5" />
            Change Password
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-soft)] pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--border-4)] bg-[var(--bg-btn)] px-4 py-2 font-semibold text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
