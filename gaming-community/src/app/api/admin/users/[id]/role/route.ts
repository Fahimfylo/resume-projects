import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../../../server/models/User.js';

const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'TEAM_LEADER', 'VERIFIED_CREATOR', 'PRO_PLAYER', 'USER'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const adminUser = await verifyAccessToken(request);
    requireRole(adminUser, 'SUPER_ADMIN', 'ADMIN');
    const { id } = await params;
    const { role } = await request.json();

    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    if (role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admins can assign Super Admin role');
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-passwordHash -refreshToken');
    if (!user) throw new ApiError(404, 'User not found');

    await logAudit(adminUser, 'update_role', 'user', user._id, { previousRole: user.role, newRole: role });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleError(error);
  }
}
