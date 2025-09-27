#!/usr/bin/env node

/**
 * Система мониторинга статуса авторизации для CI/CD
 * Проактивно отслеживает проблемы с токенами и уведомляет о них
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class AuthMonitor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      services: {},
      recommendations: []
    };
    
    this.monitoringFile = path.join(__dirname, '..', '.auth-monitoring.json');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkService(name, checkFunction) {
    try {
      const result = await checkFunction();
      this.results.services[name] = {
        status: result.valid ? 'healthy' : 'unhealthy',
        message: result.message || result.error || result.info,
        lastCheck: new Date().toISOString()
      };
      
      if (result.valid) {
        this.log(`✅ ${name}: OK`, 'success');
      } else {
        this.log(`❌ ${name}: ${result.error || result.message}`, 'error');
      }
      
      return result.valid;
    } catch (error) {
      this.results.services[name] = {
        status: 'error',
        message: error.message,
        lastCheck: new Date().toISOString()
      };
      
      this.log(`⚠️  ${name}: ${error.message}`, 'warning');
      return false;
    }
  }

  async checkVercelStatus() {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return { valid: false, error: 'Token not found' };
    }

    const result = await this.makeRequest('https://api.vercel.com/v2/user', {
      'Authorization': `Bearer ${token}`
    });

    if (result.user) {
      return { valid: true, message: `User: ${result.user.username || result.user.email}` };
    }
    
    return { valid: false, error: 'Invalid token or API error' };
  }

  async checkGitHubStatus() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { valid: false, error: 'Token not found' };
    }

    const result = await this.makeRequest('https://api.github.com/user', {
      'Authorization': `token ${token}`,
      'User-Agent': 'Auth-Monitor'
    });

    if (result.login) {
      return { valid: true, message: `User: ${result.login}` };
    }
    
    return { valid: false, error: 'Invalid token or API error' };
  }

  async checkSentryStatus() {
    const token = process.env.SENTRY_AUTH_TOKEN;
    if (!token) {
      return { valid: false, error: 'Token not found' };
    }

    const result = await this.makeRequest('https://sentry.io/api/0/organizations/', {
      'Authorization': `Bearer ${token}`
    });

    if (Array.isArray(result)) {
      return { valid: true, message: `Organizations: ${result.length}` };
    }
    
    return { valid: false, error: 'Invalid token or API error' };
  }

  makeRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async checkTokenExpiration() {
    // Проверяем JWT токены на истечение срока действия
    const tokens = [
      { name: 'VERCEL_TOKEN', value: process.env.VERCEL_TOKEN },
      { name: 'GITHUB_TOKEN', value: process.env.GITHUB_TOKEN }
    ];

    for (const token of tokens) {
      if (!token.value) continue;

      try {
        // Простая проверка формата JWT
        if (token.value.includes('.')) {
          const parts = token.value.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            if (payload.exp) {
              const expirationDate = new Date(payload.exp * 1000);
              const now = new Date();
              const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
              
              if (daysUntilExpiration < 7) {
                this.results.recommendations.push(`⚠️  ${token.name} истекает через ${daysUntilExpiration} дней`);
              }
            }
          }
        }
      } catch (error) {
        // Токен не JWT или поврежден
        continue;
      }
    }
  }

  saveMonitoringData() {
    try {
      fs.writeFileSync(this.monitoringFile, JSON.stringify(this.results, null, 2));
      this.log('📊 Данные мониторинга сохранены', 'info');
    } catch (error) {
      this.log(`❌ Ошибка сохранения данных мониторинга: ${error.message}`, 'error');
    }
  }

  loadPreviousResults() {
    try {
      if (fs.existsSync(this.monitoringFile)) {
        const data = fs.readFileSync(this.monitoringFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      this.log(`⚠️  Ошибка загрузки предыдущих результатов: ${error.message}`, 'warning');
    }
    return null;
  }

  async runHealthCheck() {
    this.log('🏥 Запуск проверки состояния авторизации...', 'info');
    this.log('', 'info');

    const checks = [
      { name: 'Vercel API', check: this.checkVercelStatus.bind(this) },
      { name: 'GitHub API', check: this.checkGitHubStatus.bind(this) },
      { name: 'Sentry API', check: this.checkSentryStatus.bind(this) }
    ];

    const results = [];
    for (const { name, check } of checks) {
      const result = await this.checkService(name, check);
      results.push(result);
    }

    // Проверяем истечение токенов
    await this.checkTokenExpiration();

    // Определяем общий статус
    const healthyServices = results.filter(r => r).length;
    const totalServices = results.length;

    if (healthyServices === totalServices) {
      this.results.status = 'healthy';
      this.log('', 'info');
      this.log('🎉 Все сервисы авторизации работают корректно!', 'success');
    } else if (healthyServices > 0) {
      this.results.status = 'degraded';
      this.log('', 'info');
      this.log(`⚠️  Частичные проблемы: ${healthyServices}/${totalServices} сервисов работают`, 'warning');
    } else {
      this.results.status = 'critical';
      this.log('', 'info');
      this.log('🚨 Критическое состояние: все сервисы авторизации недоступны!', 'error');
    }

    // Сравниваем с предыдущими результатами
    const previous = this.loadPreviousResults();
    if (previous && previous.status !== this.results.status) {
      this.log(`📈 Изменение статуса: ${previous.status} → ${this.results.status}`, 'info');
    }

    // Выводим рекомендации
    if (this.results.recommendations.length > 0) {
      this.log('', 'info');
      this.log('💡 Рекомендации:', 'warning');
      this.results.recommendations.forEach(rec => {
        this.log(`   ${rec}`, 'warning');
      });
    }

    // Сохраняем результаты
    this.saveMonitoringData();

    return this.results.status === 'healthy' ? 0 : 1;
  }

  async runContinuousMonitoring(intervalMinutes = 15) {
    this.log(`🔄 Запуск непрерывного мониторинга (интервал: ${intervalMinutes} мин)`, 'info');
    
    // Первый запуск
    await this.runHealthCheck();
    
    // Устанавливаем интервал
    setInterval(async () => {
      this.log('🔄 Плановая проверка авторизации...', 'info');
      await this.runHealthCheck();
    }, intervalMinutes * 60 * 1000);
  }

  generateStatusReport() {
    const data = this.loadPreviousResults();
    if (!data) {
      this.log('❌ Нет данных для генерации отчета', 'error');
      return;
    }

    this.log('📋 Отчет о состоянии авторизации:', 'info');
    this.log(`   Статус: ${data.status}`, data.status === 'healthy' ? 'success' : 'warning');
    this.log(`   Последняя проверка: ${data.timestamp}`, 'info');
    this.log('', 'info');

    Object.entries(data.services).forEach(([name, service]) => {
      const statusIcon = service.status === 'healthy' ? '✅' : '❌';
      this.log(`   ${statusIcon} ${name}: ${service.message}`, 'info');
    });

    if (data.recommendations.length > 0) {
      this.log('', 'info');
      this.log('   Рекомендации:', 'warning');
      data.recommendations.forEach(rec => {
        this.log(`   ${rec}`, 'warning');
      });
    }
  }
}

// CLI интерфейс
if (require.main === module) {
  const monitor = new AuthMonitor();
  const command = process.argv[2] || 'check';

  switch (command) {
    case 'check':
      monitor.runHealthCheck().then(exitCode => {
        process.exit(exitCode);
      });
      break;
      
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 15;
      monitor.runContinuousMonitoring(interval);
      break;
      
    case 'status':
      monitor.generateStatusReport();
      break;
      
    default:
      console.log('Использование: node auth-monitor.js [check|monitor|status]');
      console.log('  check   - одноразовая проверка');
      console.log('  monitor - непрерывный мониторинг');
      console.log('  status  - показать последний статус');
      process.exit(1);
  }
}

module.exports = AuthMonitor;