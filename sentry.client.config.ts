// This file configures the initialization of Sentry on the browser
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f6bcb4517e1aa4ebf9b3cb93297db1e2@o490495.ingest.us.sentry.io/4510040833523712",

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
      component: "claude-code-ui",
      platform: "nextjs",
      codegen: "enabled",
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