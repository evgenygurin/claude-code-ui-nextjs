import { NextRequest, NextResponse } from 'next/server';
import { CacheService, CacheKeys } from '@/lib/cache/cache-service';
import { createSentryClient } from '@/lib/integrations/sentry-client';

/**
 * GET /api/metrics/sentry
 * Returns Sentry error tracking metrics
 * Supports query parameter: period (7d, 14d, 30d)
 * Cached for 3 minutes to reduce Sentry API calls
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';

    const sentryMetrics = await CacheService.getOrSet(
      CacheKeys.metrics.sentry(period),
      async () => {
        const useRealData = process.env.ENABLE_REAL_DATA === 'true';
        const sentryClient = createSentryClient();

        if (!useRealData || !sentryClient) {
          // Return mock data when Sentry is not configured
          return generateMockSentryData(period);
        }

        // Fetch real data from Sentry
        const [errorTrends, topErrors, priorityDist, stats] = await Promise.all([
          sentryClient.getErrorTrends(period),
          sentryClient.getTopErrors(10, period),
          sentryClient.calculatePriorityDistribution(period),
          sentryClient.getProjectStats('24h'),
        ]);

        // Calculate MTTR from top errors
        const mttr = topErrors.length > 0
          ? Math.round(
              topErrors.reduce((sum, error) => {
                const avgResolution = error.stats?.['24h']?.[0]?.[1] || 0;
                return sum + avgResolution;
              }, 0) / topErrors.length / 60 // Convert to minutes
            )
          : 0;

        return {
          errorTrends,
          priorityDistribution: priorityDist,
          topErrors: topErrors.map((error) => ({
            id: error.id,
            title: error.title,
            count: error.count,
            userCount: error.userCount,
            lastSeen: error.lastSeen,
            level: error.level,
            permalink: error.permalink,
          })),
          mttr,
          totalErrors24h: stats.total,
          affectedUsers24h: stats.userCount,
        };
      },
      { ttl: 180, tags: ['metrics', 'sentry'] } // Cache for 3 minutes
    );

    return NextResponse.json(sentryMetrics);
  } catch (error) {
    console.error('Failed to fetch Sentry metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Sentry metrics' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock Sentry data for development
 */
function generateMockSentryData(period: string) {
  const days = parseInt(period) || 7;
  const errorTrends = [];

  for (let i = days - 1; i >= 0; i--) {
    errorTrends.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      count: 0,
    });
  }

  return {
    errorTrends,
    priorityDistribution: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    topErrors: [],
    mttr: 0,
    totalErrors24h: 0,
    affectedUsers24h: 0,
  };
}
