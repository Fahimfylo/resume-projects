import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../server/models/Group.js';

export async function GET() {
  try {
    await connectDB();
    const groups = await Group.find()
      .populate('owner', 'gamerTag avatarUrl rank')
      .populate('members', 'gamerTag avatarUrl rank')
      .populate('joinRequests.userId', 'gamerTag avatarUrl rank')
      .populate('moderators', 'gamerTag avatarUrl rank')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, groups });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);

    const { name, description } = await request.json();
    const existing = await Group.findOne({ name });
    if (existing) throw new ApiError(409, 'Group name already taken');

    const group = await Group.create({
      name,
      description,
      owner: user._id,
      members: [user._id],
    });

    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
