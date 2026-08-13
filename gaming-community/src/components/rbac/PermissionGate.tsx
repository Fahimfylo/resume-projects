'use client';

import { ReactNode } from 'react';
import { useRBAC } from '@/lib/useRBAC';
import { Permission, Role } from '@/lib/rbac';

interface PermissionGateProps {
  permission?: Permission;
  minRole?: Role;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, minRole, fallback = null, children }: PermissionGateProps) {
  const { can, isAtLeast } = useRBAC();

  if (permission && !can(permission)) return fallback;
  if (minRole && !isAtLeast(minRole)) return fallback;

  return <>{children}</>;
}

interface RoleBadgeProps {
  role: string;
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'text-red-400 border-red-400/30 bg-red-400/10',
  ADMIN: 'text-nexus-purple border-nexus-purple/30 bg-nexus-purple/10',
  MODERATOR: 'text-nexus-teal border-nexus-teal/30 bg-nexus-teal/10',
  TEAM_LEADER: 'text-nexus-gold border-nexus-gold/30 bg-nexus-gold/10',
  VERIFIED_CREATOR: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  PRO_PLAYER: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  USER: 'text-white/50 border-white/10 bg-white/5',
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-ui uppercase tracking-wider border ${ROLE_COLORS[role] || ROLE_COLORS.USER}`}>
      {role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : role}
    </span>
  );
}
