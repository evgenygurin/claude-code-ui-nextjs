/**
 * Database Seed Script
 *
 * Populates database with sample data for development and testing
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (be careful in production!)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.escalationEvent.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.report.deleteMany();
    await prisma.scheduledReport.deleteMany();
    await prisma.mergeConflict.deleteMany();
    await prisma.healthSnapshot.deleteMany();
    await prisma.pipelineRun.deleteMany();
  }

  // Seed Escalations
  console.log('📊 Creating escalations...');
  const escalation1 = await prisma.escalation.create({
    data: {
      errorId: 'sentry-error-123',
      title: 'TypeError: Cannot read property of undefined',
      description: 'Critical error in user authentication flow affecting multiple users',
      priority: 'critical',
      status: 'resolved',
      source: 'sentry',
      errorCount: 45,
      affectedUsers: 12,
      environment: 'production',
      tags: { module: 'auth', severity: 'high' },
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      events: {
        create: [
          {
            type: 'created',
            description: 'Escalation created automatically from Sentry webhook',
            metadata: { webhook_id: 'webhook-123' },
            createdBy: 'system',
          },
          {
            type: 'updated',
            description: 'Assigned to engineering team',
            metadata: { team: 'backend' },
            createdBy: 'admin',
          },
          {
            type: 'resolved',
            description: 'Fix deployed to production',
            metadata: { pr_number: 456, commit: 'abc123' },
            createdBy: 'deploy-bot',
          },
        ],
      },
    },
  });

  const escalation2 = await prisma.escalation.create({
    data: {
      errorId: 'sentry-error-456',
      title: 'API timeout in payment processing',
      description: 'Payment gateway experiencing intermittent timeouts',
      priority: 'high',
      status: 'in_progress',
      source: 'sentry',
      errorCount: 23,
      affectedUsers: 8,
      environment: 'production',
      tags: { module: 'payments', gateway: 'stripe' },
      events: {
        create: [
          {
            type: 'created',
            description: 'High priority error detected',
            createdBy: 'system',
          },
          {
            type: 'comment',
            description: 'Investigating timeout issues with Stripe API',
            createdBy: 'devops-team',
          },
        ],
      },
    },
  });

  // Seed Scheduled Reports
  console.log('📅 Creating scheduled reports...');
  const scheduledReport1 = await prisma.scheduledReport.create({
    data: {
      name: 'Daily Monitoring Report',
      description: 'Comprehensive daily report sent to operations team',
      frequency: 'daily',
      schedule: '0 0 * * *',
      enabled: true,
      format: 'html',
      sections: ['overview', 'sentry', 'conflicts', 'cicd'],
      recipients: ['ops@example.com', 'dev@example.com'],
      lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRunAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    },
  });

  const scheduledReport2 = await prisma.scheduledReport.create({
    data: {
      name: 'Weekly Executive Summary',
      description: 'High-level metrics for leadership team',
      frequency: 'weekly',
      schedule: '0 0 * * 0',
      enabled: true,
      format: 'markdown',
      sections: ['overview', 'systemHealth'],
      recipients: ['executives@example.com'],
      lastRunAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRunAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed Reports
  console.log('📝 Creating historical reports...');
  for (let i = 0; i < 10; i++) {
    const daysAgo = i;
    const periodEnd = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const periodStart = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);

    await prisma.report.create({
      data: {
        name: `Daily Report ${periodStart.toLocaleDateString()}`,
        frequency: 'daily',
        format: 'html',
        sections: ['overview', 'sentry', 'cicd'],
        content: `<h1>Monitoring Report</h1><p>Generated on ${periodEnd.toLocaleString()}</p>`,
        size: 2048 + Math.floor(Math.random() * 3000),
        periodStart,
        periodEnd,
        scheduledReportId: scheduledReport1.id,
      },
    });
  }

  // Seed Merge Conflicts
  console.log('🔀 Creating merge conflict records...');
  await prisma.mergeConflict.create({
    data: {
      filePath: 'package-lock.json',
      branch: 'feature/new-dependencies',
      baseBranch: 'main',
      strategy: 'packageLock',
      status: 'resolved',
      detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 3600, // 1 hour in seconds
      conflictSize: 150,
      metadata: { automatic: true, success: true },
    },
  });

  await prisma.mergeConflict.create({
    data: {
      filePath: 'src/config/settings.json',
      branch: 'feature/config-update',
      baseBranch: 'develop',
      strategy: 'jsonMerge',
      status: 'resolved',
      detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      duration: 1800,
      conflictSize: 25,
      metadata: { automatic: true, success: true },
    },
  });

  // Seed Health Snapshots
  console.log('💚 Creating health snapshots...');
  for (let i = 0; i < 24; i++) {
    const hoursAgo = i;
    const health = 85 + Math.floor(Math.random() * 15); // 85-100

    await prisma.healthSnapshot.create({
      data: {
        overallHealth: health,
        services: [
          { name: 'API Gateway', status: 'healthy', uptime: 99.9, responseTime: 45 },
          { name: 'Database', status: 'healthy', uptime: 100, responseTime: 12 },
          { name: 'Cache', status: 'healthy', uptime: 99.5, responseTime: 8 },
        ],
        metrics: {
          cpu: 30 + Math.floor(Math.random() * 40),
          memory: 50 + Math.floor(Math.random() * 30),
          disk: 60,
          network: 20 + Math.floor(Math.random() * 30),
        },
        trends: {
          health: 'stable',
          errorRate: 'down',
          performance: 'up',
        },
        alerts: i % 5 === 0 ? [{ severity: 'warning', message: 'CPU usage above 70%' }] : [],
        createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      },
    });
  }

  // Seed Pipeline Runs
  console.log('🔄 Creating pipeline runs...');
  const statuses = ['success', 'success', 'success', 'failed', 'success'];
  for (let i = 0; i < 15; i++) {
    const hoursAgo = i;
    const status = statuses[i % statuses.length];
    const startedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const duration = 300 + Math.floor(Math.random() * 600); // 5-15 minutes
    const completedAt = new Date(startedAt.getTime() + duration * 1000);

    await prisma.pipelineRun.create({
      data: {
        externalId: `github-run-${1000 + i}`,
        source: 'github',
        branch: i % 3 === 0 ? 'main' : `feature/branch-${i}`,
        status: 'completed',
        conclusion: status,
        startedAt,
        completedAt,
        duration,
        jobs: [
          { name: 'build', status, duration: Math.floor(duration * 0.4) },
          { name: 'test', status, duration: Math.floor(duration * 0.3) },
          { name: 'lint', status: 'success', duration: Math.floor(duration * 0.1) },
          { name: 'deploy', status, duration: Math.floor(duration * 0.2) },
        ],
        metadata: {
          commit: `abc123${i}`,
          author: 'developer@example.com',
        },
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\nCreated:');
  console.log(`  - ${await prisma.escalation.count()} escalations`);
  console.log(`  - ${await prisma.escalationEvent.count()} escalation events`);
  console.log(`  - ${await prisma.scheduledReport.count()} scheduled reports`);
  console.log(`  - ${await prisma.report.count()} historical reports`);
  console.log(`  - ${await prisma.mergeConflict.count()} merge conflicts`);
  console.log(`  - ${await prisma.healthSnapshot.count()} health snapshots`);
  console.log(`  - ${await prisma.pipelineRun.count()} pipeline runs`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
