import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../../../../server/models/Post.js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id, commentId } = await params;

    const post = await Post.findById(id);
    if (!post) throw new ApiError(404, 'Post not found');

    const comment = post.comments.id(commentId);
    if (!comment) throw new ApiError(404, 'Comment not found');

    if (comment.userId.toString() !== user._id.toString()) {
      throw new ApiError(403, 'Not authorized to delete this comment');
    }

    comment.deleteOne();
    await post.save();

    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    return handleError(error);
  }
}
