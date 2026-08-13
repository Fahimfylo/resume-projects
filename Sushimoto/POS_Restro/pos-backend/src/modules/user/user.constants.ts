export const Roles = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CHEF: 'chef',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  DELIVERY: 'delivery',
  CUSTOMER: 'customer',
} as const;

export const STAFF_ROLES: Role[] = [
  Roles.SUPERADMIN,
  Roles.ADMIN,
  Roles.MANAGER,
  Roles.CHEF,
  Roles.CASHIER,
  Roles.WAITER,
  Roles.DELIVERY,
];

export type Role = (typeof Roles)[keyof typeof Roles];

export const ROLES: Role[] = Object.values(Roles);

export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
} as const;
