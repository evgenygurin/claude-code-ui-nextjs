import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/reports/history
 * Returns paginated report history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const frequency = searchParams.get('frequency'); // filter by frequency
    const format = searchParams.get('format'); // filter by format

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (frequency) {
      where.frequency = frequency;
    }
    if (format) {
      where.format = format;
    }

    // Check if database persistence is enabled
    if (process.env.ENABLE_DATABASE_PERSISTENCE !== 'true') {
      // Return mock data
      return NextResponse.json({
        reports: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        message: 'Database persistence not enabled. Set ENABLE_DATABASE_PERSISTENCE=true to use this feature.',
      });
    }

    // Fetch reports from database
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          frequency: true,
          format: true,
          size: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
          scheduledReport: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch report history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report history' },
      { status: 500 }
    );
  }
}
