import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../../server/models/User.js';
import Post from '../../../../../../server/models/Post.js';
import GameSession from '../../../../../../server/models/GameSession.js';
import Report from '../../../../../../server/models/Report.js';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR');
    const { id } = await params;

    const targetUser = await User.findById(id).select('-passwordHash -refreshToken -__v');
    if (!targetUser) throw new ApiError(404, 'User not found');

    const [sessionCount, reportCount] = await Promise.all([
      GameSession.countDocuments({ userId: targetUser._id }),
      Report.countDocuments({ targetUser: targetUser._id }),
    ]);

    return NextResponse.json({ success: true, user: { ...targetUser.toObject(), sessionCount, reportCount } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN');
    const { id } = await params;

    if (id === String(user._id)) throw new ApiError(400, 'Cannot delete your own account');

    const targetUser = await User.findByIdAndDelete(id);
    if (!targetUser) throw new ApiError(404, 'User not found');

    await Promise.all([
      Post.deleteMany({ userId: targetUser._id }),
      GameSession.deleteMany({ userId: targetUser._id }),
      Report.deleteMany({ $or: [{ reporter: targetUser._id }, { targetUser: targetUser._id }] }),
    ]);

    await logAudit(user, 'delete_user', 'user', targetUser._id, { gamerTag: targetUser.gamerTag });
    return NextResponse.json({ success: true, message: 'User and all associated data deleted' });
  } catch (error) {
    return handleError(error);
  }
}
