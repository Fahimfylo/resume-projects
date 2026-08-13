import { useAuth, User } from './auth-context';
import {
  hasPermission,
  hasMinimumRole,
  canAccess,
  getPermissionsForRole,
  Permission,
  Role,
  ROLE_HIERARCHY,
} from './rbac';

export function useRBAC() {
  const { user, loading } = useAuth();

  const role: string = user?.role || 'USER';
  const hierarchyLevel: number = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;

  const is = {
    user: role === 'USER' || hierarchyLevel < 40,
    moderator: hierarchyLevel >= 60 && hierarchyLevel < 80,
    admin: hierarchyLevel >= 80 && hierarchyLevel < 100,
    superAdmin: hierarchyLevel >= 100,
    staff: hierarchyLevel >= 60,
  };

  function can(permission: Permission): boolean {
    return hasPermission(role, permission);
  }

  function canAll(...permissions: Permission[]): boolean {
    return canAccess(role, permissions);
  }

  function isAtLeast(minimumRole: Role): boolean {
    return hasMinimumRole(role, minimumRole);
  }

  const permissions = getPermissionsForRole(role);

  return {
    user,
    loading,
    role,
    hierarchyLevel,
    is,
    can,
    canAll,
    isAtLeast,
    permissions,
  };
}

export function usePermission(permission: Permission): boolean {
  const { can } = useRBAC();
  return can(permission);
}

export function useRoleGuard(minimumRole: Role): { allowed: boolean; loading: boolean } {
  const { user, loading } = useAuth();
  const allowed = user ? hasMinimumRole(user.role, minimumRole) : false;
  return { allowed, loading };
}
