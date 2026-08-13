import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Notification from '../../../../../server/models/Notification.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [notifications, total] = await Promise.all([
      Notification.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(),
    ]);

    return NextResponse.json({ success: true, notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
    const notification = await Notification.create(body);

    await logAudit(user, 'send_notification', 'notification', notification._id, { type: notification.type, title: notification.title });
    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
