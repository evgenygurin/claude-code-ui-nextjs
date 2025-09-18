#!/bin/bash

# Setup verification script
# Checks if all CI/CD components are properly configured

set -e

echo "🔍 Verifying CI/CD Setup..."
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Success and error functions
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if files exist
echo "📁 Checking configuration files..."

files_to_check=(
    ".circleci/config.yml:CircleCI configuration"
    ".github/workflows/vercel-deployment.yml:GitHub Actions workflow"
    "vercel.json:Vercel configuration"
    ".vercelignore:Vercel ignore rules"
    "scripts/setup-vercel.sh:Vercel setup script"
    "docs/deployment.md:Deployment documentation"
)

for item in "${files_to_check[@]}"; do
    file="${item%%:*}"
    description="${item##*:}"
    
    if [ -f "$file" ]; then
        success "$description found"
    else
        error "$description missing"
    fi
done

echo ""

# Check package.json scripts
echo "📦 Checking package.json scripts..."

required_scripts=(
    "deploy:preview"
    "deploy:production"
    "setup:vercel"
    "ci:quality"
    "prepare:deploy"
)

if [ -f "package.json" ]; then
    for script in "${required_scripts[@]}"; do
        if grep -q "\"$script\":" package.json; then
            success "Script '$script' found"
        else
            error "Script '$script' missing"
        fi
    done
else
    error "package.json not found"
fi

echo ""

# Check Vercel CLI
echo "🚀 Checking Vercel CLI..."

if command -v vercel &> /dev/null; then
    success "Vercel CLI installed"
    
    if vercel whoami &> /dev/null; then
        USER=$(vercel whoami 2>/dev/null)
        success "Authenticated as: $USER"
    else
        warning "Vercel CLI not authenticated - run 'vercel login'"
    fi
else
    warning "Vercel CLI not installed - run 'npm install -g vercel@latest'"
fi

echo ""

# Check Node.js version
echo "⚙️  Checking Node.js environment..."

NODE_VERSION=$(node --version)
REQUIRED_VERSION="v20"

if [[ "$NODE_VERSION" > "$REQUIRED_VERSION" ]] || [[ "$NODE_VERSION" == "$REQUIRED_VERSION"* ]]; then
    success "Node.js version: $NODE_VERSION"
else
    warning "Node.js version $NODE_VERSION (recommended: $REQUIRED_VERSION+)"
fi

# Check npm version
NPM_VERSION=$(npm --version)
success "npm version: $NPM_VERSION"

echo ""

# Check environment variables in .env.example
echo "🔐 Checking environment variables..."

if [ -f ".env.example" ]; then
    success ".env.example found"
    
    env_vars=(
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "CLAUDE_API_KEY"
        "CURSOR_API_KEY"
        "DATABASE_URL"
    )
    
    for var in "${env_vars[@]}"; do
        if grep -q "$var" .env.example; then
            success "Environment variable '$var' documented"
        else
            warning "Environment variable '$var' not in .env.example"
        fi
    done
else
    warning ".env.example not found"
fi

echo ""

# Try to build the project
echo "🔨 Testing build process..."

if npm run build --silent &> /dev/null; then
    success "Build successful"
else
    error "Build failed - check your code and dependencies"
fi

echo ""

# Check git setup
echo "📋 Checking git setup..."

if [ -d ".git" ]; then
    success "Git repository initialized"
    
    if git remote get-url origin &> /dev/null; then
        REMOTE=$(git remote get-url origin)
        success "Remote origin: $REMOTE"
    else
        warning "No git remote origin set"
    fi
    
    BRANCH=$(git branch --show-current)
    success "Current branch: $BRANCH"
else
    error "Not a git repository"
fi

echo ""

# Summary
echo "📊 Setup Summary"
echo "=================="

if [ -f ".circleci/config.yml" ] && [ -f ".github/workflows/vercel-deployment.yml" ]; then
    success "CI/CD pipelines configured"
else
    error "CI/CD pipelines incomplete"
fi

if [ -f "vercel.json" ] && [ -f ".vercelignore" ]; then
    success "Vercel deployment configured"
else
    error "Vercel deployment incomplete"
fi

if command -v vercel &> /dev/null && vercel whoami &> /dev/null; then
    success "Vercel CLI ready"
else
    warning "Vercel CLI needs setup"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Run 'npm run setup:vercel' to configure Vercel"
echo "2. Set up CircleCI contexts and environment variables"
echo "3. Add GitHub repository secrets for backup pipeline"
echo "4. Push to trigger your first deployment!"
echo ""
echo "📚 See docs/deployment.md for detailed instructions"