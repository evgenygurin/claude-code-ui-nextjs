import { NextResponse } from 'next/server';

/**
 * GET /api/metrics/sentry
 * Returns Sentry error tracking metrics
 */
export async function GET() {
  try {
    // In production, fetch real data from Sentry API or database
    // For now, returning mock data structure
    const sentryMetrics = {
      errorTrends: [
        { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), count: 0 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), count: 0 },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), count: 0 },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), count: 0 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), count: 0 },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), count: 0 },
        { date: new Date().toISOString(), count: 0 }
      ],
      priorityDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      topErrors: [],
      mttr: 0,
      totalErrors24h: 0,
      affectedUsers24h: 0
    };

    return NextResponse.json(sentryMetrics);
  } catch (error) {
    console.error('Failed to fetch Sentry metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Sentry metrics' },
      { status: 500 }
    );
  }
}
