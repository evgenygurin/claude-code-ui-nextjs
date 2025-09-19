import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sentry Webhook Handler
 * 
 * Handles real-time notifications from Sentry and triggers
 * the Smart Sentry Monitor system for intelligent error processing
 */

interface SentryWebhookPayload {
  action: string;
  installation?: {
    uuid: string;
  };
  data?: {
    issue?: any;
    error?: any;
  };
  issue?: any;
  project?: {
    name: string;
    slug: string;
  };
  actor?: {
    name: string;
    email: string;
  };
}

/**
 * Verify Sentry webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature) {
    return true; // Skip verification if not configured
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Extract relevant information from Sentry webhook payload
 */
function extractErrorInfo(payload: SentryWebhookPayload) {
  const issue = payload.data?.issue || payload.issue;
  
  if (!issue) {
    return null;
  }

  return {
    id: issue.id,
    title: issue.title || issue.culprit || 'Unknown Error',
    level: issue.level || 'error',
    platform: issue.platform,
    culprit: issue.culprit,
    permalink: issue.permalink,
    shortId: issue.shortId,
    firstSeen: issue.firstSeen,
    lastSeen: issue.lastSeen,
    count: issue.count || 1,
    userCount: issue.userCount || 0,
    tags: issue.tags || {},
    metadata: issue.metadata || {},
    project: payload.project?.name || 'unknown',
    action: payload.action,
    actor: payload.actor
  };
}

/**
 * Assess error priority based on Sentry data
 */
function assessPriority(errorInfo: any): string {
  // Critical indicators
  if (
    errorInfo.level === 'fatal' || 
    errorInfo.count > 100 ||
    errorInfo.userCount > 50 ||
    (errorInfo.tags.environment === 'production' && errorInfo.level === 'error')
  ) {
    return 'critical';
  }

  // High priority indicators
  if (
    errorInfo.level === 'error' ||
    errorInfo.count > 10 ||
    errorInfo.userCount > 5
  ) {
    return 'high';
  }

  // Medium priority indicators
  if (
    errorInfo.level === 'warning' ||
    errorInfo.count > 1
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Trigger Smart Sentry Monitor processing
 */
async function triggerSmartMonitoring(errorInfo: any, priority: string) {
  try {
    // Prepare data for the Smart Sentry Monitor
    const monitoringData = {
      source: 'sentry_webhook',
      timestamp: new Date().toISOString(),
      error: errorInfo,
      priority,
      environment: process.env.NODE_ENV || 'production'
    };

    // Save webhook data for processing
    const dataFile = `/tmp/sentry-webhook-${Date.now()}.json`;
    require('fs').writeFileSync(dataFile, JSON.stringify(monitoringData, null, 2));

    // Trigger Smart Sentry Monitor via CodeGen Error Handler
    const command = `node scripts/codegen-error-handler.js sentry_${priority}_${errorInfo.level} "Sentry webhook alert: ${errorInfo.title} (${errorInfo.count} occurrences, ${errorInfo.userCount} users affected)"`;
    
    // Execute asynchronously to avoid blocking the webhook response
    execAsync(command).catch(error => {
      console.error('Failed to trigger Smart Sentry Monitor:', error);
    });

    console.log(`🚨 Triggered Smart Sentry Monitor for ${priority} priority error: ${errorInfo.title}`);
    return true;

  } catch (error) {
    console.error('Failed to trigger smart monitoring:', error);
    return false;
  }
}

/**
 * Log webhook event for debugging and monitoring
 */
function logWebhookEvent(payload: SentryWebhookPayload, errorInfo: any, priority: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: payload.action,
    project: payload.project?.name,
    errorId: errorInfo?.id,
    errorTitle: errorInfo?.title,
    priority,
    userAgent: process.env.HTTP_USER_AGENT,
    processed: true
  };

  console.log('📡 Sentry webhook event:', JSON.stringify(logEntry, null, 2));
}

/**
 * POST handler for Sentry webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('sentry-hook-signature') || '';
    const secret = process.env.SENTRY_WEBHOOK_SECRET || '';

    // Verify signature if configured
    if (!verifySignature(body, signature, secret)) {
      console.warn('⚠️  Invalid Sentry webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    let payload: SentryWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log(`📨 Received Sentry webhook: ${payload.action}`);

    // Extract error information
    const errorInfo = extractErrorInfo(payload);
    
    if (!errorInfo) {
      console.log('ℹ️  Webhook contains no actionable error information');
      return NextResponse.json({ 
        status: 'ok',
        message: 'Webhook received, no action required' 
      });
    }

    // Assess priority
    const priority = assessPriority(errorInfo);

    // Skip low priority errors to reduce noise
    if (priority === 'low' && !process.env.SENTRY_PROCESS_LOW_PRIORITY) {
      console.log(`🔇 Skipping low priority error: ${errorInfo.title}`);
      return NextResponse.json({
        status: 'ok',
        message: 'Low priority error filtered'
      });
    }

    // Trigger Smart Sentry Monitor
    const triggered = await triggerSmartMonitoring(errorInfo, priority);

    // Log event
    logWebhookEvent(payload, errorInfo, priority);

    // Return success response
    return NextResponse.json({
      status: 'ok',
      message: 'Webhook processed successfully',
      data: {
        errorId: errorInfo.id,
        priority,
        triggered,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Sentry webhook handler error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification and health check
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get('hub.challenge');
  
  // Handle Sentry webhook verification challenge
  if (challenge) {
    console.log('🔐 Sentry webhook verification challenge received');
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  // Health check endpoint
  return NextResponse.json({
    status: 'ok',
    message: 'Sentry webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      smartMonitoring: true,
      signatureVerification: !!process.env.SENTRY_WEBHOOK_SECRET,
      lowPriorityFiltering: !process.env.SENTRY_PROCESS_LOW_PRIORITY,
      escalationManager: true
    }
  });
}

/**
 * Handle OPTIONS for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, sentry-hook-signature',
    },
  });
}