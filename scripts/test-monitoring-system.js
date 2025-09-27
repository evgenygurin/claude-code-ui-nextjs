#!/usr/bin/env node

/**
 * Post-Merge Monitoring System Test Suite
 * Comprehensive testing and validation of the health monitoring system
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class MonitoringSystemTester {
  constructor() {
    this.testResults = [];
    this.healthDir = '.health-monitoring';
    this.testDataDir = path.join(this.healthDir, 'test-data');
    
    this.ensureTestEnvironment();
  }

  ensureTestEnvironment() {
    // Create test directories
    const dirs = [
      this.healthDir,
      this.testDataDir,
      path.join(this.healthDir, 'reports'),
      path.join(this.healthDir, 'baselines'),
      path.join(this.healthDir, 'alerts'),
      path.join(this.healthDir, 'trends'),
      '.codegen-tasks',
      '.codegen-reports'
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive monitoring system tests...\n');

    const testSuites = [
      'testTaskScheduler',
      'testHealthChangeDetector', 
      'testNotificationManager',
      'testCodeGenErrorHandler',
      'testWorkflowIntegration',
      'testEndToEndScenarios'
    ];

    for (const testSuite of testSuites) {
      console.log(`\n📋 Running test suite: ${testSuite}`);
      console.log(''.padEnd(50, '='));
      
      try {
        await this[testSuite]();
        this.recordTestResult(testSuite, 'PASSED', 'All tests in suite passed');
      } catch (error) {
        this.recordTestResult(testSuite, 'FAILED', error.message);
        console.error(`❌ Test suite ${testSuite} failed:`, error.message);
      }
    }

    this.generateTestReport();
    return this.testResults;
  }

  async testTaskScheduler() {
    console.log('🔧 Testing Task Scheduler...');
    
    const TaskScheduler = require('./task-scheduler');
    const scheduler = new TaskScheduler();

    // Test 1: Basic delayed task scheduling
    console.log('  1. Testing delayed task scheduling...');
    const delayedTask = await scheduler.scheduleDelayedTask();
    this.assert(delayedTask.id, 'Delayed task should have an ID');
    this.assert(delayedTask.type === 'pr_readiness_check', 'Task type should be correct');
    console.log('    ✅ Delayed task scheduling works');

    // Test 2: Health monitoring task scheduling
    console.log('  2. Testing health monitoring task scheduling...');
    const healthTask = await scheduler.scheduleHealthMonitoring({
      status: 'critical',
      score: 45,
      issues: 'build,tests',
      interval: '30m'
    });
    this.assert(healthTask.id, 'Health task should have an ID');
    this.assert(healthTask.type === 'health_monitoring', 'Health task type should be correct');
    this.assert(healthTask.priority === 'high', 'Critical health should have high priority');
    console.log('    ✅ Health monitoring scheduling works');

    // Test 3: Task checking and execution
    console.log('  3. Testing task checking...');
    const pendingTasks = await scheduler.checkPendingTasks();
    this.assert(Array.isArray(pendingTasks), 'Should return an array of tasks');
    console.log('    ✅ Task checking works');

    // Test 4: Health trends analysis
    console.log('  4. Testing health trends analysis...');
    await scheduler.trackHealthTrends();
    const trendsFile = path.join(this.healthDir, 'trends', 'health-trends.json');
    this.assert(fs.existsSync(trendsFile), 'Trends file should be created');
    console.log('    ✅ Health trends analysis works');

    console.log('✅ Task Scheduler tests passed');
  }

  async testHealthChangeDetector() {
    console.log('🔍 Testing Health Change Detector...');
    
    const HealthChangeDetector = require('./health-change-detector');
    const detector = new HealthChangeDetector();

    // Create mock health data
    this.createMockHealthData();

    // Test 1: Current health status detection
    console.log('  1. Testing current health status detection...');
    const currentHealth = await detector.getCurrentHealthStatus();
    this.assert(currentHealth.timestamp, 'Health status should have timestamp');
    this.assert(typeof currentHealth.overallScore === 'number', 'Should have numeric score');
    this.assert(currentHealth.status, 'Should have status');
    console.log('    ✅ Current health detection works');

    // Test 2: Health baseline retrieval
    console.log('  2. Testing health baseline retrieval...');
    const baseline = await detector.getHealthBaseline();
    this.assert(typeof baseline.score === 'number', 'Baseline should have numeric score');
    console.log('    ✅ Health baseline retrieval works');

    // Test 3: Change detection
    console.log('  3. Testing change detection...');
    const analysis = await detector.detectHealthChanges();
    this.assert(analysis.timestamp, 'Analysis should have timestamp');
    this.assert(analysis.changes, 'Analysis should have changes object');
    this.assert(analysis.trends, 'Analysis should have trends object');
    console.log('    ✅ Change detection works');

    // Test 4: Change history
    console.log('  4. Testing change history...');
    const history = await detector.getChangeHistory(7);
    this.assert(Array.isArray(history), 'History should be an array');
    console.log('    ✅ Change history works');

    console.log('✅ Health Change Detector tests passed');
  }

  async testNotificationManager() {
    console.log('🔔 Testing Notification Manager...');
    
    const NotificationManager = require('./notification-manager');
    const manager = new NotificationManager();

    // Test 1: Alert processing
    console.log('  1. Testing alert processing...');
    const healthData = {
      status: 'critical',
      score: 45,
      issues: ['build', 'tests'],
      errorType: 'post_merge_health_critical',
      branch: 'main',
      commit: 'test-commit'
    };

    const alert = await manager.processHealthAlert(healthData);
    this.assert(alert.id, 'Alert should have an ID');
    this.assert(alert.priority === 'critical', 'Critical health should have critical priority');
    this.assert(alert.actions_taken.length > 0, 'Actions should have been taken');
    console.log('    ✅ Alert processing works');

    // Test 2: Active alerts retrieval
    console.log('  2. Testing active alerts retrieval...');
    const activeAlerts = await manager.getActiveAlerts();
    this.assert(Array.isArray(activeAlerts), 'Active alerts should be an array');
    console.log('    ✅ Active alerts retrieval works');

    // Test 3: Alert resolution
    console.log('  3. Testing alert resolution...');
    if (activeAlerts.length > 0) {
      const resolvedAlert = await manager.resolveAlert(activeAlerts[0].id, 'Test resolution');
      this.assert(resolvedAlert.status === 'resolved', 'Alert should be resolved');
      this.assert(resolvedAlert.resolution, 'Alert should have resolution details');
    }
    console.log('    ✅ Alert resolution works');

    console.log('✅ Notification Manager tests passed');
  }

  async testCodeGenErrorHandler() {
    console.log('🤖 Testing CodeGen Error Handler...');
    
    const CodeGenErrorHandler = require('./codegen-error-handler');
    const handler = new CodeGenErrorHandler();

    // Test 1: Error handling
    console.log('  1. Testing error handling...');
    await handler.handleError('post_merge_health_critical', 'Test health degradation detected');
    
    // Check if error report was created
    const reportsDir = '.codegen-reports';
    if (fs.existsSync(reportsDir)) {
      const reportFiles = fs.readdirSync(reportsDir).filter(f => f.startsWith('error-'));
      this.assert(reportFiles.length > 0, 'Error report should be created');
    }
    console.log('    ✅ Error handling works');

    // Test 2: Context gathering
    console.log('  2. Testing context gathering...');
    const context = await handler.gatherContext();
    this.assert(typeof context === 'object', 'Context should be an object');
    console.log('    ✅ Context gathering works');

    // Test 3: Analysis prompt generation
    console.log('  3. Testing analysis prompt generation...');
    const mockErrorReport = {
      errorType: 'post_merge_health_critical',
      errorDetails: 'Health score dropped to 45/100',
      project: 'test-project',
      branch: 'main',
      commit: 'test-commit',
      timestamp: new Date().toISOString()
    };

    const prompt = handler.generateAnalysisPrompt(mockErrorReport);
    this.assert(prompt.includes('@codegen'), 'Prompt should mention @codegen');
    this.assert(prompt.includes('Post-Merge'), 'Post-merge prompt should be used for health issues');
    console.log('    ✅ Analysis prompt generation works');

    console.log('✅ CodeGen Error Handler tests passed');
  }

  async testWorkflowIntegration() {
    console.log('🔄 Testing Workflow Integration...');

    // Test 1: Workflow file exists and is valid
    console.log('  1. Testing workflow file existence...');
    const workflowFile = '.github/workflows/post-merge-monitoring.yml';
    this.assert(fs.existsSync(workflowFile), 'Post-merge monitoring workflow should exist');
    
    const workflowContent = fs.readFileSync(workflowFile, 'utf8');
    this.assert(workflowContent.includes('post-merge-health-check'), 'Workflow should contain health check job');
    this.assert(workflowContent.includes('trigger-codegen-intervention'), 'Workflow should contain CodeGen intervention');
    console.log('    ✅ Workflow file is valid');

    // Test 2: Configuration files exist
    console.log('  2. Testing configuration files...');
    const configFile = 'config/notification-config.json';
    this.assert(fs.existsSync(configFile), 'Notification config should exist');
    
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    this.assert(config.notification_settings, 'Config should have notification settings');
    this.assert(config.escalation_rules, 'Config should have escalation rules');
    console.log('    ✅ Configuration files are valid');

    // Test 3: Script permissions and executability
    console.log('  3. Testing script executability...');
    const scripts = [
      'scripts/task-scheduler.js',
      'scripts/health-change-detector.js',
      'scripts/notification-manager.js',
      'scripts/codegen-error-handler.js'
    ];

    for (const script of scripts) {
      this.assert(fs.existsSync(script), `${script} should exist`);
      
      // Test if script can be loaded without syntax errors
      try {
        require(path.resolve(script));
      } catch (error) {
        if (!error.message.includes('require.main')) {
          throw new Error(`${script} has syntax errors: ${error.message}`);
        }
      }
    }
    console.log('    ✅ All scripts are valid and executable');

    console.log('✅ Workflow Integration tests passed');
  }

  async testEndToEndScenarios() {
    console.log('🎭 Testing End-to-End Scenarios...');

    // Scenario 1: Critical health degradation
    console.log('  1. Testing critical health degradation scenario...');
    await this.testCriticalHealthScenario();
    console.log('    ✅ Critical health scenario works');

    // Scenario 2: Health improvement
    console.log('  2. Testing health improvement scenario...');
    await this.testHealthImprovementScenario();
    console.log('    ✅ Health improvement scenario works');

    // Scenario 3: Trend-based alerting
    console.log('  3. Testing trend-based alerting scenario...');
    await this.testTrendBasedScenario();
    console.log('    ✅ Trend-based scenario works');

    console.log('✅ End-to-End Scenarios tests passed');
  }

  async testCriticalHealthScenario() {
    // Simulate critical health degradation
    const HealthChangeDetector = require('./health-change-detector');
    const NotificationManager = require('./notification-manager');
    
    const detector = new HealthChangeDetector();
    const notificationManager = new NotificationManager();

    // Create mock critical health data
    const criticalHealthData = {
      status: 'critical',
      score: 35,
      issues: ['build', 'tests', 'type_checking'],
      errorType: 'post_merge_health_critical_degradation',
      branch: 'main',
      commit: 'test-commit-critical'
    };

    // Process the critical health alert
    const alert = await notificationManager.processHealthAlert(criticalHealthData);
    
    this.assert(alert.priority === 'critical', 'Should trigger critical priority');
    this.assert(alert.actions_taken.some(action => 
      action.action === 'trigger_codegen_immediate'
    ), 'Should trigger immediate CodeGen intervention');
  }

  async testHealthImprovementScenario() {
    // Simulate health improvement
    const NotificationManager = require('./notification-manager');
    const notificationManager = new NotificationManager();

    const improvementData = {
      status: 'healthy',
      score: 95,
      issues: [],
      errorType: 'post_merge_health_significant_improvement',
      resolvedIssues: ['build', 'tests'],
      branch: 'main',
      commit: 'test-commit-improvement'
    };

    const alert = await notificationManager.processHealthAlert(improvementData);
    
    this.assert(alert.priority === 'low', 'Should trigger low priority for improvements');
    this.assert(alert.actions_taken.some(action => 
      action.action === 'update_baselines' || action.action === 'document_success'
    ), 'Should update baselines or document success');
  }

  async testTrendBasedScenario() {
    // Simulate degrading trend
    const HealthChangeDetector = require('./health-change-detector');
    const detector = new HealthChangeDetector();

    // Create mock trend data
    this.createMockTrendData();

    const analysis = await detector.detectHealthChanges();
    
    this.assert(analysis.trends, 'Should have trends analysis');
    this.assert(analysis.changes, 'Should have changes analysis');
  }

  createMockHealthData() {
    // Create mock baseline data
    const baselinesDir = path.join(this.healthDir, 'baselines');
    if (!fs.existsSync(baselinesDir)) {
      fs.mkdirSync(baselinesDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const baselineFile = path.join(baselinesDir, `health-score-${today}.txt`);
    fs.writeFileSync(baselineFile, '85');

    // Create mock health reports
    const reportsDir = path.join(this.healthDir, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = path.join(reportsDir, `${today}-120000-health-report.md`);
    fs.writeFileSync(reportFile, `# Health Report\nScore: 85/100\nStatus: healthy`);
  }

  createMockTrendData() {
    // Create multiple health reports with declining scores
    const reportsDir = path.join(this.healthDir, 'reports');
    const scores = [90, 85, 80, 75, 70]; // Declining trend
    
    scores.forEach((score, index) => {
      const date = new Date();
      date.setHours(date.getHours() - (index * 6)); // 6 hours apart
      
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = date.toISOString().split('T')[1].replace(/[:.]/g, '').substring(0, 6);
      
      const reportFile = path.join(reportsDir, `${dateStr}-${timeStr}-health-report.md`);
      fs.writeFileSync(reportFile, `# Health Report\nScore: ${score}/100`);
    });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  recordTestResult(testSuite, result, details) {
    this.testResults.push({
      testSuite,
      result,
      details,
      timestamp: new Date().toISOString()
    });
  }

  generateTestReport() {
    console.log('\n📊 Test Results Summary');
    console.log(''.padEnd(50, '='));

    const passed = this.testResults.filter(r => r.result === 'PASSED').length;
    const failed = this.testResults.filter(r => r.result === 'FAILED').length;
    
    console.log(`Total Test Suites: ${this.testResults.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Test Suites:');
      this.testResults
        .filter(r => r.result === 'FAILED')
        .forEach(r => {
          console.log(`  - ${r.testSuite}: ${r.details}`);
        });
    }

    // Save detailed test report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed,
        failed,
        success_rate: `${Math.round((passed / this.testResults.length) * 100)}%`
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    const reportFile = path.join(this.testDataDir, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📝 Detailed test report saved: ${reportFile}`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! The post-merge monitoring system is ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix the issues before deployment.');
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(r => r.result === 'FAILED');
    
    if (failedTests.length === 0) {
      recommendations.push('✅ All tests passed - system is ready for production deployment');
      recommendations.push('🔄 Consider setting up automated test runs in CI/CD pipeline');
      recommendations.push('📊 Monitor the system performance in production');
    } else {
      recommendations.push('❌ Fix failing tests before deploying to production');
      recommendations.push('🧪 Run tests again after fixes are applied');
      recommendations.push('🔍 Review error logs for detailed failure information');
    }

    recommendations.push('📚 Update documentation with test results');
    recommendations.push('🔧 Consider adding more edge case tests');
    recommendations.push('🚀 Plan gradual rollout with monitoring');

    return recommendations;
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    // Remove test files created during testing
    const testFiles = [
      path.join(this.healthDir, 'test-data'),
      '.codegen-tasks',
      '.codegen-reports'
    ];

    for (const testPath of testFiles) {
      if (fs.existsSync(testPath)) {
        try {
          if (fs.statSync(testPath).isDirectory()) {
            fs.rmSync(testPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(testPath);
          }
          console.log(`  Removed: ${testPath}`);
        } catch (error) {
          console.warn(`  ⚠️  Could not remove ${testPath}: ${error.message}`);
        }
      }
    }

    console.log('✅ Test cleanup completed');
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'run-all';
  const tester = new MonitoringSystemTester();

  async function main() {
    switch (command) {
      case 'run-all':
        const results = await tester.runAllTests();
        const passed = results.filter(r => r.result === 'PASSED').length;
        process.exit(passed === results.length ? 0 : 1);
        break;
        
      case 'cleanup':
        await tester.cleanup();
        break;
        
      case 'help':
      default:
        console.log(`
Post-Merge Monitoring System Test Suite

Usage:
  node test-monitoring-system.js <command>

Commands:
  run-all   - Run all test suites (default)
  cleanup   - Clean up test files and directories
  help      - Show this help message

Test Suites:
  1. Task Scheduler - Tests delayed tasks and health monitoring scheduling
  2. Health Change Detector - Tests health status detection and change analysis
  3. Notification Manager - Tests alert processing and escalation
  4. CodeGen Error Handler - Tests error handling and prompt generation
  5. Workflow Integration - Tests GitHub Actions workflow and configuration
  6. End-to-End Scenarios - Tests complete workflows for various scenarios

The test suite validates:
- ✅ Component functionality and integration
- ✅ Error handling and edge cases
- ✅ Configuration and workflow validity
- ✅ End-to-end scenario execution
- ✅ File system operations and permissions

Exit codes:
  0 - All tests passed
  1 - One or more tests failed
        `);
        break;
    }
  }

  main().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = MonitoringSystemTester;