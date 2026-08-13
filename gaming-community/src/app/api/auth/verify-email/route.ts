import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/api-utils/connectDB';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, otp } = await request.json();
    if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User not found');
    if (user.isEmailVerified) throw new ApiError(400, 'Email already verified');

    if (user.otpCode !== otp) throw new ApiError(400, 'Invalid OTP');
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) throw new ApiError(400, 'OTP has expired');

    user.isEmailVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    user.refreshToken = refreshToken;
    await user.save();

    const response = NextResponse.json(
      { success: true, user, accessToken },
      { status: 200 }
    );

    response.cookies.set('refreshToken', refreshToken, {
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
