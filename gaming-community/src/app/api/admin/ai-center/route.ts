import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import GameSession from '../../../../../server/models/GameSession.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR');

    const totalGenerations = await GameSession.countDocuments({ 'aiInsights.summary': { $ne: '' } });
    const failedRequests = await GameSession.countDocuments({ 'aiInsights.summary': 'FAILED' });

    const recentGenerations = await GameSession.aggregate([
      { $match: { 'aiInsights.summary': { $ne: '' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 14 },
    ]);

    const aiByGame = await GameSession.aggregate([
      { $match: { 'aiInsights.summary': { $ne: '' } } },
      { $group: { _id: '$gameName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      success: true,
      aiCenter: {
        totalGenerations,
        failedRequests,
        failureRate: totalGenerations > 0 ? Math.round((failedRequests / totalGenerations) * 100) : 0,
        recentGenerations,
        aiByGame,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
