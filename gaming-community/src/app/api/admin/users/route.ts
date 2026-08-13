import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const isBanned = searchParams.get('isBanned');
    const sort = searchParams.get('sort') || '-createdAt';

    const query: any = {};
    if (search) {
      query.$or = [
        { gamerTag: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (isBanned !== null) query.isBanned = isBanned === 'true';

    const sortObj: any = {};
    if (sort.startsWith('-')) sortObj[sort.slice(1)] = -1;
    else sortObj[sort] = 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-passwordHash -refreshToken -__v'),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}
