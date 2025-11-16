import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledReports,
  addScheduledReport,
  createScheduledReport,
} from '@/lib/reporting/report-scheduler';
import { ReportConfig } from '@/lib/reporting/report-generator';

/**
 * GET /api/reports/scheduled
 * Returns all scheduled reports
 */
export async function GET() {
  try {
    const scheduledReports = await getScheduledReports();
    return NextResponse.json(scheduledReports);
  } catch (error) {
    console.error('Failed to fetch scheduled reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/scheduled
 * Creates a new scheduled report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, config }: { name: string; config: ReportConfig } = body;

    // Validate inputs
    if (!name || !config || !config.frequency || !config.format || !config.sections) {
      return NextResponse.json(
        { error: 'Invalid scheduled report configuration' },
        { status: 400 }
      );
    }

    // Create scheduled report
    const scheduledReport = createScheduledReport(name, config);

    // Save to database (in production)
    await addScheduledReport(scheduledReport);

    return NextResponse.json(scheduledReport, { status: 201 });
  } catch (error) {
    console.error('Failed to create scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
}
