import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for authentication and route protection
 *
 * Protects sensitive routes like dashboard, monitoring, and reports
 * Can be extended to add rate limiting, CORS, etc.
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/metrics') ||
    pathname.startsWith('/api/reports');

  // Check if route needs authentication
  if (isProtectedRoute) {
    // In development, allow access without authentication
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return NextResponse.next();
    }

    // Check for session/auth token
    // This is a simple example - replace with your actual auth logic
    const authToken = request.cookies.get('auth-token')?.value;
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;

    // If using NextAuth
    if (!sessionToken && !authToken) {
      // Redirect to login for page routes
      if (!pathname.startsWith('/api')) {
        const loginUrl = new URL('/auth/signin', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Return 401 for API routes
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/metrics/:path*',
    '/api/reports/:path*',
  ],
};
