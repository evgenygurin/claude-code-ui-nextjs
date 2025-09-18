# CI/CD Setup Guide

## 🚀 Quick Start

This project is configured with CircleCI for continuous integration and Vercel for deployment.

## 📋 Setup Steps

### 1. CircleCI Configuration

1. **Connect Repository to CircleCI:**
   - Go to [CircleCI](https://app.circleci.com/)
   - Click "Add Projects"
   - Find `claude-code-ui-nextjs` repository
   - Click "Set Up Project"
   - Select "Use existing config" (we already have `.circleci/config.yml`)

2. **Add Environment Variables in CircleCI:**
   Go to Project Settings → Environment Variables and add:

   ```text
   VERCEL_TOKEN         # Get from https://vercel.com/account/tokens
   VERCEL_ORG_ID        # team_vQW0xhMJhexCPBThcGxpeSpw
   VERCEL_PROJECT_ID    # prj_HxQFyOmeZTF9MueNaC1ufJxkfcjj
   ```

### 2. Vercel Configuration

The project is already linked to Vercel:
- Team: eagurin's projects
- Project: claude-code-panel-1

### 3. Codegen Integration (Enterprise Only)

If you have Codegen enterprise access:
1. Visit https://codegen.com/integrations
2. Connect CircleCI
3. Grant read permissions
4. Codegen will automatically monitor and fix failing CI checks

## 🔄 Workflow

### On Push to Main Branch:
1. Install dependencies
2. Run linting
3. Run type checking  
4. Build application
5. Deploy to Vercel production

### On Pull Request:
1. Run all checks
2. Deploy preview to Vercel
3. Codegen analyzes failures (if enabled)
4. Automatic fixes committed (if enabled)

## 📊 Current Status

- ✅ CircleCI configuration created
- ✅ Vercel project linked
- ✅ Build passes locally
- ⏳ Waiting for environment variables in CircleCI
- ⏳ Waiting for first CI run

## 🛠️ Commands

```bash
# Local testing
npm run lint        # Check code style
npm run type-check  # Check TypeScript
npm run build       # Build production

# Deployment
vercel              # Deploy preview
vercel --prod       # Deploy production
```

## 📌 Important Notes

- The project uses minimal components for CI/CD demo purposes
- Directories `/components`, `/lib`, `/hooks`, `/types` are gitignored
- Focus is on CI/CD pipeline functionality, not application features

## 🔗 Links

- [CircleCI Dashboard](https://app.circleci.com/)
- [Vercel Dashboard](https://vercel.com/eagurins-projects/claude-code-panel-1)
- [GitHub Repository](https://github.com/evgenygurin/claude-code-ui-nextjs)
- [Codegen Documentation](https://docs.codegen.com/integrations/circleci)
