import * as Sentry from '@sentry/nextjs';

export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn(
      '[Sentry] No DSN found, Sentry will not be initialized on server'
    );
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // This is your Sentry initialization for the server
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      environment: process.env.VERCEL_ENV || 'development',
      integrations: [
        Sentry.captureConsoleIntegration({
          levels: ['error', 'warn'],
        }),
      ],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // This is your Sentry initialization for the edge runtime
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      environment: process.env.VERCEL_ENV || 'development',
    });
  }
}

// Capture errors from React Server Components
export async function onRequestError(
  error: Error,
  request: {
    url: string;
    method: string;
    headers: { [key: string]: string };
  }
) {
  Sentry.captureException(error, {
    tags: {
      url: request.url,
      method: request.method,
    },
    extra: {
      headers: request.headers,
    },
  });
}
