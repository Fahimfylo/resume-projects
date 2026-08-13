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
    const { reason, permanent } = await request.json();

    const user = await User.findByIdAndUpdate(id, { isBanned: true, isSuspended: false, suspensionUntil: null }, { new: true }).select('-passwordHash -refreshToken');
    if (!user) throw new ApiError(404, 'User not found');

    await logAudit(adminUser, 'ban_user', 'user', user._id, { reason, permanent });
    return NextResponse.json({ success: true, user, message: 'User banned' });
  } catch (error) {
    return handleError(error);
  }
}
