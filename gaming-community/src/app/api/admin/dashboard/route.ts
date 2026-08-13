import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';
import GameSession from '../../../../../server/models/GameSession.js';
import Group from '../../../../../server/models/Group.js';
import Report from '../../../../../server/models/Report.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR');

    const [
      totalUsers, activePlayers, totalSessions, totalGroups, pendingReports,
      newRegistrations, suspiciousAccounts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      GameSession.countDocuments({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Group.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ warnings: { $gte: 3 }, isBanned: false }),
    ]);

    const aiSessions = await GameSession.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      'aiInsights.summary': { $ne: '' },
    });

    const onlineUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    const sessionsByGame = await GameSession.aggregate([
      { $match: { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$gameName', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
      { $project: { count: 1, uniqueUsers: { $size: '$uniqueUsers' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      dashboard: { totalUsers, activePlayers, onlineUsers, aiSessions, totalGroups, pendingReports, newRegistrations, suspiciousAccounts, matchActivity: totalSessions, sessionsByGame, dailyRegistrations },
    });
  } catch (error) {
    return handleError(error);
  }
}
