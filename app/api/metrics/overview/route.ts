import { NextResponse } from 'next/server';
import { CacheService, CacheKeys } from '@/lib/cache/cache-service';
import { createSentryClient } from '@/lib/integrations/sentry-client';
import { createGitHubClient } from '@/lib/integrations/github-client';
import { prisma } from '@/lib/db/prisma';
import { PerformanceMonitor } from '@/lib/monitoring/performance';

/**
 * GET /api/metrics/overview
 * Returns overview metrics for the dashboard
 * Cached for 2 minutes to reduce load on external APIs and database
 */
export async function GET() {
  const endTiming = PerformanceMonitor.start('api:metrics:overview');

  try {
    const metrics = await CacheService.getOrSet(
      CacheKeys.metrics.overview(),
      async () => {
        const useRealData = process.env.ENABLE_REAL_DATA === 'true';
        const usePersistence = process.env.ENABLE_DATABASE_PERSISTENCE === 'true';

        // Initialize clients
        const sentryClient = createSentryClient();
        const githubClient = createGitHubClient();

        // Fetch data in parallel
        const [
          activeEscalations,
          recentConflicts,
          cicdHealth,
          sentryStats,
        ] = await Promise.all([
          // Active escalations
          usePersistence && prisma
            ? prisma.escalation.count({ where: { status: { in: ['new', 'acknowledged'] } } })
            : Promise.resolve(0),

          // Recent merge conflicts (last 7 days)
          usePersistence && prisma
            ? prisma.mergeConflict.count({
                where: {
                  detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                  status: 'open',
                },
              })
            : Promise.resolve(0),

          // CI/CD health
          useRealData && githubClient
            ? githubClient.getCICDHealth(24).catch(() => null)
            : Promise.resolve(null),

          // Sentry error stats
          useRealData && sentryClient
            ? sentryClient.getProjectStats('24h').catch(() => null)
            : Promise.resolve(null),
        ]);

        // Calculate metrics
        const errorRate24h = sentryStats?.total || 0;
        const cicdStatus = cicdHealth?.pipelineStatus || 'passing';

        // Calculate system health (0-100)
        let systemHealth = 100;
        if (activeEscalations > 0) systemHealth -= Math.min(activeEscalations * 10, 40);
        if (cicdStatus === 'failing') systemHealth -= 30;
        if (cicdStatus === 'pending') systemHealth -= 10;
        if (errorRate24h > 100) systemHealth -= 20;
        if (errorRate24h > 50) systemHealth -= 10;
        systemHealth = Math.max(0, systemHealth);

        // Calculate MTTR from escalations
        const mttr = usePersistence && prisma
          ? await calculateMTTR()
          : 0;

        // Determine error rate trend
        const errorRateTrend = sentryStats && sentryStats.total > 0
          ? (sentryStats.total > (sentryStats.total * 0.9) ? 'increasing' : 'decreasing')
          : 'stable';

        return {
          activeEscalations,
          recentMergeConflicts: recentConflicts,
          cicdStatus,
          errorRate24h,
          errorRateTrend,
          systemHealth,
          mttr,
        };
      },
      { ttl: 120, tags: ['metrics', 'overview'] } // Cache for 2 minutes
    );

    endTiming({ endpoint: 'overview' }, { success: true });
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch overview metrics:', error);
    endTiming({ endpoint: 'overview' }, { success: false, error: String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch overview metrics' },
      { status: 500 }
    );
  }
}

/**
 * Calculate Mean Time To Resolution from escalations
 */
async function calculateMTTR(): Promise<number> {
  if (!prisma) return 0;

  const resolvedEscalations = await prisma.escalation.findMany({
    where: {
      status: 'resolved',
      resolvedAt: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    },
    select: {
      createdAt: true,
      resolvedAt: true,
    },
  });

  if (resolvedEscalations.length === 0) return 0;

  const totalResolutionTime = resolvedEscalations.reduce((sum: number, escalation: { createdAt: Date; resolvedAt: Date | null }) => {
    if (!escalation.resolvedAt) return sum;
    const resolutionTime = escalation.resolvedAt.getTime() - escalation.createdAt.getTime();
    return sum + resolutionTime;
  }, 0);

  // Return average in minutes
  return Math.round(totalResolutionTime / resolvedEscalations.length / (1000 * 60));
}
