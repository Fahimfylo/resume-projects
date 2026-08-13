import { NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { handleError } from '@/lib/api-utils/error-handler';
import Group from '../../../../../server/models/Group.js';

export async function GET() {
  try {
    await connectDB();
    const groups = await Group.find()
      .sort({ 'stats.wins': -1 })
      .select('name stats.logoUrl');
    return NextResponse.json({ success: true, leaderboard: groups });
  } catch (error) {
    return handleError(error);
  }
}
