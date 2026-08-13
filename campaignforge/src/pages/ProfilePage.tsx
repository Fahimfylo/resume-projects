import React, { useState, useRef } from 'react';
import { useApp } from '../context/useApp';
import { api, storeUser, uploadFile, clearUser } from '../lib/api';
import type { StoredUser } from '../lib/api';
import { ArrowLeft, Camera, Check, Loader2, Trash2 } from 'lucide-react';

export function ProfilePage() {
  const { user, setUser, navigateTo, addToast, confirm } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const initials = (user?.name || user?.email || 'U')
    .split(/[.\s_]/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('File Too Large', 'Avatar must be under 2MB.', 'error');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      addToast('Invalid File', 'Only JPEG, PNG, GIF, and WebP images are allowed.', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const data = await uploadFile<{ url: string }>('/upload/avatar', formData);
      setAvatarUrl(data.url);
      setAvatarError(false);
      if (user) {
        const synced: StoredUser = { ...user, id: user.id || (user as any)._id || '', avatarUrl: data.url };
        storeUser(synced);
        setUser(synced);
      }
    } catch (err: any) {
      addToast('Upload Failed', err?.message || 'Could not upload image.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.patch<any>('/auth/me', {
        name: name.trim() || undefined,
        businessName: businessName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || null,
      });
      const updated: StoredUser = {
        id: data._id || data.id,
        email: data.email || user?.email || '',
        name: data.name,
        businessName: data.businessName,
        avatarUrl: data.avatarUrl,
      };
      storeUser(updated);
      setUser(updated);
      addToast('Profile Updated', 'Your profile has been saved successfully.', 'success');
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F0EEE8] px-4 py-8 md:py-16">
      <div className="max-w-[580px] mx-auto space-y-6">
        <button onClick={() => navigateTo('/dashboard')}
          className="inline-flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors uppercase cursor-pointer">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 md:p-12 rounded-2xl border border-black/10 shadow-xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black font-display text-neutral-900 tracking-tight uppercase">Profile</h2>
            <p className="text-xs text-neutral-500 tracking-wider mt-1.5 uppercase font-mono">Manage your account settings</p>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                {avatarUrl && !avatarError ? (
                  <img src={avatarUrl} alt=""
                    className="w-20 h-20 rounded-full object-cover border-2 border-black/10"
                    onError={() => setAvatarError(true)} />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-black/10 flex items-center justify-center text-xl font-black text-neutral-800 border-2 border-black/10">
                    {initials}
                  </div>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center cursor-pointer hover:bg-neutral-700 transition-colors shadow-md border-2 border-[#F0EEE8] disabled:opacity-50">
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                </button>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 font-bold uppercase">
                {uploading ? 'Uploading...' : 'Profile Photo'}
              </span>
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handleFileSelect} className="hidden" />
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1.5">Email</label>
                <input type="email" value={user?.email || ''} disabled
                  className="w-full bg-[#1A1A1A]/4 border border-black/10 rounded-lg h-11 px-3.5 text-sm text-neutral-500 outline-none cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1.5">Display Name</label>
                <input type="text" placeholder="Your name" value={name}
                  onChange={(e) => setName(e.target.value)} maxLength={100}
                  className="w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 px-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1.5">Business Name</label>
                <input type="text" placeholder="Your business or agency name" value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)} maxLength={100}
                  className="w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 px-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <button type="button" onClick={() => navigateTo('/dashboard')}
                className="rounded-[9999px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] px-6 py-2.5 cursor-pointer hover:bg-black/5 transition-all font-mono tracking-wider uppercase">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs px-6 py-2.5 cursor-pointer hover:bg-[#333333] hover:translate-y-[-1px] transition-all disabled:opacity-50 font-mono tracking-wider uppercase">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 md:p-12 rounded-2xl border border-black/10 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-black font-display text-rose-800 tracking-tight uppercase">Danger Zone</h2>
            <p className="text-xs text-neutral-500 tracking-wider mt-1 uppercase font-mono">Irreversible action — proceed with caution</p>
          </div>
          <p className="text-xs text-neutral-600 text-center leading-relaxed mb-6 max-w-md mx-auto">
            Deleting your account will permanently remove all your workspaces, tasks, content, and calendar data. This cannot be undone.
          </p>
          <div className="flex justify-center">
            <button type="button"
              onClick={() => confirm({
                title: 'Delete Account',
                message: 'This will permanently delete your account and all associated data. This action cannot be undone.',
                confirmLabel: 'Delete My Account',
                destructive: true,
                onConfirm: async () => {
                  try {
                    await api.delete('/auth/me');
                    clearUser();
                    window.location.href = '/';
                  } catch (err: any) {
                    addToast('Error', err?.message || 'Failed to delete account', 'error');
                  }
                },
              })}
              className="inline-flex items-center gap-2 rounded-[9999px] bg-transparent border border-rose-800/30 text-rose-800 font-semibold text-xs px-6 py-2.5 cursor-pointer hover:bg-rose-800 hover:text-white hover:border-rose-800 transition-all duration-300 font-mono tracking-wider uppercase active:scale-95">
              <Trash2 size={14} /> Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
