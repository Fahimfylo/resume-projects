import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import GameSession from '../../../../server/models/GameSession.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const userId = user._id;

    const totalSessions = await GameSession.countDocuments({ userId });

    const gameBreakdown = await GameSession.aggregate([
      { $match: { userId } },
      { $group: { _id: '$gameName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const analyzedCount = await GameSession.countDocuments({
      userId,
      'aiInsights.summary': { $ne: '' },
    });

    const dailySessions = await GameSession.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 14 },
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        totalSessions,
        totalGames: gameBreakdown.length,
        analyzedCount,
        analyzedPercent: totalSessions > 0 ? Math.round((analyzedCount / totalSessions) * 100) : 0,
        gameBreakdown,
        dailySessions,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
