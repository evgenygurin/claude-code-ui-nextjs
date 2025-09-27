#!/usr/bin/env node

/**
 * Скрипт для автоматической настройки конфигурации Vercel
 * Предотвращает интерактивные запросы при деплое
 */

const fs = require('fs');
const path = require('path');

class VercelConfigSetup {
  constructor() {
    this.vercelDir = path.join(process.cwd(), '.vercel');
    this.projectFile = path.join(this.vercelDir, 'project.json');
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

  ensureVercelDirectory() {
    if (!fs.existsSync(this.vercelDir)) {
      fs.mkdirSync(this.vercelDir, { recursive: true });
      this.log('✅ Создана директория .vercel', 'success');
    }
  }

  createProjectConfig() {
    const projectId = process.env.VERCEL_PROJECT_ID;
    const orgId = process.env.VERCEL_ORG_ID;

    if (!projectId || !orgId) {
      this.log('❌ VERCEL_PROJECT_ID или VERCEL_ORG_ID не найдены в переменных окружения', 'error');
      this.log('💡 Убедитесь, что эти переменные настроены в секретах CI/CD', 'warning');
      process.exit(1);
    }

    const config = {
      projectId: projectId,
      orgId: orgId
    };

    try {
      fs.writeFileSync(this.projectFile, JSON.stringify(config, null, 2));
      this.log('✅ Конфигурационный файл .vercel/project.json создан', 'success');
      this.log(`   Project ID: ${projectId}`, 'info');
      this.log(`   Org ID: ${orgId}`, 'info');
    } catch (error) {
      this.log(`❌ Ошибка при создании файла конфигурации: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  createVercelRC() {
    const vercelRCPath = path.join(process.cwd(), '.vercelrc');
    
    const config = {
      version: 2,
      scope: process.env.VERCEL_ORG_ID,
      builds: [
        {
          src: 'package.json',
          use: '@vercel/node'
        }
      ]
    };

    try {
      fs.writeFileSync(vercelRCPath, JSON.stringify(config, null, 2));
      this.log('✅ Файл .vercelrc создан', 'success');
    } catch (error) {
      this.log(`❌ Ошибка при создании .vercelrc: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  validateToken() {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      this.log('❌ VERCEL_TOKEN не найден в переменных окружения', 'error');
      this.log('💡 Убедитесь, что токен настроен в секретах CI/CD', 'warning');
      process.exit(1);
    }

    // Проверяем формат токена
    if (token.length < 20) {
      this.log('❌ VERCEL_TOKEN выглядит слишком коротким', 'error');
      process.exit(1);
    }

    this.log('✅ VERCEL_TOKEN найден и выглядит корректно', 'success');
  }

  createGitignoreEntries() {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const entries = ['.vercel'];
    
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      const missingEntries = entries.filter(entry => !content.includes(entry));
      
      if (missingEntries.length > 0) {
        fs.appendFileSync(gitignorePath, '\n# Vercel\n' + missingEntries.join('\n') + '\n');
        this.log('✅ Добавлены записи в .gitignore для Vercel', 'success');
      }
    } else {
      fs.writeFileSync(gitignorePath, '# Vercel\n' + entries.join('\n') + '\n');
      this.log('✅ Создан .gitignore с записями для Vercel', 'success');
    }
  }

  run() {
    this.log('🔧 Настройка конфигурации Vercel для CI/CD...', 'info');
    this.log('', 'info');

    // Проверяем токен
    this.validateToken();

    // Создаем необходимые файлы
    this.ensureVercelDirectory();
    this.createProjectConfig();
    this.createVercelRC();
    this.createGitignoreEntries();

    this.log('', 'info');
    this.log('🎉 Конфигурация Vercel успешно настроена!', 'success');
    this.log('', 'info');
    this.log('📋 Что было сделано:', 'info');
    this.log('   ✅ Создана директория .vercel', 'info');
    this.log('   ✅ Создан файл .vercel/project.json с ID проекта и организации', 'info');
    this.log('   ✅ Создан файл .vercelrc с базовой конфигурацией', 'info');
    this.log('   ✅ Обновлен .gitignore для исключения .vercel из репозитория', 'info');
    this.log('', 'info');
    this.log('💡 Теперь Vercel CLI не будет запрашивать интерактивный ввод при деплое!', 'warning');
  }
}

// Запуск скрипта
if (require.main === module) {
  try {
    const setup = new VercelConfigSetup();
    setup.run();
  } catch (error) {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  }
}

module.exports = VercelConfigSetup;