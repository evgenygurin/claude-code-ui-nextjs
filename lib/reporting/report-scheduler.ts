/**
 * Report Scheduler
 *
 * Manages scheduled report generation
 * Supports cron-based scheduling for daily/weekly/monthly reports
 */

import { ReportConfig, ReportFrequency, generateReport, saveReport } from './report-generator';

export interface ScheduledReport {
  id: string;
  name: string;
  config: ReportConfig;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Gets the cron expression for a given frequency
 */
export function getCronExpression(frequency: ReportFrequency): string {
  switch (frequency) {
    case 'daily':
      return '0 0 * * *'; // Every day at midnight
    case 'weekly':
      return '0 0 * * 0'; // Every Sunday at midnight
    case 'monthly':
      return '0 0 1 * *'; // First day of month at midnight
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

/**
 * Calculates the next run time based on cron expression
 * Simplified version - in production use a cron parser library
 */
export function getNextRunTime(frequency: ReportFrequency): Date {
  const now = new Date();
  const next = new Date();

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      const daysUntilSunday = (7 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilSunday);
      next.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      break;
  }

  return next;
}

/**
 * Creates a new scheduled report
 */
export function createScheduledReport(
  name: string,
  config: ReportConfig
): ScheduledReport {
  return {
    id: `scheduled-${Date.now()}`,
    name,
    config,
    schedule: getCronExpression(config.frequency),
    enabled: true,
    nextRun: getNextRunTime(config.frequency),
  };
}

/**
 * Executes a scheduled report
 */
export async function executeScheduledReport(
  scheduledReport: ScheduledReport
): Promise<void> {
  if (!scheduledReport.enabled) {
    console.log(`Skipping disabled report: ${scheduledReport.name}`);
    return;
  }

  console.log(`Executing scheduled report: ${scheduledReport.name}`);

  try {
    // Generate the report
    const report = await generateReport(scheduledReport.config);

    // Save the report
    await saveReport(report);

    // Update last run time
    scheduledReport.lastRun = new Date();
    scheduledReport.nextRun = getNextRunTime(scheduledReport.config.frequency);

    // Send email notifications if recipients are specified
    if (scheduledReport.config.recipients && scheduledReport.config.recipients.length > 0) {
      await sendReportNotifications(
        scheduledReport.config.recipients,
        report,
        scheduledReport.name
      );
    }

    console.log(`Report ${scheduledReport.name} completed successfully`);
  } catch (error) {
    console.error(`Failed to execute report ${scheduledReport.name}:`, error);
    throw error;
  }
}

/**
 * Sends email notifications with report
 * In production, integrate with email service (SendGrid, AWS SES, etc.)
 */
async function sendReportNotifications(
  recipients: string[],
  report: any,
  reportName: string
): Promise<void> {
  console.log(`Sending report "${reportName}" to ${recipients.length} recipients:`, recipients);

  // In production, implement actual email sending
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: recipients,
    from: 'monitoring@yourcompany.com',
    subject: `Monitoring Report: ${reportName}`,
    text: `Please find the ${report.frequency} monitoring report attached.`,
    html: report.format === 'html' ? report.content : undefined,
    attachments: report.format !== 'html' ? [{
      content: Buffer.from(report.content).toString('base64'),
      filename: `report-${report.id}.${report.format}`,
      type: `application/${report.format}`,
      disposition: 'attachment'
    }] : []
  };

  await sgMail.send(msg);
  */
}

/**
 * Gets all scheduled reports
 * In production, fetch from database
 */
export async function getScheduledReports(): Promise<ScheduledReport[]> {
  // In production, fetch from database
  // For now, return empty array
  return [];
}

/**
 * Adds a scheduled report
 * In production, save to database
 */
export async function addScheduledReport(
  scheduledReport: ScheduledReport
): Promise<void> {
  // In production, save to database
  console.log(`Adding scheduled report: ${scheduledReport.name}`);
}

/**
 * Updates a scheduled report
 * In production, update in database
 */
export async function updateScheduledReport(
  id: string,
  updates: Partial<ScheduledReport>
): Promise<void> {
  // In production, update in database
  console.log(`Updating scheduled report ${id}:`, updates);
}

/**
 * Deletes a scheduled report
 * In production, delete from database
 */
export async function deleteScheduledReport(id: string): Promise<void> {
  // In production, delete from database
  console.log(`Deleting scheduled report: ${id}`);
}

/**
 * Checks if any scheduled reports need to run
 * This should be called periodically (e.g., every minute via cron)
 */
export async function checkScheduledReports(): Promise<void> {
  const scheduledReports = await getScheduledReports();
  const now = new Date();

  for (const scheduledReport of scheduledReports) {
    if (
      scheduledReport.enabled &&
      scheduledReport.nextRun &&
      scheduledReport.nextRun <= now
    ) {
      try {
        await executeScheduledReport(scheduledReport);
      } catch (error) {
        console.error(`Failed to execute scheduled report ${scheduledReport.name}:`, error);
      }
    }
  }
}
