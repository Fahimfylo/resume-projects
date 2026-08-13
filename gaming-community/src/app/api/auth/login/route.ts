import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/api-utils/connectDB';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();
    const errors: string[] = [];

    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (errors.length > 0) throw new ApiError(400, errors.join('; '));

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    if (!user.isEmailVerified) throw new ApiError(403, 'Please verify your email before logging in');

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    user.refreshToken = refreshToken;
    await user.save();

    const response = NextResponse.json({ success: true, user, accessToken });

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
