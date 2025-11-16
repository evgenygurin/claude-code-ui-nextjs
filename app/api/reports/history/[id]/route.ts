import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/reports/history/[id]
 * Returns a specific report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (process.env.ENABLE_DATABASE_PERSISTENCE !== 'true') {
      return NextResponse.json(
        { error: 'Database persistence not enabled' },
        { status: 503 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        scheduledReport: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/history/[id]
 * Deletes a specific report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (process.env.ENABLE_DATABASE_PERSISTENCE !== 'true') {
      return NextResponse.json(
        { error: 'Database persistence not enabled' },
        { status: 503 }
      );
    }

    await prisma.report.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/history/[id]/download
 * Downloads a report file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (process.env.ENABLE_DATABASE_PERSISTENCE !== 'true') {
      return NextResponse.json(
        { error: 'Database persistence not enabled' },
        { status: 503 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      select: {
        content: true,
        format: true,
        name: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Set appropriate content type
    const contentTypeMap: Record<string, string> = {
      json: 'application/json',
      html: 'text/html',
      markdown: 'text/markdown',
    };
    const contentType = contentTypeMap[report.format] || 'text/plain';

    return new NextResponse(report.content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${report.name}.${report.format}"`,
      },
    });
  } catch (error) {
    console.error('Failed to download report:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}
