import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release and Environment
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV || 'development',
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Error Filtering
  beforeSend(event) {
    // Filter out errors from development
    if (event.environment === 'development') {
      console.log('[Sentry] Development error captured:', event);
    }
    return event;
  },
});

// Export navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;