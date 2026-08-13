'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { GuardianSidebar } from '@/components/guardians/guardian-sidebar';

export default function GuardiansLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { is } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!is.staff) { router.push('/dashboard'); return; }
  }, [user, loading, is.staff, router]);

  if (loading || !user || !is.staff) {
    return (
      <div className="min-h-screen bg-nexus-void flex items-center justify-center">
        <div className="text-[#ffd700] font-headline text-sm tracking-[0.3em] animate-pulse">
          AUTHORIZING GUARDIAN ACCESS...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-void">
      <GuardianSidebar />
      <main className="lg:pl-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
