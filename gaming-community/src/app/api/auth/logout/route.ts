import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
