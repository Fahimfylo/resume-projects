import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Report from '../../../../../../server/models/Report.js';
import User from '../../../../../../server/models/User.js';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN');
    const { id } = await params;
    const { action, status } = await request.json();

    const report = await Report.findById(id);
    if (!report) throw new ApiError(404, 'Report not found');

    report.status = status || 'resolved';
    report.reviewedBy = user._id;
    report.action = action || 'none';
    report.resolvedAt = new Date();
    await report.save();

    if (action === 'warning' && report.targetUser) {
      await User.findByIdAndUpdate(report.targetUser, { $inc: { warnings: 1 } });
    } else if (action === 'mute' && report.targetUser) {
      await User.findByIdAndUpdate(report.targetUser, { isSuspended: true, suspensionUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });
    } else if (action === 'temp_suspension' && report.targetUser) {
      await User.findByIdAndUpdate(report.targetUser, { isSuspended: true, suspensionUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    } else if (action === 'permanent_ban' && report.targetUser) {
      await User.findByIdAndUpdate(report.targetUser, { isBanned: true });
    }

    await logAudit(user, 'resolve_report', 'report', report._id, { action, reportId: report._id, targetUser: report.targetUser });
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return handleError(error);
  }
}
