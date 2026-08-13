import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getLiveThreatFeed, getThreatFeedSummary } from '@/services/security/threat-intel.service';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    await verifyToken(token);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const includeSummary = searchParams.get('summary') !== 'false';

    const feed = getLiveThreatFeed(limit);
    const summary = includeSummary ? getThreatFeedSummary(feed) : undefined;

    return NextResponse.json({ feed, summary }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch threat feed' }, { status: 500 });
  }
}
