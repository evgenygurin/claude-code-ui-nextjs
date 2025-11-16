import { NextResponse } from 'next/server';

/**
 * GET /api/metrics/overview
 * Returns overview metrics for the dashboard
 */
export async function GET() {
  try {
    // In production, fetch real data from database/monitoring systems
    // For now, returning mock data structure
    const metrics = {
      activeEscalations: 0,
      recentMergeConflicts: 0,
      cicdStatus: 'passing' as const,
      errorRate24h: 0,
      errorRateTrend: 'stable' as const,
      systemHealth: 100,
      mttr: 0
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch overview metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview metrics' },
      { status: 500 }
    );
  }
}
