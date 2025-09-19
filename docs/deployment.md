# CI/CD Deployment Guide

This guide covers the complete CI/CD setup for deploying the Claude Code UI to Vercel using CircleCI and GitHub Actions.

## Overview

The project is configured with dual CI/CD pipelines:

- **Primary**: CircleCI with Codegen integration
- **Backup**: GitHub Actions workflow

Both pipelines deploy to Vercel with preview deployments for PRs and production deployments for the main branch.

## Quick Setup

### 1. Prerequisites

- Node.js 20+ and npm 10+
- Vercel account and CLI access
- CircleCI account (primary pipeline)
- GitHub repository with Actions enabled
- Codegen account for code analysis

### 2. One-Command Setup

```bash
npm run setup:vercel
```

This script will:

- Install Vercel CLI if needed
- Link your project to Vercel
- Set up environment variables
- Provide CircleCI configuration values

## Manual Setup

### Step 1: Vercel Configuration

1. **Install and authenticate Vercel CLI:**

   ```bash
   npm install -g vercel@latest
   vercel login
   ```

2. **Link project to Vercel:**

   ```bash
   vercel link
   ```

3. **Set up environment variables:**

   ```bash
   vercel env add NEXTAUTH_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add CLAUDE_API_KEY production
   vercel env add CURSOR_API_KEY production
   vercel env add DATABASE_URL production
   ```

   Repeat for `preview` and `development` environments.

4. **Get project information:**
   ```bash
   # Get project ID
   vercel project ls
   # Get organization ID
   vercel teams ls
   ```

### Step 2: CircleCI Configuration

1. **Create CircleCI contexts:**
   - `vercel-context` - for Vercel deployment variables
   - `codegen-context` - for Codegen integration

2. **Add environment variables to contexts:**

   **vercel-context:**
   - `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` - From `vercel teams ls`
   - `VERCEL_PROJECT_ID` - From `vercel project ls`

   **codegen-context:**
   - `CODEGEN_API_KEY` - Get from https://docs.codegen.com/integrations/circleci

3. **Enable CircleCI for your repository:**
   - Go to CircleCI dashboard
   - Add your project
   - Ensure contexts are properly assigned

### Step 3: GitHub Secrets (for backup pipeline)

Add these secrets to your GitHub repository:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `CODEGEN_API_KEY`

## Pipeline Features

### CircleCI Pipeline

The primary CircleCI pipeline includes:

- **Dependency caching** - Faster builds with npm cache
- **Quality checks** - ESLint and TypeScript validation
- **Build verification** - Ensures application builds successfully
- **Codegen analysis** - Automated code review and insights
- **Preview deployments** - Automatic preview URLs for all PRs
- **Production deployments** - Automatic production deployment for main branch
- **Nightly analysis** - Scheduled Codegen analysis for main branch

### GitHub Actions Pipeline

The backup GitHub Actions pipeline provides:

- **Quality assurance** - Linting and type checking
- **Codegen integration** - PR comments with analysis results
- **Preview deployments** - Automatic preview URLs with PR comments
- **Production deployments** - Production deployment for main branch
- **Deployment summaries** - Detailed deployment information

## Environment Variables

### Required for Runtime

| Variable          | Description                | Example                       |
| ----------------- | -------------------------- | ----------------------------- |
| `NEXTAUTH_URL`    | NextAuth base URL          | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth secret key        | `your-secret-key`             |
| `CLAUDE_API_KEY`  | Claude API key             | `sk-ant-...`                  |
| `CURSOR_API_KEY`  | Cursor API key             | `cursor_...`                  |
| `DATABASE_URL`    | Database connection string | `postgresql://...`            |

### Required for CI/CD

| Variable            | Description                 | Where to Get                      |
| ------------------- | --------------------------- | --------------------------------- |
| `VERCEL_TOKEN`      | Vercel authentication token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID`     | Vercel organization ID      | `vercel teams ls`                 |
| `VERCEL_PROJECT_ID` | Vercel project ID           | `vercel project ls`               |
| `CODEGEN_API_KEY`   | Codegen API key             | https://docs.codegen.com          |

## Deployment Workflows

### Branch-based Deployment

- **Feature branches** → Preview deployment to `*.vercel.app`
- **Pull requests** → Preview deployment + Codegen analysis
- **Main branch** → Production deployment to your custom domain

### Manual Deployment

```bash
# Deploy preview
npm run deploy:preview

# Deploy to production
npm run deploy:production

# Full quality check + build
npm run ci:quality
```

## Troubleshooting

### Common Issues

1. **Vercel Token Issues**

   ```bash
   vercel whoami  # Check if authenticated
   vercel login   # Re-authenticate if needed
   ```

2. **Build Failures**

   ```bash
   npm run ci:quality  # Run full quality checks locally
   ```

3. **Environment Variable Issues**

   ```bash
   vercel env ls  # List all environment variables
   vercel env add VAR_NAME production  # Add missing variables
   ```

4. **CircleCI Context Issues**
   - Ensure contexts are created and assigned to workflows
   - Check that all required variables are in the correct context

### Debug Commands

```bash
# Test build locally
npm run build

# Check type errors
npm run type-check

# Check linting issues
npm run lint

# Clean and rebuild
npm run clean && npm run build
```

## File Structure

```
.circleci/
├── config.yml                 # CircleCI pipeline configuration

.github/
└── workflows/
    └── vercel-deployment.yml   # GitHub Actions backup pipeline

scripts/
└── setup-vercel.sh            # Automated setup script

.vercelignore                   # Vercel deployment ignore rules
vercel.json                     # Vercel project configuration
```

## Monitoring and Maintenance

### Performance Monitoring

- Vercel Analytics - Built-in performance monitoring
- Codegen Analysis - Code quality trends over time
- CircleCI Insights - Build performance and success rates

### Regular Maintenance

- Update dependencies monthly
- Review Codegen analysis reports
- Monitor deployment success rates
- Rotate API tokens quarterly

## Security Best Practices

1. **API Keys**
   - Store all secrets in environment variables
   - Use different keys for different environments
   - Rotate keys regularly

2. **Vercel Configuration**
   - Enable branch protection rules
   - Use preview deployments for testing
   - Monitor deployment logs

3. **CircleCI Security**
   - Use contexts for sensitive variables
   - Enable restricted contexts for production
   - Audit context access regularly

## Support

For issues with:

- **Vercel deployment**: Check Vercel dashboard and logs
- **CircleCI pipeline**: Review CircleCI build logs and contexts
- **Codegen integration**: Refer to https://docs.codegen.com/integrations/circleci
- **GitHub Actions**: Check Actions tab in your repository

## Next Steps

After successful setup:

1. Push a test branch to verify preview deployments
2. Create a test PR to verify Codegen analysis
3. Merge to main to verify production deployment
4. Set up custom domain in Vercel dashboard
5. Configure team access and permissions
