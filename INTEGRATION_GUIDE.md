# Integration Guide

Comprehensive guide for integrating real data sources, email notifications, and database persistence with the monitoring system.

## Table of Contents

1. [Database Setup](#database-setup)
2. [Sentry Integration](#sentry-integration)
3. [GitHub Integration](#github-integration)
4. [Email Service Integration](#email-service-integration)
5. [Feature Flags](#feature-flags)
6. [Testing](#testing)

## Database Setup

### Prerequisites

- PostgreSQL 14+ installed locally or access to a hosted instance
- Database created for the project

### 1. Install Dependencies

```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Configure Database URL

Add to `.env.local`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/claude_code_ui"
```

### 3. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database schema
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate dev --name init
```

### 4. View Database

```bash
# Open Prisma Studio to view/edit data
npx prisma studio
```

### Database Models

The schema includes:

- **Escalation**: Error escalations with priority and status tracking
- **EscalationEvent**: Timeline events for escalations
- **Report**: Generated reports storage
- **ScheduledReport**: Scheduled report configurations
- **MergeConflict**: Merge conflict resolution tracking
- **HealthSnapshot**: System health snapshots over time
- **PipelineRun**: CI/CD pipeline run history

## Sentry Integration

### Prerequisites

- Sentry account with a project
- Auth token with appropriate permissions

### 1. Generate Sentry Auth Token

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Select scopes:
   - `project:read`
   - `event:read`
   - `org:read`
4. Copy the token

### 2. Get Organization and Project Slugs

```bash
# Organization slug: found in URL
# https://sentry.io/organizations/YOUR_ORG_SLUG/
# Project slug: found in project settings
```

### 3. Configure Environment Variables

Add to `.env.local`:

```env
SENTRY_AUTH_TOKEN="your-auth-token-here"
SENTRY_ORG_SLUG="your-organization-slug"
SENTRY_PROJECT_SLUG="your-project-slug"
```

### 4. Enable Real Data

```env
ENABLE_REAL_DATA="true"
```

### API Usage

The Sentry client provides:

```typescript
import { createSentryClient } from '@/lib/integrations/sentry-client';

const client = createSentryClient();

if (client) {
  // Get recent issues
  const issues = await client.getIssues({ statsPeriod: '24h' });

  // Get error trends
  const trends = await client.getErrorTrends(7);

  // Get top errors
  const topErrors = await client.getTopErrors(10);
}
```

## GitHub Integration

### Prerequisites

- GitHub account with repository access
- Personal access token

### 1. Generate GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Select scopes:
   - `repo` (full control)
   - `workflow` (for Actions data)
4. Copy the token

### 2. Get Repository Information

```bash
# Owner: your username or organization name
# Repo: repository name (not full URL)
```

### 3. Configure Environment Variables

Add to `.env.local`:

```env
GITHUB_TOKEN="ghp_your-token-here"
GITHUB_OWNER="your-username-or-org"
GITHUB_REPO="your-repo-name"
```

### 4. Enable Real Data

```env
ENABLE_REAL_DATA="true"
```

### API Usage

The GitHub client provides:

```typescript
import { createGitHubClient } from '@/lib/integrations/github-client';

const client = createGitHubClient();

if (client) {
  // Get CI/CD health
  const health = await client.getCICDHealth(24);

  // Get job performance
  const jobPerf = await client.getJobPerformance(50);

  // Get merge conflicts
  const conflicts = await client.getMergeConflicts(7);
}
```

## Email Service Integration

### Option 1: SendGrid

**Recommended for: Production deployments**

1. Create account at https://sendgrid.com
2. Generate API key with "Mail Send" permissions
3. Verify sender email address

```env
EMAIL_PROVIDER="sendgrid"
EMAIL_FROM="monitoring@yourcompany.com"
SENDGRID_API_KEY="SG.your-api-key"
```

### Option 2: Resend

**Recommended for: Modern apps, best developer experience**

1. Create account at https://resend.com
2. Add and verify your domain
3. Generate API key

```env
EMAIL_PROVIDER="resend"
EMAIL_FROM="monitoring@yourcompany.com"
RESEND_API_KEY="re_your-api-key"
```

### Option 3: AWS SES

**Recommended for: AWS infrastructure**

1. Set up AWS SES in your region
2. Verify email addresses or domain
3. Move out of sandbox mode
4. Configure AWS credentials

```env
EMAIL_PROVIDER="ses"
EMAIL_FROM="monitoring@yourcompany.com"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### Option 4: SMTP

**Recommended for: On-premise or custom mail servers**

```env
EMAIL_PROVIDER="smtp"
EMAIL_FROM="monitoring@yourcompany.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

For Gmail:
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use that password in SMTP_PASS

### Enable Email Notifications

```env
ENABLE_EMAIL_NOTIFICATIONS="true"
```

### API Usage

```typescript
import { createEmailService } from '@/lib/email/email-service';

const emailService = createEmailService();

if (emailService) {
  // Send report
  await emailService.sendReport({
    recipients: ['admin@company.com'],
    reportName: 'Daily Monitoring Report',
    reportContent: htmlContent,
    reportFormat: 'html',
    frequency: 'daily',
  });

  // Send alert
  await emailService.sendAlert({
    recipients: ['ops@company.com'],
    title: 'Critical Error Detected',
    message: 'High error rate detected in production',
    priority: 'critical',
    metadata: { errorCount: 150, affectedUsers: 50 },
  });
}
```

## Feature Flags

Control which integrations are active:

```env
# Use real data from Sentry, GitHub APIs
ENABLE_REAL_DATA="false"

# Send actual email notifications
ENABLE_EMAIL_NOTIFICATIONS="false"

# Persist reports and metrics to database
ENABLE_DATABASE_PERSISTENCE="false"
```

### Development Mode

For local development, keep flags disabled:

```env
ENABLE_REAL_DATA="false"
ENABLE_EMAIL_NOTIFICATIONS="false"
ENABLE_DATABASE_PERSISTENCE="false"
```

This uses mock data and logs email notifications to console.

### Staging Mode

For staging environment, enable selectively:

```env
ENABLE_REAL_DATA="true"
ENABLE_EMAIL_NOTIFICATIONS="false"  # Don't spam real emails
ENABLE_DATABASE_PERSISTENCE="true"
```

### Production Mode

For production, enable all:

```env
ENABLE_REAL_DATA="true"
ENABLE_EMAIL_NOTIFICATIONS="true"
ENABLE_DATABASE_PERSISTENCE="true"
```

## Testing

### Test Database Connection

```bash
npx prisma db pull
```

Should complete without errors.

### Test Sentry Integration

```bash
# Create a test script
node -e "
const client = require('./lib/integrations/sentry-client').createSentryClient();
client.getIssues({ limit: 1 }).then(console.log).catch(console.error);
"
```

Should return Sentry issues or empty array.

### Test GitHub Integration

```bash
# Create a test script
node -e "
const client = require('./lib/integrations/github-client').createGitHubClient();
client.getWorkflowRuns({ per_page: 1 }).then(console.log).catch(console.error);
"
```

Should return GitHub workflow runs.

### Test Email Service

```bash
# Create a test endpoint
# POST /api/test/email
# Body: { "to": "your-email@example.com" }
```

Check your email inbox.

## Troubleshooting

### Database Issues

**Error: Can't reach database server**
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify network/firewall settings

**Error: Invalid schema**
- Run `npx prisma generate`
- Run `npx prisma db push`

### Sentry Issues

**Error: Invalid token**
- Generate new token at Sentry
- Check token has correct scopes
- Update SENTRY_AUTH_TOKEN

**Error: Organization not found**
- Verify SENTRY_ORG_SLUG matches URL
- Check token has access to organization

### GitHub Issues

**Error: Bad credentials**
- Generate new personal access token
- Ensure token has `repo` and `workflow` scopes
- Update GITHUB_TOKEN

**Error: Resource not accessible**
- Verify GITHUB_OWNER and GITHUB_REPO
- Check token has access to repository

### Email Issues

**SendGrid: Unauthorized**
- Verify API key is correct
- Check API key hasn't been revoked
- Ensure sender email is verified

**SES: Email address not verified**
- Verify sender email in AWS SES
- Move out of SES sandbox mode for production

**SMTP: Authentication failed**
- For Gmail, use app-specific password
- Check SMTP credentials
- Verify SMTP settings (host, port, secure)

## Security Best Practices

1. **Never commit credentials**
   - Add `.env.local` to `.gitignore`
   - Use environment variables in production

2. **Rotate tokens regularly**
   - Set calendar reminders for token rotation
   - Use short-lived tokens when possible

3. **Minimum permissions**
   - Grant only necessary scopes
   - Use read-only tokens where possible

4. **Secure storage**
   - Use secret management services in production
   - Examples: AWS Secrets Manager, HashiCorp Vault

5. **Monitor API usage**
   - Track API call volumes
   - Set up alerts for unusual activity

## Production Checklist

- [ ] Database migrations applied
- [ ] All environment variables configured
- [ ] Sentry integration tested
- [ ] GitHub integration tested
- [ ] Email service tested
- [ ] Feature flags set correctly
- [ ] Security review completed
- [ ] Monitoring dashboard accessible
- [ ] Reports generating successfully
- [ ] Alerts being sent as expected

---

For additional help, see:
- [MONITORING_DASHBOARD.md](./MONITORING_DASHBOARD.md) - Dashboard documentation
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - Development roadmap
- [README.md](./README.md) - Project overview
