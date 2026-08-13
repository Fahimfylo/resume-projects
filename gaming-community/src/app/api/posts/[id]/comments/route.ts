import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../../../server/models/Post.js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    const { id } = await params;

    const { content } = await request.json();
    if (!content || !content.trim()) throw new ApiError(400, 'Comment content is required');

    const post = await Post.findById(id);
    if (!post) throw new ApiError(404, 'Post not found');

    post.comments.push({ userId: user._id, content });
    await post.save();

    await post.populate('comments.userId', 'gamerTag avatarUrl');

    return NextResponse.json({ success: true, comments: post.comments }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
