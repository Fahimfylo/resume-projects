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

    const post = await Post.findById(id);
    if (!post) throw new ApiError(404, 'Post not found');

    if (post.likes.includes(user._id)) throw new ApiError(409, 'Already liked');

    post.likes.push(user._id);
    await post.save();

    return NextResponse.json({ success: true, likes: post.likes.length });
  } catch (error) {
    return handleError(error);
  }
}
