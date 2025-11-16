import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/lib/monitoring/performance';

/**
 * GET /api/monitoring/performance
 * Returns performance statistics
 * Query params:
 * - name: filter by metric name
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    const stats = PerformanceMonitor.getStats(name || undefined);

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch performance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance statistics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitoring/performance
 * Clears performance metrics
 */
export async function DELETE() {
  try {
    PerformanceMonitor.clear();
    return NextResponse.json({
      success: true,
      message: 'Performance metrics cleared',
    });
  } catch (error) {
    console.error('Failed to clear performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to clear performance metrics' },
      { status: 500 }
    );
  }
}
