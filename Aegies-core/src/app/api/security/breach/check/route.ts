import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { checkBreach } from '@/services/security';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    await verifyToken(token);

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 });
    }

    const result = checkBreach({ email });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Breach check error:', error);
    return NextResponse.json({ error: 'Failed to check breach' }, { status: 500 });
  }
}
