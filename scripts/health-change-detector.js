#!/usr/bin/env node

/**
 * Health Change Detection System
 * Automatically detects significant changes in project health metrics
 * and triggers appropriate responses via CodeGen integration
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class HealthChangeDetector {
  constructor() {
    this.healthDir = '.health-monitoring';
    this.baselinesDir = path.join(this.healthDir, 'baselines');
    this.reportsDir = path.join(this.healthDir, 'reports');
    this.trendsDir = path.join(this.healthDir, 'trends');
    this.alertsDir = path.join(this.healthDir, 'alerts');
    
    this.thresholds = {
      critical: {
        scoreDropThreshold: 30,    // Trigger if health score drops by 30+ points
        consecutiveFailures: 2,    // Trigger after 2 consecutive failures
        timeWindowHours: 6         // Within 6 hours
      },
      degraded: {
        scoreDropThreshold: 20,    // Trigger if health score drops by 20+ points
        consecutiveFailures: 3,    // Trigger after 3 consecutive failures
        timeWindowHours: 12        // Within 12 hours
      },
      improvement: {
        scoreRiseThreshold: 15,    // Detect significant improvements
        stabilityHours: 24         // Must be stable for 24 hours
      }
    };
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.healthDir, this.baselinesDir, this.reportsDir, this.trendsDir, this.alertsDir]
      .forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
  }

  async detectHealthChanges() {
    console.log('🔍 Analyzing health changes...');
    
    const currentHealth = await this.getCurrentHealthStatus();
    const baseline = await this.getHealthBaseline();
    const recentHistory = await this.getRecentHealthHistory();
    
    const changeAnalysis = {
      timestamp: new Date().toISOString(),
      current: currentHealth,
      baseline: baseline,
      changes: await this.analyzeChanges(currentHealth, baseline, recentHistory),
      trends: await this.analyzeTrends(recentHistory),
      recommendations: []
    };

    // Detect significant changes
    const significantChanges = await this.identifySignificantChanges(changeAnalysis);
    
    if (significantChanges.length > 0) {
      console.log(`🚨 Detected ${significantChanges.length} significant health changes`);
      await this.handleSignificantChanges(significantChanges, changeAnalysis);
    } else {
      console.log('✅ No significant health changes detected');
    }

    // Save analysis results
    await this.saveChangeAnalysis(changeAnalysis);
    
    return changeAnalysis;
  }

  async getCurrentHealthStatus() {
    console.log('📊 Gathering current health metrics...');
    
    const healthStatus = {
      timestamp: new Date().toISOString(),
      metrics: {},
      overallScore: 0,
      status: 'unknown',
      issues: []
    };

    try {
      // Run quick health checks
      const checks = await this.runHealthChecks();
      healthStatus.metrics = checks.metrics;
      healthStatus.overallScore = checks.overallScore;
      healthStatus.status = checks.status;
      healthStatus.issues = checks.issues;
    } catch (error) {
      console.warn('⚠️  Error gathering current health status:', error.message);
      healthStatus.status = 'error';
      healthStatus.issues = ['health_check_failure'];
    }

    return healthStatus;
  }

  async runHealthChecks() {
    const results = {
      metrics: {
        linting: await this.checkLinting(),
        typeChecking: await this.checkTypeChecking(),
        tests: await this.checkTests(),
        build: await this.checkBuild(),
        security: await this.checkSecurity()
      },
      overallScore: 0,
      status: 'unknown',
      issues: []
    };

    // Calculate overall score
    const checks = Object.values(results.metrics);
    const passedChecks = checks.filter(check => check.status === 'passed').length;
    results.overallScore = Math.round((passedChecks / checks.length) * 100);

    // Determine overall status
    const failedChecks = checks.filter(check => check.status === 'failed');
    results.issues = failedChecks.map(check => check.type);

    if (failedChecks.length === 0) {
      results.status = 'healthy';
    } else if (failedChecks.length >= 3 || failedChecks.some(c => c.critical)) {
      results.status = 'critical';
    } else if (failedChecks.length >= 2) {
      results.status = 'degraded';
    } else {
      results.status = 'warning';
    }

    return results;
  }

  async checkLinting() {
    return new Promise((resolve) => {
      exec('npm run lint', { timeout: 30000 }, (error, stdout, stderr) => {
        resolve({
          type: 'linting',
          status: error ? 'failed' : 'passed',
          critical: false,
          details: error ? stderr : 'Linting passed',
          executionTime: Date.now()
        });
      });
    });
  }

  async checkTypeChecking() {
    return new Promise((resolve) => {
      exec('npm run type-check', { timeout: 60000 }, (error, stdout, stderr) => {
        resolve({
          type: 'type_checking',
          status: error ? 'failed' : 'passed',
          critical: true, // Type errors are critical
          details: error ? stderr : 'Type checking passed',
          executionTime: Date.now()
        });
      });
    });
  }

  async checkTests() {
    return new Promise((resolve) => {
      exec('npm run test:ci', { timeout: 120000 }, (error, stdout, stderr) => {
        resolve({
          type: 'tests',
          status: error ? 'failed' : 'passed',
          critical: true, // Test failures are critical
          details: error ? stderr : 'Tests passed',
          executionTime: Date.now()
        });
      });
    });
  }

  async checkBuild() {
    return new Promise((resolve) => {
      exec('npm run build', { timeout: 180000 }, (error, stdout, stderr) => {
        resolve({
          type: 'build',
          status: error ? 'failed' : 'passed',
          critical: true, // Build failures are critical
          details: error ? stderr : 'Build passed',
          executionTime: Date.now()
        });
      });
    });
  }

  async checkSecurity() {
    return new Promise((resolve) => {
      exec('npm audit --audit-level=moderate', { timeout: 60000 }, (error, stdout, stderr) => {
        resolve({
          type: 'security',
          status: error ? 'failed' : 'passed',
          critical: false, // Security issues are important but not immediately critical
          details: error ? stderr : 'Security audit passed',
          executionTime: Date.now()
        });
      });
    });
  }

  async getHealthBaseline() {
    const baselineFiles = fs.readdirSync(this.baselinesDir)
      .filter(file => file.startsWith('health-score-') && file.endsWith('.txt'))
      .sort()
      .slice(-5); // Get last 5 baselines

    if (baselineFiles.length === 0) {
      return { score: 100, status: 'healthy', timestamp: null };
    }

    // Calculate average baseline from recent files
    let totalScore = 0;
    let validFiles = 0;

    for (const file of baselineFiles) {
      try {
        const score = parseInt(fs.readFileSync(path.join(this.baselinesDir, file), 'utf8'));
        if (!isNaN(score)) {
          totalScore += score;
          validFiles++;
        }
      } catch (error) {
        console.warn(`⚠️  Could not read baseline file ${file}:`, error.message);
      }
    }

    const averageScore = validFiles > 0 ? Math.round(totalScore / validFiles) : 100;
    
    return {
      score: averageScore,
      status: this.scoreToStatus(averageScore),
      timestamp: baselineFiles[baselineFiles.length - 1]?.match(/(\d{8})/)?.[1] || null,
      samplesCount: validFiles
    };
  }

  scoreToStatus(score) {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'degraded';
    return 'critical';
  }

  async getRecentHealthHistory(hours = 48) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const history = [];

    if (!fs.existsSync(this.reportsDir)) {
      return history;
    }

    const reportFiles = fs.readdirSync(this.reportsDir)
      .filter(file => file.endsWith('-health-report.md'))
      .map(file => {
        const stats = fs.statSync(path.join(this.reportsDir, file));
        return { file, mtime: stats.mtime };
      })
      .filter(item => item.mtime > cutoffTime)
      .sort((a, b) => a.mtime - b.mtime);

    for (const { file, mtime } of reportFiles) {
      try {
        // Extract basic info from filename (in a real system, we'd parse the report)
        const match = file.match(/(\d{8})-(\d{6})-health-report\.md/);
        if (match) {
          const [, date, time] = match;
          // Simulated health data extraction
          history.push({
            timestamp: mtime.toISOString(),
            score: Math.floor(Math.random() * 40) + 60, // Simulated score for demo
            status: 'unknown', // Would be extracted from actual report
            issues: [] // Would be extracted from actual report
          });
        }
      } catch (error) {
        console.warn(`⚠️  Could not process health report ${file}:`, error.message);
      }
    }

    return history;
  }

  async analyzeChanges(current, baseline, history) {
    const changes = {
      scoreChange: current.overallScore - baseline.score,
      statusChange: current.status !== baseline.status,
      newIssues: current.issues.filter(issue => !baseline.issues?.includes(issue)),
      resolvedIssues: baseline.issues?.filter(issue => !current.issues.includes(issue)) || [],
      severity: 'none'
    };

    // Determine change severity
    if (Math.abs(changes.scoreChange) >= this.thresholds.critical.scoreDropThreshold) {
      changes.severity = 'critical';
    } else if (Math.abs(changes.scoreChange) >= this.thresholds.degraded.scoreDropThreshold) {
      changes.severity = 'significant';
    } else if (Math.abs(changes.scoreChange) >= 10) {
      changes.severity = 'moderate';
    } else if (changes.newIssues.length > 0 || changes.resolvedIssues.length > 0) {
      changes.severity = 'minor';
    }

    return changes;
  }

  async analyzeTrends(history) {
    if (history.length < 3) {
      return { trend: 'insufficient_data', confidence: 'low' };
    }

    const recent = history.slice(-3);
    const older = history.slice(0, -3);

    const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, h) => sum + h.score, 0) / older.length : recentAvg;

    const difference = recentAvg - olderAvg;
    
    let trend = 'stable';
    let confidence = 'medium';

    if (difference > 10) {
      trend = 'improving';
      confidence = difference > 20 ? 'high' : 'medium';
    } else if (difference < -10) {
      trend = 'degrading';
      confidence = difference < -20 ? 'high' : 'medium';
    }

    return {
      trend,
      confidence,
      recentAverage: Math.round(recentAvg),
      historicalAverage: Math.round(olderAvg),
      change: Math.round(difference)
    };
  }

  async identifySignificantChanges(analysis) {
    const significantChanges = [];
    
    const { current, changes, trends } = analysis;

    // Critical health degradation
    if (changes.scoreChange <= -this.thresholds.critical.scoreDropThreshold ||
        (current.status === 'critical' && changes.statusChange)) {
      significantChanges.push({
        type: 'critical_degradation',
        priority: 'high',
        description: `Critical health degradation detected: score dropped by ${Math.abs(changes.scoreChange)} points`,
        recommendedAction: 'immediate_codegen_intervention',
        details: {
          currentScore: current.overallScore,
          previousScore: current.overallScore - changes.scoreChange,
          issues: current.issues
        }
      });
    }

    // Significant degradation
    else if (changes.scoreChange <= -this.thresholds.degraded.scoreDropThreshold ||
             (current.status === 'degraded' && changes.statusChange)) {
      significantChanges.push({
        type: 'significant_degradation',
        priority: 'medium',
        description: `Significant health degradation: score dropped by ${Math.abs(changes.scoreChange)} points`,
        recommendedAction: 'scheduled_codegen_intervention',
        details: {
          currentScore: current.overallScore,
          previousScore: current.overallScore - changes.scoreChange,
          issues: current.issues
        }
      });
    }

    // New critical issues
    const criticalIssues = changes.newIssues.filter(issue => 
      ['build', 'type_checking', 'tests'].includes(issue)
    );
    
    if (criticalIssues.length > 0) {
      significantChanges.push({
        type: 'new_critical_issues',
        priority: 'high',
        description: `New critical issues detected: ${criticalIssues.join(', ')}`,
        recommendedAction: 'immediate_codegen_intervention',
        details: {
          newCriticalIssues: criticalIssues,
          allNewIssues: changes.newIssues
        }
      });
    }

    // Positive changes (improvements)
    if (changes.scoreChange >= this.thresholds.improvement.scoreRiseThreshold ||
        changes.resolvedIssues.length >= 2) {
      significantChanges.push({
        type: 'significant_improvement',
        priority: 'low',
        description: `Significant improvement detected: score increased by ${changes.scoreChange} points`,
        recommendedAction: 'update_baseline_and_celebrate',
        details: {
          currentScore: current.overallScore,
          previousScore: current.overallScore - changes.scoreChange,
          resolvedIssues: changes.resolvedIssues
        }
      });
    }

    // Trend-based changes
    if (trends.trend === 'degrading' && trends.confidence === 'high') {
      significantChanges.push({
        type: 'degrading_trend',
        priority: 'medium',
        description: `Degrading health trend detected over recent history`,
        recommendedAction: 'preventive_intervention',
        details: {
          trendDirection: trends.trend,
          confidence: trends.confidence,
          change: trends.change
        }
      });
    }

    return significantChanges;
  }

  async handleSignificantChanges(significantChanges, analysis) {
    console.log(`🚨 Handling ${significantChanges.length} significant changes...`);

    for (const change of significantChanges) {
      console.log(`📋 Processing change: ${change.type} (Priority: ${change.priority})`);
      
      await this.createChangeAlert(change, analysis);
      
      switch (change.recommendedAction) {
        case 'immediate_codegen_intervention':
          await this.triggerImmediateIntervention(change, analysis);
          break;
          
        case 'scheduled_codegen_intervention':
          await this.scheduleIntervention(change, analysis);
          break;
          
        case 'preventive_intervention':
          await this.schedulePreventiveIntervention(change, analysis);
          break;
          
        case 'update_baseline_and_celebrate':
          await this.updateBaselineAndDocument(change, analysis);
          break;
      }
    }
  }

  async createChangeAlert(change, analysis) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: change.type,
      priority: change.priority,
      description: change.description,
      recommendedAction: change.recommendedAction,
      details: change.details,
      context: {
        currentHealth: analysis.current,
        baseline: analysis.baseline,
        changes: analysis.changes,
        trends: analysis.trends
      },
      status: 'open'
    };

    const alertFile = path.join(this.alertsDir, `${alert.id}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
    
    console.log(`🔔 Alert created: ${alertFile}`);
    return alert;
  }

  async triggerImmediateIntervention(change, analysis) {
    console.log('🚨 Triggering immediate CodeGen intervention...');
    
    const CodeGenErrorHandler = require('./codegen-error-handler');
    const errorHandler = new CodeGenErrorHandler();
    
    const errorType = `health_change_${change.type}`;
    const errorDetails = `${change.description}. Current health score: ${analysis.current.overallScore}/100. Issues: ${analysis.current.issues.join(', ')}`;
    
    try {
      await errorHandler.handleError(errorType, errorDetails);
      console.log('✅ Immediate intervention triggered successfully');
    } catch (error) {
      console.error('❌ Failed to trigger immediate intervention:', error);
    }
  }

  async scheduleIntervention(change, analysis) {
    console.log('⏰ Scheduling CodeGen intervention...');
    
    const TaskScheduler = require('./task-scheduler');
    const scheduler = new TaskScheduler();
    
    try {
      await scheduler.scheduleHealthMonitoring({
        status: analysis.current.status,
        score: analysis.current.overallScore,
        issues: analysis.current.issues.join(','),
        interval: '2h' // More frequent monitoring for degraded health
      });
      
      console.log('✅ Intervention scheduled successfully');
    } catch (error) {
      console.error('❌ Failed to schedule intervention:', error);
    }
  }

  async schedulePreventiveIntervention(change, analysis) {
    console.log('🛡️ Scheduling preventive intervention...');
    
    const TaskScheduler = require('./task-scheduler');
    const scheduler = new TaskScheduler();
    
    try {
      await scheduler.scheduleHealthMonitoring({
        status: 'warning', // Treat as warning for preventive action
        score: analysis.current.overallScore,
        issues: 'trending_degradation',
        interval: '4h' // Regular monitoring for trend prevention
      });
      
      console.log('✅ Preventive intervention scheduled successfully');
    } catch (error) {
      console.error('❌ Failed to schedule preventive intervention:', error);
    }
  }

  async updateBaselineAndDocument(change, analysis) {
    console.log('🎉 Updating baseline after improvement...');
    
    // Update baseline
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const baselineFile = path.join(this.baselinesDir, `health-score-${today}.txt`);
    fs.writeFileSync(baselineFile, analysis.current.overallScore.toString());
    
    // Document the improvement
    const improvementReport = {
      timestamp: new Date().toISOString(),
      type: 'improvement_documented',
      previousScore: analysis.current.overallScore - analysis.changes.scoreChange,
      currentScore: analysis.current.overallScore,
      resolvedIssues: analysis.changes.resolvedIssues,
      improvement: analysis.changes.scoreChange
    };
    
    const reportFile = path.join(this.reportsDir, `improvement-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(improvementReport, null, 2));
    
    console.log(`✅ Improvement documented and baseline updated: ${baselineFile}`);
  }

  async saveChangeAnalysis(analysis) {
    const analysisFile = path.join(this.trendsDir, `change-analysis-${Date.now()}.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    console.log(`📊 Change analysis saved: ${analysisFile}`);
  }

  async getChangeHistory(days = 7) {
    const cutoffTime = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const history = [];

    if (!fs.existsSync(this.alertsDir)) {
      return history;
    }

    const alertFiles = fs.readdirSync(this.alertsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(this.alertsDir, file);
        const stats = fs.statSync(filePath);
        return { file, mtime: stats.mtime, path: filePath };
      })
      .filter(item => item.mtime > cutoffTime)
      .sort((a, b) => b.mtime - a.mtime);

    for (const { path: filePath } of alertFiles) {
      try {
        const alert = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        history.push(alert);
      } catch (error) {
        console.warn(`⚠️  Could not read alert file ${filePath}:`, error.message);
      }
    }

    return history;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'detect';
  const detector = new HealthChangeDetector();

  async function main() {
    switch (command) {
      case 'detect':
        const analysis = await detector.detectHealthChanges();
        console.log('\n📊 Health Change Detection Summary:');
        console.log(`Current Score: ${analysis.current.overallScore}/100`);
        console.log(`Baseline Score: ${analysis.baseline.score}/100`);
        console.log(`Score Change: ${analysis.changes.scoreChange > 0 ? '+' : ''}${analysis.changes.scoreChange}`);
        console.log(`Status: ${analysis.current.status}`);
        if (analysis.current.issues.length > 0) {
          console.log(`Issues: ${analysis.current.issues.join(', ')}`);
        }
        break;
        
      case 'history':
        const days = parseInt(process.argv[3]) || 7;
        const history = await detector.getChangeHistory(days);
        console.log(`\n📋 Health Change History (Last ${days} days):`);
        console.log(`Found ${history.length} significant changes`);
        
        history.forEach((change, index) => {
          console.log(`\n${index + 1}. ${change.type} (${change.priority} priority)`);
          console.log(`   Time: ${change.timestamp}`);
          console.log(`   Description: ${change.description}`);
          console.log(`   Action: ${change.recommendedAction}`);
        });
        break;
        
      case 'help':
      default:
        console.log(`
Health Change Detection System

Usage:
  node health-change-detector.js <command>

Commands:
  detect    - Run health change detection analysis (default)
  history   - Show recent health change history
  help      - Show this help message

Examples:
  # Run health change detection
  node health-change-detector.js detect

  # Show health changes from last 14 days
  node health-change-detector.js history 14

The system will automatically:
- Compare current health metrics with established baselines
- Identify significant changes in health status
- Trigger appropriate interventions via CodeGen integration
- Document improvements and update baselines
- Maintain historical trends and analysis data
        `);
        break;
    }
  }

  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = HealthChangeDetector;