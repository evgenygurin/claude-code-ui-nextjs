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
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.tasksDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
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

  async cleanupOldTasks(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    console.log('🧹 Cleaning up old tasks...');
    
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

    console.log(`✅ Cleanup complete. Removed ${cleanedCount} old tasks.`);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'help';
  const scheduler = new TaskScheduler();

  async function main() {
    switch (command) {
      case 'schedule':
        await scheduler.scheduleDelayedTask();
        break;
      
      case 'check':
        await scheduler.checkPendingTasks();
        break;
      
      case 'cleanup':
        await scheduler.cleanupOldTasks();
        break;
      
      case 'help':
      default:
        console.log(`
CodeGen Task Scheduler

Usage:
  node task-scheduler.js schedule  - Schedule a new delayed task
  node task-scheduler.js check     - Check and execute pending tasks
  node task-scheduler.js cleanup   - Remove old completed tasks
  node task-scheduler.js help      - Show this help message

Examples:
  # Schedule a 1-hour delayed PR check
  node task-scheduler.js schedule

  # Check if any tasks are ready to execute  
  node task-scheduler.js check

  # Clean up tasks older than 7 days
  node task-scheduler.js cleanup
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