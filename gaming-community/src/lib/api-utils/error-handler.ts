import { NextResponse } from 'next/server';
import ApiError from './ApiError';

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    { success: false, message: 'Internal Server Error' },
    { status: 500 }
  );
}
