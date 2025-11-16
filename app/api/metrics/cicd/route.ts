import { NextRequest, NextResponse } from 'next/server';
import { CacheService, CacheKeys } from '@/lib/cache/cache-service';
import { createGitHubClient } from '@/lib/integrations/github-client';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/metrics/cicd
 * Returns CI/CD pipeline health metrics
 * Supports query parameter: period (24, 48, 168 hours)
 * Cached for 2 minutes to reduce GitHub API calls
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('period') || '24');

    const cicdMetrics = await CacheService.getOrSet(
      CacheKeys.metrics.cicd(`${hours}h`),
      async () => {
        const useRealData = process.env.ENABLE_REAL_DATA === 'true';
        const usePersistence = process.env.ENABLE_DATABASE_PERSISTENCE === 'true';
        const githubClient = createGitHubClient();

        if (!useRealData || !githubClient) {
          // Return mock data when GitHub is not configured
          return generateMockCICDData();
        }

        // Fetch real data from GitHub Actions
        const [cicdHealth, jobPerf] = await Promise.all([
          githubClient.getCICDHealth(hours),
          githubClient.getJobPerformance(hours),
        ]);

        // Optionally persist to database
        if (usePersistence && prisma && cicdHealth.recentRuns.length > 0) {
          await persistPipelineRuns(cicdHealth.recentRuns);
        }

        // Cache hit rate would require additional GitHub Actions API calls
        // For now, return placeholder value
        const cacheHitRate = 0;

        return {
          pipelineStatus: cicdHealth.pipelineStatus,
          successRate: cicdHealth.successRate,
          averageDuration: cicdHealth.averageDuration,
          totalRuns24h: cicdHealth.totalRuns,
          failedRuns24h: cicdHealth.failedRuns,
          cacheHitRate,
          securityScans: {
            vulnerabilities: 0, // Would come from separate security scanning
            secrets: 0,
            sast: 0,
          },
          recentRuns: cicdHealth.recentRuns.slice(0, 10),
          jobPerformance: jobPerf.slice(0, 20),
        };
      },
      { ttl: 120, tags: ['metrics', 'cicd'] } // Cache for 2 minutes
    );

    return NextResponse.json(cicdMetrics);
  } catch (error) {
    console.error('Failed to fetch CI/CD metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CI/CD metrics' },
      { status: 500 }
    );
  }
}

/**
 * Persist pipeline runs to database for historical tracking
 */
async function persistPipelineRuns(runs: any[]) {
  if (!prisma) return;

  try {
    await Promise.all(
      runs.map((run) =>
        prisma.pipelineRun.upsert({
          where: { externalId: String(run.id) },
          create: {
            externalId: String(run.id),
            name: run.name,
            status: run.status,
            conclusion: run.conclusion || null,
            startedAt: new Date(run.created_at),
            completedAt: run.updated_at ? new Date(run.updated_at) : null,
            duration: run.duration || 0,
            branch: run.head_branch || 'main',
            commit: run.head_sha || '',
          },
          update: {
            status: run.status,
            conclusion: run.conclusion || null,
            completedAt: run.updated_at ? new Date(run.updated_at) : null,
            duration: run.duration || 0,
          },
        })
      )
    );
  } catch (error) {
    console.error('Failed to persist pipeline runs:', error);
  }
}

/**
 * Generate mock CI/CD data for development
 */
function generateMockCICDData() {
  return {
    pipelineStatus: 'passing' as const,
    successRate: 100,
    averageDuration: 0,
    totalRuns24h: 0,
    failedRuns24h: 0,
    cacheHitRate: 0,
    securityScans: {
      vulnerabilities: 0,
      secrets: 0,
      sast: 0,
    },
    recentRuns: [],
    jobPerformance: [],
  };
}
