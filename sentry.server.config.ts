// This file configures the initialization of Sentry on the server
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f6bcb4517e1aa4ebf9b3cb93297db1e2@o490495.ingest.us.sentry.io/4510040833523712",

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
      platform: "nextjs-server",
      codegen: "enabled",
    },
  },

  integrations: [
    // Add server-specific integrations here if needed
  ],

  // Custom error filtering
  beforeSend(event) {
    // Add additional context for CodeGen
    if (event.tags) {
      event.tags.runtime = "nodejs";
      event.tags.framework = "nextjs";
    }

    return event;
  },

  // Add request context
  beforeSendTransaction(event) {
    return event;
  },
});