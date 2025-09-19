# Claude Code UI - Next.js

![Claude Code UI](https://img.shields.io/badge/Next.js-15.1.8-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?style=for-the-badge&logo=typescript)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)
![v0](https://img.shields.io/badge/v0-Components-purple?style=for-the-badge)

Modern web interface for Claude Code CLI and Cursor CLI built with Next.js 15, powered by v0 components, and deployed on Vercel.

## 🎯 Overview

Claude Code UI is a comprehensive web application that provides a beautiful, responsive interface for interacting with Claude Code and Cursor CLI tools. Built with modern technologies and best practices, it offers:

- **Real-time AI Chat Interface** - Communicate with Claude and Cursor AI
- **Integrated Terminal** - Direct CLI access through web browser  
- **File Management** - Browse, edit, and manage project files
- **Git Integration** - Full Git workflow support
- **Mobile Responsive** - Works perfectly on all devices
- **High Performance** - Optimized for speed and scalability

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Claude Code CLI or Cursor CLI installed
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/claude-code-ui-nextjs.git
   cd claude-code-ui-nextjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   ```text
   http://localhost:3000
   ```

## 🏗️ Architecture

The application follows a modern, scalable architecture:

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │  External APIs  │
│   (Next.js)     │◄──►│ (Next.js API)   │◄──►│ Claude/Cursor   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │   WebSocket     │    │   File System   │
│   (v0 + shadcn) │    │   (Real-time)   │    │   (Local/Cloud) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **v0 Components** - AI-generated UI components
- **shadcn/ui** - High-quality React components

#### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Vercel Edge Functions** - Ultra-fast serverless functions
- **WebSockets** - Real-time communication
- **NextAuth.js** - Authentication solution
- **Prisma** - Database ORM

#### Infrastructure

- **Vercel** - Hosting and deployment
- **PostgreSQL** - Primary database
- **Vercel KV** - Redis-compatible caching
- **Vercel Blob** - File storage

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:

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

### Generating Secrets

For `NEXTAUTH_SECRET`, generate a secure random string:

```bash
openssl rand -base64 32
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Installation Guide](./docs/setup/installation.md) - Step-by-step setup
- [Architecture Overview](./docs/README.md) - System design and structure
- [API Reference](./docs/api/reference.md) - HTTP endpoints
- [Component Library](./docs/components/overview.md) - UI components
- [Deployment Guide](./docs/deployment/vercel.md) - Production deployment

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Project Structure

```text
claude-code-ui-nextjs/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── chat/             # AI chat interface
│   ├── file-manager/     # File explorer
│   ├── terminal/         # Terminal emulator
│   ├── layout/           # Layout components
│   └── ui/               # Base UI components
├── lib/                   # Utilities and helpers
├── types/                 # TypeScript type definitions
├── docs/                  # Documentation
└── public/               # Static assets
```

## 🔌 API Endpoints

### Chat Integration

- `POST /api/claude` - Send messages to Claude AI
- `POST /api/cursor` - Execute Cursor CLI commands

### Terminal

- `POST /api/terminal` - Execute terminal commands
- `GET /api/terminal` - List terminal sessions
- `DELETE /api/terminal` - Close terminal session

### File Management

- `GET /api/files` - List directory contents
- `POST /api/files` - Create/write files
- `DELETE /api/files` - Delete files

### WebSocket

- `WS /api/ws` - Real-time communication

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/claude-code-ui-nextjs)

1. **One-click deploy** using the button above
2. **Configure environment variables** in Vercel dashboard
3. **Set up custom domain** (optional)

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXTAUTH_SECRET
vercel env add CLAUDE_API_KEY
# ... add other required variables
```

## 🔒 Security

- **Environment Variables** - Sensitive data stored securely
- **NextAuth.js** - Industry-standard authentication
- **CORS Protection** - Cross-origin request filtering
- **Rate Limiting** - API abuse prevention
- **Input Validation** - SQL injection protection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/guides/contributing.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📚 [Documentation](./docs/README.md)
- 🐛 [Issue Tracker](https://github.com/your-org/claude-code-ui-nextjs/issues)
- 💬 [Discussions](https://github.com/your-org/claude-code-ui-nextjs/discussions)

## 🙏 Acknowledgments

- [Claude Code CLI](https://docs.anthropic.com/claude-code) - AI-powered development
- [Cursor IDE](https://cursor.sh/) - AI code editor
- [v0](https://v0.dev/) - AI component generation
- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Deployment platform

---

**Built with ❤️ using Next.js, v0, and Vercel**
