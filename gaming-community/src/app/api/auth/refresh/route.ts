import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/api-utils/connectDB';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('refreshToken')?.value;
    if (!token) throw new ApiError(401, 'Refresh token is required');

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User not found');

    if (user.refreshToken !== token) {
      user.refreshToken = null;
      await user.save();

      const response = NextResponse.json(
        { success: false, message: 'Refresh token reuse detected. All sessions have been invalidated. Please log in again.' },
        { status: 401 }
      );

      response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 0,
      });

      return response;
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    user.refreshToken = newRefreshToken;
    await user.save();

    const response = NextResponse.json({ success: true, accessToken: newAccessToken });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
