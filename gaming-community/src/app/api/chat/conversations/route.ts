import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import { handleError } from '@/lib/api-utils/error-handler';
import Conversation from '../../../../../server/models/Conversation.js';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);

    const conversations = await Conversation.find({
      participants: user._id,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'gamerTag avatarUrl rank')
      .populate('lastMessage.sender', 'gamerTag');

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    return handleError(error);
  }
}
