import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';
import GameSession from '../../../../../server/models/GameSession.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [dauData, totalUsers, totalSessions, retentionData] = await Promise.all([
      User.aggregate([
        { $match: { lastLogin: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastLogin' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.countDocuments(),
      GameSession.countDocuments(),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, lastLogin: { $ne: null } } },
        {
          $bucket: {
            groupBy: '$createdAt',
            boundaries: [thirtyDaysAgo, new Date(now - 14 * 24 * 60 * 60 * 1000), new Date(now - 7 * 24 * 60 * 60 * 1000), now],
            default: 'older',
            output: { count: { $sum: 1 }, returned: { $sum: { $cond: [{ $gte: ['$lastLogin', '$createdAt'] }, 1, 0] } } },
          },
        },
      ]),
    ]);

    const topGames = await GameSession.aggregate([
      { $group: { _id: '$gameName', sessions: { $sum: 1 }, uniquePlayers: { $addToSet: '$userId' } } },
      { $project: { sessions: 1, uniquePlayers: { $size: '$uniquePlayers' } } },
      { $sort: { sessions: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      success: true,
      analytics: { totalUsers, totalSessions, dauData, retentionData, topGames },
    });
  } catch (error) {
    return handleError(error);
  }
}
