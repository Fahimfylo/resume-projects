import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import FeatureFlag from '../../../../../../server/models/FeatureFlag.js';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');
    const { id } = await params;
    const { enabled } = await request.json();

    const flag = await FeatureFlag.findByIdAndUpdate(id, { enabled }, { new: true });
    if (!flag) throw new ApiError(404, 'Feature flag not found');

    await logAudit(user, 'update_feature_flag', 'system', flag._id, { key: flag.key, enabled });
    return NextResponse.json({ success: true, flag });
  } catch (error) {
    return handleError(error);
  }
}
