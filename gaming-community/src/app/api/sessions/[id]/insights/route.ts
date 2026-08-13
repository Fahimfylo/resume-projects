import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import GameSession from '../../../../../../server/models/GameSession.js';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    const session = await GameSession.findOne({ _id: id, userId: user._id });
    if (!session) throw new ApiError(404, 'Session not found');

    if (!session.aiInsights || !session.aiInsights.summary) {
      throw new ApiError(404, 'No insights available for this session. Run analysis first.');
    }

    return NextResponse.json({ success: true, insights: session.aiInsights });
  } catch (error) {
    return handleError(error);
  }
}
