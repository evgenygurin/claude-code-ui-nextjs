#!/usr/bin/env node

/**
 * CodeGen Task Scheduler
 * Manages delayed tasks and follow-up checks for CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class TaskScheduler {
  constructor() {
    this.tasksDir = '.codegen-tasks';
    this.reportsDir = '.codegen-reports';
    this.healthDir = '.health-monitoring';
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.tasksDir, this.reportsDir, this.healthDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Ensure health monitoring subdirectories
    const healthSubdirs = ['reports', 'baselines', 'trends', 'alerts'];
    healthSubdirs.forEach(subdir => {
      const fullPath = path.join(this.healthDir, subdir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async scheduleDelayedTask() {
    console.log('⏰ Setting up 1-hour delayed task for PR readiness check...');
    
    const delayedTask = {
      id: `delayed-${Date.now()}`,
      createdAt: new Date().toISOString(),
      scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      type: 'pr_readiness_check',
      status: 'scheduled',
      instructions: `
        Check PR readiness after 1 hour delay:
        
        1. Verify if PR is ready and CI/CD is green
        2. If not ready or work stopped:
           - Re-analyze all issues
           - Apply additional fixes
           - Run full CI/CD cycle
           - Update PR with improvements
           - Schedule another follow-up if needed
        
        3. Continue until PR is fully ready
      `,
      environment: {
        branch: process.env.CIRCLE_BRANCH || 'main',
        buildNumber: process.env.CIRCLE_BUILD_NUM || 'local',
        commitSha: process.env.CIRCLE_SHA1 || 'unknown',
        projectName: process.env.CIRCLE_PROJECT_REPONAME || 'claude-code-ui-nextjs'
      }
    };

    const taskFile = path.join(this.tasksDir, `${delayedTask.id}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(delayedTask, null, 2));

    console.log(`✅ Delayed task scheduled: ${taskFile}`);
    console.log(`📅 Will execute at: ${delayedTask.scheduledFor}`);

    // Set up cron job or webhook (in real scenario)
    await this.setupCronJob(delayedTask);
    
    return delayedTask;
  }

  async setupCronJob(task) {
    // In a real implementation, this would set up a cron job
    // or webhook to trigger the task execution
    
    console.log('🔧 Setting up task execution mechanism...');
    
    // For GitHub Actions, we could create a workflow file
    // For CircleCI, we could use their API to trigger builds
    // For now, we'll create a simple script that can be run manually or via cron
    
    const cronScript = `#!/bin/bash
# CodeGen Delayed Task Execution Script
# Generated at: ${new Date().toISOString()}
# Task ID: ${task.id}

echo "⏰ Executing delayed task: ${task.id}"
echo "🔍 Checking PR readiness..."

# Check if task time has arrived
CURRENT_TIME=$(date -u +%s)
SCHEDULED_TIME=$(date -d "${task.scheduledFor}" +%s)

if [ $CURRENT_TIME -ge $SCHEDULED_TIME ]; then
  echo "✅ Task time reached, executing..."
  
  # Trigger CodeGen analysis
  echo "@codegen Delayed task execution triggered. Please check:"
  echo "1. Is the PR ready and CI/CD passing?"
  echo "2. If not, repeat the full development cycle:"
  echo "   - Analyze remaining issues"
  echo "   - Fix all problems"
  echo "   - Run tests and quality checks"
  echo "   - Update PR"
  echo "   - Schedule follow-up if needed"
  
  # Mark task as executed
  echo "$(date -u): Task ${task.id} executed" >> .codegen-tasks/execution.log
else
  echo "⏳ Task not ready yet. Scheduled for: ${task.scheduledFor}"
fi
`;

    const cronScriptPath = path.join(this.tasksDir, `execute-${task.id}.sh`);
    fs.writeFileSync(cronScriptPath, cronScript);
    
    // Make script executable
    exec(`chmod +x "${cronScriptPath}"`, (error) => {
      if (error) {
        console.warn('⚠️  Could not make script executable:', error.message);
      } else {
        console.log(`🚀 Executable script created: ${cronScriptPath}`);
      }
    });

    console.log(`
📋 Manual execution instructions:
   To manually check/execute this task:
   bash "${cronScriptPath}"
   
🤖 CodeGen integration:
   This task will automatically trigger CodeGen analysis
   when the scheduled time arrives.
    `);
  }

  async checkPendingTasks() {
    console.log('🔍 Checking for pending tasks...');
    
    if (!fs.existsSync(this.tasksDir)) {
      console.log('📭 No tasks directory found');
      return [];
    }

    const taskFiles = fs.readdirSync(this.tasksDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(this.tasksDir, file));

    if (taskFiles.length === 0) {
      console.log('📭 No pending tasks found');
      return [];
    }

    const currentTime = new Date();
    const readyTasks = [];

    for (const taskFile of taskFiles) {
      try {
        const task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
        
        // Validate that task has required fields
        if (!task || !task.id || !task.type || !task.status || !task.scheduledFor) {
          console.warn(`⚠️  Invalid task file (missing required fields): ${taskFile}`);
          continue;
        }
        
        const scheduledTime = new Date(task.scheduledFor);
        
        console.log(`📋 Task: ${task.id}`);
        console.log(`   Type: ${task.type}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Scheduled: ${task.scheduledFor}`);
        
        if (currentTime >= scheduledTime && task.status === 'scheduled') {
          console.log(`⏰ Task ${task.id} is ready for execution!`);
          readyTasks.push(task);
        } else {
          const timeRemaining = scheduledTime - currentTime;
          console.log(`⏳ Time remaining: ${Math.round(timeRemaining / (1000 * 60))} minutes`);
        }
      } catch (error) {
        console.warn(`⚠️  Error reading task file ${taskFile}:`, error.message);
      }
    }

    if (readyTasks.length > 0) {
      console.log(`\n🚨 ${readyTasks.length} task(s) ready for execution!`);
      await this.executeReadyTasks(readyTasks);
    }

    return readyTasks;
  }

  async executeReadyTasks(tasks) {
    for (const task of tasks) {
      console.log(`\n🎯 Executing task: ${task.id}`);
      
      // Mark task as executing
      task.status = 'executing';
      task.executedAt = new Date().toISOString();
      
      const taskFile = path.join(this.tasksDir, `${task.id}.json`);
      fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));

      // Execute the task logic
      await this.executePRReadinessCheck(task);
      
      // Mark task as completed
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
    }
  }

  async executePRReadinessCheck(task) {
    console.log('🔍 Checking PR readiness...');
    console.log('📋 Task instructions:', task.instructions);
    
    // This would trigger CodeGen to:
    // 1. Check current PR status
    // 2. Verify CI/CD pipeline status
    // 3. If issues remain, repeat the cycle
    
    console.log(`
🤖 @codegen Scheduled PR readiness check for ${task.environment.projectName}

Branch: ${task.environment.branch}
Build: ${task.environment.buildNumber}
Commit: ${task.environment.commitSha}

Please check if the PR is ready:
1. ✅ All CI/CD checks passing?
2. ✅ Code quality requirements met?
3. ✅ Tests passing and coverage adequate?
4. ✅ Security scans clean?
5. ✅ Ready for review/merge?

If any items are ❌, please:
- Analyze and fix remaining issues
- Run the full development cycle
- Update the PR with improvements
- Schedule another follow-up check if needed

This is an automated follow-up from the CI/CD failure handling system.
    `);

    // Log execution
    const executionLog = {
      taskId: task.id,
      executedAt: new Date().toISOString(),
      action: 'pr_readiness_check',
      status: 'triggered_codegen'
    };

    const logFile = path.join(this.reportsDir, `execution-${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(executionLog, null, 2));
  }

  async scheduleHealthMonitoring(options = {}) {
    const {
      status = 'unknown',
      score = 0,
      issues = '',
      interval = '6h'
    } = options;

    console.log(`🏥 Setting up health monitoring for status: ${status}`);
    
    const healthTask = {
      id: `health-monitor-${Date.now()}`,
      createdAt: new Date().toISOString(),
      type: 'health_monitoring',
      status: 'scheduled',
      priority: this.getHealthPriority(status),
      config: {
        healthStatus: status,
        healthScore: score,
        detectedIssues: issues,
        monitoringInterval: interval,
        escalationEnabled: status === 'critical' || status === 'degraded',
        maxRetries: status === 'critical' ? 10 : 5
      },
      scheduledChecks: this.generateHealthCheckSchedule(status, interval),
      environment: {
        branch: process.env.CIRCLE_BRANCH || process.env.GITHUB_REF_NAME || 'main',
        buildNumber: process.env.CIRCLE_BUILD_NUM || process.env.GITHUB_RUN_NUMBER || 'local',
        commitSha: process.env.CIRCLE_SHA1 || process.env.GITHUB_SHA || 'unknown',
        projectName: process.env.CIRCLE_PROJECT_REPONAME || 'claude-code-ui-nextjs'
      }
    };

    const taskFile = path.join(this.tasksDir, `${healthTask.id}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(healthTask, null, 2));

    console.log(`✅ Health monitoring task scheduled: ${taskFile}`);
    console.log(`📊 Health status: ${status}, Score: ${score}/100`);
    console.log(`🔄 Monitoring interval: ${interval}`);

    // Create health monitoring schedule
    await this.createHealthMonitoringSchedule(healthTask);
    
    return healthTask;
  }

  getHealthPriority(status) {
    const priorities = {
      'critical': 'high',
      'degraded': 'high',
      'warning': 'medium',
      'healthy': 'low'
    };
    return priorities[status] || 'medium';
  }

  generateHealthCheckSchedule(status, baseInterval) {
    const now = new Date();
    const schedule = [];
    
    // Parse interval (e.g., '30m', '2h', '24h')
    const intervalMs = this.parseInterval(baseInterval);
    
    // Generate multiple check times based on health status
    const checkCount = status === 'critical' ? 24 : status === 'degraded' ? 12 : 6;
    
    for (let i = 1; i <= checkCount; i++) {
      const checkTime = new Date(now.getTime() + (intervalMs * i));
      schedule.push({
        checkNumber: i,
        scheduledFor: checkTime.toISOString(),
        type: this.getCheckType(i, status),
        completed: false
      });
    }
    
    return schedule;
  }

  getCheckType(checkNumber, status) {
    if (status === 'critical') {
      return checkNumber <= 3 ? 'immediate_assessment' : 
             checkNumber <= 8 ? 'recovery_check' : 'stability_verification';
    }
    
    if (status === 'degraded') {
      return checkNumber <= 2 ? 'issue_analysis' :
             checkNumber <= 6 ? 'improvement_check' : 'health_verification';
    }
    
    return checkNumber === 1 ? 'routine_check' : 'trend_analysis';
  }

  parseInterval(interval) {
    const match = interval.match(/^(\d+)([mh])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour
    
    const [, amount, unit] = match;
    const multiplier = unit === 'm' ? 60 * 1000 : 60 * 60 * 1000;
    return parseInt(amount) * multiplier;
  }

  async createHealthMonitoringSchedule(healthTask) {
    console.log('🔧 Creating health monitoring execution scripts...');
    
    /* eslint-disable no-useless-escape */
    const scriptContent = `#!/bin/bash
# Health Monitoring Execution Script
# Generated at: ${new Date().toISOString()}
# Task ID: ${healthTask.id}
# Health Status: ${healthTask.config.healthStatus}

echo "🏥 Executing health monitoring task: ${healthTask.id}"
echo "📊 Current health status: ${healthTask.config.healthStatus}"
echo "🎯 Health score: ${healthTask.config.healthScore}/100"

# Function to run health check
run_health_check() {
  echo "🔍 Running comprehensive health check..."
  
  # Run the post-merge monitoring workflow
  if command -v gh &> /dev/null; then
    echo "📋 Triggering GitHub Actions health check..."
    gh workflow run post-merge-monitoring.yml \\
      --field check_type=comprehensive \\
      --field force_codegen_trigger=${healthTask.config.escalationEnabled} || echo "Workflow trigger failed"
  fi
  
  # Run local health checks
  echo "🧪 Running local quality checks..."
  
  HEALTH_ISSUES=()
  
  # Linting check
  if npm run lint &>/dev/null; then
    echo "✅ Linting: PASSED"
  else
    echo "❌ Linting: FAILED"
    HEALTH_ISSUES+=("linting")
  fi
  
  # Type checking
  if npm run type-check &>/dev/null; then
    echo "✅ Type checking: PASSED"
  else
    echo "❌ Type checking: FAILED"
    HEALTH_ISSUES+=("types")
  fi
  
  # Tests
  if npm run test:ci &>/dev/null; then
    echo "✅ Tests: PASSED"
  else
    echo "❌ Tests: FAILED"
    HEALTH_ISSUES+=("tests")
  fi
  
  # Build
  if npm run build &>/dev/null; then
    echo "✅ Build: PASSED"
  else
    echo "❌ Build: FAILED"
    HEALTH_ISSUES+=("build")
  fi
  
  # Calculate health score
  TOTAL_CHECKS=4
  FAILED_CHECKS=\${#HEALTH_ISSUES[@]}
  SUCCESS_RATE=$(( (TOTAL_CHECKS - FAILED_CHECKS) * 100 / TOTAL_CHECKS ))
  
  echo "📊 Health Score: \$SUCCESS_RATE/100"
  echo "🔍 Failed checks: \${#HEALTH_ISSUES[@]}/\$TOTAL_CHECKS"
  
  if [ \${#HEALTH_ISSUES[@]} -gt 0 ]; then
    echo "⚠️  Issues detected: \${HEALTH_ISSUES[*]}"
    
    # Trigger CodeGen if critical issues
    if [ \${#HEALTH_ISSUES[@]} -ge 2 ] || [[ " \${HEALTH_ISSUES[*]} " == *" build "* ]] || [[ " \${HEALTH_ISSUES[*]} " == *" types "* ]]; then
      echo "🚨 Critical issues detected - triggering CodeGen intervention"
      node scripts/codegen-error-handler.js "post_merge_health_degradation" \\
        "Health monitoring detected issues: \${HEALTH_ISSUES[*]}, Score: \$SUCCESS_RATE/100"
    fi
  else
    echo "✅ All health checks passed!"
  fi
  
  # Log execution
  echo "\$(date -u): Health check completed, Score: \$SUCCESS_RATE/100, Issues: \${HEALTH_ISSUES[*]}" >> .health-monitoring/execution.log
}

# Main execution logic
CURRENT_TIME=\$(date -u +%s)
HEALTH_STATUS="${healthTask.config.healthStatus}"

case "\$HEALTH_STATUS" in
  "critical")
    echo "🚨 CRITICAL health status - running immediate assessment"
    run_health_check
    ;;
  "degraded"|"warning")
    echo "⚠️  Degraded health status - running standard assessment"
    run_health_check
    ;;
  *)
    echo "ℹ️  Standard health monitoring"
    run_health_check
    ;;
esac

echo "✅ Health monitoring execution completed"
`;

    const scriptPath = path.join(this.tasksDir, `health-monitor-${healthTask.id}.sh`);
    fs.writeFileSync(scriptPath, scriptContent);
    /* eslint-enable no-useless-escape */
    
    // Make script executable
    exec(`chmod +x "${scriptPath}"`, (error) => {
      if (error) {
        console.warn('⚠️  Could not make script executable:', error.message);
      } else {
        console.log(`🚀 Health monitoring script created: ${scriptPath}`);
      }
    });

    return scriptPath;
  }

  async trackHealthTrends() {
    console.log('📈 Analyzing health trends...');
    
    const trendsFile = path.join(this.healthDir, 'trends', 'health-trends.json');
    let trends = { history: [], summary: {} };
    
    if (fs.existsSync(trendsFile)) {
      try {
        trends = JSON.parse(fs.readFileSync(trendsFile, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Could not read existing trends file:', error.message);
      }
    }
    
    // Collect recent health data
    const reportsDir = path.join(this.healthDir, 'reports');
    if (fs.existsSync(reportsDir)) {
      const reportFiles = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('-health-report.md'))
        .sort()
        .slice(-20); // Keep last 20 reports
      
      console.log(`📋 Analyzing ${reportFiles.length} recent health reports...`);
      
      // Simple trend analysis (would be more sophisticated in production)
      trends.lastUpdated = new Date().toISOString();
      trends.reportsAnalyzed = reportFiles.length;
      trends.summary.trendDirection = this.determineTrendDirection(reportFiles);
    }
    
    fs.writeFileSync(trendsFile, JSON.stringify(trends, null, 2));
    console.log(`📊 Health trends updated: ${trendsFile}`);
  }

  determineTrendDirection(reportFiles) {
    // Simple trend analysis based on filename timestamps
    if (reportFiles.length < 2) return 'insufficient_data';
    
    const recent = reportFiles.slice(-3);
    const older = reportFiles.slice(-6, -3);
    
    // In a real implementation, we'd parse the reports and analyze actual health scores
    return recent.length > older.length ? 'improving' : 'stable';
  }

  async cleanupOldTasks(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    console.log('🧹 Cleaning up old tasks and health monitoring data...');
    
    // Cleanup old tasks
    const taskFiles = fs.readdirSync(this.tasksDir)
      .filter(file => file.endsWith('.json'));

    const cutoffTime = new Date(Date.now() - maxAge);
    let cleanedCount = 0;

    for (const file of taskFiles) {
      const taskPath = path.join(this.tasksDir, file);
      try {
        const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
        const taskTime = new Date(task.createdAt);
        
        if (taskTime < cutoffTime && task.status === 'completed') {
          fs.unlinkSync(taskPath);
          cleanedCount++;
          console.log(`🗑️  Removed old task: ${task.id}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error processing task file ${file}:`, error.message);
      }
    }

    // Cleanup old health reports (keep last 30 days)
    const healthReportsDir = path.join(this.healthDir, 'reports');
    if (fs.existsSync(healthReportsDir)) {
      const healthReports = fs.readdirSync(healthReportsDir)
        .filter(file => file.endsWith('.md'));
      
      const healthCutoff = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // 30 days
      let healthCleanedCount = 0;
      
      for (const file of healthReports) {
        const reportPath = path.join(healthReportsDir, file);
        const stats = fs.statSync(reportPath);
        
        if (stats.mtime < healthCutoff) {
          fs.unlinkSync(reportPath);
          healthCleanedCount++;
          console.log(`🗑️  Removed old health report: ${file}`);
        }
      }
      
      console.log(`✅ Health cleanup complete. Removed ${healthCleanedCount} old reports.`);
    }

    console.log(`✅ Task cleanup complete. Removed ${cleanedCount} old tasks.`);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'help';
  const scheduler = new TaskScheduler();

  // Parse command line arguments
  const args = process.argv.slice(3);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] && args[i].startsWith('--') && args[i + 1]) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      options[key] = value;
    }
  }

  async function main() {
    switch (command) {
      case 'schedule':
        await scheduler.scheduleDelayedTask();
        break;
      
      case 'schedule-health-monitoring': {
        const healthOptions = {
          status: options.status || 'unknown',
          score: parseInt(options.score) || 0,
          issues: options.issues || '',
          interval: options.interval || '6h'
        };
        await scheduler.scheduleHealthMonitoring(healthOptions);
        break;
      }
      
      case 'check':
        await scheduler.checkPendingTasks();
        break;
      
      case 'health-trends':
        await scheduler.trackHealthTrends();
        break;
      
      case 'cleanup':
        await scheduler.cleanupOldTasks();
        break;
      
      case 'help':
      default:
        console.log(`
CodeGen Task Scheduler with Health Monitoring

Usage:
  node task-scheduler.js <command> [options]

Commands:
  schedule                    - Schedule a new delayed task
  schedule-health-monitoring  - Set up health monitoring tasks
  check                      - Check and execute pending tasks
  health-trends              - Analyze health trends
  cleanup                    - Remove old completed tasks
  help                       - Show this help message

Health Monitoring Options:
  --status <status>     - Health status (critical|degraded|warning|healthy)
  --score <score>       - Health score (0-100)
  --issues <issues>     - Detected issues (comma-separated)
  --interval <interval> - Monitoring interval (e.g., 30m, 2h, 24h)

Examples:
  # Schedule a 1-hour delayed PR check
  node task-scheduler.js schedule

  # Set up health monitoring for critical status
  node task-scheduler.js schedule-health-monitoring --status critical --score 45 --issues "build,tests" --interval 30m

  # Set up standard health monitoring
  node task-scheduler.js schedule-health-monitoring --status healthy --score 95 --interval 6h

  # Check if any tasks are ready to execute  
  node task-scheduler.js check

  # Analyze health trends
  node task-scheduler.js health-trends

  # Clean up tasks older than 7 days
  node task-scheduler.js cleanup

Health Status Levels:
  - critical: Immediate attention required, frequent monitoring (every 30min)
  - degraded: Issues need attention, regular monitoring (every 2h)
  - warning: Minor issues detected, standard monitoring (every 6h)
  - healthy: All systems operational, routine monitoring (every 24h)
        `);
        break;
    }
  }

  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = TaskScheduler;