import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { connectDB } from '@/lib/db';
import { ScanRecord } from '@/lib/models/ScanRecord';
import { analyzeWebsite } from '@/services/security';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const payload = await verifyToken(token);

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Missing required field: url' }, { status: 400 });
    }

    const result = await analyzeWebsite({ url });

    await connectDB();
    await ScanRecord.create({
      userId: payload.userId,
      type: 'url',
      target: url,
      riskScore: 100 - result.securityScore,
      riskLevel: result.securityScore > 80 ? 'Safe' : result.securityScore > 50 ? 'Medium' : 'High',
      urlDetails: {
        overallAssessment: result.recommendation,
        defensiveActions: result.vulnerabilities.map(v => v.recommendation),
        domainReputation: result.sslDetails,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Web scan error:', error);
    return NextResponse.json({ error: 'Failed to scan website' }, { status: 500 });
  }
}
