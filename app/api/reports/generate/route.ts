import { NextRequest, NextResponse } from 'next/server';
import { generateReport, ReportConfig } from '@/lib/reporting/report-generator';

/**
 * POST /api/reports/generate
 * Generates a one-time report based on provided configuration
 */
export async function POST(request: NextRequest) {
  try {
    const config: ReportConfig = await request.json();

    // Validate config
    if (!config.frequency || !config.format || !config.sections || config.sections.length === 0) {
      return NextResponse.json(
        { error: 'Invalid report configuration' },
        { status: 400 }
      );
    }

    // Generate the report
    const report = await generateReport(config);

    // Return the report
    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
