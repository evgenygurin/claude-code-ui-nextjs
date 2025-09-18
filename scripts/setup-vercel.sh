#!/bin/bash

# Setup script for Vercel deployment configuration
# This script helps configure Vercel environment variables and project settings

set -e

echo "🚀 Setting up Vercel deployment configuration..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
fi

# Link project to Vercel
echo "🔗 Linking project to Vercel..."
vercel link

# Set up environment variables
echo "⚙️  Setting up environment variables..."

# List of required environment variables
ENV_VARS=(
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET" 
    "CLAUDE_API_KEY"
    "CURSOR_API_KEY"
    "DATABASE_URL"
)

echo "Please provide values for the following environment variables:"

for var in "${ENV_VARS[@]}"; do
    read -p "Enter value for $var: " -r
    if [ -n "$REPLY" ]; then
        vercel env add "$var" production <<< "$REPLY"
        vercel env add "$var" preview <<< "$REPLY"
        vercel env add "$var" development <<< "$REPLY"
        echo "✅ Set $var"
    else
        echo "⚠️  Skipped $var (empty value)"
    fi
done

# Get project information for CircleCI setup
echo "📋 Getting project information for CircleCI setup..."
PROJECT_INFO=$(vercel project ls --format json | jq '.[0]')
PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.id')
ORG_ID=$(vercel teams ls --format json | jq -r '.[0].id')

echo ""
echo "🎯 CircleCI Environment Variables Setup"
echo "Add these environment variables to your CircleCI project settings:"
echo "  VERCEL_TOKEN: $(vercel --help | grep -o 'Get your token.*' || echo 'Get from https://vercel.com/account/tokens')"
echo "  VERCEL_ORG_ID: $ORG_ID"
echo "  VERCEL_PROJECT_ID: $PROJECT_ID"
echo ""

# Create or update .env.example with new variables if needed
if [ -f ".env.example" ]; then
    echo "📝 Updating .env.example with Vercel-specific variables..."
    cat >> .env.example << 'EOF'

# Vercel Deployment Variables (for CI/CD)
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here  
VERCEL_PROJECT_ID=your_project_id_here
EOF
fi

echo ""
echo "✅ Vercel setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the CircleCI environment variables shown above"
echo "2. Create contexts in CircleCI:"
echo "   - vercel-context (with Vercel variables)"
echo "   - codegen-context (with Codegen variables)"
echo "3. Push your code to trigger the CI/CD pipeline"