// This file configures the initialization of Sentry on the browser
// Required for Turbopack compatibility
import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is provided
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Performance monitoring
    tracesSampleRate: 1.0,

    // Capture unhandled promise rejections
    debug: false,

    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Environment-specific configuration
    environment: process.env.NODE_ENV,

    // CodeGen integration - set via initialScope
    initialScope: {
      tags: {
        component: 'claude-code-ui',
        platform: 'nextjs',
        codegen: 'enabled',
      },
    },

    // Custom error filtering
    beforeSend(event) {
      // Filter out non-critical errors in development
      if (process.env.NODE_ENV === 'development') {
        return event;
      }

      return event;
    },
  });
} else {
  console.warn(
    '[Sentry] NEXT_PUBLIC_SENTRY_DSN not found, Sentry will not be initialized'
  );
}

// Export navigation instrumentation - required for router tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
