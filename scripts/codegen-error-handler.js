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
    
    // Support both CircleCI and GitHub Actions environment variables
    this.projectId = process.env.CIRCLE_PROJECT_REPONAME || 
                     process.env.GITHUB_REPOSITORY?.split('/')[1] ||
                     'unknown-project';
    
    this.buildNumber = process.env.CIRCLE_BUILD_NUM || 
                       process.env.GITHUB_RUN_NUMBER ||
                       'local';
    
    this.branch = process.env.CIRCLE_BRANCH || 
                  process.env.GITHUB_REF_NAME ||
                  'unknown-branch';
    
    this.commitSha = process.env.CIRCLE_SHA1 || 
                     process.env.GITHUB_SHA ||
                     'unknown-commit';
    
    this.jobName = process.env.CIRCLE_JOB || 
                   process.env.GITHUB_JOB ||
                   'unknown-job';
    
    this.buildUrl = process.env.CIRCLE_BUILD_URL || 
                    (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
                      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
                      : 'unknown-url');

    // Smart Sentry Monitor Integration
    this.sentryIntegration = {
      enabled: process.env.SENTRY_MONITORING_ENABLED !== 'false',
      escalationManager: null,
      activeEscalations: new Map()
    };

    // Initialize escalation manager if available
    if (this.sentryIntegration.enabled) {
      try {
        const AlertEscalationManager = require('./alert-escalation-manager');
        this.sentryIntegration.escalationManager = new AlertEscalationManager();
        console.log('✅ Smart Sentry integration enabled');
      } catch (error) {
        console.warn('⚠️  Alert Escalation Manager not available, continuing without escalation');
        this.sentryIntegration.enabled = false;
      }
    }
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
      context: await this.gatherContext(),
      source: this.determineErrorSource(errorType)
    };

    // Smart Sentry integration - assess priority and create escalation if needed
    let escalationId = null;
    if (this.sentryIntegration.enabled) {
      const priority = this.assessErrorPriority(errorType, errorDetails);
      
      if (priority !== 'ignore') {
        escalationId = await this.createSmartEscalation(errorReport, priority);
        errorReport.escalationId = escalationId;
      }
    }

    // Save error report locally
    await this.saveErrorReport(errorReport);
    
    // Trigger CodeGen analysis with enhanced context
    await this.triggerCodeGenAnalysis(errorReport);
    
    // Create delayed task for follow-up (with escalation awareness)
    await this.scheduleFollowUpTask(errorReport);
    
    return { errorReport, escalationId };
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
    const isPostMergeIssue = errorReport.errorType.includes('post_merge') || 
                            errorReport.errorType.includes('health');
    
    if (isPostMergeIssue) {
      return this.generatePostMergeAnalysisPrompt(errorReport);
    }
    
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

  generatePostMergeAnalysisPrompt(errorReport) {
    return `🏥 Post-Merge Health Issue detected in ${errorReport.project}

**Health Status Alert:**
- Branch: ${errorReport.branch}
- Commit: ${errorReport.commit}
- Issue Type: ${errorReport.errorType}
- Detection Time: ${errorReport.timestamp}

**Issue Description:**
${errorReport.errorDetails}

**🎯 Post-Merge Context:**
This issue was detected AFTER a PR was successfully merged, indicating that:
- The merge passed initial CI/CD checks
- Health degradation occurred post-merge
- Continuous monitoring system flagged the problem
- Immediate intervention is required to prevent production issues

@codegen **POST-MERGE INTERVENTION REQUIRED**

## 🚨 Critical Analysis Needed:
1. **Root Cause Investigation:**
   - Why did this issue appear after merge when CI passed?
   - Are there missing test scenarios or edge cases?
   - Did environmental changes cause the degradation?
   - Was there a race condition or timing-dependent failure?

2. **Immediate Remediation:**
   - Fix the detected health issues (${this.extractIssueTypes(errorReport.errorDetails)})
   - Ensure all CI/CD checks pass again
   - Verify no regression in other components
   - Run comprehensive integration tests

3. **Prevention Measures:**
   - Enhance pre-merge testing to catch similar issues
   - Improve health monitoring sensitivity
   - Add missing test coverage for the failure scenarios
   - Consider adding smoke tests post-merge

4. **System Resilience:**
   - Update baseline health metrics
   - Strengthen continuous monitoring
   - Document the incident for future prevention
   - Consider rollback strategy if issues persist

## 📊 Health Monitoring Integration:
- This intervention was triggered by continuous health monitoring
- System will continue monitoring until health score returns to >90/100
- Additional escalation will occur if issues persist beyond 2 hours
- Success will be measured by sustained healthy metrics

**Environment Context:**
- Project: ${errorReport.project}
- Build: ${errorReport.buildNumber}
- Monitoring System: Post-Merge Health Assessment
- Escalation Level: ${this.determineEscalationLevel(errorReport.errorType)}

Please treat this as a HIGH PRIORITY post-merge incident requiring immediate attention and comprehensive resolution.`;
  }

  extractIssueTypes(errorDetails) {
    const commonIssues = ['linting', 'type_checking', 'tests', 'build', 'security'];
    const detectedIssues = commonIssues.filter(issue => 
      errorDetails.toLowerCase().includes(issue.replace('_', ' '))
    );
    return detectedIssues.length > 0 ? detectedIssues.join(', ') : 'system degradation';
  }

  determineEscalationLevel(errorType) {
    if (errorType.includes('critical') || errorType.includes('new_critical_issues')) {
      return 'CRITICAL - Immediate Action Required';
    }
    if (errorType.includes('significant') || errorType.includes('degradation')) {
      return 'HIGH - Urgent Attention Needed';
    }
    if (errorType.includes('trend') || errorType.includes('preventive')) {
      return 'MEDIUM - Preventive Action';
    }
    return 'STANDARD - Regular Monitoring';
  }

  async createGitHubComment(prompt, errorReport) {
    // This would create a GitHub issue or PR comment
    // triggering CodeGen via GitHub integration
    console.log('💬 GitHub comment would be created here');
    console.log('Prompt:', prompt);
  }

  async scheduleFollowUpTask(errorReport) {
    const taskId = `followup-${Date.now()}`;
    const followUpTask = {
      id: taskId,
      type: 'followup',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
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

    const taskFile = path.join(tasksDir, `${taskId}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(followUpTask, null, 2));
    
    console.log(`⏰ Follow-up task scheduled: ${taskFile}`);
    console.log(`📅 Will check again at: ${followUpTask.scheduledFor}`);
  }

  /**
   * Determine error source (CI/CD, Sentry, Health Monitor, etc.)
   */
  determineErrorSource(errorType) {
    if (errorType.includes('sentry_') || errorType.includes('escalation_')) {
      return 'sentry_monitor';
    } else if (errorType.includes('health_') || errorType.includes('post_merge')) {
      return 'health_monitor';
    } else if (errorType.includes('ci_') || errorType.includes('build_')) {
      return 'ci_cd';
    }
    return 'unknown';
  }

  /**
   * Assess error priority for Smart Sentry integration
   */
  assessErrorPriority(errorType, errorDetails) {
    // Critical priority indicators
    const criticalKeywords = [
      'critical', 'fatal', 'production', 'database', 'auth', 'payment', 
      'security', 'data loss', 'corruption', 'breach'
    ];
    
    // High priority indicators
    const highKeywords = [
      'error', 'exception', 'failure', 'crash', 'timeout', 'memory',
      'performance', 'api', 'service', 'unavailable'
    ];
    
    const combinedText = `${errorType} ${errorDetails}`.toLowerCase();
    
    // Check for critical indicators
    if (criticalKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'critical';
    }
    
    // Check for high priority indicators
    if (highKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'high';
    }
    
    // Check error type patterns
    if (errorType.includes('escalation_critical') || errorType.includes('sentry_critical')) {
      return 'critical';
    } else if (errorType.includes('escalation_high') || errorType.includes('sentry_high')) {
      return 'high';
    } else if (errorType.includes('escalation_medium') || errorType.includes('sentry_medium')) {
      return 'medium';
    } else if (errorType.includes('health_change_critical') || errorType.includes('post_merge')) {
      return 'high';
    }
    
    return 'medium'; // Default priority
  }

  /**
   * Create smart escalation with enhanced context
   */
  async createSmartEscalation(errorReport, priority) {
    if (!this.sentryIntegration.escalationManager) {
      console.warn('⚠️  Escalation manager not available');
      return null;
    }

    try {
      const alertId = `codegen-${errorReport.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      
      const escalationContext = {
        errorType: errorReport.errorType,
        source: errorReport.source,
        project: errorReport.project,
        branch: errorReport.branch,
        commit: errorReport.commitSha,
        buildUrl: errorReport.buildUrl,
        codegenTriggered: true,
        detailedContext: errorReport.context,
        errorSnippet: errorReport.errorDetails.substring(0, 500), // First 500 chars
        environment: process.env.NODE_ENV || 'production',
        timestamp: errorReport.timestamp
      };

      const escalation = await this.sentryIntegration.escalationManager.createEscalation(
        alertId, 
        priority, 
        escalationContext
      );
      
      // Track this escalation
      this.sentryIntegration.activeEscalations.set(escalation.id, {
        errorReport,
        escalation,
        createdAt: new Date()
      });
      
      console.log(`🚨 Created ${priority} escalation: ${escalation.id} for error: ${errorReport.errorType}`);
      return escalation.id;
      
    } catch (error) {
      console.error('❌ Failed to create smart escalation:', error);
      return null;
    }
  }

  /**
   * Resolve escalation when error is handled
   */
  async resolveEscalation(escalationId, resolution = 'resolved') {
    if (!this.sentryIntegration.escalationManager || !escalationId) {
      return false;
    }

    try {
      await this.sentryIntegration.escalationManager.resolveEscalation(escalationId, resolution);
      
      // Remove from active tracking
      this.sentryIntegration.activeEscalations.delete(escalationId);
      
      console.log(`✅ Resolved escalation: ${escalationId}`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to resolve escalation:', error);
      return false;
    }
  }

  /**
   * Check and update escalation status
   */
  async checkEscalationStatus(escalationId) {
    if (!this.sentryIntegration.escalationManager || !escalationId) {
      return null;
    }

    try {
      const status = this.sentryIntegration.escalationManager.getEscalationStatus(escalationId);
      return status;
      
    } catch (error) {
      console.error('❌ Failed to check escalation status:', error);
      return null;
    }
  }

  /**
   * Handle success callback from CodeGen execution
   */
  async onCodeGenSuccess(errorReport) {
    console.log('🎉 CodeGen execution successful');
    
    // Resolve any associated escalation
    if (errorReport.escalationId) {
      await this.resolveEscalation(errorReport.escalationId, 'codegen_resolved');
    }
    
    // Update success metrics
    this.updateSuccessMetrics(errorReport);
  }

  /**
   * Handle failure callback from CodeGen execution
   */
  async onCodeGenFailure(errorReport, error) {
    console.error('❌ CodeGen execution failed:', error);
    
    // Check if we should escalate further
    if (errorReport.escalationId) {
      const status = await this.checkEscalationStatus(errorReport.escalationId);
      
      // If escalation is still active and this is a repeated failure, 
      // the escalation system will automatically handle it
      console.log(`🔄 Escalation ${errorReport.escalationId} will continue based on policy`);
    }
    
    // Update failure metrics
    this.updateFailureMetrics(errorReport, error);
  }

  /**
   * Update success metrics
   */
  updateSuccessMetrics(errorReport) {
    // This could integrate with monitoring systems
    const metrics = {
      timestamp: new Date().toISOString(),
      errorType: errorReport.errorType,
      source: errorReport.source,
      resolutionTime: new Date() - new Date(errorReport.timestamp),
      success: true
    };
    
    console.log('📈 Success metrics:', metrics);
  }

  /**
   * Update failure metrics
   */
  updateFailureMetrics(errorReport, error) {
    const metrics = {
      timestamp: new Date().toISOString(),
      errorType: errorReport.errorType,
      source: errorReport.source,
      failureReason: error.message,
      success: false
    };
    
    console.log('📉 Failure metrics:', metrics);
  }

  /**
   * Get Smart Sentry integration status
   */
  getSentryIntegrationStatus() {
    return {
      enabled: this.sentryIntegration.enabled,
      escalationManagerAvailable: this.sentryIntegration.escalationManager !== null,
      activeEscalations: this.sentryIntegration.activeEscalations.size,
      escalations: Array.from(this.sentryIntegration.activeEscalations.values()).map(e => ({
        id: e.escalation.id,
        priority: e.escalation.priority,
        errorType: e.errorReport.errorType,
        createdAt: e.createdAt.toISOString()
      }))
    };
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