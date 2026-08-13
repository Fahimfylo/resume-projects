export const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'TEAM_LEADER',
  'VERIFIED_CREATOR',
  'PRO_PLAYER',
  'USER',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MODERATOR: 60,
  TEAM_LEADER: 40,
  VERIFIED_CREATOR: 30,
  PRO_PLAYER: 20,
  USER: 10,
};

export const PERMISSIONS = {
  feed: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
  ] as const,
  clans: [
    'clans.browse',
    'clans.join.request',
    'clans.leave',
    'clans.create',
    'clans.edit',
    'clans.manage',
    'clans.delete',
    'clans.join.approve',
    'clans.join.reject',
    'clans.members.add',
    'clans.members.remove',
    'clans.assign-moderator',
    'clans.manage-leadership',
  ] as const,
  moderation: [
    'moderation.review',
    'moderation.approve',
    'moderation.reject',
    'moderation.escalate',
    'moderation.hide',
    'moderation.override',
    'moderation.final-action',
  ] as const,
  tournaments: [
    'tournaments.create',
    'tournaments.publish',
    'tournaments.manage',
    'tournaments.full-control',
  ] as const,
  users: [
    'users.view',
    'users.block',
    'users.unblock',
    'users.remove',
    'users.update',
  ] as const,
  roles: [
    'roles.promote',
    'roles.demote',
    'roles.assign.clan-leader',
    'roles.remove.clan-leader',
  ] as const,
  feed_management: [
    'feed.delete',
    'feed.pin',
    'feed.unpin',
    'feed.block-user',
  ] as const,
  system: [
    'system.settings',
    'system.all',
  ] as const,
} as const;

export type Permission =
  | (typeof PERMISSIONS.feed)[number]
  | (typeof PERMISSIONS.clans)[number]
  | (typeof PERMISSIONS.moderation)[number]
  | (typeof PERMISSIONS.tournaments)[number]
  | (typeof PERMISSIONS.users)[number]
  | (typeof PERMISSIONS.roles)[number]
  | (typeof PERMISSIONS.feed_management)[number]
  | (typeof PERMISSIONS.system)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  USER: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
    'clans.browse',
    'clans.join.request',
    'clans.leave',
  ],

  PRO_PLAYER: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
    'clans.browse',
    'clans.join.request',
    'clans.leave',
  ],

  VERIFIED_CREATOR: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
    'clans.browse',
    'clans.join.request',
    'clans.leave',
  ],

  TEAM_LEADER: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
    'clans.browse',
    'clans.join.request',
    'clans.leave',
    'clans.create',
    'clans.edit',
    'clans.manage',
    'clans.join.approve',
    'clans.join.reject',
    'clans.members.add',
    'clans.members.remove',
  ],

  MODERATOR: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
    'clans.browse',
    'clans.join.request',
    'clans.leave',
    'clans.create',
    'clans.edit',
    'clans.manage',
    'clans.join.approve',
    'clans.join.reject',
    'clans.members.add',
    'clans.members.remove',
    'moderation.review',
    'moderation.approve',
    'moderation.reject',
    'moderation.escalate',
    'moderation.hide',
    'tournaments.create',
    'tournaments.publish',
    'tournaments.manage',
  ],

  ADMIN: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
    'clans.browse',
    'clans.join.request',
    'clans.leave',
    'clans.create',
    'clans.edit',
    'clans.manage',
    'clans.delete',
    'clans.join.approve',
    'clans.join.reject',
    'clans.members.add',
    'clans.members.remove',
    'clans.assign-moderator',
    'clans.manage-leadership',
    'moderation.review',
    'moderation.approve',
    'moderation.reject',
    'moderation.escalate',
    'moderation.hide',
    'moderation.override',
    'moderation.final-action',
    'tournaments.create',
    'tournaments.publish',
    'tournaments.manage',
    'tournaments.full-control',
    'users.view',
    'users.block',
    'users.unblock',
    'users.remove',
    'users.update',
    'roles.promote',
    'roles.demote',
    'roles.assign.clan-leader',
    'roles.remove.clan-leader',
    'feed.delete',
    'feed.pin',
    'feed.unpin',
    'feed.block-user',
    'system.settings',
  ],

  SUPER_ADMIN: [
    'feed.create',
    'feed.comment',
    'feed.react',
    'feed.report',
    'clans.browse',
    'clans.join.request',
    'clans.leave',
    'clans.create',
    'clans.edit',
    'clans.manage',
    'clans.delete',
    'clans.join.approve',
    'clans.join.reject',
    'clans.members.add',
    'clans.members.remove',
    'clans.assign-moderator',
    'clans.manage-leadership',
    'moderation.review',
    'moderation.approve',
    'moderation.reject',
    'moderation.escalate',
    'moderation.hide',
    'moderation.override',
    'moderation.final-action',
    'tournaments.create',
    'tournaments.publish',
    'tournaments.manage',
    'tournaments.full-control',
    'users.view',
    'users.block',
    'users.unblock',
    'users.remove',
    'users.update',
    'roles.promote',
    'roles.demote',
    'roles.assign.clan-leader',
    'roles.remove.clan-leader',
    'feed.delete',
    'feed.pin',
    'feed.unpin',
    'feed.block-user',
    'system.settings',
    'system.all',
  ],
};

export function getPermissionsForRole(role: string): readonly Permission[] {
  return ROLE_PERMISSIONS[role as Role] || ROLE_PERMISSIONS.USER;
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = getPermissionsForRole(role);
  return perms.includes(permission);
}

export function hasMinimumRole(role: string, minimumRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[role as Role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= requiredLevel;
}

export function canAccess(
  role: string,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((perm) => hasPermission(role, perm));
}

export function getAccessibleNavItems(role: string) {
  const items: { section: string; items: { href: string; label: string; permission?: Permission }[] }[] = [];

  items.push({
    section: 'CORE',
    items: [
      { href: '/admin/dashboard', label: 'Overview' },
      { href: '/admin/analytics', label: 'Analytics' },
    ],
  });

  const managementItems: { href: string; label: string; permission?: Permission }[] = [];

  if (hasPermission(role, 'users.view')) {
    managementItems.push({ href: '/admin/users', label: 'Users', permission: 'users.view' });
  }
  if (hasPermission(role, 'moderation.review')) {
    managementItems.push({ href: '/admin/moderation', label: 'Moderation', permission: 'moderation.review' });
  }
  if (hasPermission(role, 'moderation.review')) {
    managementItems.push({ href: '/admin/reports', label: 'Reports', permission: 'moderation.review' });
  }
  if (hasPermission(role, 'clans.manage')) {
    managementItems.push({ href: '/admin/clans', label: 'Clans', permission: 'clans.manage' });
  }
  if (hasPermission(role, 'tournaments.manage')) {
    managementItems.push({ href: '/admin/tournaments', label: 'Tournaments', permission: 'tournaments.manage' });
  }

  if (managementItems.length > 0) {
    items.push({ section: 'MANAGEMENT', items: managementItems });
  }

  const systemItems: { href: string; label: string; permission?: Permission }[] = [];

  systemItems.push({ href: '/admin/ai-center', label: 'AI Center' });
  systemItems.push({ href: '/admin/notifications', label: 'Notifications' });
  if (hasPermission(role, 'system.settings')) {
    systemItems.push({ href: '/admin/feature-flags', label: 'Feature Flags', permission: 'system.settings' });
    systemItems.push({ href: '/admin/logs', label: 'Audit Logs', permission: 'system.settings' });
  }

  items.push({ section: 'SYSTEM', items: systemItems });

  return items;
}
