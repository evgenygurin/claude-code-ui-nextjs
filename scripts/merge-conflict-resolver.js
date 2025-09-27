#!/usr/bin/env node

/**
 * Robust Merge Conflict Resolution System
 * 
 * Автоматическая система разрешения конфликтов слияния для проекта
 * Claude Code UI Next.js. Поддерживает различные стратегии разрешения
 * в зависимости от типа файлов и характера конфликтов.
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const crypto = require('crypto');

class MergeConflictResolver {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      logFile: options.logFile || 'merge-resolution.log',
      backupDir: options.backupDir || '.merge-backups',
      maxAttempts: options.maxAttempts || 3,
      ...options
    };

    this.stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      failedConflicts: 0,
      strategies: {},
      startTime: new Date()
    };

    this.conflictStrategies = new Map([
      ['package-lock.json', 'packageLock'],
      ['package.json', 'packageJson'],
      ['.yml', 'yamlMerge'],
      ['.yaml', 'yamlMerge'],
      ['.json', 'jsonMerge'],
      ['.js', 'codeMerge'],
      ['.ts', 'codeMerge'],
      ['.tsx', 'codeMerge'],
      ['.jsx', 'codeMerge'],
      ['.md', 'documentMerge'],
      ['.txt', 'textMerge'],
      ['default', 'intelligentMerge']
    ]);

    this.log(`🚀 Инициализация системы разрешения конфликтов...`);
    this.ensureDirectories();
  }

  /**
   * Основная функция для разрешения всех конфликтов
   */
  async resolveAllConflicts() {
    this.log(`\n🔍 Поиск конфликтов слияния...`);
    
    try {
      const conflictFiles = this.getConflictFiles();
      
      if (conflictFiles.length === 0) {
        this.log(`✅ Конфликты не найдены!`);
        return { success: true, message: 'Нет конфликтов для разрешения' };
      }

      this.stats.totalConflicts = conflictFiles.length;
      this.log(`⚠️ Обнаружено конфликтов: ${conflictFiles.length}`);
      
      // Создаём резервные копии всех конфликтующих файлов
      await this.createBackups(conflictFiles);

      // Разрешаем конфликты по очереди
      const results = [];
      for (const filePath of conflictFiles) {
        const result = await this.resolveFileConflict(filePath);
        results.push({ file: filePath, ...result });
        
        if (result.success) {
          this.stats.resolvedConflicts++;
        } else {
          this.stats.failedConflicts++;
        }
      }

      // Проверяем результаты
      const finalCheck = await this.validateResolution();
      
      if (finalCheck.success) {
        this.log(`\n🎉 Все конфликты успешно разрешены!`);
        await this.generateReport(results);
        return { 
          success: true, 
          message: `Разрешено ${this.stats.resolvedConflicts}/${this.stats.totalConflicts} конфликтов`,
          details: results 
        };
      } else {
        this.log(`\n❌ Остались нерешённые конфликты: ${finalCheck.remainingConflicts}`);
        return { 
          success: false, 
          message: `Не удалось разрешить ${finalCheck.remainingConflicts} конфликтов`,
          details: results 
        };
      }

    } catch (error) {
      this.log(`💥 Критическая ошибка при разрешении конфликтов: ${error.message}`);
      return { success: false, message: error.message, error };
    }
  }

  /**
   * Получение списка файлов с конфликтами
   */
  getConflictFiles() {
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf8' });
      const lines = output.trim().split('\n').filter(line => line.trim());
      
      return lines
        .filter(line => line.startsWith('UU') || line.includes('both modified'))
        .map(line => {
          // Извлекаем путь к файлу из различных форматов вывода git status
          const match = line.match(/\s+(.+)$/) || line.match(/UU\s+(.+)$/);
          return match ? match[1].trim() : null;
        })
        .filter(Boolean);
    } catch (error) {
      this.log(`❌ Ошибка при получении списка конфликтов: ${error.message}`);
      return [];
    }
  }

  /**
   * Разрешение конфликта в конкретном файле
   */
  async resolveFileConflict(filePath) {
    this.log(`\n🛠️ Разрешение конфликта в файле: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      return { success: false, message: 'Файл не найден', strategy: 'none' };
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    if (!this.hasConflictMarkers(fileContent)) {
      this.log(`ℹ️ Файл ${filePath} не содержит маркеров конфликта`);
      return { success: true, message: 'Конфликт уже разрешён', strategy: 'already-resolved' };
    }

    const strategy = this.determineStrategy(filePath);
    this.log(`📋 Используемая стратегия: ${strategy}`);

    // Увеличиваем счётчик для статистики
    this.stats.strategies[strategy] = (this.stats.strategies[strategy] || 0) + 1;

    try {
      const result = await this.applyStrategy(filePath, fileContent, strategy);
      
      if (result.success) {
        this.log(`✅ Конфликт в ${filePath} разрешён (${strategy})`);
        
        // Проверяем, что файл больше не содержит конфликтов
        const newContent = fs.readFileSync(filePath, 'utf8');
        if (this.hasConflictMarkers(newContent)) {
          this.log(`⚠️ Файл ${filePath} всё ещё содержит конфликты после разрешения`);
          return { success: false, message: 'Остались нерешённые конфликты', strategy };
        }

        // Добавляем файл в индекс git
        if (!this.options.dryRun) {
          execSync(`git add "${filePath}"`);
          this.log(`📝 Файл ${filePath} добавлен в индекс`);
        }

        return { success: true, message: 'Конфликт успешно разрешён', strategy };
      } else {
        return { success: false, message: result.message || 'Не удалось разрешить конфликт', strategy };
      }
    } catch (error) {
      this.log(`❌ Ошибка при применении стратегии ${strategy}: ${error.message}`);
      return { success: false, message: error.message, strategy };
    }
  }

  /**
   * Определение стратегии разрешения конфликта
   */
  determineStrategy(filePath) {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath);

    // Сначала проверяем точные имена файлов
    if (this.conflictStrategies.has(fileName)) {
      return this.conflictStrategies.get(fileName);
    }

    // Затем проверяем расширения файлов
    if (this.conflictStrategies.has(fileExt)) {
      return this.conflictStrategies.get(fileExt);
    }

    // Возвращаем стратегию по умолчанию
    return this.conflictStrategies.get('default');
  }

  /**
   * Применение конкретной стратегии разрешения
   */
  async applyStrategy(filePath, content, strategy) {
    switch (strategy) {
      case 'packageLock':
        return await this.resolvePackageLockConflict(filePath);
      
      case 'packageJson':
        return await this.resolvePackageJsonConflict(filePath, content);
      
      case 'jsonMerge':
        return await this.resolveJsonConflict(filePath, content);
      
      case 'yamlMerge':
        return await this.resolveYamlConflict(filePath, content);
      
      case 'codeMerge':
        return await this.resolveCodeConflict(filePath, content);
      
      case 'documentMerge':
        return await this.resolveDocumentConflict(filePath, content);
      
      case 'textMerge':
        return await this.resolveTextConflict(filePath, content);
      
      case 'intelligentMerge':
      default:
        return await this.resolveIntelligentConflict(filePath, content);
    }
  }

  /**
   * Стратегия для package-lock.json - полная регенерация
   */
  async resolvePackageLockConflict(filePath) {
    this.log(`🔄 Регенерация package-lock.json...`);
    
    try {
      if (!this.options.dryRun) {
        // Удаляем конфликтующий файл
        fs.unlinkSync(filePath);
        
        // Также удаляем node_modules для чистой установки
        if (fs.existsSync('node_modules')) {
          this.log(`🧹 Удаление node_modules для чистой установки...`);
          execSync('rm -rf node_modules');
        }
        
        // Запускаем npm install для регенерации package-lock.json
        this.log(`📦 Запуск npm install для регенерации lock файла...`);
        execSync('npm install', { stdio: 'inherit' });
        
        this.log(`✅ package-lock.json успешно регенерирован`);
      }
      
      return { success: true, message: 'package-lock.json регенерирован' };
    } catch (error) {
      this.log(`❌ Ошибка при регенерации package-lock.json: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * Стратегия для package.json - интеллектуальное слияние
   */
  async resolvePackageJsonConflict(filePath, content) {
    try {
      const sections = this.parseConflictSections(content);
      
      // Парсим обе версии как JSON
      const ourVersion = JSON.parse(sections.ours);
      const theirVersion = JSON.parse(sections.theirs);
      
      // Создаём объединённую версию
      const merged = this.mergePackageJson(ourVersion, theirVersion);
      
      if (!this.options.dryRun) {
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
      }
      
      return { success: true, message: 'package.json объединён интеллектуально' };
    } catch (error) {
      this.log(`❌ Ошибка при слиянии package.json: ${error.message}`);
      // Если не удалось разобрать JSON, используем стратегию "наша версия"
      return await this.resolveByTakingOurs(filePath, content);
    }
  }

  /**
   * Объединение двух версий package.json
   */
  mergePackageJson(ours, theirs) {
    const merged = { ...ours };
    
    // Объединяем зависимости
    const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    
    for (const field of depFields) {
      if (theirs[field]) {
        merged[field] = merged[field] || {};
        
        // Для каждой зависимости выбираем более новую версию
        for (const [pkg, version] of Object.entries(theirs[field])) {
          if (!merged[field][pkg] || this.isNewerVersion(version, merged[field][pkg])) {
            merged[field][pkg] = version;
          }
        }
      }
    }
    
    // Объединяем скрипты (добавляем новые, не перезаписываем существующие)
    if (theirs.scripts) {
      merged.scripts = merged.scripts || {};
      for (const [name, script] of Object.entries(theirs.scripts)) {
        if (!merged.scripts[name]) {
          merged.scripts[name] = script;
        }
      }
    }
    
    return merged;
  }

  /**
   * Простое сравнение версий (может быть улучшено)
   */
  isNewerVersion(version1, version2) {
    // Убираем префиксы вроде ^, ~, >=
    const clean1 = version1.replace(/^[\^~>=<]+/, '');
    const clean2 = version2.replace(/^[\^~>=<]+/, '');
    
    return clean1.localeCompare(clean2, undefined, { numeric: true }) > 0;
  }

  /**
   * Разрешение конфликтов в JSON файлах
   */
  async resolveJsonConflict(filePath, content) {
    try {
      const sections = this.parseConflictSections(content);
      
      // Пытаемся парсить обе версии
      const ourVersion = JSON.parse(sections.ours);
      const theirVersion = JSON.parse(sections.theirs);
      
      // Глубокое слияние объектов
      const merged = this.deepMerge(ourVersion, theirVersion);
      
      if (!this.options.dryRun) {
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
      }
      
      return { success: true, message: 'JSON файл объединён' };
    } catch (error) {
      // Если JSON невалидный, используем стратегию "наша версия"
      return await this.resolveByTakingOurs(filePath, content);
    }
  }

  /**
   * Разрешение конфликтов в YAML файлах
   */
  async resolveYamlConflict(filePath, content) {
    // Для YAML файлов (особенно GitHub Actions) используем стратегию "их версия"
    // так как обычно это обновления workflow файлов
    return await this.resolveByTakingTheirs(filePath, content);
  }

  /**
   * Разрешение конфликтов в коде
   */
  async resolveCodeConflict(filePath, content) {
    const sections = this.parseConflictSections(content);
    
    // Анализируем характер конфликта
    const analysis = this.analyzeCodeConflict(sections);
    
    if (analysis.canAutoResolve) {
      // Если можем автоматически разрешить, применяем стратегию
      return await this.applyCodeMergeStrategy(filePath, content, sections, analysis);
    } else {
      // Для сложных конфликтов кода используем стратегию "наша версия"
      this.log(`⚠️ Сложный конфликт в коде, используем нашу версию: ${filePath}`);
      return await this.resolveByTakingOurs(filePath, content);
    }
  }

  /**
   * Анализ конфликта в коде для определения возможности автоматического разрешения
   */
  analyzeCodeConflict(sections) {
    const { ours, theirs } = sections;
    
    // Простые эвристики для определения типа конфликта
    const analysis = {
      canAutoResolve: false,
      strategy: 'ours',
      reason: ''
    };
    
    // Если одна версия является подмножеством другой, можем объединить
    if (theirs.includes(ours.trim())) {
      analysis.canAutoResolve = true;
      analysis.strategy = 'theirs';
      analysis.reason = 'Наша версия содержится в их версии';
    } else if (ours.includes(theirs.trim())) {
      analysis.canAutoResolve = true;
      analysis.strategy = 'ours';
      analysis.reason = 'Их версия содержится в нашей версии';
    }
    
    return analysis;
  }

  /**
   * Применение стратегии слияния кода
   */
  async applyCodeMergeStrategy(filePath, content, sections, analysis) {
    if (analysis.strategy === 'theirs') {
      return await this.resolveByTakingTheirs(filePath, content);
    } else {
      return await this.resolveByTakingOurs(filePath, content);
    }
  }

  /**
   * Разрешение конфликтов в документах
   */
  async resolveDocumentConflict(filePath, content) {
    // Для документов пытаемся объединить содержимое
    const sections = this.parseConflictSections(content);
    
    // Простое объединение: наша версия + их версия
    const merged = sections.ours.trim() + '\n\n' + sections.theirs.trim();
    
    if (!this.options.dryRun) {
      const finalContent = content.replace(
        /<<<<<<< HEAD.*?>>>>>>> .+$/gms,
        merged
      );
      fs.writeFileSync(filePath, finalContent);
    }
    
    return { success: true, message: 'Документ объединён' };
  }

  /**
   * Разрешение текстовых конфликтов
   */
  async resolveTextConflict(filePath, content) {
    // Для обычных текстовых файлов используем стратегию "их версия"
    return await this.resolveByTakingTheirs(filePath, content);
  }

  /**
   * Интеллектуальное разрешение конфликтов (стратегия по умолчанию)
   */
  async resolveIntelligentConflict(filePath, content) {
    const sections = this.parseConflictSections(content);
    
    // Анализируем содержимое для выбора лучшей стратегии
    const ourLength = sections.ours.length;
    const theirLength = sections.theirs.length;
    
    if (ourLength === 0 && theirLength > 0) {
      // Если наша версия пустая, берём их
      return await this.resolveByTakingTheirs(filePath, content);
    } else if (theirLength === 0 && ourLength > 0) {
      // Если их версия пустая, берём нашу
      return await this.resolveByTakingOurs(filePath, content);
    } else if (theirLength > ourLength * 1.5) {
      // Если их версия значительно больше, скорее всего, она более полная
      return await this.resolveByTakingTheirs(filePath, content);
    } else {
      // По умолчанию берём нашу версию
      return await this.resolveByTakingOurs(filePath, content);
    }
  }

  /**
   * Стратегия "взять нашу версию"
   */
  async resolveByTakingOurs(filePath, content) {
    const resolved = content.replace(/<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> .+$/gms, '$1');
    
    if (!this.options.dryRun) {
      fs.writeFileSync(filePath, resolved);
    }
    
    return { success: true, message: 'Использована наша версия' };
  }

  /**
   * Стратегия "взять их версию"
   */
  async resolveByTakingTheirs(filePath, content) {
    const resolved = content.replace(/<<<<<<< HEAD\n.*?\n=======\n(.*?)\n>>>>>>> .+$/gms, '$1');
    
    if (!this.options.dryRun) {
      fs.writeFileSync(filePath, resolved);
    }
    
    return { success: true, message: 'Использована их версия' };
  }

  /**
   * Парсинг секций конфликта
   */
  parseConflictSections(content) {
    const conflictPattern = /<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> .+$/gms;
    const match = conflictPattern.exec(content);
    
    if (!match) {
      throw new Error('Не найдены маркеры конфликта');
    }
    
    return {
      ours: match[1] || '',
      theirs: match[2] || ''
    };
  }

  /**
   * Глубокое слияние объектов
   */
  deepMerge(obj1, obj2) {
    const result = { ...obj1 };
    
    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
          result[key] = this.deepMerge(result[key] || {}, obj2[key]);
        } else {
          result[key] = obj2[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Проверка наличия маркеров конфликта в файле
   */
  hasConflictMarkers(content) {
    return content.includes('<<<<<<<') && content.includes('=======') && content.includes('>>>>>>>');
  }

  /**
   * Создание резервных копий файлов
   */
  async createBackups(files) {
    if (this.options.dryRun) return;
    
    this.log(`💾 Создание резервных копий ${files.length} файлов...`);
    
    for (const filePath of files) {
      try {
        const backupPath = path.join(this.options.backupDir, `${filePath.replace(/\//g, '_')}.backup`);
        const backupDir = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.copyFileSync(filePath, backupPath);
        this.log(`💾 Создана резервная копия: ${filePath} → ${backupPath}`);
      } catch (error) {
        this.log(`⚠️ Не удалось создать резервную копию для ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Финальная проверка разрешения конфликтов
   */
  async validateResolution() {
    try {
      const remainingConflicts = this.getConflictFiles();
      
      if (remainingConflicts.length === 0) {
        // Дополнительная проверка на наличие маркеров конфликтов в файлах
        const filesWithMarkers = await this.findFilesWithConflictMarkers();
        
        if (filesWithMarkers.length === 0) {
          return { success: true, remainingConflicts: 0 };
        } else {
          this.log(`⚠️ Найдены файлы с маркерами конфликтов: ${filesWithMarkers.join(', ')}`);
          return { success: false, remainingConflicts: filesWithMarkers.length, files: filesWithMarkers };
        }
      } else {
        return { success: false, remainingConflicts: remainingConflicts.length, files: remainingConflicts };
      }
    } catch (error) {
      this.log(`❌ Ошибка при финальной проверке: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Поиск файлов с маркерами конфликтов
   */
  async findFilesWithConflictMarkers() {
    try {
      // Используем git grep для поиска маркеров конфликтов
      const output = execSync('git grep -l "<<<<<<< HEAD" || true', { encoding: 'utf8' });
      return output.trim() ? output.trim().split('\n') : [];
    } catch (error) {
      // Если git grep не работает, проверяем вручную
      return [];
    }
  }

  /**
   * Генерация отчёта о разрешении конфликтов
   */
  async generateReport(results) {
    const endTime = new Date();
    const duration = Math.round((endTime - this.stats.startTime) / 1000);
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      summary: {
        totalConflicts: this.stats.totalConflicts,
        resolvedConflicts: this.stats.resolvedConflicts,
        failedConflicts: this.stats.failedConflicts,
        successRate: `${Math.round((this.stats.resolvedConflicts / this.stats.totalConflicts) * 100)}%`
      },
      strategies: this.stats.strategies,
      files: results,
      gitStatus: this.getGitStatus()
    };
    
    const reportPath = `merge-resolution-report-${Date.now()}.json`;
    
    if (!this.options.dryRun) {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`📊 Отчёт сохранён в файл: ${reportPath}`);
    }
    
    this.log(`\n📊 ОТЧЁТ О РАЗРЕШЕНИИ КОНФЛИКТОВ:`);
    this.log(`⏱️ Время выполнения: ${duration}s`);
    this.log(`📈 Успешность: ${report.summary.successRate} (${this.stats.resolvedConflicts}/${this.stats.totalConflicts})`);
    this.log(`🛠️ Использованные стратегии: ${Object.entries(this.stats.strategies).map(([k, v]) => `${k}(${v})`).join(', ')}`);
  }

  /**
   * Получение текущего статуса git
   */
  getGitStatus() {
    try {
      return execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'Ошибка получения статуса git';
    }
  }

  /**
   * Обеспечение существования необходимых директорий
   */
  ensureDirectories() {
    if (!fs.existsSync(this.options.backupDir)) {
      fs.mkdirSync(this.options.backupDir, { recursive: true });
    }
  }

  /**
   * Логирование с временными метками
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (this.options.verbose) {
      console.log(logMessage);
    }
    
    if (!this.options.dryRun) {
      fs.appendFileSync(this.options.logFile, logMessage + '\n');
    }
  }
}

// CLI интерфейс
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    maxAttempts: parseInt(args.find(arg => arg.startsWith('--max-attempts='))?.split('=')[1]) || 3
  };

  console.log('🔧 Система автоматического разрешения конфликтов слияния');
  console.log('=' .repeat(60));

  const resolver = new MergeConflictResolver(options);
  const result = await resolver.resolveAllConflicts();

  if (result.success) {
    console.log('\n✅ ВСЕ КОНФЛИКТЫ УСПЕШНО РАЗРЕШЕНЫ!');
    console.log(`📝 ${result.message}`);
    process.exit(0);
  } else {
    console.log('\n❌ НЕ ВСЕ КОНФЛИКТЫ УДАЛОСЬ РАЗРЕШИТЬ');
    console.log(`📝 ${result.message}`);
    process.exit(1);
  }
}

// Запуск если скрипт вызван напрямую
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { MergeConflictResolver };