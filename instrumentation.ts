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
    // Import server config to avoid duplicate initialization
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import edge config to avoid duplicate initialization
    await import('./sentry.edge.config');
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
