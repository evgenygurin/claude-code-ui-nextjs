#!/usr/bin/env node

/**
 * Система мониторинга конфликтов слияния
 * 
 * Отслеживает состояние репозитория и автоматически запускает
 * разрешение конфликтов при их обнаружении.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { MergeConflictResolver } = require('./merge-conflict-resolver');

class MergeMonitor {
  constructor(options = {}) {
    this.options = {
      interval: options.interval || 30000, // 30 секунд
      maxRetries: options.maxRetries || 3,
      enableSlackNotifications: options.enableSlackNotifications || false,
      slackWebhook: options.slackWebhook || process.env.SLACK_WEBHOOK_URL,
      enableEmailNotifications: options.enableEmailNotifications || false,
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.monitoring = false;
    this.stats = {
      totalChecks: 0,
      conflictsDetected: 0,
      autoResolved: 0,
      manualInterventionRequired: 0,
      startTime: new Date()
    };

    this.log('🚀 Инициализация системы мониторинга конфликтов...');
  }

  /**
   * Запуск мониторинга
   */
  async startMonitoring() {
    this.monitoring = true;
    this.log(`📡 Запуск мониторинга с интервалом ${this.options.interval}ms`);

    while (this.monitoring) {
      try {
        await this.checkForConflicts();
        this.stats.totalChecks++;
        
        // Ожидание перед следующей проверкой
        await this.sleep(this.options.interval);
      } catch (error) {
        this.log(`❌ Ошибка в цикле мониторинга: ${error.message}`, 'error');
        
        // Небольшая пауза при ошибке, чтобы не спамить
        await this.sleep(5000);
      }
    }
  }

  /**
   * Остановка мониторинга
   */
  stopMonitoring() {
    this.monitoring = false;
    this.log('⏹️ Мониторинг остановлен');
    this.generateReport();
  }

  /**
   * Проверка наличия конфликтов
   */
  async checkForConflicts() {
    const conflictFiles = this.getConflictFiles();
    
    if (conflictFiles.length > 0) {
      this.stats.conflictsDetected++;
      this.log(`⚠️ Обнаружены конфликты в ${conflictFiles.length} файлах: ${conflictFiles.join(', ')}`);
      
      await this.handleConflicts(conflictFiles);
    }
  }

  /**
   * Обработка обнаруженных конфликтов
   */
  async handleConflicts(conflictFiles) {
    this.log(`🛠️ Начало автоматического разрешения конфликтов...`);
    
    try {
      const resolver = new MergeConflictResolver({
        verbose: this.options.logLevel === 'debug',
        dryRun: false
      });

      const result = await resolver.resolveAllConflicts();
      
      if (result.success) {
        this.stats.autoResolved++;
        this.log(`✅ Конфликты успешно разрешены автоматически`);
        
        await this.notifySuccess(result);
        
        // Пытаемся продолжить операцию git (rebase/merge)
        await this.continueGitOperation();
        
      } else {
        this.stats.manualInterventionRequired++;
        this.log(`❌ Не удалось разрешить все конфликты автоматически: ${result.message}`, 'error');
        
        await this.notifyFailure(result, conflictFiles);
        await this.requestManualIntervention(result, conflictFiles);
      }
    } catch (error) {
      this.stats.manualInterventionRequired++;
      this.log(`💥 Критическая ошибка при разрешении конфликтов: ${error.message}`, 'error');
      
      await this.notifyError(error, conflictFiles);
      await this.requestManualIntervention({ error: error.message }, conflictFiles);
    }
  }

  /**
   * Продолжение операции git после разрешения конфликтов
   */
  async continueGitOperation() {
    try {
      // Проверяем, какая операция git в процессе
      const gitDir = '.git';
      const rebasePath = path.join(gitDir, 'rebase-apply');
      const mergePath = path.join(gitDir, 'MERGE_HEAD');
      const cherryPickPath = path.join(gitDir, 'CHERRY_PICK_HEAD');

      if (fs.existsSync(rebasePath)) {
        this.log(`🔄 Продолжение операции rebase...`);
        execSync('git rebase --continue', { stdio: 'inherit' });
        this.log(`✅ Rebase успешно завершён`);
      } else if (fs.existsSync(mergePath)) {
        this.log(`🔄 Завершение операции merge...`);
        execSync('git commit --no-edit', { stdio: 'inherit' });
        this.log(`✅ Merge успешно завершён`);
      } else if (fs.existsSync(cherryPickPath)) {
        this.log(`🔄 Продолжение операции cherry-pick...`);
        execSync('git cherry-pick --continue', { stdio: 'inherit' });
        this.log(`✅ Cherry-pick успешно завершён`);
      } else {
        this.log(`ℹ️ Операция git не требует продолжения`);
      }
    } catch (error) {
      this.log(`⚠️ Ошибка при продолжении операции git: ${error.message}`, 'warn');
      // Не выбрасываем ошибку, так как конфликты уже разрешены
    }
  }

  /**
   * Получение списка файлов с конфликтами
   */
  getConflictFiles() {
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf8' });
      return output
        .split('\n')
        .filter(line => line.startsWith('UU') || line.includes('both modified'))
        .map(line => line.replace(/^UU\s+/, '').trim())
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * Уведомление об успешном разрешении
   */
  async notifySuccess(result) {
    const message = `✅ Конфликты успешно разрешены!\n\n` +
                   `📊 ${result.message}\n` +
                   `⏱️ Время: ${new Date().toISOString()}\n` +
                   `🏛️ Репозиторий: ${this.getRepositoryName()}`;

    await this.sendNotification(message, 'success');
  }

  /**
   * Уведомление о неудачном разрешении
   */
  async notifyFailure(result, conflictFiles) {
    const message = `⚠️ Не удалось разрешить конфликты автоматически\n\n` +
                   `❌ ${result.message}\n` +
                   `📁 Файлы с конфликтами: ${conflictFiles.join(', ')}\n` +
                   `⏱️ Время: ${new Date().toISOString()}\n` +
                   `🏛️ Репозиторий: ${this.getRepositoryName()}\n\n` +
                   `🚨 Требуется ручное вмешательство разработчика!`;

    await this.sendNotification(message, 'warning');
  }

  /**
   * Уведомление об ошибке
   */
  async notifyError(error, conflictFiles) {
    const message = `💥 Критическая ошибка при разрешении конфликтов!\n\n` +
                   `❌ ${error.message}\n` +
                   `📁 Файлы с конфликтами: ${conflictFiles.join(', ')}\n` +
                   `⏱️ Время: ${new Date().toISOString()}\n` +
                   `🏛️ Репозиторий: ${this.getRepositoryName()}\n\n` +
                   `🚨 Необходимо немедленное вмешательство!`;

    await this.sendNotification(message, 'error');
  }

  /**
   * Отправка уведомлений
   */
  async sendNotification(message, level = 'info') {
    this.log(`📢 Отправка уведомления (${level}): ${message.substring(0, 100)}...`);

    const notifications = [];

    // Slack уведомления
    if (this.options.enableSlackNotifications && this.options.slackWebhook) {
      notifications.push(this.sendSlackNotification(message, level));
    }

    // Email уведомления (если настроены)
    if (this.options.enableEmailNotifications) {
      notifications.push(this.sendEmailNotification(message, level));
    }

    // GitHub Issue (если критическая ошибка)
    if (level === 'error') {
      notifications.push(this.createGitHubIssue(message));
    }

    // Ожидаем завершения всех уведомлений
    const results = await Promise.allSettled(notifications);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.log(`❌ Не удалось отправить уведомление ${index + 1}: ${result.reason}`, 'warn');
      }
    });
  }

  /**
   * Отправка уведомления в Slack
   */
  async sendSlackNotification(message, level) {
    if (!this.options.slackWebhook) {
      throw new Error('Slack webhook URL не настроен');
    }

    const colors = {
      success: 'good',
      warning: 'warning',
      error: 'danger',
      info: '#36a64f'
    };

    const payload = {
      username: 'Merge Conflict Monitor',
      icon_emoji: ':robot_face:',
      attachments: [{
        color: colors[level] || colors.info,
        title: 'Мониторинг конфликтов слияния',
        text: message,
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    try {
      const response = await fetch(this.options.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      this.log('📤 Slack уведомление отправлено успешно');
    } catch (error) {
      this.log(`❌ Ошибка отправки в Slack: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Отправка email уведомления
   */
  async sendEmailNotification(message, level) {
    // Заглушка для email уведомлений
    // В реальном проекте здесь будет интеграция с email сервисом
    this.log('📧 Email уведомления пока не реализованы', 'warn');
  }

  /**
   * Создание GitHub Issue для критических ошибок
   */
  async createGitHubIssue(message) {
    try {
      // Проверяем, есть ли GitHub CLI
      execSync('gh --version', { stdio: 'ignore' });

      const title = `🚨 Критическая ошибка разрешения конфликтов - ${new Date().toISOString().split('T')[0]}`;
      const body = `${message}\n\n---\n\nЭто автоматическое issue создано системой мониторинга конфликтов.`;

      execSync(`gh issue create --title "${title}" --body "${body}" --label "critical,merge-conflicts,automated"`, {
        stdio: 'inherit'
      });

      this.log('🎫 GitHub issue создано успешно');
    } catch (error) {
      this.log(`❌ Не удалось создать GitHub issue: ${error.message}`, 'warn');
    }
  }

  /**
   * Запрос ручного вмешательства
   */
  async requestManualIntervention(result, conflictFiles) {
    this.log(`\n🚨 ТРЕБУЕТСЯ РУЧНОЕ ВМЕШАТЕЛЬСТВО 🚨`);
    this.log(`📁 Файлы с конфликтами: ${conflictFiles.join(', ')}`);
    this.log(`❌ Причина: ${result.message || result.error}`);
    this.log(`\n📋 Рекомендуемые действия:`);
    this.log(`1. Проверьте файлы с конфликтами вручную`);
    this.log(`2. Разрешите конфликты в вашем редакторе`);
    this.log(`3. Добавьте файлы в индекс: git add <файлы>`);
    this.log(`4. Продолжите операцию: git rebase --continue или git commit`);
    this.log(`\n⏱️ Мониторинг продолжится через ${this.options.interval / 1000} секунд...`);

    // Можно добавить интерактивный режим для остановки мониторинга
    // или ожидания пользовательского ввода
  }

  /**
   * Получение имени репозитория
   */
  getRepositoryName() {
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      return remoteUrl.split('/').pop().replace('.git', '');
    } catch (error) {
      return 'unknown-repository';
    }
  }

  /**
   * Генерация отчёта о работе мониторинга
   */
  generateReport() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.stats.startTime) / 1000);

    const report = {
      monitoring: {
        duration: `${duration}s`,
        totalChecks: this.stats.totalChecks,
        conflictsDetected: this.stats.conflictsDetected,
        autoResolved: this.stats.autoResolved,
        manualInterventionRequired: this.stats.manualInterventionRequired
      },
      effectiveness: {
        autoResolutionRate: this.stats.conflictsDetected > 0 
          ? `${Math.round((this.stats.autoResolved / this.stats.conflictsDetected) * 100)}%`
          : '0%'
      },
      timestamp: endTime.toISOString()
    };

    const reportPath = `merge-monitoring-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`\n📊 ОТЧЁТ О МОНИТОРИНГЕ:`);
    this.log(`⏱️ Продолжительность: ${duration}s`);
    this.log(`🔍 Всего проверок: ${this.stats.totalChecks}`);
    this.log(`⚠️ Конфликтов обнаружено: ${this.stats.conflictsDetected}`);
    this.log(`✅ Автоматически разрешено: ${this.stats.autoResolved}`);
    this.log(`🔧 Требовало ручного вмешательства: ${this.stats.manualInterventionRequired}`);
    this.log(`📈 Эффективность: ${report.effectiveness.autoResolutionRate}`);
    this.log(`📁 Отчёт сохранён: ${reportPath}`);
  }

  /**
   * Утилита для задержки
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Логирование
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level] || 'ℹ️';

    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    console.log(logMessage);

    // Сохраняем в файл лога
    try {
      fs.appendFileSync('merge-monitor.log', logMessage + '\n');
    } catch (error) {
      // Игнорируем ошибки записи в лог
    }
  }
}

// CLI интерфейс
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    interval: parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 30000,
    enableSlackNotifications: args.includes('--slack'),
    slackWebhook: args.find(arg => arg.startsWith('--slack-webhook='))?.split('=')[1],
    logLevel: args.find(arg => arg.startsWith('--log-level='))?.split('=')[1] || 'info'
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 Система мониторинга конфликтов слияния

Использование:
  node merge-monitor.js [опции]

Опции:
  --interval=ms          Интервал проверки в миллисекундах (по умолчанию: 30000)
  --slack                Включить Slack уведомления
  --slack-webhook=url    URL webhook для Slack
  --log-level=level      Уровень логирования (debug, info, warn, error)
  --help, -h             Показать эту справку

Примеры:
  node merge-monitor.js --interval=10000 --slack --log-level=debug
  node merge-monitor.js --slack-webhook=https://hooks.slack.com/...

Переменные окружения:
  SLACK_WEBHOOK_URL      URL webhook для Slack уведомлений
    `);
    process.exit(0);
  }

  console.log('🔧 Система мониторинга конфликтов слияния');
  console.log('=' .repeat(50));

  const monitor = new MergeMonitor(options);

  // Обработка сигналов для корректного завершения
  process.on('SIGINT', () => {
    console.log('\n👋 Получен сигнал завершения...');
    monitor.stopMonitoring();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Получен сигнал завершения...');
    monitor.stopMonitoring();
    process.exit(0);
  });

  // Запуск мониторинга
  await monitor.startMonitoring();
}

// Запуск если скрипт вызван напрямую
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { MergeMonitor };