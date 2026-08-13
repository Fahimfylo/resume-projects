import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { connectDB } from '@/lib/db';
import { ScanRecord } from '@/lib/models/ScanRecord';
import { analyzeEmailFull } from '@/services/security';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const payload = await verifyToken(token);

    const { subject, body, sender, rawHeaders } = await req.json();

    if (!subject || !body || !sender) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, body, sender' },
        { status: 400 }
      );
    }

    const result = await analyzeEmailFull({ subject, body, sender, rawHeaders });

    await connectDB();
    await ScanRecord.create({
      userId: payload.userId,
      type: 'url',
      target: `email:${sender}`,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      aiSummary: result.aiAssessment ? {
        summary: result.aiAssessment.summary,
        detectedThreats: result.reasons,
        implications: result.aiAssessment.intent,
        recommendations: result.recommendedActions,
      } : undefined,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Email analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze email' }, { status: 500 });
  }
}
