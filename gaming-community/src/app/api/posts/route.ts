import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../server/models/Post.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { moderationStatus: 'approved', isHidden: { $ne: true } };

    const user = await verifyAccessToken(request).catch(() => null);

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('userId', 'gamerTag avatarUrl rank')
      .populate('comments.userId', 'gamerTag avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);

    const { content, image } = await request.json();

    const post = await Post.create({
      userId: user._id,
      content,
      image: image || '',
      moderationStatus: 'pending',
    });

    await post.populate('userId', 'gamerTag avatarUrl rank');

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
