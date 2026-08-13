import React, { useState } from 'react';
import { useApp } from '../context/useApp';
import { AuthType } from '../types';
import { Input } from '../components/ui/Input';

import { API_BASE } from '../lib/config';

interface AuthPageProps {
  type: AuthType;
}

export function AuthPage({ type }: AuthPageProps) {
  const { navigateTo, addToast, login, register, loading } = useApp();
  const [authType, setAuthType] = useState<AuthType>(type);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { addToast('Error', 'Please input a valid email address.', 'error'); return; }
    if (!password) { addToast('Error', 'Please enter your password.', 'error'); return; }
    try {
      if (authType === 'sign-in') {
        await login(email, password);
        addToast('Signed In Successfully', `Welcome back to your campaign control center, ${email.split('@')[0]}!`, 'success');
        navigateTo('/dashboard');
      } else {
        if (!businessName) { addToast('Error', 'Please enter your business name.', 'error'); return; }
        await register(email, password, businessName, 'Services', name);
        addToast('Account Created', 'Welcome to Momentum!', 'success');
        navigateTo('/dashboard');
      }
    } catch (err: any) {
      const fieldErrors = err.errors ? Object.values(err.errors).flat().join(', ') : '';
      const message = fieldErrors || err.message || 'Please check your credentials.';
      addToast('Authentication Failed', message, 'error');
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { addToast('Error', 'Please enter your email address.', 'error'); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Email Sent', 'If that email is registered, a reset link has been sent.', 'success');
        setShowForgotPassword(false);
      } else {
        addToast('Error', data.message || 'Something went wrong.', 'error');
      }
    } catch {
      addToast('Error', 'Failed to send reset email. Please try again.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#F0EEE8] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl border border-black/10 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black font-display text-neutral-900 tracking-tight uppercase">Reset Password</h2>
            <p className="text-xs text-neutral-500 tracking-wider mt-1.5 uppercase font-mono">
              Enter your email and we'll send you a reset link
            </p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <Input label="EMAIL ADDRESS" type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} id="reset-email" required />
            <button type="submit" disabled={forgotLoading}
              className="w-full inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.08em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] uppercase py-3 text-center mt-2 gap-1 font-mono tracking-wider disabled:opacity-50">
              {forgotLoading ? 'Sending...' : 'Send Reset Link ↗'}
            </button>
          </form>
          <div className="text-center mt-6">
            <button onClick={() => setShowForgotPassword(false)}
              className="text-xs text-neutral-500 hover:text-black transition-all">
              <span className="font-bold underline text-neutral-800">Back to sign in →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F0EEE8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl border border-black/10 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black font-display text-neutral-900 tracking-tight uppercase">MOMENTUM</h2>
          <p className="text-xs text-neutral-500 tracking-wider mt-1.5 uppercase font-mono">
            {authType === 'sign-in' ? 'Sign in to your workspace' : 'Create your campaign credentials'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {authType === 'sign-up' && (
            <>
              <Input label="YOUR NAME" type="text" placeholder="Tahmid Aalim" value={name} onChange={(e) => setName(e.target.value)} id="auth-name" />
              <Input label="BUSINESS / PROJECT NAME" type="text" placeholder="Aalim Specialty Coffee" value={businessName} onChange={(e) => setBusinessName(e.target.value)} id="auth-business-name" />
            </>
          )}
          <Input label="EMAIL ADDRESS" type="email" placeholder="tahmid@aalim.design" value={email} onChange={(e) => setEmail(e.target.value)} id="auth-email" required />
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">PASSWORD</label>
              {authType === 'sign-in' && (
                <button type="button" onClick={() => setShowForgotPassword(true)}
                  className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 hover:text-black hover:underline">Forgot password?</button>
              )}
            </div>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 px-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all" id="auth-password" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-xs tracking-[0.08em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] uppercase py-3 text-center mt-2 gap-1 font-mono tracking-wider disabled:opacity-50">
            {loading ? 'Processing...' : authType === 'sign-in' ? 'Sign in ↗' : 'Generate account ↗'}
          </button>
        </form>
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5" /></div>
          <span className="relative bg-[#F0EEE8] px-3 text-[10px] font-mono text-neutral-400 uppercase tracking-widest">or</span>
        </div>
        <button onClick={handleGoogleAuth} disabled={loading}
          className="w-full h-11 border border-black/10 rounded-lg flex items-center justify-center gap-2.5 bg-black/4 hover:bg-black/8 text-xs font-semibold tracking-tight text-neutral-800 cursor-pointer transition-all disabled:opacity-50">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        <div className="text-center mt-6">
          <button onClick={() => navigateTo(authType === 'sign-in' ? '/sign-up' : '/sign-in')} disabled={loading}
            className="text-xs text-neutral-500 hover:text-black transition-all">
            {authType === 'sign-in' ? <>Don't have an account? <span className="font-bold underline text-neutral-800">Sign up →</span></>
              : <>Already have an account? <span className="font-bold underline text-neutral-800">Sign in →</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
