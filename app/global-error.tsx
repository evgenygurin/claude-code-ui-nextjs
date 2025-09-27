'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              Something went wrong!
            </h2>
            <p className="mb-4 text-gray-600">
              An error has been reported to our monitoring system.
            </p>
            {error.digest && (
              <p className="mb-4 text-sm text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-3 text-xs">
                {error.message}
                {error.stack}
              </pre>
            </details>
            <button
              onClick={reset}
              className="w-full rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
