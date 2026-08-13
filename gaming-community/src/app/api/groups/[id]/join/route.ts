import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../../server/models/Group.js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    const group = await Group.findById(id);
    if (!group) throw new ApiError(404, 'Group not found');

    if (group.members.includes(user._id)) throw new ApiError(409, 'Already a member');

    const existingRequest = group.joinRequests?.find(
      (r: any) => r.userId.toString() === user._id.toString() && r.status === 'pending'
    );
    if (existingRequest) throw new ApiError(409, 'Join request already pending');

    if (!group.joinRequests) group.joinRequests = [];
    group.joinRequests.push({
      userId: user._id,
      status: 'pending',
      requestedAt: new Date(),
    });
    await group.save();

    return NextResponse.json({ success: true, message: 'Join request submitted for review' });
  } catch (error) {
    return handleError(error);
  }
}
