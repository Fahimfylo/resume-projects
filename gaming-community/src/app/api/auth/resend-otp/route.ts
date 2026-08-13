import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import { sendOtpEmail } from '@/lib/api-utils/email';
import User from '../../../../../server/models/User.js';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email } = await request.json();
    if (!email) throw new ApiError(400, 'Email is required');

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User not found');
    if (user.isEmailVerified) throw new ApiError(400, 'Email already verified');

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);

    return NextResponse.json(
      { success: true, message: 'OTP resent to your email' },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
