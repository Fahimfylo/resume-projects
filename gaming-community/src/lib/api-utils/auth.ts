import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User from '../../../server/models/User.js';
import ApiError from './ApiError';
import { hasPermission, Permission, ROLE_HIERARCHY } from '../rbac';

export async function verifyAccessToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token is required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
    if (!user) throw new ApiError(401, 'User not found');
    return user;
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired');
    }
    throw new ApiError(401, 'Invalid access token');
  }
}

export function requireRole(user: any, ...allowedRoles: string[]) {
  if (!user) throw new ApiError(401, 'Authentication required');

  const userRole = user.role || 'USER';
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;

  const hasMinLevel = allowedRoles.some((role) => {
    const requiredLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;
    return userLevel >= requiredLevel;
  });

  if (!hasMinLevel) {
    throw new ApiError(403, 'Insufficient permissions');
  }

  return true;
}

export function requirePermission(user: any, ...permissions: Permission[]) {
  if (!user) throw new ApiError(401, 'Authentication required');

  const role = user.role || 'USER';
  const hasAll = permissions.every((perm) => hasPermission(role, perm));

  if (!hasAll) {
    throw new ApiError(403, 'Insufficient permissions');
  }

  return true;
}

export async function logAudit(user: any, action: string, targetType: string, targetId: string, details: Record<string, any> = {}) {
  try {
    const AuditLog = (await import('../../../server/models/AuditLog.js')).default;
    await AuditLog.create({
      admin: user._id,
      action,
      targetType,
      targetId: String(targetId || ''),
      details,
    });
  } catch {}
}
