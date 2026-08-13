import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Message from '../../../../../../server/models/Message.js';
import Group from '../../../../../../server/models/Group.js';
import ApiError from '@/lib/api-utils/ApiError';

export async function GET(request: NextRequest, { params }: { params: Promise<{ clanId: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { clanId } = await params;

    const group = await Group.findById(clanId);
    if (!group) throw new ApiError(404, 'Clan not found');

    const isMember = group.members.some((m: any) => String(m) === String(user._id));
    if (!isMember) throw new ApiError(403, 'You are not a member of this clan');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const since = searchParams.get('since');

    const roomId = `clan_${clanId}`;
    const filter: any = { roomType: 'clan', roomId, isDeleted: false };
    if (since) filter.createdAt = { $gte: new Date(since) };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'gamerTag avatarUrl rank'),
      Message.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      messages: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}
