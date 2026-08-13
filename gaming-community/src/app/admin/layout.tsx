'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';

const ADMIN_TO_GUARDIAN: Record<string, string> = {
  '/admin': '/guardians',
  '/admin/dashboard': '/guardians/dashboard',
  '/admin/analytics': '/guardians/analytics',
  '/admin/users': '/guardians/users',
  '/admin/moderation': '/guardians/moderation',
  '/admin/reports': '/guardians/reports',
  '/admin/clans': '/guardians/clans',
  '/admin/tournaments': '/guardians/tournaments',
  '/admin/ai-center': '/guardians/ai-center',
  '/admin/notifications': '/guardians/notifications',
  '/admin/feature-flags': '/guardians/feature-flags',
  '/admin/logs': '/guardians/logs',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { is } = useRBAC();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    const guardianPath = ADMIN_TO_GUARDIAN[pathname];
    if (guardianPath) {
      router.replace(guardianPath);
    }
  }, [user, loading, is.staff, router, pathname]);

  return (
    <div className="min-h-screen bg-nexus-void flex items-center justify-center">
      <div className="text-[#ffd700] font-headline text-sm tracking-[0.3em] animate-pulse">
        REDIRECTING TO GUARDIAN COMMAND...
      </div>
    </div>
  );
}
