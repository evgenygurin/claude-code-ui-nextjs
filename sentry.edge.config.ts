// This file configures the initialization of Sentry for edge runtime
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 1.0,

  // Capture all errors
  debug: false,

  // Environment-specific configuration
  environment: process.env.NODE_ENV,

  // CodeGen integration - set via initialScope
  initialScope: {
    tags: {
      component: "claude-code-ui",
      platform: "nextjs-edge",
      codegen: "enabled",
    },
  },

  // Custom error filtering for edge runtime
  beforeSend(event) {
    // Add edge runtime context
    if (event.tags) {
      event.tags.runtime = "edge";
      event.tags.framework = "nextjs";
    }

    return event;
  },
});