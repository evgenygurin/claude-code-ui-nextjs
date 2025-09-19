#!/usr/bin/env node

/**
 * Monitoring Cron Setup
 * 
 * Configures cron jobs for periodic health checks and monitoring tasks.
 * This complements the real-time webhook system with scheduled monitoring.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class MonitoringCronSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.cronJobs = [
      {
        name: 'sentry-health-check',
        schedule: '*/15 * * * *', // Every 15 minutes
        command: `cd ${this.projectRoot} && node scripts/smart-sentry-monitor.js check`,
        description: 'Periodic Sentry health check for non-critical monitoring'
      },
      {
        name: 'health-change-detector',
        schedule: '*/20 * * * *', // Every 20 minutes  
        command: `cd ${this.projectRoot} && node scripts/health-change-detector.js detect`,
        description: 'System health change detection and analysis'
      },
      {
        name: 'escalation-cleanup',
        schedule: '0 2 * * *', // Daily at 2 AM
        command: `cd ${this.projectRoot} && node scripts/alert-escalation-manager.js cleanup`,
        description: 'Clean up old escalation records and optimize storage'
      },
      {
        name: 'monitoring-system-status',
        schedule: '*/30 * * * *', // Every 30 minutes
        command: `cd ${this.projectRoot} && node scripts/monitoring-cron-setup.js status`,
        description: 'Check monitoring system components health'
      }
    ];
    
    this.systemdServices = [
      {
        name: 'smart-sentry-monitor',
        description: 'Smart Sentry Monitor Service',
        command: `node ${this.projectRoot}/scripts/smart-sentry-monitor.js start`,
        workingDirectory: this.projectRoot,
        user: process.env.USER || 'app',
        autoRestart: true
      }
    ];
  }

  /**
   * Install all monitoring cron jobs
   */
  async installCronJobs() {
    console.log('🔧 Installing monitoring cron jobs...');
    
    try {
      // Get current crontab
      let currentCrontab = '';
      try {
        const { stdout } = await execAsync('crontab -l');
        currentCrontab = stdout;
      } catch (error) {
        console.log('ℹ️  No existing crontab found, creating new one');
        currentCrontab = '';
      }

      // Prepare new crontab content
      let newCrontab = currentCrontab;
      
      // Add header if not exists
      if (!currentCrontab.includes('# Smart Sentry Monitoring System')) {
        newCrontab += '\n# Smart Sentry Monitoring System - Auto-generated\n';
        newCrontab += '# Do not modify this section manually\n';
      }

      // Remove existing monitoring jobs to avoid duplicates
      newCrontab = this.removeExistingMonitoringJobs(newCrontab);

      // Add new jobs
      for (const job of this.cronJobs) {
        newCrontab += `# ${job.description}\n`;
        newCrontab += `${job.schedule} ${job.command} >> /var/log/${job.name}.log 2>&1\n`;
      }

      newCrontab += '# End Smart Sentry Monitoring System\n\n';

      // Write temporary crontab file
      const tempCrontabFile = `/tmp/crontab-${Date.now()}`;
      fs.writeFileSync(tempCrontabFile, newCrontab);

      // Install the crontab
      await execAsync(`crontab ${tempCrontabFile}`);

      // Cleanup temp file
      fs.unlinkSync(tempCrontabFile);

      console.log('✅ Successfully installed monitoring cron jobs:');
      this.cronJobs.forEach(job => {
        console.log(`  📅 ${job.name}: ${job.schedule}`);
      });

      // Ensure log directory exists and has proper permissions
      await this.setupLogDirectory();

    } catch (error) {
      console.error('❌ Failed to install cron jobs:', error);
      throw error;
    }
  }

  /**
   * Remove existing monitoring jobs from crontab
   */
  removeExistingMonitoringJobs(crontab) {
    const lines = crontab.split('\n');
    const filteredLines = [];
    let inMonitoringSection = false;

    for (const line of lines) {
      if (line.includes('# Smart Sentry Monitoring System')) {
        inMonitoringSection = true;
        continue;
      }
      
      if (line.includes('# End Smart Sentry Monitoring System')) {
        inMonitoringSection = false;
        continue;
      }
      
      if (!inMonitoringSection && 
          !this.cronJobs.some(job => line.includes(job.name))) {
        filteredLines.push(line);
      }
    }

    return filteredLines.join('\n');
  }

  /**
   * Setup log directory with proper permissions
   */
  async setupLogDirectory() {
    try {
      // Create logs directory if it doesn't exist
      const logDir = '/var/log';
      
      // Check if we have write permissions to /var/log
      try {
        fs.accessSync(logDir, fs.constants.W_OK);
        console.log('✅ Log directory permissions verified');
      } catch (error) {
        console.warn('⚠️  Cannot write to /var/log, using local logs directory');
        
        // Create local logs directory
        const localLogDir = path.join(this.projectRoot, 'logs');
        if (!fs.existsSync(localLogDir)) {
          fs.mkdirSync(localLogDir, { recursive: true });
        }
        
        // Update cron jobs to use local directory
        await this.updateCronJobsLogPath(localLogDir);
      }

    } catch (error) {
      console.warn('⚠️  Could not setup log directory:', error.message);
    }
  }

  /**
   * Update cron jobs to use alternative log path
   */
  async updateCronJobsLogPath(logDir) {
    // Re-install with updated paths
    this.cronJobs = this.cronJobs.map(job => ({
      ...job,
      command: job.command.replace(/>> \/var\/log\//, `>> ${logDir}/`)
    }));
  }

  /**
   * Create systemd service for persistent monitoring
   */
  async createSystemdServices() {
    console.log('🔧 Creating systemd services...');
    
    if (process.getuid && process.getuid() !== 0) {
      console.log('⚠️  Systemd service creation requires root privileges, skipping...');
      console.log('💡 Run with sudo to create systemd services');
      return;
    }

    try {
      for (const service of this.systemdServices) {
        const serviceContent = this.generateSystemdServiceFile(service);
        const servicePath = `/etc/systemd/system/${service.name}.service`;
        
        fs.writeFileSync(servicePath, serviceContent);
        
        // Reload systemd and enable service
        await execAsync('systemctl daemon-reload');
        await execAsync(`systemctl enable ${service.name}`);
        
        console.log(`✅ Created systemd service: ${service.name}`);
      }

    } catch (error) {
      console.error('❌ Failed to create systemd services:', error);
    }
  }

  /**
   * Generate systemd service file content
   */
  generateSystemdServiceFile(service) {
    return `[Unit]
Description=${service.description}
After=network.target
Wants=network.target

[Service]
Type=simple
User=${service.user}
WorkingDirectory=${service.workingDirectory}
ExecStart=${service.command}
Restart=${service.autoRestart ? 'always' : 'no'}
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment variables
Environment=NODE_ENV=production
Environment=SENTRY_MONITORING_ENABLED=true

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${service.workingDirectory}

[Install]
WantedBy=multi-user.target
`;
  }

  /**
   * Check monitoring system status
   */
  async checkMonitoringStatus() {
    console.log('🔍 Checking monitoring system status...');
    
    const status = {
      timestamp: new Date().toISOString(),
      cronJobs: {},
      services: {},
      logFiles: {},
      overallHealth: 'unknown'
    };

    // Check cron jobs
    try {
      const { stdout } = await execAsync('crontab -l');
      const cronContent = stdout;
      
      for (const job of this.cronJobs) {
        status.cronJobs[job.name] = cronContent.includes(job.name);
      }
    } catch (error) {
      console.warn('⚠️  Could not check crontab:', error.message);
    }

    // Check systemd services
    for (const service of this.systemdServices) {
      try {
        const { stdout } = await execAsync(`systemctl is-active ${service.name}`);
        status.services[service.name] = stdout.trim() === 'active';
      } catch (error) {
        status.services[service.name] = false;
      }
    }

    // Check log files
    const logPaths = ['/var/log', path.join(this.projectRoot, 'logs')];
    
    for (const logPath of logPaths) {
      if (fs.existsSync(logPath)) {
        for (const job of this.cronJobs) {
          const logFile = path.join(logPath, `${job.name}.log`);
          if (fs.existsSync(logFile)) {
            const stats = fs.statSync(logFile);
            status.logFiles[job.name] = {
              exists: true,
              size: stats.size,
              lastModified: stats.mtime.toISOString()
            };
          }
        }
      }
    }

    // Determine overall health
    const cronJobsHealthy = Object.values(status.cronJobs).filter(Boolean).length;
    const servicesHealthy = Object.values(status.services).filter(Boolean).length;
    
    if (cronJobsHealthy >= this.cronJobs.length * 0.8) {
      status.overallHealth = 'healthy';
    } else if (cronJobsHealthy >= this.cronJobs.length * 0.5) {
      status.overallHealth = 'degraded';
    } else {
      status.overallHealth = 'critical';
    }

    console.log('\n📊 Monitoring System Status:');
    console.log('=====================================');
    console.log(`Overall Health: ${status.overallHealth.toUpperCase()}`);
    console.log(`Cron Jobs: ${cronJobsHealthy}/${this.cronJobs.length} active`);
    console.log(`Services: ${servicesHealthy}/${this.systemdServices.length} running`);
    console.log(`Log Files: ${Object.keys(status.logFiles).length} found`);
    
    console.log('\n🔧 Cron Jobs Status:');
    for (const [name, active] of Object.entries(status.cronJobs)) {
      console.log(`  ${active ? '✅' : '❌'} ${name}`);
    }
    
    console.log('\n🔧 Services Status:');
    for (const [name, active] of Object.entries(status.services)) {
      console.log(`  ${active ? '✅' : '❌'} ${name}`);
    }

    return status;
  }

  /**
   * Uninstall monitoring cron jobs
   */
  async uninstallCronJobs() {
    console.log('🗑️  Uninstalling monitoring cron jobs...');
    
    try {
      // Get current crontab
      const { stdout } = await execAsync('crontab -l');
      const currentCrontab = stdout;

      // Remove monitoring section
      const cleanedCrontab = this.removeExistingMonitoringJobs(currentCrontab);

      // Write cleaned crontab
      const tempCrontabFile = `/tmp/crontab-clean-${Date.now()}`;
      fs.writeFileSync(tempCrontabFile, cleanedCrontab);
      
      await execAsync(`crontab ${tempCrontabFile}`);
      fs.unlinkSync(tempCrontabFile);

      console.log('✅ Successfully uninstalled monitoring cron jobs');

    } catch (error) {
      console.error('❌ Failed to uninstall cron jobs:', error);
    }
  }

  /**
   * Get monitoring recommendations
   */
  getMonitoringRecommendations() {
    return `
📋 Smart Sentry Monitoring Setup Recommendations:

🔧 Environment Variables:
  export SENTRY_DSN="your-sentry-dsn"
  export SENTRY_AUTH_TOKEN="your-sentry-auth-token"
  export SENTRY_ORG="your-org"
  export SENTRY_PROJECT="your-project"
  export SENTRY_WEBHOOK_SECRET="your-webhook-secret"
  export SENTRY_MONITORING_ENABLED="true"

📅 Cron Job Schedule:
  - Health checks every 15 minutes (non-critical monitoring)
  - System health detection every 20 minutes (optimal balance)
  - Daily cleanup at 2 AM (maintenance window)
  - Status checks every 30 minutes (system monitoring)

🔐 Security:
  - Use dedicated user account for monitoring services
  - Restrict file permissions on sensitive configuration
  - Use webhook secrets for Sentry integration
  - Monitor log files for unusual activity

📊 Performance:
  - Monitor system resources during peak times
  - Adjust cron frequencies based on system load
  - Use log rotation to prevent disk space issues
  - Set up alerts for monitoring system failures

🚀 Production Setup:
  1. Install cron jobs: node monitoring-cron-setup.js install
  2. Create systemd services: sudo node monitoring-cron-setup.js services
  3. Configure Sentry webhooks: point to /api/sentry-webhook
  4. Start Smart Sentry Monitor: node smart-sentry-monitor.js start
  5. Monitor system status: node monitoring-cron-setup.js status

🔄 Maintenance:
  - Review escalation policies monthly
  - Update priority thresholds based on experience  
  - Clean old monitoring data regularly
  - Test webhook endpoints periodically
    `;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'help';
  const setup = new MonitoringCronSetup();

  async function main() {
    switch (command) {
      case 'install':
        await setup.installCronJobs();
        console.log('\n🎯 Next steps:');
        console.log('1. Configure environment variables');
        console.log('2. Test the system: node monitoring-cron-setup.js status');
        console.log('3. Start Smart Sentry Monitor: node smart-sentry-monitor.js start');
        break;
        
      case 'uninstall':
        await setup.uninstallCronJobs();
        break;
        
      case 'services':
        await setup.createSystemdServices();
        break;
        
      case 'status':
        const status = await setup.checkMonitoringStatus();
        
        // Exit with error code if system is not healthy
        if (status.overallHealth === 'critical') {
          process.exit(2);
        } else if (status.overallHealth === 'degraded') {
          process.exit(1);
        }
        break;
        
      case 'recommendations':
        console.log(setup.getMonitoringRecommendations());
        break;
        
      case 'help':
      default:
        console.log(`
Smart Sentry Monitoring - Cron Setup

Usage:
  node monitoring-cron-setup.js <command>

Commands:
  install        - Install monitoring cron jobs
  uninstall      - Remove monitoring cron jobs  
  services       - Create systemd services (requires root)
  status         - Check monitoring system status
  recommendations- Show setup recommendations
  help           - Show this help message

Cron Jobs:
  📅 sentry-health-check     - Every 15 minutes
  📅 health-change-detector  - Every 20 minutes  
  📅 escalation-cleanup      - Daily at 2 AM
  📅 monitoring-status       - Every 30 minutes

Example Setup:
  # Install cron jobs
  node monitoring-cron-setup.js install
  
  # Check status
  node monitoring-cron-setup.js status
  
  # View recommendations
  node monitoring-cron-setup.js recommendations

Features:
  ✅ Automated cron job management
  ✅ Systemd service creation
  ✅ Log directory setup with fallbacks
  ✅ Health monitoring and status checks
  ✅ Smart cleanup and maintenance
  ✅ Production-ready configuration
        `);
        break;
    }
  }

  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = MonitoringCronSetup;