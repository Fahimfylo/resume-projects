import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';
import { verifyAccessToken } from '@/lib/api-utils/auth';
import ApiError from '@/lib/api-utils/ApiError';
import { handleError } from '@/lib/api-utils/error-handler';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'text/plain', 'application/zip', 'application/json'];
const MAX_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'chat');

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await verifyAccessToken(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) throw new ApiError(400, 'No file uploaded');
    if (file.size > MAX_SIZE) throw new ApiError(400, 'File size must be less than 5MB');

    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${randomUUID()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(join(UPLOAD_DIR, filename), Buffer.from(bytes));

    const url = `/uploads/chat/${filename}`;

    return NextResponse.json({
      success: true,
      file: { url, name: file.name, mimeType: file.type, size: file.size },
    });
  } catch (error) {
    return handleError(error);
  }
}
