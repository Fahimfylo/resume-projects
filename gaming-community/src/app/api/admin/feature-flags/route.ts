import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import FeatureFlag from '../../../../../server/models/FeatureFlag.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');

    const flags = await FeatureFlag.find().sort({ category: 1, key: 1 });
    return NextResponse.json({ success: true, flags });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN');

    const body = await request.json();
    const flag = await FeatureFlag.create(body);

    await logAudit(user, 'create_feature_flag', 'system', flag._id, { key: flag.key });
    return NextResponse.json({ success: true, flag }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
