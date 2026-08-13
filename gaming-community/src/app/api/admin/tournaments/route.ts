import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Tournament from '../../../../../server/models/Tournament.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status) query.status = status;

    const [tournaments, total] = await Promise.all([
      Tournament.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'gamerTag'),
      Tournament.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, tournaments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');

    const body = await request.json();
    const tournament = await Tournament.create({ ...body, createdBy: user._id });

    await logAudit(user, 'create_tournament', 'tournament', tournament._id, { name: tournament.name });
    return NextResponse.json({ success: true, tournament }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
