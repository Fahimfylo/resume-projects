import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requirePermission } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../../server/models/Group.js';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requirePermission(user, 'clans.join.approve');
    const { id } = await params;

    const group = await Group.findById(id)
      .populate('joinRequests.userId', 'gamerTag email avatarUrl rank level');

    if (!group) throw new ApiError(404, 'Group not found');

    const pendingRequests = group.joinRequests?.filter((r: any) => r.status === 'pending') || [];

    return NextResponse.json({ success: true, requests: pendingRequests });
  } catch (error) {
    return handleError(error);
  }
}
