import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import GameSession from '../../../../server/models/GameSession.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const gameName = searchParams.get('gameName');

    const filter: any = { userId: user._id };
    if (gameName) filter.gameName = { $regex: gameName, $options: 'i' };

    const skip = (page - 1) * limit;
    const total = await GameSession.countDocuments(filter);

    const sessions = await GameSession.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);

    const { gameName, gameType, summary } = await request.json();
    const errors: string[] = [];

    if (!gameName || typeof gameName !== 'string' || !gameName.trim()) {
      errors.push('gameName is required and must be a non-empty string');
    }
    if (gameType && typeof gameType !== 'string') errors.push('gameType must be a string');
    if (summary && typeof summary !== 'string') errors.push('summary must be a string');

    if (errors.length > 0) throw new ApiError(400, errors.join('; '));

    const session = await GameSession.create({
      userId: user._id,
      gameName: gameName.trim(),
      gameType: gameType?.trim() || '',
      summary: summary?.trim() || '',
    });

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
