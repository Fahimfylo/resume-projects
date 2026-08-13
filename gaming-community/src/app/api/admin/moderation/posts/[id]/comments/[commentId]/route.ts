import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../../../../../../server/models/Post.js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR');
    const { postId, commentId } = await params;

    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, 'Post not found');

    post.comments.pull({ _id: commentId });
    await post.save();

    await logAudit(user, 'delete_comment', 'comment', commentId, { postId });
    return NextResponse.json({ success: true, message: 'Comment removed' });
  } catch (error) {
    return handleError(error);
  }
}
