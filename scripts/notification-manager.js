#!/usr/bin/env node

/**
 * Notification and Escalation Manager
 * Manages notifications, escalation rules, and follow-up actions
 * for the post-merge health monitoring system
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class NotificationManager {
  constructor() {
    this.configPath = 'config/notification-config.json';
    this.healthDir = '.health-monitoring';
    this.alertsDir = path.join(this.healthDir, 'alerts');
    this.reportsDir = path.join(this.healthDir, 'reports');

    this.config = this.loadConfiguration();
    this.ensureDirectories();
  }

  loadConfiguration() {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn('⚠️  Notification config not found, using defaults');
        return this.getDefaultConfig();
      }

      const configContent = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configContent);

      // Replace environment variables in config
      return this.resolveEnvironmentVariables(config);
    } catch (error) {
      console.error('❌ Failed to load notification config:', error.message);
      return this.getDefaultConfig();
    }
  }

  resolveEnvironmentVariables(obj) {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return process.env[varName] || match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveEnvironmentVariables(item));
    }

    if (obj && typeof obj === 'object') {
      const resolved = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveEnvironmentVariables(value);
      }
      return resolved;
    }

    return obj;
  }

  getDefaultConfig() {
    return {
      notification_settings: {
        enabled: true,
        channels: {
          github_issues: {
            enabled: true,
            priority_levels: ['critical', 'high'],
          },
        },
      },
      escalation_rules: { enabled: true, levels: [] },
      health_thresholds: {
        critical: { score_max: 50, escalation_time_minutes: 30 },
        degraded: { score_max: 70, escalation_time_minutes: 120 },
      },
    };
  }

  ensureDirectories() {
    [this.healthDir, this.alertsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async processHealthAlert(healthData) {
    console.log('🔔 Processing health alert...');
    console.log(
      `Health Status: ${healthData.status}, Score: ${healthData.score}/100`
    );

    if (!this.config.notification_settings.enabled) {
      console.log('📵 Notifications are disabled');
      return;
    }

    // Determine escalation level
    const escalationLevel = this.determineEscalationLevel(healthData);
    console.log(
      `📈 Escalation Level: ${escalationLevel.name} (${escalationLevel.priority})`
    );

    // Create alert record
    const alert = await this.createAlert(healthData, escalationLevel);

    // Execute escalation actions
    await this.executeEscalationActions(alert, escalationLevel);

    // Schedule follow-up actions
    await this.scheduleFollowUpActions(alert, escalationLevel);

    console.log(`✅ Health alert processed: ${alert.id}`);
    return alert;
  }

  determineEscalationLevel(healthData) {
    const { escalation_rules } = this.config;

    if (!escalation_rules.enabled || !escalation_rules.levels) {
      return { name: 'standard', priority: 'medium', actions: [] };
    }

    // Find matching escalation level
    for (const level of escalation_rules.levels) {
      if (this.matchesConditions(healthData, level.trigger_conditions)) {
        return level;
      }
    }

    // Default escalation level
    return (
      escalation_rules.levels[escalation_rules.levels.length - 1] || {
        name: 'standard',
        priority: 'medium',
        actions: [],
      }
    );
  }

  matchesConditions(healthData, conditions) {
    if (!conditions || conditions.length === 0) return false;

    return conditions.some(condition => {
      try {
        // Simple condition parser (in production, use a proper expression evaluator)
        if (condition.includes('error_type contains')) {
          const searchTerm = condition.match(/'([^']+)'/)?.[1];
          return searchTerm && healthData.errorType?.includes(searchTerm);
        }

        if (
          condition.includes('improvement') &&
          healthData.errorType?.includes('improvement')
        ) {
          return true;
        }

        if (condition.includes('health_score')) {
          const operator = condition.includes('<')
            ? '<'
            : condition.includes('>')
              ? '>'
              : '=';
          const value = parseInt(condition.match(/\d+/)?.[0]);

          if (operator === '<') return healthData.score < value;
          if (operator === '>') return healthData.score > value;
          if (operator === '=') return healthData.score === value;
        }

        return false;
      } catch (error) {
        console.warn(
          `⚠️  Error evaluating condition "${condition}":`,
          error.message
        );
        return false;
      }
    });
  }

  async createAlert(healthData, escalationLevel) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'health_alert',
      priority: escalationLevel.priority,
      escalation_level: escalationLevel.name,
      health_data: healthData,
      status: 'open',
      actions_taken: [],
      follow_up_scheduled: [],
      resolution_time: null,
      metadata: {
        created_by: 'post-merge-monitoring',
        environment: process.env.NODE_ENV || 'development',
        repository: process.env.GITHUB_REPOSITORY || 'unknown',
      },
    };

    // Save alert
    const alertFile = path.join(this.alertsDir, `${alert.id}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

    console.log(`📝 Alert created: ${alertFile}`);
    return alert;
  }

  async executeEscalationActions(alert, escalationLevel) {
    console.log(
      `🎬 Executing ${escalationLevel.actions?.length || 0} escalation actions...`
    );

    if (!escalationLevel.actions) return;

    for (const action of escalationLevel.actions) {
      try {
        console.log(`🔧 Executing action: ${action}`);

        const result = await this.executeAction(action, alert);

        alert.actions_taken.push({
          action,
          timestamp: new Date().toISOString(),
          result: result.success ? 'success' : 'failed',
          details: result.details || 'No details provided',
        });

        // Update alert file
        const alertFile = path.join(this.alertsDir, `${alert.id}.json`);
        fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
      } catch (error) {
        console.error(`❌ Failed to execute action ${action}:`, error.message);

        alert.actions_taken.push({
          action,
          timestamp: new Date().toISOString(),
          result: 'error',
          details: error.message,
        });
      }
    }
  }

  async executeAction(actionName, alert) {
    switch (actionName) {
      case 'create_github_issue':
        return await this.createGitHubIssue(alert);

      case 'create_github_comment':
        return await this.createGitHubComment(alert);

      case 'trigger_codegen_immediate':
        return await this.triggerCodeGenIntervention(alert, 'immediate');

      case 'trigger_codegen_scheduled':
        return await this.triggerCodeGenIntervention(alert, 'scheduled');

      case 'schedule_health_monitoring':
        return await this.scheduleHealthMonitoring(alert);

      case 'schedule_followup_30min':
        return await this.scheduleFollowUp(alert, 30);

      case 'schedule_followup_2hours':
        return await this.scheduleFollowUp(alert, 120);

      case 'schedule_followup_6hours':
        return await this.scheduleFollowUp(alert, 360);

      case 'update_baselines':
        return await this.updateHealthBaselines(alert);

      case 'document_success':
        return await this.documentSuccess(alert);

      case 'send_email_notification':
        return await this.sendEmailNotification(alert);

      case 'send_slack_notification':
        return await this.sendSlackNotification(alert);

      default:
        console.warn(`⚠️  Unknown action: ${actionName}`);
        return { success: false, details: 'Unknown action type' };
    }
  }

  async createGitHubIssue(alert) {
    if (!this.config.notification_settings.channels.github_issues?.enabled) {
      return { success: false, details: 'GitHub issues disabled' };
    }

    console.log('📝 Creating GitHub issue...');

    const issueTitle = this.generateIssueTitle(alert);
    const issueBody = this.generateIssueBody(alert);
    const labels = this.getIssueLabels(alert);

    // In a real implementation, this would use GitHub API
    console.log(`Title: ${issueTitle}`);
    console.log(`Labels: ${labels.join(', ')}`);
    console.log('Body preview:', issueBody.substring(0, 200) + '...');

    return {
      success: true,
      details: `GitHub issue would be created with title: "${issueTitle}"`,
      issue_url: 'https://github.com/example/repo/issues/123', // Mock URL
    };
  }

  generateIssueTitle(alert) {
    const { health_data, priority, escalation_level } = alert;
    const emoji =
      priority === 'critical' ? '🚨' : priority === 'high' ? '⚠️' : '📊';

    return `${emoji} Post-Merge Health Alert: ${health_data.status.toUpperCase()} - Score: ${health_data.score}/100 [${escalation_level}]`;
  }

  generateIssueBody(alert) {
    const { health_data, timestamp, escalation_level } = alert;

    return `## 🏥 Post-Merge Health Monitoring Alert

**Alert Details:**
- **Alert ID:** ${alert.id}
- **Timestamp:** ${timestamp}
- **Escalation Level:** ${escalation_level}
- **Priority:** ${alert.priority}

**Health Status:**
- **Current Score:** ${health_data.score}/100
- **Status:** ${health_data.status}
- **Issues Detected:** ${health_data.issues ? health_data.issues.join(', ') : 'None specified'}
- **Error Type:** ${health_data.errorType || 'Not specified'}

**Context:**
- **Repository:** ${alert.metadata.repository}
- **Environment:** ${alert.metadata.environment}
- **Branch:** ${health_data.branch || 'main'}
- **Commit:** ${health_data.commit || 'latest'}

---

@codegen This is an automated health monitoring alert. Please analyze the detected issues and implement appropriate fixes.

### Required Actions:
1. Investigate the root cause of health degradation
2. Fix all detected issues
3. Ensure CI/CD pipeline passes
4. Update monitoring baselines if needed

### Success Criteria:
- Health score returns to ≥90/100
- All critical issues resolved
- CI/CD pipeline stable
- No regression in other components

**This alert was automatically generated by the Post-Merge Health Monitoring System.**`;
  }

  getIssueLabels(alert) {
    const { priority } = alert;
    const labelsConfig =
      this.config.notification_settings.channels.github_issues?.labels;

    return (
      labelsConfig?.[priority] || ['post-merge', 'health-monitoring', priority]
    );
  }

  async createGitHubComment(alert) {
    console.log('💬 Creating GitHub comment...');

    // In a real implementation, would add comment to existing issue or PR
    return {
      success: true,
      details: 'GitHub comment would be created',
      comment_url: 'https://github.com/example/repo/issues/123#comment-456',
    };
  }

  async triggerCodeGenIntervention(alert, urgency) {
    console.log(`🤖 Triggering CodeGen intervention (${urgency})...`);

    try {
      const CodeGenErrorHandler = require('./codegen-error-handler');
      const errorHandler = new CodeGenErrorHandler();

      const errorType = `post_merge_health_${alert.escalation_level}`;
      const errorDetails = `Health monitoring alert: ${alert.health_data.status} status, score ${alert.health_data.score}/100, issues: ${alert.health_data.issues?.join(', ') || 'none'}`;

      await errorHandler.handleError(errorType, errorDetails);

      return {
        success: true,
        details: `CodeGen intervention triggered with urgency: ${urgency}`,
      };
    } catch (error) {
      return {
        success: false,
        details: `Failed to trigger CodeGen intervention: ${error.message}`,
      };
    }
  }

  async scheduleHealthMonitoring(alert) {
    console.log('📅 Scheduling health monitoring...');

    try {
      const TaskScheduler = require('./task-scheduler');
      const scheduler = new TaskScheduler();

      const interval = this.getMonitoringInterval(alert.health_data.status);

      await scheduler.scheduleHealthMonitoring({
        status: alert.health_data.status,
        score: alert.health_data.score,
        issues: alert.health_data.issues?.join(',') || '',
        interval,
      });

      return {
        success: true,
        details: `Health monitoring scheduled with interval: ${interval}`,
      };
    } catch (error) {
      return {
        success: false,
        details: `Failed to schedule health monitoring: ${error.message}`,
      };
    }
  }

  getMonitoringInterval(healthStatus) {
    const intervals = {
      critical: '15m',
      degraded: '1h',
      warning: '6h',
      healthy: '24h',
    };
    return intervals[healthStatus] || '6h';
  }

  async scheduleFollowUp(alert, delayMinutes) {
    console.log(`⏰ Scheduling follow-up in ${delayMinutes} minutes...`);

    try {
      const followUpTime = new Date(Date.now() + delayMinutes * 60 * 1000);

      const followUpTask = {
        id: `followup-${alert.id}-${Date.now()}`,
        type: 'alert_followup',
        alert_id: alert.id,
        scheduled_for: followUpTime.toISOString(),
        delay_minutes: delayMinutes,
        status: 'scheduled',
      };

      alert.follow_up_scheduled.push(followUpTask);

      // In a real implementation, this would integrate with a job scheduler
      return {
        success: true,
        details: `Follow-up scheduled for ${followUpTime.toISOString()}`,
      };
    } catch (error) {
      return {
        success: false,
        details: `Failed to schedule follow-up: ${error.message}`,
      };
    }
  }

  async updateHealthBaselines(alert) {
    console.log('📊 Updating health baselines...');

    try {
      const baselinesDir = path.join(this.healthDir, 'baselines');
      if (!fs.existsSync(baselinesDir)) {
        fs.mkdirSync(baselinesDir, { recursive: true });
      }

      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const baselineFile = path.join(baselinesDir, `health-score-${today}.txt`);

      fs.writeFileSync(baselineFile, alert.health_data.score.toString());

      return {
        success: true,
        details: `Baseline updated with score: ${alert.health_data.score}`,
      };
    } catch (error) {
      return {
        success: false,
        details: `Failed to update baselines: ${error.message}`,
      };
    }
  }

  async documentSuccess(alert) {
    console.log('📝 Documenting success...');

    try {
      const successReport = {
        timestamp: new Date().toISOString(),
        alert_id: alert.id,
        health_score: alert.health_data.score,
        improvement_noted: true,
        previous_issues_resolved: alert.health_data.resolvedIssues || [],
        recommendations: [
          'Continue current practices',
          'Monitor for sustained improvement',
          'Update team on successful resolution',
        ],
      };

      const reportFile = path.join(
        this.reportsDir,
        `success-${Date.now()}.json`
      );
      fs.writeFileSync(reportFile, JSON.stringify(successReport, null, 2));

      return {
        success: true,
        details: `Success documented in ${reportFile}`,
      };
    } catch (error) {
      return {
        success: false,
        details: `Failed to document success: ${error.message}`,
      };
    }
  }

  async sendEmailNotification(alert) {
    console.log('📧 Sending email notification...');

    // Email functionality would be implemented here
    return {
      success: true,
      details: 'Email notification would be sent (not implemented)',
    };
  }

  async sendSlackNotification(alert) {
    console.log('💬 Sending Slack notification...');

    // Slack integration would be implemented here
    return {
      success: true,
      details: 'Slack notification would be sent (not implemented)',
    };
  }

  async scheduleFollowUpActions(alert, escalationLevel) {
    const followUpConfig =
      this.config.follow_up_schedule?.[`${alert.health_data.status}_health`] ||
      this.config.follow_up_schedule?.critical_issues ||
      [];

    console.log(`⏰ Scheduling ${followUpConfig.length} follow-up actions...`);

    for (const followUp of followUpConfig) {
      const delayMs =
        (followUp.delay_minutes || 0) * 60 * 1000 +
        (followUp.delay_hours || 0) * 60 * 60 * 1000;

      const scheduledTime = new Date(Date.now() + delayMs);

      alert.follow_up_scheduled.push({
        action: followUp.action,
        scheduled_for: scheduledTime.toISOString(),
        delay_description: followUp.delay_minutes
          ? `${followUp.delay_minutes} minutes`
          : `${followUp.delay_hours} hours`,
        status: 'scheduled',
      });
    }

    // Update alert file with follow-up schedule
    const alertFile = path.join(this.alertsDir, `${alert.id}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
  }

  async getActiveAlerts() {
    if (!fs.existsSync(this.alertsDir)) {
      return [];
    }

    const alertFiles = fs
      .readdirSync(this.alertsDir)
      .filter(file => file.endsWith('.json') && file.startsWith('alert-'));

    const alerts = [];
    for (const file of alertFiles) {
      try {
        const alertPath = path.join(this.alertsDir, file);
        const alert = JSON.parse(fs.readFileSync(alertPath, 'utf8'));

        if (alert.status === 'open') {
          alerts.push(alert);
        }
      } catch (error) {
        console.warn(`⚠️  Could not read alert file ${file}:`, error.message);
      }
    }

    return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async resolveAlert(alertId, resolution) {
    const alertFile = path.join(this.alertsDir, `${alertId}.json`);

    if (!fs.existsSync(alertFile)) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const alert = JSON.parse(fs.readFileSync(alertFile, 'utf8'));

    alert.status = 'resolved';
    alert.resolution_time = new Date().toISOString();
    alert.resolution = resolution;

    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

    console.log(`✅ Alert ${alertId} resolved: ${resolution}`);
    return alert;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'help';
  const manager = new NotificationManager();

  async function main() {
    switch (command) {
      case 'process-alert':
        const healthData = JSON.parse(process.argv[3] || '{}');
        await manager.processHealthAlert(healthData);
        break;

      case 'active-alerts':
        const alerts = await manager.getActiveAlerts();
        console.log(`\n📊 Active Alerts: ${alerts.length}`);
        alerts.forEach((alert, index) => {
          console.log(`\n${index + 1}. ${alert.id}`);
          console.log(`   Priority: ${alert.priority}`);
          console.log(
            `   Health: ${alert.health_data.status} (${alert.health_data.score}/100)`
          );
          console.log(`   Created: ${alert.timestamp}`);
          console.log(`   Actions: ${alert.actions_taken.length} completed`);
        });
        break;

      case 'resolve-alert':
        const alertId = process.argv[3];
        const resolution = process.argv[4] || 'Manually resolved';
        if (!alertId) {
          console.error('❌ Alert ID required');
          process.exit(1);
        }
        await manager.resolveAlert(alertId, resolution);
        break;

      case 'help':
      default:
        console.log(`
Notification and Escalation Manager

Usage:
  node notification-manager.js <command> [options]

Commands:
  process-alert <json>   - Process a health alert (JSON string)
  active-alerts         - List all active alerts
  resolve-alert <id> [reason] - Mark an alert as resolved
  help                  - Show this help message

Examples:
  # Process a critical health alert
  node notification-manager.js process-alert '{"status":"critical","score":45,"issues":["build","tests"],"errorType":"post_merge_health_critical"}'

  # List active alerts
  node notification-manager.js active-alerts

  # Resolve an alert
  node notification-manager.js resolve-alert alert-1234567890 "Issues fixed and health restored"

The notification manager handles:
- Alert creation and tracking
- Escalation level determination
- GitHub issue/comment creation
- CodeGen intervention triggering
- Follow-up action scheduling
- Success documentation
        `);
        break;
    }
  }

  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = NotificationManager;
