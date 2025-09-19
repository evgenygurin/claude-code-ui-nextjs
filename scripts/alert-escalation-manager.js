#!/usr/bin/env node

/**
 * Alert Escalation Manager
 * 
 * Implements intelligent escalation policies with backoff strategies
 * to prevent alert fatigue and ensure appropriate response to different
 * severity levels of errors and issues.
 */

const fs = require('fs');
const path = require('path');

class AlertEscalationManager {
  constructor() {
    this.config = {
      escalationPolicies: {
        critical: {
          name: 'Critical Error Policy',
          levels: [
            { delay: 0, cooldown: 5 * 60 * 1000, maxRetries: 3 },      // Immediate, 5min cooldown
            { delay: 15 * 60 * 1000, cooldown: 15 * 60 * 1000, maxRetries: 5 },  // 15min, then 15min cooldown
            { delay: 60 * 60 * 1000, cooldown: 60 * 60 * 1000, maxRetries: -1 }  // 1h, then 1h cooldown
          ],
          channels: ['webhook', 'codegen', 'email', 'slack'],
          priority: 100,
          description: 'Immediate response for production-breaking issues'
        },
        high: {
          name: 'High Priority Policy', 
          levels: [
            { delay: 2 * 60 * 1000, cooldown: 15 * 60 * 1000, maxRetries: 2 },   // 2min delay, 15min cooldown
            { delay: 30 * 60 * 1000, cooldown: 30 * 60 * 1000, maxRetries: 3 },  // 30min, then 30min cooldown
            { delay: 2 * 60 * 60 * 1000, cooldown: 2 * 60 * 60 * 1000, maxRetries: -1 } // 2h, then 2h cooldown
          ],
          channels: ['codegen', 'email'],
          priority: 80,
          description: 'Urgent attention for significant issues'
        },
        medium: {
          name: 'Medium Priority Policy',
          levels: [
            { delay: 15 * 60 * 1000, cooldown: 60 * 60 * 1000, maxRetries: 2 },  // 15min delay, 1h cooldown
            { delay: 4 * 60 * 60 * 1000, cooldown: 4 * 60 * 60 * 1000, maxRetries: 2 }, // 4h, then 4h cooldown
            { delay: 24 * 60 * 60 * 1000, cooldown: 24 * 60 * 60 * 1000, maxRetries: -1 } // 24h, then daily
          ],
          channels: ['codegen'],
          priority: 60,
          description: 'Standard monitoring for moderate issues'
        },
        low: {
          name: 'Low Priority Policy',
          levels: [
            { delay: 60 * 60 * 1000, cooldown: 8 * 60 * 60 * 1000, maxRetries: 1 },  // 1h delay, 8h cooldown
            { delay: 24 * 60 * 60 * 1000, cooldown: 48 * 60 * 60 * 1000, maxRetries: -1 } // 24h, then every 2 days
          ],
          channels: ['codegen'],
          priority: 40,
          description: 'Background monitoring for minor issues'
        },
        maintenance: {
          name: 'Maintenance Policy',
          levels: [
            { delay: 7 * 24 * 60 * 60 * 1000, cooldown: 7 * 24 * 60 * 60 * 1000, maxRetries: -1 } // Weekly
          ],
          channels: ['codegen'],
          priority: 20,
          description: 'Periodic maintenance and cleanup tasks'
        }
      },
      
      backoffStrategies: {
        exponential: {
          name: 'Exponential Backoff',
          calculate: (attempt, baseDelay) => baseDelay * Math.pow(2, attempt - 1),
          maxDelay: 24 * 60 * 60 * 1000, // 24 hours max
          jitter: true
        },
        linear: {
          name: 'Linear Backoff', 
          calculate: (attempt, baseDelay) => baseDelay * attempt,
          maxDelay: 12 * 60 * 60 * 1000, // 12 hours max
          jitter: false
        },
        fibonacci: {
          name: 'Fibonacci Backoff',
          calculate: (attempt, baseDelay) => {
            const fib = this.fibonacci(attempt);
            return baseDelay * fib;
          },
          maxDelay: 48 * 60 * 60 * 1000, // 48 hours max
          jitter: true
        }
      }
    };

    this.state = {
      activeEscalations: new Map(), // Track active escalations
      escalationHistory: [], // Historical records
      statistics: {
        totalEscalations: 0,
        resolvedEscalations: 0,
        averageResolutionTime: 0,
        escalationsByPriority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      }
    };

    this.dataDir = '.escalation-manager';
    this.stateFile = path.join(this.dataDir, 'escalation-state.json');
    this.historyFile = path.join(this.dataDir, 'escalation-history.json');
    
    this.ensureDirectories();
    this.loadState();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Create new escalation for an alert
   */
  async createEscalation(alertId, priority, context = {}) {
    console.log(`🚨 Creating ${priority} escalation for alert: ${alertId}`);
    
    const policy = this.config.escalationPolicies[priority];
    if (!policy) {
      throw new Error(`Unknown priority level: ${priority}`);
    }

    const escalation = {
      id: `esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      alertId,
      priority,
      policy: policy.name,
      status: 'active',
      currentLevel: 0,
      currentAttempt: 0,
      context,
      timeline: [{
        timestamp: new Date().toISOString(),
        event: 'escalation_created',
        level: 0,
        attempt: 0
      }],
      createdAt: new Date().toISOString(),
      lastActionAt: new Date().toISOString(),
      nextScheduledAt: new Date(Date.now() + policy.levels[0].delay).toISOString()
    };

    this.state.activeEscalations.set(escalation.id, escalation);
    this.state.statistics.totalEscalations++;
    this.state.statistics.escalationsByPriority[priority]++;
    
    await this.saveState();
    
    // Schedule first escalation action
    this.scheduleEscalationAction(escalation);
    
    return escalation;
  }

  /**
   * Schedule an escalation action
   */
  scheduleEscalationAction(escalation) {
    const nextAction = new Date(escalation.nextScheduledAt).getTime();
    const delay = Math.max(0, nextAction - Date.now());
    
    console.log(`⏰ Scheduling escalation action for ${escalation.id} in ${Math.round(delay / 1000)}s`);
    
    setTimeout(async () => {
      await this.executeEscalationAction(escalation.id);
    }, delay);
  }

  /**
   * Execute escalation action
   */
  async executeEscalationAction(escalationId) {
    const escalation = this.state.activeEscalations.get(escalationId);
    if (!escalation || escalation.status !== 'active') {
      console.log(`⏭️  Skipping escalation action for ${escalationId} (not active)`);
      return;
    }

    console.log(`🎯 Executing escalation action for ${escalationId}`);
    
    const policy = this.config.escalationPolicies[escalation.priority];
    const currentLevel = policy.levels[escalation.currentLevel];
    
    try {
      // Execute the escalation action
      await this.performEscalationAction(escalation, currentLevel);
      
      // Update escalation state
      escalation.currentAttempt++;
      escalation.lastActionAt = new Date().toISOString();
      
      // Add to timeline
      escalation.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'action_executed',
        level: escalation.currentLevel,
        attempt: escalation.currentAttempt,
        success: true
      });

      // Determine next action
      await this.scheduleNextAction(escalation, currentLevel);
      
    } catch (error) {
      console.error(`❌ Failed to execute escalation action for ${escalationId}:`, error);
      
      // Add failure to timeline
      escalation.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'action_failed',
        level: escalation.currentLevel,
        attempt: escalation.currentAttempt,
        error: error.message
      });

      // Schedule retry or move to next level
      await this.handleEscalationFailure(escalation, currentLevel, error);
    }
    
    await this.saveState();
  }

  /**
   * Perform the actual escalation action
   */
  async performEscalationAction(escalation, levelConfig) {
    const policy = this.config.escalationPolicies[escalation.priority];
    
    console.log(`📢 Performing ${policy.name} action (Level ${escalation.currentLevel}, Attempt ${escalation.currentAttempt + 1})`);
    
    // Execute actions for each configured channel
    for (const channel of policy.channels) {
      try {
        await this.executeChannelAction(channel, escalation, levelConfig);
      } catch (error) {
        console.error(`❌ Failed to execute ${channel} action:`, error);
      }
    }
  }

  /**
   * Execute action for specific channel
   */
  async executeChannelAction(channel, escalation, levelConfig) {
    switch (channel) {
      case 'webhook':
        await this.executeWebhookAction(escalation, levelConfig);
        break;
        
      case 'codegen':
        await this.executeCodeGenAction(escalation, levelConfig);
        break;
        
      case 'email':
        await this.executeEmailAction(escalation, levelConfig);
        break;
        
      case 'slack':
        await this.executeSlackAction(escalation, levelConfig);
        break;
        
      default:
        console.warn(`⚠️  Unknown escalation channel: ${channel}`);
    }
  }

  /**
   * Execute webhook escalation action
   */
  async executeWebhookAction(escalation, levelConfig) {
    console.log(`🔗 Executing webhook action for escalation ${escalation.id}`);
    
    // This could trigger external webhook notifications
    const webhookPayload = {
      escalationId: escalation.id,
      alertId: escalation.alertId,
      priority: escalation.priority,
      level: escalation.currentLevel,
      attempt: escalation.currentAttempt,
      context: escalation.context,
      timestamp: new Date().toISOString()
    };

    // Simulate webhook call (in real implementation, this would make HTTP request)
    console.log('📡 Webhook payload:', JSON.stringify(webhookPayload, null, 2));
  }

  /**
   * Execute CodeGen escalation action
   */
  async executeCodeGenAction(escalation, levelConfig) {
    console.log(`🤖 Executing CodeGen action for escalation ${escalation.id}`);
    
    try {
      // Load CodeGen error handler if available
      const CodeGenErrorHandler = require('./codegen-error-handler');
      const errorHandler = new CodeGenErrorHandler();
      
      // Prepare escalated error information
      const errorType = `escalation_${escalation.priority}_level_${escalation.currentLevel}`;
      const errorDetails = this.formatEscalationForCodeGen(escalation);
      
      // Trigger CodeGen with escalation context
      await errorHandler.handleError(errorType, errorDetails);
      
      console.log('✅ CodeGen action executed successfully');
      
    } catch (error) {
      console.error('❌ CodeGen action failed:', error);
      throw error;
    }
  }

  /**
   * Format escalation for CodeGen consumption
   */
  formatEscalationForCodeGen(escalation) {
    const policy = this.config.escalationPolicies[escalation.priority];
    
    return `🚨 ESCALATED ALERT - ${policy.name.toUpperCase()} 🚨

Escalation ID: ${escalation.id}
Alert ID: ${escalation.alertId}
Priority: ${escalation.priority.toUpperCase()}
Current Level: ${escalation.currentLevel + 1}/${policy.levels.length}
Current Attempt: ${escalation.currentAttempt + 1}
Created: ${escalation.createdAt}
Last Action: ${escalation.lastActionAt}

📊 ESCALATION CONTEXT:
${JSON.stringify(escalation.context, null, 2)}

📈 ESCALATION TIMELINE:
${escalation.timeline.map((event, index) => 
  `${index + 1}. ${event.timestamp} - ${event.event} (Level ${event.level}, Attempt ${event.attempt})`
).join('\n')}

🎯 ESCALATION POLICY DETAILS:
- Policy: ${policy.description}
- Channels: ${policy.channels.join(', ')}
- Priority Score: ${policy.priority}

⚠️  This alert has been escalated due to:
1. Severity level requiring immediate attention
2. Previous attempts may not have resolved the issue
3. Automated escalation policy triggered

🔄 NEXT STEPS:
1. Investigate the underlying issue immediately
2. Check if previous CodeGen actions were effective
3. Apply comprehensive fixes to prevent re-escalation
4. Update monitoring and alerting thresholds if needed
5. Consider escalation policy adjustments

This escalation was triggered automatically by the Alert Escalation Manager.
Manual intervention may be required to resolve and de-escalate.`;
  }

  /**
   * Execute email escalation action (placeholder)
   */
  async executeEmailAction(escalation, levelConfig) {
    console.log(`📧 Email action for escalation ${escalation.id} (placeholder)`);
    // In real implementation, this would send emails
  }

  /**
   * Execute Slack escalation action (placeholder)
   */
  async executeSlackAction(escalation, levelConfig) {
    console.log(`💬 Slack action for escalation ${escalation.id} (placeholder)`);
    // In real implementation, this would send Slack messages
  }

  /**
   * Schedule next escalation action
   */
  async scheduleNextAction(escalation, levelConfig) {
    const policy = this.config.escalationPolicies[escalation.priority];
    
    // Check if we've reached max retries for current level
    if (levelConfig.maxRetries > 0 && escalation.currentAttempt >= levelConfig.maxRetries) {
      // Move to next level or complete escalation
      if (escalation.currentLevel + 1 < policy.levels.length) {
        escalation.currentLevel++;
        escalation.currentAttempt = 0;
        const nextLevel = policy.levels[escalation.currentLevel];
        escalation.nextScheduledAt = new Date(Date.now() + nextLevel.delay).toISOString();
        
        console.log(`📈 Escalating to level ${escalation.currentLevel + 1}`);
        
        escalation.timeline.push({
          timestamp: new Date().toISOString(),
          event: 'escalation_level_increased',
          level: escalation.currentLevel,
          attempt: 0
        });
        
        this.scheduleEscalationAction(escalation);
      } else {
        console.log(`🔄 Maximum escalation level reached, continuing at current level`);
        escalation.nextScheduledAt = new Date(Date.now() + levelConfig.cooldown).toISOString();
        escalation.currentAttempt = 0; // Reset attempt counter for continuous monitoring
        this.scheduleEscalationAction(escalation);
      }
    } else {
      // Schedule next attempt at current level
      const nextDelay = this.calculateBackoffDelay(escalation, levelConfig);
      escalation.nextScheduledAt = new Date(Date.now() + nextDelay).toISOString();
      
      console.log(`⏳ Next attempt in ${Math.round(nextDelay / 60000)} minutes`);
      this.scheduleEscalationAction(escalation);
    }
  }

  /**
   * Calculate backoff delay using configured strategy
   */
  calculateBackoffDelay(escalation, levelConfig) {
    // For now, use simple cooldown period
    // This could be enhanced to use different backoff strategies
    let delay = levelConfig.cooldown;
    
    // Add jitter to prevent thundering herd
    if (this.config.backoffStrategies.exponential.jitter) {
      const jitterPercent = 0.1; // 10% jitter
      const jitter = delay * jitterPercent * (Math.random() - 0.5) * 2;
      delay += jitter;
    }
    
    return Math.max(0, Math.round(delay));
  }

  /**
   * Handle escalation failure
   */
  async handleEscalationFailure(escalation, levelConfig, error) {
    console.log(`🔄 Handling escalation failure for ${escalation.id}`);
    
    // Exponential backoff on failures
    const failureDelay = Math.min(
      levelConfig.cooldown * Math.pow(2, escalation.currentAttempt),
      4 * 60 * 60 * 1000 // Max 4 hours
    );
    
    escalation.nextScheduledAt = new Date(Date.now() + failureDelay).toISOString();
    
    console.log(`⏳ Retrying after failure in ${Math.round(failureDelay / 60000)} minutes`);
    this.scheduleEscalationAction(escalation);
  }

  /**
   * Resolve escalation
   */
  async resolveEscalation(escalationId, resolution = 'resolved') {
    const escalation = this.state.activeEscalations.get(escalationId);
    if (!escalation) {
      throw new Error(`Escalation not found: ${escalationId}`);
    }

    console.log(`✅ Resolving escalation ${escalationId} with status: ${resolution}`);
    
    escalation.status = resolution;
    escalation.resolvedAt = new Date().toISOString();
    escalation.resolutionTime = new Date(escalation.resolvedAt) - new Date(escalation.createdAt);
    
    escalation.timeline.push({
      timestamp: new Date().toISOString(),
      event: 'escalation_resolved',
      resolution
    });

    // Move to history
    this.state.escalationHistory.push(escalation);
    this.state.activeEscalations.delete(escalationId);
    
    // Update statistics
    this.state.statistics.resolvedEscalations++;
    this.updateStatistics();
    
    await this.saveState();
    return escalation;
  }

  /**
   * Update escalation statistics
   */
  updateStatistics() {
    // Calculate average resolution time
    const resolved = this.state.escalationHistory.filter(e => e.resolutionTime);
    if (resolved.length > 0) {
      const totalTime = resolved.reduce((sum, e) => sum + e.resolutionTime, 0);
      this.state.statistics.averageResolutionTime = totalTime / resolved.length;
    }
  }

  /**
   * Get escalation status
   */
  getEscalationStatus(escalationId) {
    const escalation = this.state.activeEscalations.get(escalationId) ||
                     this.state.escalationHistory.find(e => e.id === escalationId);
    
    if (!escalation) {
      return null;
    }

    return {
      ...escalation,
      isActive: this.state.activeEscalations.has(escalationId),
      timeToNext: escalation.nextScheduledAt ? 
        Math.max(0, new Date(escalation.nextScheduledAt) - new Date()) : null
    };
  }

  /**
   * List all active escalations
   */
  listActiveEscalations() {
    return Array.from(this.state.activeEscalations.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get escalation statistics
   */
  getStatistics() {
    return {
      ...this.state.statistics,
      activeEscalations: this.state.activeEscalations.size,
      totalHistoryRecords: this.state.escalationHistory.length,
      averageResolutionTimeHours: Math.round(this.state.statistics.averageResolutionTime / (1000 * 60 * 60) * 100) / 100
    };
  }

  /**
   * Clean old history records
   */
  cleanOldHistory(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    const cutoff = new Date(Date.now() - maxAge);
    const originalLength = this.state.escalationHistory.length;
    
    this.state.escalationHistory = this.state.escalationHistory.filter(
      escalation => new Date(escalation.createdAt) > cutoff
    );
    
    const cleaned = originalLength - this.state.escalationHistory.length;
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old escalation records`);
    }
    
    return cleaned;
  }

  /**
   * Fibonacci sequence for backoff calculation
   */
  fibonacci(n) {
    if (n <= 1) return 1;
    let a = 1, b = 1;
    for (let i = 2; i < n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * Save state to disk
   */
  async saveState() {
    try {
      const stateData = {
        activeEscalations: Array.from(this.state.activeEscalations.entries()),
        statistics: this.state.statistics,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.stateFile, JSON.stringify(stateData, null, 2));
      
      // Save history separately to avoid large state file
      if (this.state.escalationHistory.length > 0) {
        fs.writeFileSync(this.historyFile, JSON.stringify(this.state.escalationHistory, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Failed to save escalation state:', error);
    }
  }

  /**
   * Load state from disk
   */
  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const stateData = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.state.activeEscalations = new Map(stateData.activeEscalations || []);
        this.state.statistics = { ...this.state.statistics, ...stateData.statistics };
        
        console.log(`📁 Loaded ${this.state.activeEscalations.size} active escalations from state`);
        
        // Reschedule active escalations
        for (const escalation of this.state.activeEscalations.values()) {
          if (escalation.status === 'active' && escalation.nextScheduledAt) {
            this.scheduleEscalationAction(escalation);
          }
        }
      }
      
      if (fs.existsSync(this.historyFile)) {
        this.state.escalationHistory = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        console.log(`📚 Loaded ${this.state.escalationHistory.length} historical escalations`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load escalation state:', error);
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'help';
  const manager = new AlertEscalationManager();

  async function main() {
    switch (command) {
      case 'create':
        const alertId = process.argv[3] || `test-alert-${Date.now()}`;
        const priority = process.argv[4] || 'medium';
        const context = process.argv[5] ? JSON.parse(process.argv[5]) : { test: true };
        
        const escalation = await manager.createEscalation(alertId, priority, context);
        console.log(`✅ Created escalation: ${escalation.id}`);
        
        // Keep process alive to handle scheduled actions
        process.stdin.resume();
        break;
        
      case 'resolve':
        const escalationId = process.argv[3];
        if (!escalationId) {
          console.error('❌ Escalation ID required');
          process.exit(1);
        }
        
        const resolved = await manager.resolveEscalation(escalationId);
        console.log(`✅ Resolved escalation: ${resolved.id}`);
        process.exit(0);
        break;
        
      case 'status':
        const statusId = process.argv[3];
        if (statusId) {
          const status = manager.getEscalationStatus(statusId);
          if (status) {
            console.log('📋 Escalation Status:');
            console.log(JSON.stringify(status, null, 2));
          } else {
            console.log('❌ Escalation not found');
          }
        } else {
          const active = manager.listActiveEscalations();
          console.log(`📊 Active Escalations: ${active.length}`);
          active.forEach(esc => {
            console.log(`- ${esc.id} (${esc.priority}) - Level ${esc.currentLevel + 1}`);
          });
        }
        process.exit(0);
        break;
        
      case 'stats':
        const stats = manager.getStatistics();
        console.log('📈 Escalation Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        process.exit(0);
        break;
        
      case 'cleanup':
        const cleaned = manager.cleanOldHistory();
        await manager.saveState();
        console.log(`✅ Cleanup completed, removed ${cleaned} old records`);
        process.exit(0);
        break;
        
      case 'help':
      default:
        console.log(`
Alert Escalation Manager - Intelligent Escalation Policies

Usage:
  node alert-escalation-manager.js <command> [options]

Commands:
  create <alertId> <priority> [context] - Create new escalation
  resolve <escalationId>                - Resolve escalation
  status [escalationId]                 - Get escalation status
  stats                                 - Show statistics
  cleanup                               - Clean old history records
  help                                  - Show this help

Priority Levels:
  critical  - Immediate response (0min delay, 5min cooldown)
  high      - Urgent attention (2min delay, 15min cooldown)
  medium    - Standard monitoring (15min delay, 1h cooldown)
  low       - Background monitoring (1h delay, 8h cooldown)

Examples:
  # Create critical escalation
  node alert-escalation-manager.js create alert-123 critical '{"error":"Database down"}'

  # Check escalation status
  node alert-escalation-manager.js status esc-1234567890

  # Resolve escalation
  node alert-escalation-manager.js resolve esc-1234567890

  # View statistics
  node alert-escalation-manager.js stats

Features:
  ✅ Multi-level escalation policies with backoff strategies
  ✅ Configurable channels (webhook, CodeGen, email, Slack)
  ✅ Automatic escalation level progression
  ✅ Failure handling with exponential backoff
  ✅ Comprehensive statistics and timeline tracking
  ✅ Persistent state management
        `);
        break;
    }
  }

  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = AlertEscalationManager;