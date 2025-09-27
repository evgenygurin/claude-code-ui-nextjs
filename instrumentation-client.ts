// This file configures the initialization of Sentry for client-side
// Required for Next.js 15+ and Turbopack compatibility
import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Only run on client-side
  if (typeof window === 'undefined') return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture all errors
    debug: process.env.NODE_ENV === 'development',

    // Environment-specific configuration
    environment: process.env.NODE_ENV,

    // CodeGen integration - set via initialScope
    initialScope: {
      tags: {
        component: 'claude-code-ui',
        platform: 'nextjs-client',
        codegen: 'enabled',
      },
    },

    integrations: [
      // Session Replay - only in production and with controlled sampling
      ...(process.env.NODE_ENV === 'production'
        ? [
            Sentry.replayIntegration({
              // Session Replay
              maskAllText: true,
              blockAllMedia: true,
            }),
          ]
        : []),
    ],

    // Session Replay sampling rates (separate from integration config)
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,
    replaysOnErrorSampleRate: 1.0,

    // Custom error filtering
    beforeSend(event) {
      // Filter out development noise
      if (process.env.NODE_ENV === 'development') {
        // Skip webpack HMR errors
        if (event.exception?.values?.[0]?.value?.includes('ChunkLoadError')) {
          return null;
        }
        // Skip localhost connection errors
        if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
          return null;
        }
      }

      // Add additional context for CodeGen
      if (event.tags) {
        event.tags.runtime = 'browser';
        event.tags.framework = 'nextjs';
      }

      return event;
    },

    // Add request context
    beforeSendTransaction(event) {
      return event;
    },
  });
}

// Export navigation instrumentation hook for router tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
