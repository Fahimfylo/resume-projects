import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import GameSession from '../../../../../../server/models/GameSession.js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    const session = await GameSession.findOne({ _id: id, userId: user._id });
    if (!session) throw new ApiError(404, 'Session not found');

    const { summary, strengths, weaknesses, recommendations } = await request.json();

    const insights = summary
      ? { summary, strengths: strengths || [], weaknesses: weaknesses || [], recommendations: recommendations || [] }
      : {
          summary: `Analysis for ${session.gameName} session.`,
          strengths: ['Strong early-game decision making', 'Effective communication with team', 'Above average map awareness'],
          weaknesses: ['Inconsistent mid-game macro play', 'Reaction time drops after 20 minutes', 'Utility usage could be optimized'],
          recommendations: ['Focus on mid-game rotation drills', 'Review utility lineups for current map pool', 'Consider aim training sessions before matches'],
        };

    session.aiInsights = insights;
    await session.save();

    return NextResponse.json({ success: true, insights });
  } catch (error) {
    return handleError(error);
  }
}
