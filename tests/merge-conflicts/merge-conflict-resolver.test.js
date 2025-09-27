const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { MergeConflictResolver } = require('../../scripts/merge-conflict-resolver');

describe('MergeConflictResolver', () => {
  let testDir;
  let originalCwd;

  beforeAll(() => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'temp-test-repo');
    
    // Создаем временную директорию для тестов
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Инициализируем git репозиторий
    execSync('git init');
    execSync('git config user.name "Test User"');
    execSync('git config user.email "test@example.com"');
  });

  afterAll(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Очищаем директорию перед каждым тестом
    const files = fs.readdirSync('.').filter(f => f !== '.git');
    files.forEach(file => {
      fs.rmSync(file, { recursive: true, force: true });
    });
  });

  describe('Базовая функциональность', () => {
    test('должен создаваться с настройками по умолчанию', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      expect(resolver.options.dryRun).toBe(true);
      expect(resolver.options.maxAttempts).toBe(3);
      expect(resolver.stats.totalConflicts).toBe(0);
    });

    test('должен определять отсутствие конфликтов', async () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      const result = await resolver.resolveAllConflicts();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Нет конфликтов');
    });

    test('должен правильно обнаруживать маркеры конфликтов', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      const contentWithConflict = `
some code
<<<<<<< HEAD
our version
=======
their version
>>>>>>> branch-name
more code
      `;
      
      expect(resolver.hasConflictMarkers(contentWithConflict)).toBe(true);
      
      const contentWithoutConflict = `
some code
our version
more code
      `;
      
      expect(resolver.hasConflictMarkers(contentWithoutConflict)).toBe(false);
    });
  });

  describe('Стратегии разрешения', () => {
    test('должен правильно определять стратегию для package-lock.json', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      expect(resolver.determineStrategy('package-lock.json')).toBe('packageLock');
      expect(resolver.determineStrategy('package.json')).toBe('packageJson');
      expect(resolver.determineStrategy('config.yml')).toBe('yamlMerge');
      expect(resolver.determineStrategy('test.js')).toBe('codeMerge');
    });

    test('должен парсить секции конфликта', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      const conflictContent = `
before conflict
<<<<<<< HEAD
our changes
=======
their changes  
>>>>>>> feature-branch
after conflict
      `;
      
      const sections = resolver.parseConflictSections(conflictContent);
      
      expect(sections.ours.trim()).toBe('our changes');
      expect(sections.theirs.trim()).toBe('their changes');
    });
  });

  describe('Разрешение JSON конфликтов', () => {
    test('должен объединять package.json файлы', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      const ourPackage = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          lodash: '^4.17.0'
        },
        scripts: {
          build: 'webpack build',
          test: 'jest'
        }
      };
      
      const theirPackage = {
        name: 'test-package',
        version: '1.0.1',
        dependencies: {
          react: '^18.2.0',
          axios: '^1.0.0'
        },
        scripts: {
          start: 'react-scripts start',
          test: 'jest --coverage'
        }
      };
      
      const merged = resolver.mergePackageJson(ourPackage, theirPackage);
      
      expect(merged.version).toBe('1.0.0'); // наша версия основная
      expect(merged.dependencies.react).toBe('^18.2.0'); // более новая версия
      expect(merged.dependencies.lodash).toBe('^4.17.0'); // наша зависимость
      expect(merged.dependencies.axios).toBe('^1.0.0'); // их зависимость
      expect(merged.scripts.build).toBe('webpack build'); // наш скрипт
      expect(merged.scripts.start).toBe('react-scripts start'); // их скрипт
    });

    test('должен глубоко объединять объекты', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      const obj1 = {
        a: 1,
        b: {
          x: 10,
          y: 20
        }
      };
      
      const obj2 = {
        b: {
          y: 30,
          z: 40
        },
        c: 3
      };
      
      const merged = resolver.deepMerge(obj1, obj2);
      
      expect(merged).toEqual({
        a: 1,
        b: {
          x: 10,
          y: 30,
          z: 40
        },
        c: 3
      });
    });
  });

  describe('Интеграционные тесты', () => {
    test('должен разрешать простые текстовые конфликты', async () => {
      const conflictContent = `
line 1
<<<<<<< HEAD
our line
=======
their line
>>>>>>> branch
line 2
      `;
      
      fs.writeFileSync('test.txt', conflictContent);
      
      // Имитируем git status с конфликтом
      execSync('git add test.txt');
      execSync('git commit -m "initial commit"');
      
      const resolver = new MergeConflictResolver({ 
        dryRun: false,
        verbose: false
      });
      
      // Создаем мок для getConflictFiles
      resolver.getConflictFiles = () => ['test.txt'];
      
      const result = await resolver.resolveFileConflict('test.txt');
      
      expect(result.success).toBe(true);
      
      const resolvedContent = fs.readFileSync('test.txt', 'utf8');
      expect(resolver.hasConflictMarkers(resolvedContent)).toBe(false);
    });

    test('должен создавать резервные копии файлов', async () => {
      const testContent = 'test content with conflicts';
      fs.writeFileSync('backup-test.txt', testContent);
      
      const resolver = new MergeConflictResolver({ 
        dryRun: false,
        backupDir: '.test-backups'
      });
      
      await resolver.createBackups(['backup-test.txt']);
      
      const backupPath = path.join('.test-backups', 'backup-test.txt.backup');
      expect(fs.existsSync(backupPath)).toBe(true);
      
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      expect(backupContent).toBe(testContent);
    });
  });

  describe('Обработка ошибок', () => {
    test('должен корректно обрабатывать несуществующие файлы', async () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      const result = await resolver.resolveFileConflict('non-existent-file.txt');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Файл не найден');
    });

    test('должен обрабатывать невалидный JSON', async () => {
      const invalidJson = `
{
  "name": "test",
<<<<<<< HEAD
  "version": "1.0.0"
=======
  "version": "2.0.0",
>>>>>>> branch
}
      `;
      
      fs.writeFileSync('invalid.json', invalidJson);
      
      const resolver = new MergeConflictResolver({ dryRun: false });
      
      const result = await resolver.resolveJsonConflict('invalid.json', invalidJson);
      
      // Должен fallback к стратегии "наша версия"
      expect(result.success).toBe(true);
      expect(result.message).toContain('наша версия');
    });
  });

  describe('Анализ кода', () => {
    test('должен анализировать конфликты в коде', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      const sections = {
        ours: 'function test() { return "ours"; }',
        theirs: 'function test() { return "ours"; } // added comment'
      };
      
      const analysis = resolver.analyzeCodeConflict(sections);
      
      expect(analysis.canAutoResolve).toBe(true);
      expect(analysis.strategy).toBe('theirs'); // их версия содержит нашу
    });

    test('должен определять сложные конфликты кода', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      const sections = {
        ours: 'function test() { return "completely different"; }',
        theirs: 'function different() { return "also different"; }'
      };
      
      const analysis = resolver.analyzeCodeConflict(sections);
      
      expect(analysis.canAutoResolve).toBe(false);
    });
  });

  describe('Генерация отчетов', () => {
    test('должен генерировать статистику', async () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      resolver.stats.totalConflicts = 5;
      resolver.stats.resolvedConflicts = 4;
      resolver.stats.failedConflicts = 1;
      resolver.stats.strategies = {
        packageLock: 1,
        jsonMerge: 2,
        codeMerge: 2
      };
      
      await resolver.generateReport([]);
      
      // В dry-run режиме отчет не должен создаваться как файл
      const reportFiles = fs.readdirSync('.').filter(f => f.startsWith('merge-resolution-report'));
      expect(reportFiles.length).toBe(0);
    });
  });

  describe('Валидация разрешения', () => {
    test('должен корректно валидировать успешное разрешение', async () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      // Мокаем методы для успешной валидации
      resolver.getConflictFiles = () => [];
      resolver.findFilesWithConflictMarkers = () => Promise.resolve([]);
      
      const result = await resolver.validateResolution();
      
      expect(result.success).toBe(true);
      expect(result.remainingConflicts).toBe(0);
    });

    test('должен обнаруживать оставшиеся конфликты', async () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      // Мокаем методы для неуспешной валидации
      resolver.getConflictFiles = () => ['still-conflicted.txt'];
      
      const result = await resolver.validateResolution();
      
      expect(result.success).toBe(false);
      expect(result.remainingConflicts).toBe(1);
    });
  });

  describe('Сравнение версий', () => {
    test('должен корректно сравнивать версии', () => {
      const resolver = new MergeConflictResolver({ dryRun: true });
      
      expect(resolver.isNewerVersion('1.2.0', '1.1.0')).toBe(true);
      expect(resolver.isNewerVersion('2.0.0', '1.9.9')).toBe(true);
      expect(resolver.isNewerVersion('1.0.0', '1.0.1')).toBe(false);
      expect(resolver.isNewerVersion('^1.2.0', '^1.1.0')).toBe(true);
      expect(resolver.isNewerVersion('~2.0.0', '~1.9.9')).toBe(true);
    });
  });
});