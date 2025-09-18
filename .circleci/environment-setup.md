# CircleCI Environment Variables Setup

## Required Environment Variables

Set these in CircleCI Project Settings → Environment Variables:

### Vercel Deployment
- `VERCEL_TOKEN` - Your Vercel API token (get from https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - Your Vercel organization ID (team_vQW0xhMJhexCPBThcGxpeSpw)
- `VERCEL_PROJECT_ID` - Will be created after first deployment

### Application Environment Variables
- `NEXTAUTH_URL` - Application URL (e.g., https://claude-code-panel.vercel.app)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `CLAUDE_API_KEY` - Your Claude API key
- `CURSOR_API_KEY` - Your Cursor API key (optional)
- `DATABASE_URL` - PostgreSQL connection string (optional)
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `V0_API_KEY` - V0 API key (optional)

## Setup Steps

1. **Create Vercel Token:**
   ```bash
   # Go to https://vercel.com/account/tokens
   # Create a new token with full access
   ```

2. **Get Organization ID:**
   ```bash
   # Already identified: team_vQW0xhMJhexCPBThcGxpeSpw
   ```

3. **Link Project to Vercel:**
   ```bash
   npx vercel link
   # Select the team: "eagurin's projects"
   # Set up as new project
   ```

4. **Add to CircleCI:**
   - Go to CircleCI dashboard
   - Select your project
   - Go to Project Settings → Environment Variables
   - Add each variable listed above

## Codegen Integration

For Codegen to work with CircleCI:

1. **Connect CircleCI to Codegen:**
   - Visit https://codegen.com/integrations
   - Connect CircleCI account
   - Grant read permissions

2. **Configure Codegen:**
   - Codegen will automatically monitor PR checks
   - When checks fail, it will analyze logs
   - Automatic fixes will be committed to PR branches

## Testing the Setup

1. **Local Build Test:**
   ```bash
   npm run build
   npm run type-check
   npm run lint
   ```

2. **Push to Repository:**
   ```bash
   git add .
   git commit -m "feat: add CircleCI configuration for CI/CD"
   git push origin main
   ```

3. **Monitor CircleCI:**
   - Check https://app.circleci.com
   - Verify pipeline runs successfully

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check Node version matches (20.x)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Deployment Failures:**
   - Verify VERCEL_TOKEN is correct
   - Check Vercel project exists
   - Ensure environment variables are set

3. **Codegen Not Working:**
   - Verify CircleCI integration is connected
   - Check Codegen has repository access
   - Ensure PR checks are enabled

## Next Steps

1. Create PR to test preview deployments
2. Merge to main to test production deployment
3. Monitor Codegen for automatic fixes
4. Set up monitoring and alerts
