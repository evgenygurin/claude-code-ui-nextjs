#!/usr/bin/env node

/**
 * 🏥 Authentication Monitoring System
 * 
 * Continuously monitors authentication status across all integrated services
 * Provides proactive alerts for token expiration and authorization issues
 */

const fs = require('fs');
const path = require('path');
const process = require('process');

// Import token validation
const { validateAllTokens, exportValidationResults, REQUIRED_TOKENS } = require('./check-auth-tokens');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const CONFIG = {
  MONITORING_INTERVAL: 5 * 60 * 1000, // 5 minutes
  HEALTH_CHECK_INTERVAL: 15 * 60 * 1000, // 15 minutes
  MAX_LOG_ENTRIES: 100,
  MONITORING_DIR: '.health-monitoring',
  AUTH_STATUS_FILE: '.auth-monitoring.json'
};

/**
 * Enhanced logging with persistence
 */
class Logger {
  constructor() {
    this.logFile = path.join(CONFIG.MONITORING_DIR, 'auth-monitor.log');
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(CONFIG.MONITORING_DIR)) {
      fs.mkdirSync(CONFIG.MONITORING_DIR, { recursive: true });
    }
  }

  log(level, message, details = '') {
    const timestamp = new Date().toISOString();
    const levelColors = {
      INFO: colors.blue,
      SUCCESS: colors.green,
      WARNING: colors.yellow,
      ERROR: colors.red,
      DEBUG: colors.magenta
    };
    
    const color = levelColors[level] || colors.reset;
    const logEntry = `${level} [${timestamp}] ${message} ${details}`;
    
    // Console output with colors
    console.log(`${color}${logEntry}${colors.reset}`);
    
    // File output without colors
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
      this.rotateLogIfNeeded();
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  rotateLogIfNeeded() {
    try {
      const stats = fs.statSync(this.logFile);
      if (stats.size > 1024 * 1024) { // 1MB
        const backupFile = this.logFile.replace('.log', '.backup.log');
        fs.renameSync(this.logFile, backupFile);
      }
    } catch (error) {
      // Ignore rotation errors
    }
  }
}

/**
 * Authentication Status Monitor
 */
class AuthMonitor {
  constructor() {
    this.logger = new Logger();
    this.isRunning = false;
    this.intervals = [];
    this.healthData = {
      startTime: new Date().toISOString(),
      checks: [],
      status: 'starting'
    };
  }

  /**
   * Start continuous monitoring
   */
  start() {
    if (this.isRunning) {
      this.logger.log('WARNING', '⚠️  Monitor already running');
      return;
    }

    this.logger.log('INFO', '🚀 Starting authentication monitoring system...');
    this.isRunning = true;
    this.healthData.status = 'running';

    // Initial check
    this.performAuthCheck();

    // Schedule regular checks
    const authInterval = setInterval(() => {
      this.performAuthCheck();
    }, CONFIG.MONITORING_INTERVAL);

    const healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, CONFIG.HEALTH_CHECK_INTERVAL);

    this.intervals = [authInterval, healthInterval];

    // Graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());

    this.logger.log('SUCCESS', '✅ Authentication monitoring started');
    this.logger.log('INFO', `📊 Check interval: ${CONFIG.MONITORING_INTERVAL / 1000}s`);
    this.logger.log('INFO', `🏥 Health check interval: ${CONFIG.HEALTH_CHECK_INTERVAL / 1000}s`);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.logger.log('INFO', '🛑 Stopping authentication monitoring...');
    this.isRunning = false;
    this.healthData.status = 'stopped';

    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    this.saveHealthData();
    this.logger.log('SUCCESS', '✅ Authentication monitoring stopped');
    process.exit(0);
  }

  /**
   * Perform authentication check
   */
  performAuthCheck() {
    this.logger.log('INFO', '🔍 Performing authentication check...');

    try {
      const isValid = validateAllTokens();
      exportValidationResults();

      const checkResult = {
        timestamp: new Date().toISOString(),
        type: 'auth_check',
        success: isValid,
        details: this.getAuthStatus()
      };

      this.healthData.checks.push(checkResult);
      this.trimHealthData();
      this.saveHealthData();

      if (isValid) {
        this.logger.log('SUCCESS', '✅ Authentication check passed');
      } else {
        this.logger.log('ERROR', '❌ Authentication check failed');
        this.handleAuthFailure(checkResult);
      }

    } catch (error) {
      this.logger.log('ERROR', '💥 Authentication check error', `Error: ${error.message}`);
      
      const errorResult = {
        timestamp: new Date().toISOString(),
        type: 'auth_error',
        success: false,
        error: error.message,
        stack: error.stack
      };

      this.healthData.checks.push(errorResult);
      this.saveHealthData();
    }
  }

  /**
   * Perform comprehensive health check
   */
  performHealthCheck() {
    this.logger.log('INFO', '🏥 Performing comprehensive health check...');

    const healthCheck = {
      timestamp: new Date().toISOString(),
      type: 'health_check',
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      auth: this.getAuthStatus(),
      monitoring: {
        isRunning: this.isRunning,
        startTime: this.healthData.startTime,
        totalChecks: this.healthData.checks.length,
        recentFailures: this.getRecentFailures()
      }
    };

    this.healthData.checks.push(healthCheck);
    this.trimHealthData();
    this.saveHealthData();

    this.logger.log('SUCCESS', '✅ Health check completed');
    this.logger.log('DEBUG', '📊 System metrics updated');
  }

  /**
   * Get current authentication status
   */
  getAuthStatus() {
    try {
      const authFile = path.join(process.cwd(), CONFIG.AUTH_STATUS_FILE);
      if (fs.existsSync(authFile)) {
        return JSON.parse(fs.readFileSync(authFile, 'utf8'));
      }
    } catch (error) {
      this.logger.log('WARNING', '⚠️  Could not read auth status file', `Error: ${error.message}`);
    }
    
    return { error: 'Auth status not available' };
  }

  /**
   * Get recent failures for analysis
   */
  getRecentFailures() {
    const recent = this.healthData.checks.slice(-20); // Last 20 checks
    return recent.filter(check => !check.success);
  }

  /**
   * Handle authentication failures
   */
  handleAuthFailure(checkResult) {
    const recentFailures = this.getRecentFailures();
    
    if (recentFailures.length >= 3) {
      this.logger.log('ERROR', '🚨 CRITICAL: Multiple authentication failures detected!');
      this.logger.log('ERROR', '📋 Recommend immediate manual intervention');
      
      // Could integrate with alerting system here
      this.createFailureReport(recentFailures);
    }
  }

  /**
   * Create detailed failure report
   */
  createFailureReport(failures) {
    const report = {
      timestamp: new Date().toISOString(),
      type: 'failure_report',
      failureCount: failures.length,
      failures: failures,
      recommendations: this.getRecommendations(failures)
    };

    const reportFile = path.join(CONFIG.MONITORING_DIR, `failure-report-${Date.now()}.json`);
    
    try {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      this.logger.log('INFO', '📄 Failure report created', `File: ${reportFile}`);
    } catch (error) {
      this.logger.log('ERROR', '❌ Could not create failure report', `Error: ${error.message}`);
    }
  }

  /**
   * Get recommendations based on failure patterns
   */
  getRecommendations(failures) {
    const recommendations = [];
    
    const hasTokenIssues = failures.some(f => 
      f.details && f.details.summary && !f.details.summary.requiredValid
    );
    
    if (hasTokenIssues) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Check and update authentication tokens',
        details: 'Required tokens are missing or invalid. Update CI/CD environment variables.'
      });
    }

    const hasNetworkIssues = failures.some(f => 
      f.error && (f.error.includes('ENOTFOUND') || f.error.includes('timeout'))
    );

    if (hasNetworkIssues) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Investigate network connectivity',
        details: 'Network-related errors detected. Check service availability and network configuration.'
      });
    }

    recommendations.push({
      priority: 'LOW',
      action: 'Review AUTH-TROUBLESHOOTING.md',
      details: 'Consult the troubleshooting guide for detailed resolution steps.'
    });

    return recommendations;
  }

  /**
   * Trim health data to prevent excessive memory usage
   */
  trimHealthData() {
    if (this.healthData.checks.length > CONFIG.MAX_LOG_ENTRIES) {
      this.healthData.checks = this.healthData.checks.slice(-CONFIG.MAX_LOG_ENTRIES);
    }
  }

  /**
   * Save health data to disk
   */
  saveHealthData() {
    const healthFile = path.join(CONFIG.MONITORING_DIR, 'health-data.json');
    
    try {
      fs.writeFileSync(healthFile, JSON.stringify(this.healthData, null, 2));
    } catch (error) {
      this.logger.log('WARNING', '⚠️  Could not save health data', `Error: ${error.message}`);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    const authStatus = this.getAuthStatus();
    const recentChecks = this.healthData.checks.slice(-5);
    
    return {
      monitoring: {
        isRunning: this.isRunning,
        status: this.healthData.status,
        uptime: this.isRunning ? process.uptime() : 0,
        startTime: this.healthData.startTime
      },
      authentication: authStatus,
      recentActivity: recentChecks,
      health: {
        totalChecks: this.healthData.checks.length,
        recentFailures: this.getRecentFailures().length,
        lastCheck: recentChecks.length > 0 ? recentChecks[recentChecks.length - 1].timestamp : null
      }
    };
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const monitor = new AuthMonitor();

  switch (command) {
    case 'start':
    case 'run':
      monitor.start();
      break;

    case 'check':
      monitor.performAuthCheck();
      break;

    case 'health':
      monitor.performHealthCheck();
      break;

    case 'status':
      const status = monitor.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'help':
    default:
      console.log(`
${colors.cyan}🏥 Authentication Monitor${colors.reset}

Usage: node auth-monitor.js [command]

Commands:
  ${colors.green}start${colors.reset}    Start continuous monitoring
  ${colors.green}check${colors.reset}    Perform single authentication check
  ${colors.green}health${colors.reset}   Perform comprehensive health check
  ${colors.green}status${colors.reset}   Show current monitoring status
  ${colors.green}help${colors.reset}     Show this help message

Examples:
  npm run auth:monitor
  npm run auth:monitor:continuous
  npm run auth:status
      `);
      break;
  }
}

// Export for use in other scripts
module.exports = AuthMonitor;

// Run if called directly
if (require.main === module) {
  main();
}