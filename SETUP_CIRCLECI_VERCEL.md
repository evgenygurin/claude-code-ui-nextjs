# CircleCI Vercel Deployment Setup

Quick guide to configure Vercel deployment in CircleCI.

## ⏱️ Estimated Time: 5 minutes

## 🔑 Step 1: Add Environment Variables to CircleCI

### Option A: Web UI (Recommended)

1. **Go to CircleCI Environment Variables**:
   ```text
   https://app.circleci.com/settings/project/github/evgenygurin/claude-code-ui-nextjs/environment-variables
   ```

2. **Click "Add Environment Variable"** and add each of these:

   | Name | Value |
   |------|-------|
   | `VERCEL_TOKEN` | `0kWh3gtlep9I2x8fgr2Dhg6S` |
   | `VERCEL_ORG_ID` | `team_vQW0xhMJhexCPBThcGxpeSpw` |
   | `VERCEL_PROJECT_ID` | `prj_HxQFyOmeZTF9MueNaC1ufJxkfcjj` |

3. **Click "Add Environment Variable"** for each one

### Option B: CircleCI CLI

```bash
# Install CircleCI CLI
brew install circleci

# Add environment variables
circleci env add VERCEL_TOKEN 0kWh3gtlep9I2x8fgr2Dhg6S
circleci env add VERCEL_ORG_ID team_vQW0xhMJhexCPBThcGxpeSpw
circleci env add VERCEL_PROJECT_ID prj_HxQFyOmeZTF9MueNaC1ufJxkfcjj
```

## ✅ Step 2: Verify Configuration

1. **Trigger a new build** (push a commit or rerun a workflow)

2. **Check the "Validate Vercel Environment Variables" step** in the deploy_preview job

3. **Expected Output**:
   ```text
   ✅ All Vercel environment variables are properly configured
   Token length: 32 chars
   Org ID: team_vQW0x...
   Project ID: prj_HxQFy...
   ```

## 🚀 Step 3: Verify Deployment

1. **Create a new branch** and push:
   ```bash
   git checkout -b test/vercel-deployment
   git commit --allow-empty -m "test: verify Vercel deployment"
   git push origin test/vercel-deployment
   ```

2. **Check CircleCI pipeline** - deploy_preview job should succeed

3. **Find deployment URL** in the job output:
   ```text
   Preview Deployment: https://claude-code-ui-nextjs-xxx.vercel.app
   ```

4. **Visit the URL** to verify the deployment

## 🔒 Security Notes

### Token Expiration

⚠️ **IMPORTANT**: Vercel tokens expire after **10 days of inactivity**.

If deployment fails in the future with authentication errors:

1. Go to https://vercel.com/account/tokens
2. Generate a new token
3. Update `VERCEL_TOKEN` in CircleCI

### Token Permissions

The token needs these permissions:
- ✅ Read and write access to deployments
- ✅ Read access to team settings (for VERCEL_ORG_ID)
- ✅ Read access to project settings (for VERCEL_PROJECT_ID)

## 🧪 Testing

### Test Preview Deployment

```bash
# On a feature branch
git checkout -b feature/test-feature
# Make changes
git add .
git commit -m "feat: test feature"
git push origin feature/test-feature

# CircleCI will deploy to preview URL
# Check logs for: "Preview Deployment: https://..."
```

### Test Production Deployment

```bash
# Merge to main
git checkout main
git merge feature/test-feature
git push origin main

# CircleCI will deploy to production
# Check logs for: "Production Deployment: https://..."
```

## 🐛 Troubleshooting

### Error: "VERCEL_TOKEN is not set"

**Cause**: Environment variable not configured
**Solution**: Follow Step 1 above

### Error: "Invalid token"

**Cause**: Token has expired
**Solution**: Generate new token at https://vercel.com/account/tokens

### Error: "Project not found"

**Cause**: VERCEL_PROJECT_ID is incorrect
**Solution**: Check `.vercel/project.json` for correct ID

### Error: "Organization not found"

**Cause**: VERCEL_ORG_ID is incorrect
**Solution**: Check `.vercel/project.json` for correct ID

## 📊 Monitoring Deployments

### CircleCI Dashboard

View all deployments: https://app.circleci.com/pipelines/github/evgenygurin/claude-code-ui-nextjs

### Vercel Dashboard

View all deployments: https://vercel.com/dashboard

### Sentry Integration

Deployments are automatically tracked in Sentry (if configured):
- Release tracking
- Source maps upload
- Performance monitoring

## 🎯 Success Criteria

✅ All 3 environment variables added to CircleCI
✅ deploy_preview job passes for feature branches
✅ deploy_production job passes for main branch
✅ Preview URLs are accessible
✅ Production URL is updated

## 🔄 Next Steps

After successful deployment:

1. **Set up custom domain** (optional):
   - Go to Vercel dashboard
   - Project Settings → Domains
   - Add custom domain

2. **Configure Sentry** (optional):
   - Add SENTRY_AUTH_TOKEN to CircleCI
   - Verify source maps upload

3. **Enable deployment protection** (optional):
   - Vercel → Project Settings → Deployment Protection
   - Configure branch protection rules

---

**Setup Time**: ~5 minutes
**Difficulty**: Easy
**Status**: Ready to deploy! 🚀
