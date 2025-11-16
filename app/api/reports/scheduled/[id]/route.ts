import { NextRequest, NextResponse } from 'next/server';
import {
  updateScheduledReport,
  deleteScheduledReport,
  getScheduledReports,
  executeScheduledReport,
} from '@/lib/reporting/report-scheduler';

/**
 * GET /api/reports/scheduled/[id]
 * Gets a specific scheduled report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduledReports = await getScheduledReports();
    const report = scheduledReports.find((r) => r.id === params.id);

    if (!report) {
      return NextResponse.json(
        { error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to fetch scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled report' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/scheduled/[id]
 * Updates a scheduled report
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();

    await updateScheduledReport(params.id, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/scheduled/[id]
 * Deletes a scheduled report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteScheduledReport(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/scheduled/[id]/execute
 * Manually executes a scheduled report
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduledReports = await getScheduledReports();
    const report = scheduledReports.find((r) => r.id === params.id);

    if (!report) {
      return NextResponse.json(
        { error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    await executeScheduledReport(report);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to execute scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to execute scheduled report' },
      { status: 500 }
    );
  }
}
