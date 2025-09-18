# Basic Setup Example

This guide shows you how to get started with Claude Code UI for the first time.

## Prerequisites

Before you begin, make sure you have:

- Node.js 20+ installed
- Claude Code CLI or Cursor CLI installed
- A Claude API key (from Anthropic Console)
- Git configured on your system

## Step 1: Installation

```bash
# Clone the repository
git clone https://github.com/your-org/claude-code-ui-nextjs.git
cd claude-code-ui-nextjs

# Install dependencies
npm install
```

## Step 2: Environment Setup

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
CLAUDE_API_KEY=sk-ant-api03-your-claude-key-here

# Optional (for Cursor integration)
CURSOR_API_KEY=your-cursor-key-here
```

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

## Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 4: First Login

1. Click "Get Started" on the landing page
2. You'll be redirected to the authentication page
3. For development, you can use the default auth provider
4. After login, you'll see the dashboard

## Step 5: Basic Usage

### Chat with Claude

1. In the dashboard, you'll see the AI chat interface on the right panel
2. Type a message like "Hello, can you help me with JavaScript?"
3. Press Enter or click the send button
4. Claude will respond with helpful information

### Use the Terminal

1. The terminal is located at the bottom of the right panel
2. Try typing basic commands:
   ```bash
   pwd
   ls
   echo "Hello World"
   ```
3. The terminal supports command history (use arrow keys)

### Browse Files

1. The file explorer is in the middle of the right panel
2. Click on folders to expand them
3. Click on files to view their contents
4. Use the "+" button to create new files or folders

## Step 6: Project Integration

### Connect a Real Project

1. Open your terminal (outside of the browser)
2. Navigate to your project directory
3. Start Claude Code CLI:
   ```bash
   cd /path/to/your/project
   claude
   ```
4. In the browser, you can now interact with your actual project

### Advanced Features

Once you're comfortable with the basics, explore:

- **Real-time collaboration** - Multiple users in the same session
- **Git integration** - View commits, branches, and diffs
- **File editing** - Edit files directly in the browser
- **AI-powered assistance** - Get help with coding tasks

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
PORT=3001 npm run dev
```

**Authentication not working:**
- Check your `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your development URL

**Claude API not responding:**
- Verify your `CLAUDE_API_KEY` is correct
- Check your Anthropic Console for API usage limits

**Terminal commands not working:**
- Terminal commands are simulated in development
- For real command execution, integrate with actual CLI tools

## Next Steps

- [Deploy to Production](../deployment/vercel.md)
- [Configure Advanced Features](../guides/advanced-configuration.md)
- [Integrate with Your Team](../guides/team-setup.md)
- [Customize the Interface](../components/theming.md)

## Support

If you encounter issues:

1. Check the [Troubleshooting Guide](../guides/troubleshooting.md)
2. Review [Common Issues](https://github.com/your-org/claude-code-ui-nextjs/issues)
3. Create a new issue with detailed information

---

✅ **You're now ready to use Claude Code UI!** Start by exploring the chat interface and terminal to get familiar with the features.
