import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requireRole, logAudit } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../../../../server/models/Post.js';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requireRole(user, 'SUPER_ADMIN', 'ADMIN', 'MODERATOR');
    const { id } = await params;

    const post = await Post.findByIdAndDelete(id);
    if (!post) throw new ApiError(404, 'Post not found');

    await logAudit(user, 'delete_post', 'post', post._id, { userId: post.userId });
    return NextResponse.json({ success: true, message: 'Post removed' });
  } catch (error) {
    return handleError(error);
  }
}
