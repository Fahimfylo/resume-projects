import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import { sendOtpEmail } from '@/lib/api-utils/email';
import User from '../../../../../server/models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password, gamerTag } = await request.json();
    const errors: string[] = [];

    if (!email || !EMAIL_REGEX.test(email)) errors.push('Valid email is required');
    if (!password) errors.push('Password is required');
    else if (password.length < 8) errors.push('Password must be at least 8 characters');
    else if (!PASSWORD_REGEX.test(password)) errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    if (gamerTag && gamerTag.length < 2) errors.push('Gamer tag must be at least 2 characters');

    if (errors.length > 0) throw new ApiError(400, errors.join('; '));

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(409, 'Email already registered');

    if (gamerTag) {
      const existingTag = await User.findOne({ gamerTag });
      if (existingTag) throw new ApiError(409, 'Gamer tag already taken');
    }

    const otp = generateOtp();

    await sendOtpEmail(email, otp);

    const user = await User.create({
      email,
      passwordHash: password,
      gamerTag: gamerTag || `Gamer_${Date.now()}`,
      otpCode: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to your email',
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
