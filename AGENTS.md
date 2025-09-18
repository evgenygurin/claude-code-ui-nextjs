# CodeGen Repository Rules - Claude Code UI Panel

## 🎯 Project Overview

This is a Next.js 15 application with React 19 that provides a modern web interface for Claude Code CLI and Cursor CLI. Built with security-first principles, comprehensive error tracking, and a custom design system.

## 🏗️ Architecture & Technology Stack

### Core Technologies

- **Next.js 15** with App Router (app/ directory structure)
- **React 19** with concurrent features and latest patterns
- **TypeScript 5.7+** with strict mode enabled
- **Tailwind CSS 3.4+** with custom design system
- **Sentry** for comprehensive error tracking (client/server/edge)
- **Prisma** for database ORM with NextAuth.js integration
- **CodeMirror 6** for advanced code editing capabilities
- **XTerm.js** for terminal emulation
- **WebSocket (ws)** for real-time collaboration features

### Required File Structure

```text
/
├── app/                          # Next.js App Router pages and API routes
├── components/                   # Reusable UI components (use @/components/*)
├── lib/                         # Utility functions and configurations
├── types/                       # TypeScript type definitions
├── hooks/                       # Custom React hooks
├── utils/                       # Pure utility functions
├── sentry.client.config.ts      # Client-side Sentry configuration
├── sentry.server.config.ts      # Server-side Sentry configuration
├── sentry.edge.config.ts        # Edge runtime Sentry configuration
└── instrumentation.ts           # Next.js instrumentation
```

## 🔒 Security Rules (CRITICAL - ZERO TOLERANCE)

### Environment Variables & Secrets

- **NEVER** hardcode API keys, tokens, or sensitive data in source code
- **ALWAYS** use environment variables for configuration
- **ALWAYS** use process.env.VARIABLE_NAME pattern
- **VERIFY** all Sentry DSN references use environment variables:
  - Client: `process.env.NEXT_PUBLIC_SENTRY_DSN`
  - Server/Edge: `process.env.SENTRY_DSN`
- **REQUIRED**: Update .env.example with placeholder values when adding new environment variables
- **MANDATORY**: Run TruffleHog security scanning before commits

### API Security

- **ALWAYS** validate input using Zod schemas in API routes
- **ALWAYS** implement proper authentication checks
- **NEVER** expose internal errors to clients in production
- **ALWAYS** use NextAuth.js session validation for protected routes

## 💻 TypeScript Development Rules

### Type Safety Requirements

- **MANDATORY**: Use strict TypeScript configuration
- **REQUIRED**: Enable noUncheckedIndexedAccess, noImplicitReturns, noFallthroughCasesInSwitch
- **ALWAYS** define interfaces for API responses and component props
- **NEVER** use `any` type - use `unknown` or proper types
- **REQUIRED**: Type all function parameters and return values
- **ALWAYS** use path aliases for imports: `@/components/*`, `@/lib/*`, `@/types/*`

### Import Organization

```typescript
// 1. React and Next.js imports
import React from 'react'
import { NextRequest, NextResponse } from 'next/server'

// 2. Third-party library imports
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

// 3. Internal imports using path aliases
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UserSession } from '@/types/auth'
```

## 🎨 UI Development Rules

### Component Architecture

- **ALWAYS** use shadcn/ui components as base primitives
- **REQUIRED**: Implement custom components in `@/components/` with proper organization:

  ```text
  components/
  ├── ui/           # shadcn/ui base components
  ├── auth/         # Authentication components
  ├── chat/         # AI chat interface components
  ├── terminal/     # Terminal emulation components
  ├── file-manager/ # File management components
  └── layout/       # Layout and navigation components
  ```

- **ALWAYS** use TypeScript interfaces for component props
- **REQUIRED**: Forward refs for components that need DOM access

### Styling Standards

- **ALWAYS** use Tailwind CSS for styling
- **REQUIRED**: Use CSS custom properties for theme variables
- **MANDATORY**: Support both light and dark themes
- **ALWAYS** use semantic color names from the design system:
  - `claude-*` for Claude brand colors (orange palette)
  - `cursor-*` for Cursor brand colors (blue palette)
  - Standard shadcn colors: `primary`, `secondary`, `muted`, `accent`
- **REQUIRED**: Use custom animations from tailwind.config.js:
  - `animate-fade-in`, `animate-slide-in`, `animate-pulse-soft`, `animate-shimmer`

### Design System Rules

- **ALWAYS** use consistent spacing: `space-4`, `space-6`, `space-8`
- **REQUIRED**: Use custom font families: `font-sans` (Geist Sans), `font-mono` (Geist Mono)
- **MANDATORY**: Follow responsive design patterns with mobile-first approach
- **ALWAYS** ensure accessibility compliance (ARIA labels, keyboard navigation)

## 🔄 State Management Rules

### Zustand Implementation

- **REQUIRED**: Use Zustand for global state management
- **ALWAYS** organize stores by domain (auth, chat, terminal, files)
- **MANDATORY**: Implement TypeScript interfaces for store state
- **PATTERN**:

  ```typescript
  interface ChatStore {
    messages: Message[]
    isLoading: boolean
    addMessage: (message: Message) => void
    clearMessages: () => void
  }

  export const useChatStore = create<ChatStore>((set) => ({
    messages: [],
    isLoading: false,
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, message]
    })),
    clearMessages: () => set({ messages: [] }),
  }))
  ```

### React State Patterns

- **ALWAYS** use hooks for component-local state
- **PREFERRED**: Use `useOptimistic` for optimistic updates
- **REQUIRED**: Use `Suspense` boundaries for data loading
- **MANDATORY**: Implement error boundaries for component-level error handling

## 🌐 API Development Rules

### Next.js API Routes

- **REQUIRED**: Place all API routes in `app/api/` directory
- **MANDATORY**: Use proper HTTP status codes and error handling
- **ALWAYS** implement request validation using Zod schemas
- **PATTERN**:

  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { z } from 'zod'
  import * as Sentry from '@sentry/nextjs'

  const RequestSchema = z.object({
    message: z.string().min(1).max(1000),
  })

  export async function POST(request: NextRequest) {
    try {
      const body = await request.json()
      const { message } = RequestSchema.parse(body)

      // Process request
      return NextResponse.json({ success: true })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }
  ```

### WebSocket Implementation

- **REQUIRED**: Use `ws` library for WebSocket server
- **MANDATORY**: Implement session-based messaging
- **ALWAYS** include heartbeat/ping-pong for connection health
- **REQUIRED**: Type-safe message handling with discriminated unions

## 🎯 Sentry Integration Rules

### Configuration Requirements

- **MANDATORY**: Use environment-specific configuration
- **ALWAYS** set appropriate sample rates:
  - Development: `tracesSampleRate: 1.0`
  - Production: `tracesSampleRate: 0.1`
- **REQUIRED**: Include custom tags for component identification:

  ```typescript
  initialScope: {
    tags: {
      component: "claude-code-ui",
      platform: "nextjs-client", // or server/edge
      version: process.env.npm_package_version,
    },
  }
  ```

### Error Handling Patterns

- **ALWAYS** wrap async operations in try-catch blocks
- **REQUIRED**: Use Sentry.captureException() for errors
- **MANDATORY**: Implement custom beforeSend filtering for sensitive data
- **ALWAYS** add contextual information to error reports

## 🔧 Development Workflow Rules

### Code Quality Standards

- **MANDATORY**: Run `npm run type-check` before commits
- **REQUIRED**: Use Prettier for code formatting
- **ALWAYS** follow ESLint rules (extends next/core-web-vitals)
- **MANDATORY**: Ensure all components are accessible (ARIA compliance)

### Testing Requirements

- **REQUIRED**: Write unit tests for utility functions
- **MANDATORY**: Test API routes with proper error scenarios
- **ALWAYS** test WebSocket connections and message handling
- **REQUIRED**: Implement integration tests for critical user flows

### Performance Standards

- **MANDATORY**: Use Next.js Image optimization for all images
- **REQUIRED**: Implement proper loading states and skeletons
- **ALWAYS** use dynamic imports for heavy components
- **MANDATORY**: Optimize bundle size with proper imports
- **REQUIRED**: Implement caching strategies for API responses

## 🚀 Deployment & CI/CD Rules

### CircleCI Pipeline Requirements

- **MANDATORY**: Security scanning with TruffleHog before deployment
- **REQUIRED**: Type checking must pass (`npm run type-check`)
- **ALWAYS** run linting and formatting checks
- **MANDATORY**: Build verification (`npm run build`)
- **REQUIRED**: Deploy to Vercel with proper environment variables

### Environment Management

- **REQUIRED**: Separate configurations for development/staging/production
- **MANDATORY**: Use Vercel environment variables for secrets
- **ALWAYS** validate environment variables at application startup
- **REQUIRED**: Implement health check endpoints for monitoring

## 📱 Responsive Design Rules

### Breakpoint Strategy

- **REQUIRED**: Mobile-first responsive design
- **ALWAYS** test on mobile devices (iPhone/Android)
- **MANDATORY**: Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **REQUIRED**: Ensure touch-friendly interface elements (minimum 44px touch targets)

### Layout Requirements

- **ALWAYS** use CSS Grid and Flexbox for layouts
- **REQUIRED**: Implement collapsible sidebar for mobile
- **MANDATORY**: Ensure proper keyboard navigation
- **ALWAYS** maintain accessibility standards across all breakpoints

## 🔍 Debugging & Monitoring Rules

### Development Debugging

- **REQUIRED**: Use React Developer Tools for component debugging
- **ALWAYS** implement proper console logging with appropriate levels
- **MANDATORY**: Use Sentry's development mode for error testing
- **REQUIRED**: Test WebSocket connections with browser dev tools

### Production Monitoring

- **MANDATORY**: Monitor Core Web Vitals performance metrics
- **REQUIRED**: Track user interactions with custom Sentry events
- **ALWAYS** implement proper error boundaries for graceful degradation
- **REQUIRED**: Monitor API response times and error rates

## 🎮 Interactive Features Rules

### Terminal Emulation

- **REQUIRED**: Use XTerm.js with proper addons (fit, webgl)
- **MANDATORY**: Implement session persistence
- **ALWAYS** sanitize command input and output
- **REQUIRED**: Support copy/paste functionality
- **MANDATORY**: Implement proper terminal sizing and responsiveness

### AI Chat Integration

- **REQUIRED**: Use Vercel AI SDK for streaming responses
- **MANDATORY**: Implement proper loading states
- **ALWAYS** handle API rate limiting gracefully
- **REQUIRED**: Support markdown rendering with syntax highlighting
- **MANDATORY**: Implement message history management

### File Management

- **REQUIRED**: Implement tree view with lazy loading
- **MANDATORY**: Support file upload with drag-and-drop
- **ALWAYS** validate file types and sizes
- **REQUIRED**: Implement proper error handling for file operations
- **MANDATORY**: Support context menus for file actions

## 🔄 Real-time Features Rules

### WebSocket Implementation

- **REQUIRED**: Session-based message broadcasting
- **MANDATORY**: Implement automatic reconnection with exponential backoff
- **ALWAYS** handle connection state management
- **REQUIRED**: Type-safe message schemas
- **MANDATORY**: Implement proper cleanup on component unmount

### Collaboration Features

- **REQUIRED**: Broadcast cursor positions and file changes
- **MANDATORY**: Implement conflict resolution for simultaneous edits
- **ALWAYS** show connected users and their status
- **REQUIRED**: Support real-time chat during collaboration

## 💾 Data Management Rules

### Database Integration

- **REQUIRED**: Use Prisma with proper schema definitions
- **MANDATORY**: Implement database migrations
- **ALWAYS** use connection pooling for production
- **REQUIRED**: Implement proper error handling for database operations

### Caching Strategy

- **REQUIRED**: Use React Query or SWR for client-side caching
- **MANDATORY**: Implement proper cache invalidation
- **ALWAYS** use Next.js built-in caching for static content
- **REQUIRED**: Implement optimistic updates for better UX

## 🔐 Authentication & Authorization Rules

### NextAuth.js Implementation

- **REQUIRED**: Use NextAuth.js for authentication
- **MANDATORY**: Implement proper session management
- **ALWAYS** protect API routes with session validation
- **REQUIRED**: Support multiple authentication providers
- **MANDATORY**: Implement proper logout functionality

### User Management

- **REQUIRED**: Store user preferences in database
- **MANDATORY**: Implement role-based access control
- **ALWAYS** validate user permissions for sensitive operations
- **REQUIRED**: Support user profile management

## 🎯 Performance Optimization Rules

### Bundle Optimization

- **REQUIRED**: Use dynamic imports for route-level code splitting
- **MANDATORY**: Optimize images with Next.js Image component
- **ALWAYS** minimize JavaScript bundle size
- **REQUIRED**: Implement proper caching headers
- **MANDATORY**: Use service workers for offline functionality

### Runtime Performance

- **REQUIRED**: Implement proper memoization with React.memo
- **MANDATORY**: Use useCallback and useMemo appropriately
- **ALWAYS** avoid unnecessary re-renders
- **REQUIRED**: Implement virtualization for large lists
- **MANDATORY**: Monitor and optimize Core Web Vitals

## 🚨 Error Handling & Recovery Rules

### Graceful Degradation

- **REQUIRED**: Implement fallback UI for component errors
- **MANDATORY**: Provide user-friendly error messages
- **ALWAYS** log errors to Sentry with proper context
- **REQUIRED**: Implement retry mechanisms for failed requests
- **MANDATORY**: Support offline mode for critical features

### User Experience

- **REQUIRED**: Show loading states for all async operations
- **MANDATORY**: Implement proper form validation with helpful messages
- **ALWAYS** provide clear feedback for user actions
- **REQUIRED**: Support keyboard shortcuts for power users
- **MANDATORY**: Ensure accessibility compliance for all interactive elements

This comprehensive rule set ensures consistent, secure, and high-quality development for the Claude Code UI Panel project. All developers and AI coding assistants must follow these guidelines to maintain code quality and user experience standards.
