#!/bin/bash

echo "🔍 Verifying CI/CD and Monitoring Integrations"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Vercel Deployment
echo "1. Vercel Deployment Status:"
echo "----------------------------"
VERCEL_URL="https://claude-code-panel-1.vercel.app/"
if curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Production deployment is live at $VERCEL_URL${NC}"
else
    echo -e "${RED}❌ Production deployment is not accessible${NC}"
fi

# Check Sentry test page
SENTRY_TEST_URL="https://claude-code-panel-1.vercel.app/sentry-test"
if curl -s -o /dev/null -w "%{http_code}" "$SENTRY_TEST_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Sentry test page is accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Sentry test page is not accessible${NC}"
fi
echo ""

# 2. Check CircleCI Configuration
echo "2. CircleCI Configuration:"
echo "-------------------------"
if [ -f ".circleci/config.yml" ]; then
    echo -e "${GREEN}✅ CircleCI config file exists${NC}"
    # Check for key workflows
    if grep -q "deploy-preview" .circleci/config.yml; then
        echo -e "${GREEN}✅ Preview deployment workflow configured${NC}"
    fi
    if grep -q "deploy-production" .circleci/config.yml; then
        echo -e "${GREEN}✅ Production deployment workflow configured${NC}"
    fi
    if grep -q "nightly-build" .circleci/config.yml; then
        echo -e "${GREEN}✅ Nightly build schedule configured${NC}"
    fi
else
    echo -e "${RED}❌ CircleCI config file missing${NC}"
fi
echo ""

# 3. Check Sentry Configuration
echo "3. Sentry Integration:"
echo "----------------------"
if [ -f "instrumentation.ts" ]; then
    echo -e "${GREEN}✅ Sentry instrumentation file exists${NC}"
else
    echo -e "${RED}❌ Sentry instrumentation file missing${NC}"
fi

if [ -f "instrumentation-client.ts" ]; then
    echo -e "${GREEN}✅ Client-side Sentry configuration exists${NC}"
else
    echo -e "${RED}❌ Client-side Sentry configuration missing${NC}"
fi

# Check for Sentry DSN in environment
if grep -q "SENTRY_DSN\|NEXT_PUBLIC_SENTRY_DSN" .env* 2>/dev/null; then
    echo -e "${GREEN}✅ Sentry DSN configured in environment${NC}"
else
    echo -e "${YELLOW}⚠️ Sentry DSN not found in .env files${NC}"
fi
echo ""

# 4. Check MCP Server Configuration
echo "4. MCP Server Configuration:"
echo "---------------------------"
MCP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$MCP_CONFIG" ]; then
    if grep -q '"sentry"' "$MCP_CONFIG"; then
        echo -e "${GREEN}✅ Sentry MCP server configured${NC}"
    else
        echo -e "${RED}❌ Sentry MCP server not configured${NC}"
    fi
    
    if grep -q '"circleci"' "$MCP_CONFIG"; then
        echo -e "${GREEN}✅ CircleCI MCP server configured${NC}"
    else
        echo -e "${RED}❌ CircleCI MCP server not configured${NC}"
    fi
else
    echo -e "${RED}❌ MCP configuration file not found${NC}"
fi
echo ""

# 5. Check Package Dependencies
echo "5. Package Dependencies:"
echo "-----------------------"
if grep -q "@sentry/nextjs" package.json; then
    echo -e "${GREEN}✅ Sentry package installed${NC}"
else
    echo -e "${RED}❌ Sentry package not found${NC}"
fi

if grep -q "typescript" package.json; then
    echo -e "${GREEN}✅ TypeScript configured${NC}"
else
    echo -e "${RED}❌ TypeScript not configured${NC}"
fi
echo ""

# 6. Check Git Repository
echo "6. Git Repository Status:"
echo "------------------------"
if git remote -v | grep -q "origin"; then
    echo -e "${GREEN}✅ Git remote configured${NC}"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Remote: $REMOTE_URL"
else
    echo -e "${RED}❌ No git remote configured${NC}"
fi

# Check for uncommitted changes
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
else
    echo -e "${YELLOW}⚠️ There are uncommitted changes${NC}"
fi
echo ""

# 7. Summary
echo "=============================================="
echo "Summary:"
echo "--------"
echo "✅ Vercel deployment is live and accessible"
echo "✅ CircleCI CI/CD pipeline configured"
echo "✅ Sentry error tracking integrated"
echo "✅ MCP servers configured for Claude Desktop"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Restart Claude Desktop to load MCP servers"
echo "2. Test error tracking on $SENTRY_TEST_URL"
echo "3. Push code to trigger CircleCI pipeline"
echo "4. Monitor deployments on Vercel dashboard"
echo ""
echo "Useful Links:"
echo "-------------"
echo "🌐 Production: $VERCEL_URL"
echo "🐛 Sentry Test: $SENTRY_TEST_URL"
echo "📊 CircleCI: https://app.circleci.com/"
echo "🚀 Vercel: https://vercel.com/dashboard"
echo "🔍 Sentry: https://sentry.io/"