'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { is } = useRBAC();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!is.staff) { router.push('/dashboard'); return; }
    router.push('/admin/dashboard');
  }, [user, loading, is.staff, router]);

  return (
    <div className="min-h-screen bg-nexus-void flex items-center justify-center">
      <div className="text-nexus-jade font-headline text-sm tracking-[0.3em] animate-pulse">
        INITIALIZING COMMAND CENTER...
      </div>
    </div>
  );
}
