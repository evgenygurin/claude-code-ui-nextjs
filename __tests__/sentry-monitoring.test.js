/**
 * Comprehensive Tests for Smart Sentry Monitoring System
 * 
 * Tests all components of the hybrid monitoring system:
 * - Smart Sentry Monitor
 * - Alert Escalation Manager
 * - CodeGen Error Handler Integration
 * - Webhook API Endpoints
 */

// Jest globals are already available in the test environment
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

// Mock modules before importing
jest.mock('fs');
jest.mock('child_process');
jest.mock('https');
jest.mock('http');

const SmartSentryMonitor = require('../scripts/smart-sentry-monitor');
const AlertEscalationManager = require('../scripts/alert-escalation-manager');
const CodeGenErrorHandler = require('../scripts/codegen-error-handler');

describe('Smart Sentry Monitoring System', () => {
  let mockFs;
  let mockChildProcess;
  let mockHttps;
  let mockHttp;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup fs mocks
    mockFs = {
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn(),
      readFileSync: jest.fn(() => '{"test": true}'),
      readdirSync: jest.fn(() => [])
    };
    fs.existsSync.mockImplementation(mockFs.existsSync);
    fs.mkdirSync.mockImplementation(mockFs.mkdirSync);
    fs.writeFileSync.mockImplementation(mockFs.writeFileSync);
    fs.readFileSync.mockImplementation(mockFs.readFileSync);
    fs.readdirSync.mockImplementation(mockFs.readdirSync);

    // Setup child_process mocks
    mockChildProcess = {
      exec: jest.fn((cmd, cb) => cb(null, 'mock output', ''))
    };
    require('child_process').exec = mockChildProcess.exec;

    // Setup https mocks
    mockHttps = {
      get: jest.fn()
    };
    require('https').get = mockHttps.get;

    // Setup http mocks
    mockHttp = {
      createServer: jest.fn(() => ({
        listen: jest.fn((port, cb) => cb())
      }))
    };
    require('http').createServer = mockHttp.createServer;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('SmartSentryMonitor', () => {
    let monitor;

    beforeEach(() => {
      // Mock environment variables
      process.env.SENTRY_DSN = 'https://test@sentry.io/12345';
      process.env.SENTRY_AUTH_TOKEN = 'test-token';
      process.env.SENTRY_ORG = 'test-org';
      process.env.SENTRY_PROJECT = 'test-project';
      
      monitor = new SmartSentryMonitor();
    });

    describe('Initialization', () => {
      test('should initialize with correct configuration', () => {
        expect(monitor.config.sentry.dsn).toBe('https://test@sentry.io/12345');
        expect(monitor.config.sentry.org).toBe('test-org');
        expect(monitor.config.sentry.project).toBe('test-project');
      });

      test('should create necessary directories', () => {
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('.sentry-monitoring', { recursive: true });
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('.sentry-monitoring/alerts', { recursive: true });
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('.sentry-monitoring/reports', { recursive: true });
      });
    });

    describe('Error Priority Assessment', () => {
      test('should classify critical errors correctly', async () => {
        const errorInfo = {
          level: 'fatal',
          count: 150,
          userCount: 100,
          platform: 'node',
          lastSeen: new Date().toISOString(),
          culprit: 'database/connection.js',
          tags: { environment: 'production' }
        };

        const priority = await monitor.assessErrorPriority(errorInfo);
        expect(priority).toBe('critical');
      });

      test('should classify high priority errors correctly', async () => {
        const errorInfo = {
          level: 'error',
          count: 25,
          userCount: 10,
          platform: 'javascript',
          lastSeen: new Date().toISOString(),
          culprit: 'api/users.js',
          tags: {}
        };

        const priority = await monitor.assessErrorPriority(errorInfo);
        expect(priority).toBe('high');
      });

      test('should classify medium priority errors correctly', async () => {
        const errorInfo = {
          level: 'warning',
          count: 5,
          userCount: 2,
          platform: 'node',
          lastSeen: new Date().toISOString(),
          culprit: 'utils/helper.js',
          tags: {}
        };

        const priority = await monitor.assessErrorPriority(errorInfo);
        expect(priority).toBe('medium');
      });

      test('should ignore low priority errors', async () => {
        const errorInfo = {
          level: 'info',
          count: 1,
          userCount: 0,
          platform: 'node',
          lastSeen: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
          culprit: 'debug/logger.js',
          tags: {}
        };

        const priority = await monitor.assessErrorPriority(errorInfo);
        expect(priority).toBe('ignore');
      });
    });

    describe('Error Grouping', () => {
      test('should group similar errors correctly', async () => {
        const errorInfo1 = {
          title: 'TypeError: Cannot read property "name" of undefined',
          culprit: 'user/profile.js',
          platform: 'javascript',
          level: 'error',
          timestamp: new Date().toISOString()
        };

        const errorInfo2 = {
          title: 'TypeError: Cannot read property "email" of undefined',
          culprit: 'user/profile.js',
          platform: 'javascript',
          level: 'error',
          timestamp: new Date().toISOString()
        };

        const grouped1 = await monitor.groupSimilarErrors(errorInfo1);
        const grouped2 = await monitor.groupSimilarErrors(errorInfo2);

        // Should have same grouping key since they're similar errors
        expect(grouped1.key).toBe(grouped2.key);
        expect(grouped2.count).toBe(2); // Should be incremented
      });

      test('should not group different errors', async () => {
        const errorInfo1 = {
          title: 'TypeError: Cannot read property of undefined',
          culprit: 'user/profile.js',
          platform: 'javascript',
          level: 'error',
          timestamp: new Date().toISOString()
        };

        const errorInfo2 = {
          title: 'ReferenceError: variable is not defined',
          culprit: 'admin/dashboard.js',
          platform: 'javascript',
          level: 'error',
          timestamp: new Date().toISOString()
        };

        const grouped1 = await monitor.groupSimilarErrors(errorInfo1);
        const grouped2 = await monitor.groupSimilarErrors(errorInfo2);

        expect(grouped1.key).not.toBe(grouped2.key);
      });
    });

    describe('Webhook Processing', () => {
      test('should extract error info from Sentry payload', () => {
        const payload = {
          action: 'created',
          data: {
            issue: {
              id: 'test-123',
              title: 'Test Error',
              level: 'error',
              platform: 'javascript',
              count: 5,
              userCount: 2,
              tags: { environment: 'production' }
            }
          },
          project: { name: 'test-project' }
        };

        const errorInfo = monitor.extractErrorInfo(payload);
        
        expect(errorInfo).toEqual({
          id: 'test-123',
          title: 'Test Error',
          level: 'error',
          platform: 'javascript',
          culprit: undefined,
          permalink: undefined,
          firstSeen: undefined,
          lastSeen: undefined,
          count: 5,
          userCount: 2,
          tags: { environment: 'production' },
          metadata: {},
          project: 'test-project',
          timestamp: expect.any(String)
        });
      });

      test('should verify webhook signatures correctly', () => {
        const payload = JSON.stringify({ test: 'data' });
        const secret = 'test-secret';
        const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        
        const isValid = monitor.verifyWebhookSignature(payload, signature);
        expect(isValid).toBe(true);
        
        const isInvalid = monitor.verifyWebhookSignature(payload, 'invalid-signature');
        expect(isInvalid).toBe(false);
      });
    });

    describe('API Integration', () => {
      test('should fetch recent issues from Sentry API', async () => {
        const mockIssues = [
          {
            id: 'issue-1',
            title: 'Test Error 1',
            level: 'error',
            count: 10
          },
          {
            id: 'issue-2', 
            title: 'Test Error 2',
            level: 'warning',
            count: 3
          }
        ];

        // Mock https.get for API call
        mockHttps.get.mockImplementation((url, options, callback) => {
          const res = {
            on: jest.fn((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify(mockIssues));
              } else if (event === 'end') {
                handler();
              }
            })
          };
          callback(res);
          return { on: jest.fn(), setTimeout: jest.fn() };
        });

        const issues = await monitor.fetchRecentIssues();
        expect(issues).toEqual(mockIssues);
        expect(mockHttps.get).toHaveBeenCalledWith(
          expect.stringContaining('/issues/?statsPeriod=1h&query=is:unresolved'),
          expect.any(Object),
          expect.any(Function)
        );
      });
    });
  });

  describe('AlertEscalationManager', () => {
    let manager;

    beforeEach(() => {
      manager = new AlertEscalationManager();
    });

    describe('Escalation Creation', () => {
      test('should create escalation with correct structure', async () => {
        const escalation = await manager.createEscalation('test-alert', 'critical', { test: true });
        
        expect(escalation).toEqual({
          id: expect.stringMatching(/^esc-\d+-[a-z0-9]+$/),
          alertId: 'test-alert',
          priority: 'critical',
          policy: 'Critical Error Policy',
          status: 'active',
          currentLevel: 0,
          currentAttempt: 0,
          context: { test: true },
          timeline: expect.arrayContaining([
            expect.objectContaining({
              event: 'escalation_created',
              level: 0,
              attempt: 0
            })
          ]),
          createdAt: expect.any(String),
          lastActionAt: expect.any(String),
          nextScheduledAt: expect.any(String)
        });
      });

      test('should throw error for unknown priority', async () => {
        await expect(manager.createEscalation('test', 'invalid', {}))
          .rejects.toThrow('Unknown priority level: invalid');
      });
    });

    describe('Escalation Policies', () => {
      test('should have correct critical policy configuration', () => {
        const policy = manager.config.escalationPolicies.critical;
        
        expect(policy.priority).toBe(100);
        expect(policy.levels[0].delay).toBe(0); // Immediate
        expect(policy.levels[0].cooldown).toBe(5 * 60 * 1000); // 5 minutes
        expect(policy.channels).toContain('webhook');
        expect(policy.channels).toContain('codegen');
      });

      test('should have different intervals for different priorities', () => {
        const critical = manager.config.escalationPolicies.critical;
        const medium = manager.config.escalationPolicies.medium;
        
        expect(critical.levels[0].delay).toBeLessThan(medium.levels[0].delay);
        expect(critical.levels[0].cooldown).toBeLessThan(medium.levels[0].cooldown);
      });
    });

    describe('Backoff Calculation', () => {
      test('should calculate backoff with jitter', () => {
        const escalation = { currentAttempt: 2 };
        const levelConfig = { cooldown: 60000 }; // 1 minute
        
        const delay1 = manager.calculateBackoffDelay(escalation, levelConfig);
        const delay2 = manager.calculateBackoffDelay(escalation, levelConfig);
        
        // Should be approximately the same but with small jitter difference
        expect(Math.abs(delay1 - delay2)).toBeLessThan(levelConfig.cooldown * 0.2);
      });
    });

    describe('State Management', () => {
      test('should save and load state correctly', async () => {
        const escalation = await manager.createEscalation('test', 'high', {});
        
        await manager.saveState();
        
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          expect.stringContaining('escalation-state.json'),
          expect.stringContaining(escalation.id)
        );
      });

      test('should resolve escalations properly', async () => {
        const escalation = await manager.createEscalation('test', 'medium', {});
        
        const resolved = await manager.resolveEscalation(escalation.id, 'manual');
        
        expect(resolved.status).toBe('manual');
        expect(resolved.resolvedAt).toBeDefined();
        expect(manager.state.activeEscalations.has(escalation.id)).toBe(false);
      });
    });
  });

  describe('CodeGen Error Handler Integration', () => {
    let handler;

    beforeEach(() => {
      // Mock environment variables
      process.env.SENTRY_MONITORING_ENABLED = 'true';
      handler = new CodeGenErrorHandler();
    });

    describe('Initialization', () => {
      test('should enable Sentry integration when configured', () => {
        expect(handler.sentryIntegration.enabled).toBe(true);
      });

      test('should disable Sentry integration when not available', () => {
        // Simulate missing AlertEscalationManager
        jest.doMock('../scripts/alert-escalation-manager', () => {
          throw new Error('Module not found');
        });
        
        const testHandler = new CodeGenErrorHandler();
        expect(testHandler.sentryIntegration.enabled).toBe(false);
      });
    });

    describe('Error Handling with Escalation', () => {
      test('should create escalation for high priority errors', async () => {
        const mockEscalationManager = {
          createEscalation: jest.fn().mockResolvedValue({ id: 'esc-123' })
        };
        handler.sentryIntegration.escalationManager = mockEscalationManager;

        const result = await handler.handleError('sentry_critical_error', 'Critical database failure');
        
        expect(mockEscalationManager.createEscalation).toHaveBeenCalledWith(
          expect.any(String),
          'critical',
          expect.any(Object)
        );
        expect(result.escalationId).toBe('esc-123');
      });

      test('should assess error priority correctly', () => {
        expect(handler.assessErrorPriority('database_failure', 'Critical production issue')).toBe('critical');
        expect(handler.assessErrorPriority('api_timeout', 'Service temporarily unavailable')).toBe('high');
        expect(handler.assessErrorPriority('warning_log', 'Non-critical warning message')).toBe('medium');
      });
    });

    describe('Success and Failure Handling', () => {
      test('should resolve escalation on success', async () => {
        const mockEscalationManager = {
          resolveEscalation: jest.fn().mockResolvedValue(true)
        };
        handler.sentryIntegration.escalationManager = mockEscalationManager;

        const errorReport = { escalationId: 'esc-123', errorType: 'test' };
        
        await handler.onCodeGenSuccess(errorReport);
        
        expect(mockEscalationManager.resolveEscalation).toHaveBeenCalledWith('esc-123', 'codegen_resolved');
      });

      test('should handle failure without resolving escalation', async () => {
        const mockEscalationManager = {
          getEscalationStatus: jest.fn().mockReturnValue({ status: 'active' })
        };
        handler.sentryIntegration.escalationManager = mockEscalationManager;

        const errorReport = { escalationId: 'esc-123', errorType: 'test' };
        const error = new Error('CodeGen failed');
        
        await handler.onCodeGenFailure(errorReport, error);
        
        expect(mockEscalationManager.getEscalationStatus).toHaveBeenCalledWith('esc-123');
        // Should not resolve escalation on failure
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end webhook to escalation flow', async () => {
      const monitor = new SmartSentryMonitor();
      const manager = new AlertEscalationManager();
      
      // Mock CodeGen handler
      const mockCodeGenHandler = {
        handleError: jest.fn().mockResolvedValue({ success: true })
      };
      jest.doMock('../scripts/codegen-error-handler', () => mockCodeGenHandler);

      // Simulate webhook payload
      const payload = {
        action: 'created',
        data: {
          issue: {
            id: 'test-error-123',
            title: 'Critical Production Error',
            level: 'error',
            platform: 'node',
            count: 50,
            userCount: 25,
            tags: { environment: 'production' }
          }
        }
      };

      // Process webhook
      await monitor.processWebhookPayload(payload);

      // Verify error was processed and escalated
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.stringContaining('test-error-123')
      );
    });

    test('should integrate with health monitoring system', async () => {
      const handler = new CodeGenErrorHandler();
      
      // Test health monitoring integration
      const healthErrorType = 'health_change_critical_degradation';
      const healthDetails = 'Health score dropped by 35 points. Issues: build, type_checking';
      
      const result = await handler.handleError(healthErrorType, healthDetails);
      
      expect(result.errorReport.source).toBe('health_monitor');
      expect(result.errorReport.errorType).toBe(healthErrorType);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large payloads efficiently', async () => {
      const monitor = new SmartSentryMonitor();
      
      const largePayload = {
        action: 'created',
        data: {
          issue: {
            id: 'large-error',
            title: 'Error with large context',
            level: 'error',
            metadata: {
              largeData: 'x'.repeat(10000) // 10KB of data
            },
            tags: Array.from({ length: 100 }, (_, i) => [`tag${i}`, `value${i}`])
              .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
          }
        }
      };

      const startTime = Date.now();
      await monitor.processWebhookPayload(largePayload);
      const endTime = Date.now();
      
      // Should process within reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should handle error buffer cleanup correctly', () => {
      const monitor = new SmartSentryMonitor();
      
      // Add old entries
      const oldTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      monitor.state.errorBuffer.set('old-key', { groupedAt: oldTime });
      monitor.state.errorBuffer.set('new-key', { groupedAt: Date.now() });
      
      monitor.cleanErrorBuffer(Date.now() - 60 * 60 * 1000); // 1 hour cutoff
      
      expect(monitor.state.errorBuffer.has('old-key')).toBe(false);
      expect(monitor.state.errorBuffer.has('new-key')).toBe(true);
    });

    test('should handle API failures gracefully', async () => {
      const monitor = new SmartSentryMonitor();
      
      // Mock API failure
      mockHttps.get.mockImplementation((url, options, callback) => {
        const req = { 
          on: jest.fn((event, handler) => {
            if (event === 'error') {
              handler(new Error('API timeout'));
            }
          }),
          setTimeout: jest.fn()
        };
        return req;
      });

      // Should not throw, should handle gracefully
      await expect(monitor.fetchRecentIssues()).resolves.toBeDefined();
    });
  });

  describe('Configuration and Environment', () => {
    test('should use environment variables correctly', () => {
      process.env.SENTRY_WEBHOOK_PORT = '3002';
      process.env.SENTRY_WEBHOOK_SECRET = 'custom-secret';
      
      const monitor = new SmartSentryMonitor();
      
      expect(monitor.config.webhook.port).toBe('3002');
      expect(monitor.config.webhook.secret).toBe('custom-secret');
    });

    test('should handle missing environment variables', () => {
      delete process.env.SENTRY_DSN;
      delete process.env.SENTRY_AUTH_TOKEN;
      
      const monitor = new SmartSentryMonitor();
      
      expect(monitor.config.sentry.dsn).toBeUndefined();
      expect(monitor.config.sentry.authToken).toBeUndefined();
    });

    test('should generate webhook secret if not provided', () => {
      delete process.env.SENTRY_WEBHOOK_SECRET;
      
      const monitor = new SmartSentryMonitor();
      
      expect(monitor.config.webhook.secret).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});