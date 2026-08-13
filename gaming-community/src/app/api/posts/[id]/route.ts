import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../../server/models/Post.js';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const post = await Post.findById(id)
      .populate('userId', 'gamerTag avatarUrl rank')
      .populate('comments.userId', 'gamerTag avatarUrl');

    if (!post) throw new ApiError(404, 'Post not found');
    return NextResponse.json({ success: true, post });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    const post = await Post.findOne({ _id: id, userId: user._id });
    if (!post) throw new ApiError(404, 'Post not found or not authorized');

    await Post.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    return handleError(error);
  }
}
