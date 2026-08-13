import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await verifyAccessToken(request);

    const { gamerTag, gamerBio, avatarUrl, gamingPreferences } = await request.json();

    if (gamerTag && gamerTag !== currentUser.gamerTag) {
      const existing = await User.findOne({ gamerTag });
      if (existing) throw new ApiError(409, 'Gamer tag already taken');
    }

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      {
        ...(gamerTag && { gamerTag }),
        ...(gamerBio !== undefined && { gamerBio }),
        ...(avatarUrl && { avatarUrl }),
        ...(gamingPreferences && { gamingPreferences }),
      },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshToken');

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleError(error);
  }
}
