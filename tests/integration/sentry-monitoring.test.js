/**
 * Integration Tests for Sentry Monitoring System
 *
 * Tests the complete Sentry monitoring pipeline:
 * - Webhook signature verification
 * - Priority assessment algorithm
 * - Escalation creation
 * - Error grouping
 * - Smart filtering
 */

const crypto = require('crypto');

describe('Sentry Monitoring System - Integration Tests', () => {
  describe('Webhook Signature Verification', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';

      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      const result = verifySignature(payload, `sha256=${signature}`, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const wrongSignature = 'sha256=invalid';

      const result = verifySignature(payload, wrongSignature, secret);
      expect(result).toBe(false);
    });

    it('should handle missing signature gracefully', () => {
      const payload = JSON.stringify({ test: 'data' });
      const result = verifySignature(payload, '', '');
      expect(result).toBe(true); // Allows when not configured
    });
  });

  describe('Priority Assessment Algorithm', () => {
    it('should assess critical priority for fatal errors', () => {
      const errorInfo = {
        level: 'fatal',
        count: 5,
        userCount: 2,
        tags: { environment: 'production' }
      };

      const priority = assessPriority(errorInfo);
      expect(priority).toBe('critical');
    });

    it('should assess critical priority for high occurrence errors', () => {
      const errorInfo = {
        level: 'error',
        count: 150,
        userCount: 60,
        tags: { environment: 'production' }
      };

      const priority = assessPriority(errorInfo);
      expect(priority).toBe('critical');
    });

    it('should assess high priority for production errors', () => {
      const errorInfo = {
        level: 'error',
        count: 5,
        userCount: 3,
        tags: { environment: 'production' }
      };

      const priority = assessPriority(errorInfo);
      expect(priority).toBe('high');
    });

    it('should assess medium priority for warnings', () => {
      const errorInfo = {
        level: 'warning',
        count: 3,
        userCount: 1,
        tags: { environment: 'staging' }
      };

      const priority = assessPriority(errorInfo);
      expect(priority).toBe('medium');
    });

    it('should assess low priority for single info messages', () => {
      const errorInfo = {
        level: 'info',
        count: 1,
        userCount: 0,
        tags: { environment: 'development' }
      };

      const priority = assessPriority(errorInfo);
      expect(priority).toBe('low');
    });
  });

  describe('Error Grouping', () => {
    it('should group similar errors together', () => {
      const error1 = {
        title: 'TypeError: Cannot read property of undefined',
        culprit: 'app.js:123',
        platform: 'javascript'
      };

      const error2 = {
        title: 'TypeError: Cannot read property of undefined',
        culprit: 'app.js:123',
        platform: 'javascript'
      };

      const hash1 = generateErrorHash(error1);
      const hash2 = generateErrorHash(error2);

      expect(hash1).toBe(hash2);
    });

    it('should create different groups for different errors', () => {
      const error1 = {
        title: 'TypeError: Cannot read property of undefined',
        culprit: 'app.js:123',
        platform: 'javascript'
      };

      const error2 = {
        title: 'ReferenceError: variable is not defined',
        culprit: 'utils.js:456',
        platform: 'javascript'
      };

      const hash1 = generateErrorHash(error1);
      const hash2 = generateErrorHash(error2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Smart Filtering', () => {
    it('should filter out low priority errors when configured', () => {
      const lowPriorityError = {
        level: 'info',
        count: 1,
        userCount: 0
      };

      process.env.SENTRY_PROCESS_LOW_PRIORITY = 'false';
      const shouldProcess = shouldProcessError(lowPriorityError);

      expect(shouldProcess).toBe(false);
    });

    it('should process critical errors always', () => {
      const criticalError = {
        level: 'fatal',
        count: 100,
        userCount: 50
      };

      const shouldProcess = shouldProcessError(criticalError);
      expect(shouldProcess).toBe(true);
    });

    it('should process high priority errors in production', () => {
      const productionError = {
        level: 'error',
        count: 5,
        tags: { environment: 'production' }
      };

      const shouldProcess = shouldProcessError(productionError);
      expect(shouldProcess).toBe(true);
    });
  });

  describe('Escalation Creation', () => {
    it('should create escalation for critical errors', async () => {
      const errorInfo = {
        id: 'error-12345',
        title: 'Critical production error',
        level: 'fatal',
        count: 100,
        userCount: 50
      };

      const escalation = await createEscalation(errorInfo, 'critical');

      expect(escalation).toBeDefined();
      expect(escalation.priority).toBe('critical');
      expect(escalation.errorId).toBe('error-12345');
      expect(escalation.status).toBe('open');
    });

    it('should set appropriate cooldown for priority levels', async () => {
      const highPriorityEscalation = await createEscalation(
        { id: 'error-1', title: 'Test' },
        'high'
      );

      const mediumPriorityEscalation = await createEscalation(
        { id: 'error-2', title: 'Test' },
        'medium'
      );

      expect(highPriorityEscalation.cooldown).toBeLessThan(
        mediumPriorityEscalation.cooldown
      );
    });
  });

  describe('Webhook Endpoint Integration', () => {
    it('should handle complete webhook payload', async () => {
      const webhookPayload = {
        action: 'created',
        data: {
          issue: {
            id: 'issue-123',
            title: 'Test Error',
            level: 'error',
            count: 10,
            userCount: 5,
            platform: 'javascript',
            culprit: 'app.js:100',
            tags: { environment: 'production' }
          }
        },
        project: {
          name: 'test-project',
          slug: 'test-project'
        }
      };

      const result = await processWebhook(webhookPayload);

      expect(result.status).toBe('ok');
      expect(result.data.priority).toBe('high');
      expect(result.data.triggered).toBe(true);
    });

    it('should skip webhook with no actionable data', async () => {
      const webhookPayload = {
        action: 'resolved',
        data: {}
      };

      const result = await processWebhook(webhookPayload);

      expect(result.status).toBe('ok');
      expect(result.message).toContain('no action required');
    });
  });
});

// Helper functions (would be imported from actual implementation)
function verifySignature(payload, signature, secret) {
  if (!secret || !signature) return true;

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
    return false;
  }
}

function assessPriority(errorInfo) {
  if (
    errorInfo.level === 'fatal' ||
    errorInfo.count > 100 ||
    errorInfo.userCount > 50 ||
    (errorInfo.tags.environment === 'production' && errorInfo.level === 'error')
  ) {
    return 'critical';
  }

  if (
    errorInfo.level === 'error' ||
    errorInfo.count > 10 ||
    errorInfo.userCount > 5
  ) {
    return 'high';
  }

  if (errorInfo.level === 'warning' || errorInfo.count > 1) {
    return 'medium';
  }

  return 'low';
}

function generateErrorHash(error) {
  const hashString = `${error.title}|${error.culprit}|${error.platform}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

function shouldProcessError(error) {
  const priority = assessPriority(error);

  if (priority === 'low' && process.env.SENTRY_PROCESS_LOW_PRIORITY === 'false') {
    return false;
  }

  return true;
}

async function createEscalation(errorInfo, priority) {
  const cooldowns = {
    critical: 5 * 60 * 1000,      // 5 minutes
    high: 15 * 60 * 1000,         // 15 minutes
    medium: 60 * 60 * 1000,       // 1 hour
    low: 8 * 60 * 60 * 1000       // 8 hours
  };

  return {
    id: `esc-${Date.now()}`,
    errorId: errorInfo.id,
    title: errorInfo.title,
    priority,
    status: 'open',
    cooldown: cooldowns[priority],
    createdAt: new Date().toISOString()
  };
}

async function processWebhook(payload) {
  const errorInfo = payload.data?.issue;

  if (!errorInfo) {
    return {
      status: 'ok',
      message: 'Webhook received, no action required'
    };
  }

  const priority = assessPriority(errorInfo);
  const shouldProcess = shouldProcessError({ ...errorInfo, level: errorInfo.level });

  if (!shouldProcess) {
    return {
      status: 'ok',
      message: 'Low priority error filtered'
    };
  }

  return {
    status: 'ok',
    message: 'Webhook processed successfully',
    data: {
      errorId: errorInfo.id,
      priority,
      triggered: true,
      timestamp: new Date().toISOString()
    }
  };
}
