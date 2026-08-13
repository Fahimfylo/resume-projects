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

    if (group.owner.toString() === user._id.toString()) {
      throw new ApiError(403, 'Owner cannot leave. Transfer ownership or delete the group.');
    }

    group.members = group.members.filter((m: any) => m.toString() !== user._id.toString());
    await group.save();

    return NextResponse.json({ success: true, message: 'Left group', group });
  } catch (error) {
    return handleError(error);
  }
}
