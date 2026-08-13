import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../server/models/Group.js';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const group = await Group.findById(id)
      .populate('owner', 'gamerTag avatarUrl rank')
      .populate('members', 'gamerTag avatarUrl rank')
      .populate('joinRequests.userId', 'gamerTag avatarUrl rank level')
      .populate('moderators', 'gamerTag avatarUrl rank');

    if (!group) throw new ApiError(404, 'Group not found');
    return NextResponse.json({ success: true, group });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    const group = await Group.findOne({ _id: id, owner: user._id });
    if (!group) throw new ApiError(404, 'Group not found or not authorized');

    await Group.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    return handleError(error);
  }
}
