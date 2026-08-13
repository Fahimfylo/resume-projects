import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import AuditLog from '../../../../../server/models/AuditLog.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const targetType = searchParams.get('targetType');
    const action = searchParams.get('action');

    const query: any = {};
    if (targetType) query.targetType = targetType;
    if (action) query.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('admin', 'gamerTag email'),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}
