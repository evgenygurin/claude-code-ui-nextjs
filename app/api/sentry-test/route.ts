import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  // Test successful response
  return NextResponse.json({ 
    status: 'ok',
    message: 'Sentry test endpoint is working' 
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { errorType } = body;

    // Trigger different types of errors for testing
    switch(errorType) {
      case 'runtime':
        throw new Error('Test runtime error from API endpoint');
        
      case 'async':
        setTimeout(() => {
          throw new Error('Test async error from API endpoint');
        }, 100);
        return NextResponse.json({ message: 'Async error triggered' });
        
      case 'type':
        const obj: any = null;
        // This will throw a TypeError
        return NextResponse.json({ data: obj.property });
        
      case 'custom':
        // Manually capture an error with context
        Sentry.captureException(new Error('Custom error with context'), {
          tags: {
            section: 'api',
            errorType: 'custom'
          },
          extra: {
            requestBody: body,
            timestamp: new Date().toISOString()
          }
        });
        return NextResponse.json({ message: 'Custom error captured' });
        
      default:
        return NextResponse.json({ 
          error: 'Unknown error type' 
        }, { status: 400 });
    }
  } catch (error) {
    // Sentry will automatically capture this error
    console.error('API Error:', error);
    throw error; // Re-throw to let Next.js error handling take over
  }
}