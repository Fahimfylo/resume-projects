import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requirePermission, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../../../../server/models/Group.js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requirePermission(user, 'clans.join.reject');
    const { id, requestId } = await params;

    const group = await Group.findById(id);
    if (!group) throw new ApiError(404, 'Group not found');

    const joinRequest = group.joinRequests?.id(requestId);
    if (!joinRequest) throw new ApiError(404, 'Join request not found');
    if (joinRequest.status !== 'pending') throw new ApiError(400, 'Request already processed');

    joinRequest.status = 'rejected';
    joinRequest.reviewedBy = user._id;
    joinRequest.reviewedAt = new Date();

    await group.save();

    await logAudit(user, 'reject_join_request', 'group', id, {
      userId: joinRequest.userId,
      groupName: group.name,
    });

    return NextResponse.json({ success: true, message: 'Join request rejected' });
  } catch (error) {
    return handleError(error);
  }
}
