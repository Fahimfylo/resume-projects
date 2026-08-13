import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../server/models/Group.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const featured = searchParams.get('featured');

    const query: any = {};
    if (featured !== null) query.isFeatured = featured === 'true';

    const [groups, total] = await Promise.all([
      Group.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('owner', 'gamerTag email')
        .populate('members', 'gamerTag'),
      Group.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, groups, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}
