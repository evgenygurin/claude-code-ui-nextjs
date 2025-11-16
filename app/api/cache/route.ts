import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache/cache-service';

/**
 * GET /api/cache
 * Returns cache statistics
 */
export async function GET() {
  try {
    const stats = CacheService.getStats();

    return NextResponse.json({
      stats,
      uptime: process.uptime(),
      nodeVersion: process.version,
    });
  } catch (error) {
    console.error('Failed to fetch cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache statistics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cache
 * Invalidates cache by tag or clears all
 * Query params:
 * - tag: specific tag to invalidate (e.g., "metrics", "reports")
 * - all: clear all cache (use with caution)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      await CacheService.clear();
      return NextResponse.json({
        success: true,
        message: 'All cache cleared'
      });
    }

    if (tag) {
      await CacheService.invalidateByTag(tag);
      return NextResponse.json({
        success: true,
        message: `Cache invalidated for tag: ${tag}`
      });
    }

    return NextResponse.json(
      { error: 'Must provide either "tag" or "all=true" query parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cache/reset-stats
 * Resets cache statistics
 */
export async function POST() {
  try {
    CacheService.resetStats();
    return NextResponse.json({
      success: true,
      message: 'Cache statistics reset'
    });
  } catch (error) {
    console.error('Failed to reset cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to reset cache statistics' },
      { status: 500 }
    );
  }
}
