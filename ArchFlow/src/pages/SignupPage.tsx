import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthLayout, AuthField, AuthLink } from './AuthLayout';
import { ApiError } from '../api/client';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const signup = useAuthStore((s) => s.signup);
  const status = useAuthStore((s) => s.status);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/workspaces';

  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true });
  }, [status, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      toast.success('Account created — welcome to ArchFlow!');
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Signup failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to start mapping your architecture"
      footer={
        <>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        <AuthField
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Ada Lovelace"
          autoComplete="name"
        />
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={submitting || !name.trim() || !email.trim() || !password || !confirm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--text-strong)] shadow-lg shadow-indigo-600/30 hover:bg-[var(--accent-hover)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
};
