import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../../../server/models/Group.js';
import User from '../../../../../../../server/models/User.js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const adminUser = await verifyAccessToken(request);
    requireRole(adminUser, 'SUPER_ADMIN');
    const { id } = await params;
    const { newOwnerId } = await request.json();

    const group = await Group.findById(id);
    if (!group) throw new ApiError(404, 'Group not found');

    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) throw new ApiError(404, 'New owner not found');

    if (!group.members.includes(newOwnerId)) {
      group.members.push(newOwnerId);
    }

    group.owner = newOwnerId;
    await group.save();

    await logAudit(adminUser, 'transfer_group', 'group', group._id, { previousOwner: group.owner, newOwner: newOwnerId });
    return NextResponse.json({ success: true, group, message: 'Ownership transferred' });
  } catch (error) {
    return handleError(error);
  }
}
