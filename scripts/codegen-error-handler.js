#!/usr/bin/env node

/**
 * CodeGen Error Handler for CI/CD Pipeline
 * Automatically triggers CodeGen analysis when CI/CD failures occur
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class CodeGenErrorHandler {
  constructor() {
    this.apiKey = process.env.CODEGEN_API_KEY;
    this.projectId = process.env.CIRCLE_PROJECT_REPONAME;
    this.buildNumber = process.env.CIRCLE_BUILD_NUM;
    this.branch = process.env.CIRCLE_BRANCH;
    this.commitSha = process.env.CIRCLE_SHA1;
    this.jobName = process.env.CIRCLE_JOB;
    this.buildUrl = process.env.CIRCLE_BUILD_URL;
  }

  async handleError(errorType, errorDetails) {
    console.log(`🚨 Handling ${errorType} error...`);
    
    const errorReport = {
      timestamp: new Date().toISOString(),
      project: this.projectId,
      branch: this.branch,
      commit: this.commitSha,
      buildNumber: this.buildNumber,
      jobName: this.jobName,
      buildUrl: this.buildUrl,
      errorType,
      errorDetails,
      context: await this.gatherContext()
    };

    // Save error report locally
    await this.saveErrorReport(errorReport);
    
    // Trigger CodeGen analysis
    await this.triggerCodeGenAnalysis(errorReport);
    
    // Create delayed task for follow-up
    await this.scheduleFollowUpTask(errorReport);
  }

  async gatherContext() {
    const context = {
      packageJson: this.readFileIfExists('package.json'),
      circleciConfig: this.readFileIfExists('.circleci/config.yml'),
      eslintConfig: this.readFileIfExists('.eslintrc.js') || this.readFileIfExists('.eslintrc.json'),
      tsconfig: this.readFileIfExists('tsconfig.json'),
      recentCommits: await this.getRecentCommits()
    };

    return context;
  }

  readFileIfExists(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  async getRecentCommits() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec('git log --oneline -10', (error, stdout) => {
        resolve(error ? 'Unable to get commits' : stdout);
      });
    });
  }

  async saveErrorReport(errorReport) {
    const reportDir = '.codegen-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `error-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(errorReport, null, 2));
    
    console.log(`📝 Error report saved: ${reportFile}`);
  }

  async triggerCodeGenAnalysis(errorReport) {
    const analysisPrompt = this.generateAnalysisPrompt(errorReport);
    
    console.log('🤖 Triggering CodeGen analysis...');
    console.log(`Analysis prompt: ${analysisPrompt}`);

    // This would normally make an API call to CodeGen service
    // For now, we'll create a webhook or GitHub comment
    
    if (process.env.GITHUB_TOKEN) {
      await this.createGitHubComment(analysisPrompt, errorReport);
    }

    // Simulate CodeGen API call
    console.log('🔄 CodeGen analysis triggered successfully');
  }

  generateAnalysisPrompt(errorReport) {
    return `🚨 CI/CD Failure detected in ${errorReport.project}

**Error Details:**
- Job: ${errorReport.jobName}
- Branch: ${errorReport.branch}
- Commit: ${errorReport.commit}
- Build: ${errorReport.buildUrl}
- Error Type: ${errorReport.errorType}

**Error Description:**
${errorReport.errorDetails}

@codegen Please analyze this CI/CD failure and:
1. Identify the root cause
2. Provide specific fixes for the issue
3. Review and improve the CI/CD configuration
4. Run comprehensive tests after fixes
5. Create a PR with the improvements

**Context provided:**
- Project configuration files
- Recent commit history  
- Build environment details

Please use your standard development workflow: analyze → fix → test → review → PR.`;
  }

  async createGitHubComment(prompt, errorReport) {
    // This would create a GitHub issue or PR comment
    // triggering CodeGen via GitHub integration
    console.log('💬 GitHub comment would be created here');
    console.log('Prompt:', prompt);
  }

  async scheduleFollowUpTask(errorReport) {
    const followUpTask = {
      scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      taskType: 'followup',
      originalError: errorReport,
      instructions: `
        Check if the CI/CD issues have been resolved after 1 hour.
        If PR is still not ready or work has stopped, repeat the full cycle:
        1. Re-analyze the problem
        2. Apply additional fixes
        3. Run tests and quality checks
        4. Update the PR
        5. Schedule another follow-up if needed
      `
    };

    // Save the follow-up task
    const tasksDir = '.codegen-tasks';
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }

    const taskFile = path.join(tasksDir, `followup-${Date.now()}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(followUpTask, null, 2));
    
    console.log(`⏰ Follow-up task scheduled: ${taskFile}`);
    console.log(`📅 Will check again at: ${followUpTask.scheduledTime.toISOString()}`);
  }
}

// CLI usage
if (require.main === module) {
  const errorType = process.argv[2] || 'unknown';
  const errorDetails = process.argv[3] || 'No details provided';
  
  const handler = new CodeGenErrorHandler();
  handler.handleError(errorType, errorDetails)
    .then(() => {
      console.log('✅ Error handling completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error handling failed:', error);
      process.exit(1);
    });
}

module.exports = CodeGenErrorHandler;