import { NextResponse } from 'next/server';
import connectDB from '@/lib/api-utils/connectDB';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ success: true, message: 'NEXUS API is running' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Database connection failed' },
      { status: 500 }
    );
  }
}
