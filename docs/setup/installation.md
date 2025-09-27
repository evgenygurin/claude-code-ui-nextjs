# Installation Guide

This guide will walk you through setting up Claude Code UI on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js 20.0.0 or later** - [Download from nodejs.org](https://nodejs.org/)
- **npm 10.0.0 or later** (comes with Node.js)
- **Git** - [Download from git-scm.com](https://git-scm.com/)

### CLI Tools (Choose one or both)

- **Claude Code CLI** - [Installation guide](https://docs.anthropic.com/en/docs/claude-code)
- **Cursor CLI** - [Installation guide](https://docs.cursor.com/en/cli/overview)

### Verify Installation

Check that everything is properly installed:

```bash
node --version  # Should be 20.0.0 or later
npm --version   # Should be 10.0.0 or later
git --version   # Any recent version is fine
claude --version  # If using Claude Code
cursor --version  # If using Cursor
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/claude-code-ui-nextjs.git
cd claude-code-ui-nextjs
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- v0 components
- And many more

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred text editor:

```bash
# Required - Basic Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Required - AI Provider API Keys (choose one or both)
CLAUDE_API_KEY=your-claude-api-key
CURSOR_API_KEY=your-cursor-api-key

# Optional - Additional providers
OPENAI_API_KEY=your-openai-api-key

# Optional - Database (for production)
DATABASE_URL=postgresql://username:password@localhost:5432/claude-code-ui
```

#### Generating Secrets

For `NEXTAUTH_SECRET`, generate a secure random string:

```bash
openssl rand -base64 32
```

Or use an online generator: [generate-secret.vercel.app](https://generate-secret.vercel.app/)

### 4. API Key Setup

#### Claude API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Add it to your `.env` file as `CLAUDE_API_KEY`

#### Cursor API Key

1. Install Cursor IDE
2. Sign up for Cursor Pro (if needed)
3. Get your API key from Cursor settings
4. Add it to your `.env` file as `CURSOR_API_KEY`

#### OpenAI API Key (Optional)

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account and add billing
3. Generate an API key
4. Add it to your `.env` file as `OPENAI_API_KEY`

### 5. Database Setup (Optional)

For development, the app can work without a database. For production or full features:

#### Option A: PostgreSQL (Recommended)

1. Install PostgreSQL locally or use a cloud service
2. Create a database named `claude_code_ui`
3. Update `DATABASE_URL` in `.env`
4. Run database migrations:

```bash
npx prisma migrate dev
```

#### Option B: SQLite (Development)

For local development, you can use SQLite:

```bash
# Update .env
DATABASE_URL="file:./dev.db"

# Run migrations
npx prisma migrate dev
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api

### 7. Verify Installation

1. Open http://localhost:3000 in your browser
2. You should see the Claude Code UI landing page
3. Click "Get Started" to test authentication
4. Try creating a new project or session

## Post-Installation Setup

### CLI Integration

#### Configure Claude Code

1. Run Claude Code in a project directory:

   ```bash
   cd /path/to/your/project
   claude
   ```

2. Verify it works in the terminal first
3. The web UI will automatically detect Claude Code sessions

#### Configure Cursor

1. Open Cursor IDE
2. Open a project in Cursor
3. Use Cursor CLI commands to verify setup
4. The web UI will integrate with Cursor sessions

### Project Organization

Create a workspace directory for your projects:

```bash
mkdir ~/claude-code-workspace
cd ~/claude-code-workspace

# Example projects
mkdir my-next-app
mkdir my-python-api
mkdir my-documentation
```

## Troubleshooting

### Common Issues

#### Port Already in Use

If port 3000 is busy:

```bash
# Use a different port
PORT=3001 npm run dev

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

#### Permission Errors

On macOS/Linux, you might need to fix permissions:

```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Module Not Found Errors

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variables Not Loading

Ensure your `.env` file is in the project root and restart the dev server:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](../guides/troubleshooting.md)
2. Search [existing issues](https://github.com/your-org/claude-code-ui-nextjs/issues)
3. Create a [new issue](https://github.com/your-org/claude-code-ui-nextjs/issues/new)
4. Join our [Discord community](https://discord.gg/your-community)

## Next Steps

Once you have Claude Code UI running:

1. **[Environment Configuration](./environment.md)** - Configure all environment variables
2. **[Development Setup](./development.md)** - Set up your development environment
3. **[First Project](../guides/first-project.md)** - Create your first project
4. **[API Reference](../api/reference.md)** - Explore the API capabilities

## Development vs Production

This installation guide is for **development**. For production deployment:

- Use [Vercel Deployment Guide](../deployment/vercel.md) for easy cloud deployment
- Use [Self-Hosted Guide](../deployment/self-hosted.md) for custom infrastructure
- Follow [Security Best Practices](../security/best-practices.md)

---

🎉 **Congratulations!** You now have Claude Code UI running locally. Start building amazing AI-powered applications!
