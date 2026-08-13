import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../server/models/User.js';
import Group from '../../../../server/models/Group.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await verifyAccessToken(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ success: true, users: [], groups: [] });
    }

    const regex = { $regex: q, $options: 'i' };

    const [users, groups] = await Promise.all([
      User.find({
        $and: [
          { _id: { $ne: currentUser._id } },
          {
            $or: [
              { gamerTag: regex },
              { gamerBio: regex },
            ],
          },
        ],
        isBanned: { $ne: true },
      })
        .select('gamerTag avatarUrl rank level gamerBio')
        .limit(10)
        .lean(),

      Group.find({ name: regex })
        .select('name description owner members moderators joinRequests logoUrl stats')
        .populate('owner', 'gamerTag avatarUrl rank')
        .limit(10)
        .lean(),
    ]);

    return NextResponse.json({ success: true, users, groups });
  } catch (error) {
    return handleError(error);
  }
}
