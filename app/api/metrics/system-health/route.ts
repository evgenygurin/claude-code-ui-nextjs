import { NextResponse } from 'next/server';

/**
 * GET /api/metrics/system-health
 * Returns overall system health metrics
 */
export async function GET() {
  try {
    // In production, fetch real data from monitoring systems
    // For now, returning mock data structure
    const systemHealth = {
      overallHealth: 100,
      services: [],
      metrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      },
      alerts: [],
      trends: {
        health: 'stable' as const,
        errorRate: 'stable' as const,
        performance: 'stable' as const
      }
    };

    return NextResponse.json(systemHealth);
  } catch (error) {
    console.error('Failed to fetch system health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    );
  }
}
