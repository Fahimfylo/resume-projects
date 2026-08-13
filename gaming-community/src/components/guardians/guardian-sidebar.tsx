'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Users, ShieldAlert, Flag, Swords, Trophy, Bell, BrainCircuit,
  BarChart3, ToggleLeft, ScrollText, ChevronLeft, Menu, X, Shield,
  Fingerprint, Eye, Gavel,
} from 'lucide-react';
import { useRBAC } from '@/lib/useRBAC';
import { RoleBadge } from '@/components/rbac/PermissionGate';

export function GuardianSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, permissions } = useRBAC();

  const sections: { section: string; items: { href: string; label: string; icon: any }[] }[] = [];

  sections.push({
    section: 'CORE',
    items: [
      { href: '/guardians/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/guardians/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  });

  const managementItems: { href: string; label: string; icon: any }[] = [];

  if (permissions.includes('users.view')) {
    managementItems.push({ href: '/guardians/users', label: 'Users', icon: Users });
  }
  if (permissions.includes('moderation.review')) {
    managementItems.push({ href: '/guardians/moderation', label: 'Moderation', icon: Eye });
    managementItems.push({ href: '/guardians/reports', label: 'Reports', icon: Flag });
  }
  if (permissions.includes('clans.manage')) {
    managementItems.push({ href: '/guardians/clans', label: 'Clans', icon: Swords });
  }
  if (permissions.includes('tournaments.manage')) {
    managementItems.push({ href: '/guardians/tournaments', label: 'Tournaments', icon: Trophy });
  }

  if (managementItems.length > 0) {
    sections.push({ section: 'MANAGEMENT', items: managementItems });
  }

  const systemItems: { href: string; label: string; icon: any }[] = [];
  systemItems.push({ href: '/guardians/ai-center', label: 'AI Center', icon: BrainCircuit });
  systemItems.push({ href: '/guardians/notifications', label: 'Notifications', icon: Bell });
  if (permissions.includes('system.settings')) {
    systemItems.push({ href: '/guardians/feature-flags', label: 'Feature Flags', icon: ToggleLeft });
    systemItems.push({ href: '/guardians/logs', label: 'Audit Logs', icon: ScrollText });
  }

  sections.push({ section: 'SYSTEM', items: systemItems });

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[60] lg:hidden bg-nexus-carbon/80 backdrop-blur-md border border-white/10 p-2 rounded-none"
      >
        <Menu className="w-5 h-5 text-nexus-gold" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        className={`fixed top-0 left-0 z-[60] h-screen bg-nexus-carbon/95 backdrop-blur-xl border-r border-white/10 overflow-hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          <Link href="/guardians/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d4a017, #ffd700)' }}>
              <Shield className="text-nexus-void w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-headline text-lg font-black tracking-tighter text-white">
                <span style={{ color: '#ffd700' }}>G</span>UARDIANS
              </span>
            )}
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setMobileOpen(false); }}
              className="lg:hidden p-1 hover:bg-white/5 rounded-sm"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-1 hover:bg-white/5 rounded-sm"
            >
              <ChevronLeft className={`w-4 h-4 text-white/60 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          {!collapsed && <RoleBadge role={role} />}
        </div>

        <div className="overflow-y-auto h-[calc(100vh-64px)] scrollbar-hide p-3 space-y-6">
          {sections.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <div className="text-[10px] font-ui text-white/30 tracking-[0.3em] px-3 mb-2 uppercase">
                  {section.section}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-ui transition-all rounded-sm group ${
                        isActive
                          ? 'bg-[#ffd700]/10 text-[#ffd700] border-l-2 border-[#ffd700]'
                          : 'text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ffd700]' : ''}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-ui text-white/40 hover:text-nexus-teal transition-colors"
            >
              <Fingerprint className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Back to HUD</span>}
            </Link>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
