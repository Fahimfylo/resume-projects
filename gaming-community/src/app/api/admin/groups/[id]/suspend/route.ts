import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../../../server/models/Group.js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');
    const { id } = await params;

    const group = await Group.findByIdAndUpdate(id, { isSuspended: true }, { new: true });
    if (!group) throw new ApiError(404, 'Group not found');

    await logAudit(user, 'suspend_group', 'group', group._id, {});
    return NextResponse.json({ success: true, group, message: 'Group suspended' });
  } catch (error) {
    return handleError(error);
  }
}
