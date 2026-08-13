import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import User from '../../../../../server/models/User.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAccessToken(request);

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) throw new ApiError(400, 'No file uploaded');

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ApiError(400, 'Only image files (jpeg, jpg, png, gif, webp) are allowed');
    }

    if (file.size > MAX_SIZE) {
      throw new ApiError(400, 'File size must be less than 5MB');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { avatarUrl: dataUrl },
      { new: true }
    ).select('-passwordHash -refreshToken');

    return NextResponse.json({ success: true, user: updatedUser, avatarUrl: dataUrl });
  } catch (error) {
    return handleError(error);
  }
}
