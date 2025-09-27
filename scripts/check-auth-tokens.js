#!/usr/bin/env node

/**
 * Скрипт для проверки всех необходимых токенов авторизации в CI/CD
 * Предотвращает необходимость ручного логина путем валидации токенов
 */

const https = require('https');
const { spawn } = require('child_process');

class AuthTokenChecker {
  constructor() {
    this.requiredTokens = [
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID', 
      'VERCEL_PROJECT_ID',
      'CODECOV_TOKEN',
      'SENTRY_AUTH_TOKEN',
      'GITHUB_TOKEN'
    ];
    
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async checkTokenExists(tokenName) {
    const token = process.env[tokenName];
    if (!token || token.trim() === '') {
      return { valid: false, error: 'Token not found or empty' };
    }
    return { valid: true, token: token.substring(0, 10) + '...' };
  }

  async checkVercelToken() {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return { valid: false, error: 'VERCEL_TOKEN not found' };
    }

    try {
      // Проверяем токен через Vercel API
      const result = await this.makeRequest('https://api.vercel.com/v2/user', {
        'Authorization': `Bearer ${token}`
      });

      if (result.user) {
        return { 
          valid: true, 
          info: `Vercel user: ${result.user.username || result.user.email}` 
        };
      }
    } catch (error) {
      return { valid: false, error: `Vercel API error: ${error.message}` };
    }

    return { valid: false, error: 'Invalid Vercel token' };
  }

  async checkCodecovToken() {
    const token = process.env.CODECOV_TOKEN;
    if (!token) {
      return { valid: false, error: 'CODECOV_TOKEN not found' };
    }

    // Codecov токены сложно проверить без отправки данных
    // Проверяем только формат
    if (token.length < 30) {
      return { valid: false, error: 'Codecov token appears too short' };
    }

    return { valid: true, info: 'Codecov token format looks valid' };
  }

  async checkSentryToken() {
    const token = process.env.SENTRY_AUTH_TOKEN;
    if (!token) {
      return { valid: false, error: 'SENTRY_AUTH_TOKEN not found' };
    }

    try {
      // Проверяем токен через Sentry API
      const result = await this.makeRequest('https://sentry.io/api/0/organizations/', {
        'Authorization': `Bearer ${token}`
      });

      if (Array.isArray(result)) {
        return { 
          valid: true, 
          info: `Sentry organizations: ${result.length}` 
        };
      }
    } catch (error) {
      return { valid: false, error: `Sentry API error: ${error.message}` };
    }

    return { valid: false, error: 'Invalid Sentry token' };
  }

  async checkGitHubToken() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { valid: false, error: 'GITHUB_TOKEN not found' };
    }

    try {
      const result = await this.makeRequest('https://api.github.com/user', {
        'Authorization': `token ${token}`,
        'User-Agent': 'CI-CD-Auth-Checker'
      });

      if (result.login) {
        return { 
          valid: true, 
          info: `GitHub user: ${result.login}` 
        };
      }
    } catch (error) {
      return { valid: false, error: `GitHub API error: ${error.message}` };
    }

    return { valid: false, error: 'Invalid GitHub token' };
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

  async checkVercelCLI() {
    return new Promise((resolve) => {
      const vercel = spawn('vercel', ['--version'], { stdio: 'pipe' });
      
      let output = '';
      vercel.stdout.on('data', (data) => {
        output += data.toString();
      });

      vercel.on('close', (code) => {
        if (code === 0) {
          resolve({ valid: true, info: `Vercel CLI: ${output.trim()}` });
        } else {
          resolve({ valid: false, error: 'Vercel CLI not installed' });
        }
      });

      vercel.on('error', () => {
        resolve({ valid: false, error: 'Vercel CLI not found' });
      });
    });
  }

  async runAllChecks() {
    this.log('🔍 Проверка токенов авторизации для CI/CD...', 'info');
    this.log('', 'info');

    // Проверка основных переменных окружения
    this.log('📋 Проверка переменных окружения:', 'info');
    for (const tokenName of this.requiredTokens) {
      const result = await this.checkTokenExists(tokenName);
      if (result.valid) {
        this.log(`✅ ${tokenName}: найден (${result.token})`, 'success');
        this.results.passed.push(tokenName);
      } else {
        this.log(`❌ ${tokenName}: ${result.error}`, 'error');
        this.results.failed.push(`${tokenName}: ${result.error}`);
      }
    }

    this.log('', 'info');
    this.log('🌐 Проверка API токенов:', 'info');

    // Детальная проверка токенов
    const apiChecks = [
      { name: 'Vercel API', check: this.checkVercelToken.bind(this) },
      { name: 'GitHub API', check: this.checkGitHubToken.bind(this) },
      { name: 'Sentry API', check: this.checkSentryToken.bind(this) },
      { name: 'Codecov Token', check: this.checkCodecovToken.bind(this) }
    ];

    for (const { name, check } of apiChecks) {
      try {
        const result = await check();
        if (result.valid) {
          this.log(`✅ ${name}: ${result.info || 'OK'}`, 'success');
        } else {
          this.log(`❌ ${name}: ${result.error}`, 'error');
          this.results.failed.push(`${name}: ${result.error}`);
        }
      } catch (error) {
        this.log(`⚠️  ${name}: Ошибка проверки - ${error.message}`, 'warning');
        this.results.warnings.push(`${name}: ${error.message}`);
      }
    }

    // Проверка CLI инструментов
    this.log('', 'info');
    this.log('🛠️  Проверка CLI инструментов:', 'info');
    
    const cliResult = await this.checkVercelCLI();
    if (cliResult.valid) {
      this.log(`✅ ${cliResult.info}`, 'success');
    } else {
      this.log(`❌ ${cliResult.error}`, 'error');
      this.results.failed.push(`Vercel CLI: ${cliResult.error}`);
    }

    // Итоговый отчет
    this.printSummary();
    
    // Возвращаем код выхода
    return this.results.failed.length === 0 ? 0 : 1;
  }

  printSummary() {
    this.log('', 'info');
    this.log('📊 Итоговый отчет:', 'info');
    this.log(`✅ Успешно: ${this.results.passed.length}`, 'success');
    this.log(`⚠️  Предупреждения: ${this.results.warnings.length}`, 'warning');
    this.log(`❌ Ошибки: ${this.results.failed.length}`, 'error');

    if (this.results.failed.length > 0) {
      this.log('', 'info');
      this.log('🚨 Найденные проблемы:', 'error');
      this.results.failed.forEach(error => {
        this.log(`   - ${error}`, 'error');
      });
      
      this.log('', 'info');
      this.log('💡 Рекомендации:', 'warning');
      this.log('   1. Проверьте наличие всех секретов в настройках CI/CD', 'warning');
      this.log('   2. Убедитесь, что токены не истекли', 'warning');
      this.log('   3. Проверьте права доступа для токенов', 'warning');
      this.log('   4. Установите Vercel CLI если он отсутствует', 'warning');
    } else {
      this.log('', 'info');
      this.log('🎉 Все проверки пройдены! CI/CD должен работать без ручного логина.', 'success');
    }
  }
}

// Запуск скрипта
if (require.main === module) {
  const checker = new AuthTokenChecker();
  checker.runAllChecks().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = AuthTokenChecker;