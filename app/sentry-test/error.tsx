'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 mb-4">
          Error has been reported to Sentry
        </p>
        <details className="mb-4 text-left max-w-md mx-auto">
          <summary className="cursor-pointer text-sm text-gray-500">
            Error details
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {error.message}
            {error.stack}
          </pre>
        </details>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}