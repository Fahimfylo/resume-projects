import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import GameSession from '../../../../../server/models/GameSession.js';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid session ID');

    const session = await GameSession.findOne({ _id: id, userId: user._id });
    if (!session) throw new ApiError(404, 'Session not found');

    return NextResponse.json({ success: true, session });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid session ID');

    const session = await GameSession.findOneAndDelete({ _id: id, userId: user._id });
    if (!session) throw new ApiError(404, 'Session not found');

    return NextResponse.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    return handleError(error);
  }
}
