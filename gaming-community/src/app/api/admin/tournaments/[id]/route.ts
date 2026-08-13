import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Tournament from '../../../../../../server/models/Tournament.js';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');
    const { id } = await params;
    const body = await request.json();

    const tournament = await Tournament.findByIdAndUpdate(id, body, { new: true });
    if (!tournament) throw new ApiError(404, 'Tournament not found');

    await logAudit(user, 'update_tournament', 'tournament', tournament._id, body);
    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    return handleError(error);
  }
}
