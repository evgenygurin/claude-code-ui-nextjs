/**
 * Report Generator
 *
 * Generates automated reports for monitoring metrics
 * Supports daily/weekly/monthly reports in multiple formats
 */

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';
export type ReportFormat = 'json' | 'html' | 'markdown';

export interface ReportConfig {
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients?: string[];
  sections: ReportSection[];
}

export type ReportSection =
  | 'overview'
  | 'sentry'
  | 'conflicts'
  | 'cicd'
  | 'timeline'
  | 'systemHealth';

export interface ReportData {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  sections: {
    [key in ReportSection]?: any;
  };
}

export interface GeneratedReport {
  id: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  content: string;
  size: number;
}

/**
 * Fetches metrics data for a given time period
 */
async function fetchMetricsForPeriod(
  section: ReportSection,
  startDate: Date,
  endDate: Date
): Promise<any> {
  try {
    const response = await fetch(`/api/metrics/${section}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${section} metrics`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${section} metrics:`, error);
    return null;
  }
}

/**
 * Calculates the report period based on frequency
 */
function getReportPeriod(frequency: ReportFrequency): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (frequency) {
    case 'daily':
      start.setDate(start.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      break;
  }

  return { start, end };
}

/**
 * Generates a report in the specified format
 */
export async function generateReport(
  config: ReportConfig
): Promise<GeneratedReport> {
  const period = getReportPeriod(config.frequency);
  const reportData: ReportData = {
    generatedAt: new Date(),
    period,
    sections: {},
  };

  // Fetch data for all requested sections
  for (const section of config.sections) {
    const data = await fetchMetricsForPeriod(section, period.start, period.end);
    if (data) {
      reportData.sections[section] = data;
    }
  }

  // Generate report content based on format
  let content: string;
  switch (config.format) {
    case 'json':
      content = JSON.stringify(reportData, null, 2);
      break;
    case 'html':
      content = generateHTMLReport(reportData);
      break;
    case 'markdown':
      content = generateMarkdownReport(reportData);
      break;
    default:
      throw new Error(`Unsupported format: ${config.format}`);
  }

  return {
    id: `report-${Date.now()}`,
    frequency: config.frequency,
    format: config.format,
    generatedAt: reportData.generatedAt,
    period,
    content,
    size: content.length,
  };
}

/**
 * Generates an HTML report
 */
function generateHTMLReport(data: ReportData): string {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitoring Report - ${formatDate(data.generatedAt)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
    }
    .period {
      opacity: 0.9;
      font-size: 14px;
    }
    .section {
      background: white;
      padding: 25px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin-top: 0;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .metric:last-child {
      border-bottom: none;
    }
    .metric-label {
      font-weight: 500;
      color: #666;
    }
    .metric-value {
      font-weight: 700;
      color: #333;
    }
    .status-healthy { color: #10b981; }
    .status-warning { color: #f59e0b; }
    .status-critical { color: #ef4444; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Monitoring Report</h1>
    <div class="period">
      Period: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}
    </div>
    <div class="period">
      Generated: ${formatDate(data.generatedAt)}
    </div>
  </div>
`;

  // Overview Section
  if (data.sections.overview) {
    const overview = data.sections.overview;
    html += `
  <div class="section">
    <h2>Overview</h2>
    <div class="metric">
      <span class="metric-label">Active Escalations</span>
      <span class="metric-value ${overview.activeEscalations > 0 ? 'status-warning' : 'status-healthy'}">
        ${overview.activeEscalations}
      </span>
    </div>
    <div class="metric">
      <span class="metric-label">Merge Conflicts (24h)</span>
      <span class="metric-value">${overview.recentMergeConflicts}</span>
    </div>
    <div class="metric">
      <span class="metric-label">CI/CD Status</span>
      <span class="metric-value status-${overview.cicdStatus === 'passing' ? 'healthy' : 'critical'}">
        ${overview.cicdStatus.toUpperCase()}
      </span>
    </div>
    <div class="metric">
      <span class="metric-label">Error Rate (24h)</span>
      <span class="metric-value">${overview.errorRate24h}</span>
    </div>
    <div class="metric">
      <span class="metric-label">System Health</span>
      <span class="metric-value status-${overview.systemHealth >= 90 ? 'healthy' : overview.systemHealth >= 70 ? 'warning' : 'critical'}">
        ${overview.systemHealth}%
      </span>
    </div>
  </div>
`;
  }

  // Sentry Section
  if (data.sections.sentry) {
    const sentry = data.sections.sentry;
    html += `
  <div class="section">
    <h2>Error Tracking (Sentry)</h2>
    <div class="metric">
      <span class="metric-label">Total Errors (24h)</span>
      <span class="metric-value">${sentry.totalErrors24h}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Affected Users (24h)</span>
      <span class="metric-value">${sentry.affectedUsers24h}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Mean Time To Resolution</span>
      <span class="metric-value">${sentry.mttr} minutes</span>
    </div>
    <div class="metric">
      <span class="metric-label">Critical Errors</span>
      <span class="metric-value status-critical">${sentry.priorityDistribution.critical}</span>
    </div>
    <div class="metric">
      <span class="metric-label">High Priority</span>
      <span class="metric-value status-warning">${sentry.priorityDistribution.high}</span>
    </div>
  </div>
`;
  }

  // Merge Conflicts Section
  if (data.sections.conflicts) {
    const conflicts = data.sections.conflicts;
    html += `
  <div class="section">
    <h2>Merge Conflict Resolution</h2>
    <div class="metric">
      <span class="metric-label">Total Conflicts (24h)</span>
      <span class="metric-value">${conflicts.totalConflicts24h}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Auto-Resolved</span>
      <span class="metric-value status-healthy">${conflicts.autoResolved}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Manual Resolution</span>
      <span class="metric-value status-warning">${conflicts.manualResolution}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Success Rate</span>
      <span class="metric-value">${conflicts.successRate}%</span>
    </div>
    <div class="metric">
      <span class="metric-label">Avg Resolution Time</span>
      <span class="metric-value">${conflicts.averageResolutionTime} minutes</span>
    </div>
  </div>
`;
  }

  // CI/CD Section
  if (data.sections.cicd) {
    const cicd = data.sections.cicd;
    html += `
  <div class="section">
    <h2>CI/CD Pipeline Health</h2>
    <div class="metric">
      <span class="metric-label">Pipeline Status</span>
      <span class="metric-value status-${cicd.pipelineStatus === 'passing' ? 'healthy' : 'critical'}">
        ${cicd.pipelineStatus.toUpperCase()}
      </span>
    </div>
    <div class="metric">
      <span class="metric-label">Success Rate (24h)</span>
      <span class="metric-value">${cicd.successRate}%</span>
    </div>
    <div class="metric">
      <span class="metric-label">Total Runs (24h)</span>
      <span class="metric-value">${cicd.totalRuns24h}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Failed Runs</span>
      <span class="metric-value status-${cicd.failedRuns24h > 0 ? 'warning' : 'healthy'}">
        ${cicd.failedRuns24h}
      </span>
    </div>
    <div class="metric">
      <span class="metric-label">Cache Hit Rate</span>
      <span class="metric-value">${cicd.cacheHitRate}%</span>
    </div>
    <div class="metric">
      <span class="metric-label">Security Vulnerabilities</span>
      <span class="metric-value status-${cicd.securityScans.vulnerabilities > 0 ? 'critical' : 'healthy'}">
        ${cicd.securityScans.vulnerabilities}
      </span>
    </div>
  </div>
`;
  }

  html += `
  <div class="footer">
    Generated by Claude Code UI Monitoring System<br>
    Report ID: report-${Date.now()}
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Generates a Markdown report
 */
function generateMarkdownReport(data: ReportData): string {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  let markdown = `# 📊 Monitoring Report

**Period:** ${formatDate(data.period.start)} - ${formatDate(data.period.end)}
**Generated:** ${formatDate(data.generatedAt)}

---

`;

  // Overview Section
  if (data.sections.overview) {
    const overview = data.sections.overview;
    markdown += `## Overview

| Metric | Value |
|--------|-------|
| Active Escalations | ${overview.activeEscalations} |
| Merge Conflicts (24h) | ${overview.recentMergeConflicts} |
| CI/CD Status | ${overview.cicdStatus.toUpperCase()} |
| Error Rate (24h) | ${overview.errorRate24h} |
| System Health | ${overview.systemHealth}% |

`;
  }

  // Sentry Section
  if (data.sections.sentry) {
    const sentry = data.sections.sentry;
    markdown += `## Error Tracking (Sentry)

| Metric | Value |
|--------|-------|
| Total Errors (24h) | ${sentry.totalErrors24h} |
| Affected Users (24h) | ${sentry.affectedUsers24h} |
| Mean Time To Resolution | ${sentry.mttr} minutes |
| Critical Errors | ${sentry.priorityDistribution.critical} |
| High Priority | ${sentry.priorityDistribution.high} |

`;
  }

  // Merge Conflicts Section
  if (data.sections.conflicts) {
    const conflicts = data.sections.conflicts;
    markdown += `## Merge Conflict Resolution

| Metric | Value |
|--------|-------|
| Total Conflicts (24h) | ${conflicts.totalConflicts24h} |
| Auto-Resolved | ${conflicts.autoResolved} |
| Manual Resolution | ${conflicts.manualResolution} |
| Success Rate | ${conflicts.successRate}% |
| Avg Resolution Time | ${conflicts.averageResolutionTime} minutes |

`;
  }

  // CI/CD Section
  if (data.sections.cicd) {
    const cicd = data.sections.cicd;
    markdown += `## CI/CD Pipeline Health

| Metric | Value |
|--------|-------|
| Pipeline Status | ${cicd.pipelineStatus.toUpperCase()} |
| Success Rate (24h) | ${cicd.successRate}% |
| Total Runs (24h) | ${cicd.totalRuns24h} |
| Failed Runs | ${cicd.failedRuns24h} |
| Cache Hit Rate | ${cicd.cacheHitRate}% |
| Security Vulnerabilities | ${cicd.securityScans.vulnerabilities} |

`;
  }

  markdown += `---

*Generated by Claude Code UI Monitoring System*
*Report ID: report-${Date.now()}*
`;

  return markdown;
}

/**
 * Saves a generated report
 */
export async function saveReport(report: GeneratedReport): Promise<void> {
  // In production, save to database or file system
  // For now, just log
  console.log(`Report ${report.id} generated (${report.size} bytes)`);
}
