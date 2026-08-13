import React, { useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { isAuthenticated } from './lib/api';
import { HeaderNav } from './components/layout/HeaderNav';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/overlays/CommandPalette';
import { MenuOverlay } from './components/overlays/MenuOverlay';
import { ToastContainer } from './components/overlays/ToastContainer';
import { ConfirmDialog } from './components/overlays/ConfirmDialog';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { GeneratingPage } from './pages/GeneratingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ProfilePage } from './pages/ProfilePage';

import { API_BASE } from './lib/config';

function ResetPasswordPage() {
  const { navigateTo, addToast } = useApp();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Error', 'Passwords do not match.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Password Reset', 'Your password has been reset. Please sign in.', 'success');
        navigateTo('/sign-in');
      } else {
        addToast('Error', data.message || 'Reset failed.', 'error');
      }
    } catch {
      addToast('Error', 'Failed to reset password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F0EEE8] flex items-center justify-center">
        <p className="text-sm text-neutral-500 font-mono">Invalid reset link.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F0EEE8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl border border-black/10 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black font-display text-neutral-900 tracking-tight uppercase">Reset Password</h2>
          <p className="text-xs text-neutral-500 tracking-wider mt-1.5 uppercase font-mono">Enter your new password</p>
        </div>
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1.5">NEW PASSWORD</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 px-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
              required minLength={8} />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1.5">CONFIRM PASSWORD</label>
            <input type="password" placeholder="••••••••" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 px-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
              required minLength={8} />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.08em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] uppercase py-3 text-center mt-2 gap-1 font-mono tracking-wider disabled:opacity-50">
            {submitting ? 'Resetting...' : 'Reset Password ↗'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MainAppContent() {
  const { currentPath, navigateTo, user, authReady, confirmState, setConfirmState, confirm, logout } = useApp();
  const authed = !!(user || isAuthenticated());

  useEffect(() => {
    if (!authReady) return;

    const isPublicPage = ['/sign-in', '/sign-up', '/reset-password'].includes(currentPath);
    const isProtectedPage = currentPath === '/dashboard' || currentPath.startsWith('/workspace') || currentPath === '/onboarding' || currentPath === '/profile';

    if (authed && isPublicPage) {
      navigateTo('/dashboard');
    } else if (!authed && isProtectedPage) {
      navigateTo('/sign-in');
    }
  }, [authed, currentPath, navigateTo, authReady]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F0EEE8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-mono mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPath === '/generating') {
    return <GeneratingPage />;
  }

  if (currentPath === '/reset-password') {
    return <ResetPasswordPage />;
  }

  const isDashboardOrWorkspace = currentPath === '/dashboard' || currentPath.startsWith('/workspace');

  return (
    <div className="min-h-screen bg-[#F0EEE8] text-[#111111] font-sans flex flex-col selection:bg-neutral-900 selection:text-white">
      <HeaderNav />
      {isDashboardOrWorkspace ? (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-66px)] overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-[#F0EEE8]">
            {currentPath === '/dashboard' ? <DashboardPage /> : <WorkspacePage />}
          </main>
        </div>
      ) : (
        <div className="flex-1">
          {currentPath === '/' && <LandingPage />}
          {currentPath === '/sign-in' && <AuthPage type="sign-in" />}
          {currentPath === '/sign-up' && <AuthPage type="sign-up" />}
          {currentPath === '/onboarding' && <OnboardingPage />}
          {currentPath === '/profile' && <ProfilePage />}
        </div>
      )}
      <CommandPalette />
      <MenuOverlay />
      <ToastContainer />
      <ConfirmDialog state={confirmState} setState={setConfirmState} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
