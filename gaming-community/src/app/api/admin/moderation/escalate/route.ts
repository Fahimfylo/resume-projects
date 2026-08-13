import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requirePermission, logAudit } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../../../server/models/Post.js';
import ApiError from '@/lib/api-utils/ApiError';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requirePermission(user, 'moderation.escalate');

    const { postId, reason } = await request.json();
    if (!postId) throw new ApiError(400, 'Post ID is required');

    const post = await Post.findByIdAndUpdate(
      postId,
      {
        moderationStatus: 'escalated',
        moderatedBy: user._id,
        moderationNote: reason || 'Escalated to admin review',
      },
      { new: true }
    );

    if (!post) throw new ApiError(404, 'Post not found');

    await logAudit(user, 'escalate_post', 'post', postId, { reason: reason || 'Requires admin review' });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    return handleError(error);
  }
}
