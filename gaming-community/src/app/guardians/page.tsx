'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';

export default function GuardiansPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { is } = useRBAC();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!is.staff) { router.push('/dashboard'); return; }
    router.push('/guardians/dashboard');
  }, [user, loading, is.staff, router]);

  return (
    <div className="min-h-screen bg-nexus-void flex items-center justify-center">
      <div className="text-[#ffd700] font-headline text-sm tracking-[0.3em] animate-pulse">
        INITIALIZING GUARDIAN COMMAND...
      </div>
    </div>
  );
}
