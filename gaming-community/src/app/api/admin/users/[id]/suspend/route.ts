import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../../../server/models/User.js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const adminUser = await verifyAccessToken(request);
    requireRole(adminUser, 'SUPER_ADMIN', 'ADMIN');
    const { id } = await params;
    const { days, reason } = await request.json();

    const suspensionUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(id, { isSuspended: true, suspensionUntil, isBanned: false }, { new: true }).select('-passwordHash -refreshToken');
    if (!user) throw new ApiError(404, 'User not found');

    await logAudit(adminUser, 'suspend_user', 'user', user._id, { days, reason, suspensionUntil });
    return NextResponse.json({ success: true, user, message: `User suspended for ${days} day(s)` });
  } catch (error) {
    return handleError(error);
  }
}
