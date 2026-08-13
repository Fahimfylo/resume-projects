import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken, requirePermission } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Post from '../../../../../server/models/Post.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);
    requirePermission(user, 'moderation.review');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status) {
      query.moderationStatus = status;
    } else {
      query.moderationStatus = { $in: ['pending', 'escalated'] };
    }

    const [items, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'gamerTag email avatarUrl')
        .populate('moderatedBy', 'gamerTag'),
      Post.countDocuments(query),
    ]);

    const comments = await Post.aggregate([
      { $unwind: '$comments' },
      { $sort: { 'comments.createdAt': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.userId',
          foreignField: '_id',
          as: 'commentUser',
        },
      },
      { $unwind: { path: '$commentUser', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: '$comments._id',
          postId: '$_id',
          content: '$comments.content',
          userId: '$comments.userId',
          createdAt: '$comments.createdAt',
          gamerTag: '$commentUser.gamerTag',
          avatarUrl: '$commentUser.avatarUrl',
          moderationStatus: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      posts: items,
      comments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}
