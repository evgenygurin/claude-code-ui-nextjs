const fs = require('fs');
const path = require('path');
const { MergeMonitor } = require('../../scripts/merge-monitor');

// Мокаем внешние зависимости
jest.mock('child_process');
jest.mock('fs');

const { execSync } = require('child_process');

describe('MergeMonitor', () => {
  let monitor;
  
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
    
    // Настраиваем базовые моки
    execSync.mockReturnValue('');
    fs.existsSync.mockReturnValue(false);
    fs.appendFileSync.mockImplementation(() => {});
    
    monitor = new MergeMonitor({
      interval: 100, // Короткий интервал для тестов
      maxRetries: 2
    });
  });

  afterEach(() => {
    if (monitor && monitor.monitoring) {
      monitor.stopMonitoring();
    }
  });

  describe('Инициализация', () => {
    test('должен создаваться с настройками по умолчанию', () => {
      const defaultMonitor = new MergeMonitor();
      
      expect(defaultMonitor.options.interval).toBe(30000);
      expect(defaultMonitor.options.maxRetries).toBe(3);
      expect(defaultMonitor.monitoring).toBe(false);
      expect(defaultMonitor.stats.totalChecks).toBe(0);
    });

    test('должен принимать пользовательские настройки', () => {
      const customMonitor = new MergeMonitor({
        interval: 5000,
        maxRetries: 5,
        enableSlackNotifications: true
      });
      
      expect(customMonitor.options.interval).toBe(5000);
      expect(customMonitor.options.maxRetries).toBe(5);
      expect(customMonitor.options.enableSlackNotifications).toBe(true);
    });
  });

  describe('Обнаружение конфликтов', () => {
    test('должен обнаруживать файлы с конфликтами', () => {
      execSync.mockReturnValue('UU file1.txt\nUU file2.js\n');
      
      const conflictFiles = monitor.getConflictFiles();
      
      expect(conflictFiles).toEqual(['file1.txt', 'file2.js']);
      expect(execSync).toHaveBeenCalledWith('git status --porcelain', { encoding: 'utf8' });
    });

    test('должен возвращать пустой массив при отсутствии конфликтов', () => {
      execSync.mockReturnValue('M modified_file.txt\n');
      
      const conflictFiles = monitor.getConflictFiles();
      
      expect(conflictFiles).toEqual([]);
    });

    test('должен обрабатывать ошибки git команд', () => {
      execSync.mockImplementation(() => {
        throw new Error('git not found');
      });
      
      const conflictFiles = monitor.getConflictFiles();
      
      expect(conflictFiles).toEqual([]);
    });
  });

  describe('Обработка конфликтов', () => {
    test('должен запускать разрешение конфликтов при их обнаружении', async () => {
      const mockResolver = {
        resolveAllConflicts: jest.fn().mockResolvedValue({
          success: true,
          message: 'Конфликты разрешены'
        })
      };

      // Мокаем MergeConflictResolver
      jest.doMock('../../scripts/merge-conflict-resolver', () => ({
        MergeConflictResolver: jest.fn(() => mockResolver)
      }));

      monitor.getConflictFiles = jest.fn().mockReturnValue(['conflict.txt']);
      monitor.notifySuccess = jest.fn();
      monitor.continueGitOperation = jest.fn();

      await monitor.handleConflicts(['conflict.txt']);

      expect(mockResolver.resolveAllConflicts).toHaveBeenCalled();
      expect(monitor.stats.autoResolved).toBe(1);
    });

    test('должен обрабатывать неудачное разрешение конфликтов', async () => {
      const mockResolver = {
        resolveAllConflicts: jest.fn().mockResolvedValue({
          success: false,
          message: 'Не удалось разрешить'
        })
      };

      jest.doMock('../../scripts/merge-conflict-resolver', () => ({
        MergeConflictResolver: jest.fn(() => mockResolver)
      }));

      monitor.getConflictFiles = jest.fn().mockReturnValue(['conflict.txt']);
      monitor.notifyFailure = jest.fn();
      monitor.requestManualIntervention = jest.fn();

      await monitor.handleConflicts(['conflict.txt']);

      expect(monitor.stats.manualInterventionRequired).toBe(1);
      expect(monitor.notifyFailure).toHaveBeenCalled();
      expect(monitor.requestManualIntervention).toHaveBeenCalled();
    });
  });

  describe('Продолжение git операций', () => {
    test('должен продолжить rebase после разрешения конфликтов', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('rebase-apply');
      });

      await monitor.continueGitOperation();

      expect(execSync).toHaveBeenCalledWith('git rebase --continue', { stdio: 'inherit' });
    });

    test('должен завершить merge после разрешения конфликтов', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('MERGE_HEAD');
      });

      await monitor.continueGitOperation();

      expect(execSync).toHaveBeenCalledWith('git commit --no-edit', { stdio: 'inherit' });
    });

    test('должен продолжить cherry-pick после разрешения конфликтов', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('CHERRY_PICK_HEAD');
      });

      await monitor.continueGitOperation();

      expect(execSync).toHaveBeenCalledWith('git cherry-pick --continue', { stdio: 'inherit' });
    });

    test('должен игнорировать ошибки git операций', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('rebase-apply');
      });
      
      execSync.mockImplementation(() => {
        throw new Error('rebase failed');
      });

      // Не должно выбрасывать исключение
      await expect(monitor.continueGitOperation()).resolves.toBeUndefined();
    });
  });

  describe('Система уведомлений', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('должен отправлять Slack уведомления при включенной настройке', async () => {
      monitor.options.enableSlackNotifications = true;
      monitor.options.slackWebhook = 'https://hooks.slack.com/test';
      
      global.fetch.mockResolvedValue({ ok: true });

      await monitor.sendSlackNotification('Test message', 'success');

      expect(fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    test('должен обрабатывать ошибки Slack API', async () => {
      monitor.options.enableSlackNotifications = true;
      monitor.options.slackWebhook = 'https://hooks.slack.com/test';
      
      global.fetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(monitor.sendSlackNotification('Test', 'error')).rejects.toThrow();
    });

    test('должен создавать GitHub issues для критических ошибок', async () => {
      execSync.mockReturnValueOnce('gh version 2.0.0'); // Мокаем проверку gh CLI
      
      await monitor.createGitHubIssue('Critical error message');

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('gh issue create'),
        { stdio: 'inherit' }
      );
    });
  });

  describe('Мониторинг цикл', () => {
    test('должен запускать и останавливать мониторинг', async () => {
      monitor.checkForConflicts = jest.fn();
      monitor.sleep = jest.fn().mockResolvedValue();

      // Запускаем мониторинг в фоне
      const monitoringPromise = monitor.startMonitoring();

      // Ждем несколько итераций
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Останавливаем мониторинг
      monitor.stopMonitoring();
      
      // Ожидаем завершения
      await monitoringPromise;

      expect(monitor.checkForConflicts).toHaveBeenCalled();
      expect(monitor.stats.totalChecks).toBeGreaterThan(0);
    });

    test('должен обрабатывать ошибки в цикле мониторинга', async () => {
      monitor.checkForConflicts = jest.fn().mockRejectedValue(new Error('Test error'));
      monitor.sleep = jest.fn().mockResolvedValue();

      const consoleErrorSpy = jest.spyOn(console, 'log').mockImplementation();

      // Запускаем и сразу останавливаем мониторинг
      const monitoringPromise = monitor.startMonitoring();
      
      // Небольшая задержка для обработки ошибки
      await new Promise(resolve => setTimeout(resolve, 50));
      
      monitor.stopMonitoring();
      await monitoringPromise;

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Генерация отчетов', () => {
    test('должен генерировать отчет о работе мониторинга', () => {
      fs.writeFileSync = jest.fn();
      
      monitor.stats.totalChecks = 10;
      monitor.stats.conflictsDetected = 2;
      monitor.stats.autoResolved = 1;
      monitor.stats.manualInterventionRequired = 1;

      monitor.generateReport();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/merge-monitoring-report-\d+\.json/),
        expect.stringContaining('"totalChecks": 10')
      );
    });

    test('должен вычислять эффективность автоматического разрешения', () => {
      monitor.stats.conflictsDetected = 4;
      monitor.stats.autoResolved = 3;

      fs.writeFileSync = jest.fn();
      monitor.generateReport();

      const reportCall = fs.writeFileSync.mock.calls[0];
      const reportData = JSON.parse(reportCall[1]);
      
      expect(reportData.effectiveness.autoResolutionRate).toBe('75%');
    });
  });

  describe('Утилиты', () => {
    test('должен получать имя репозитория', () => {
      execSync.mockReturnValue('https://github.com/user/repo.git\n');
      
      const repoName = monitor.getRepositoryName();
      
      expect(repoName).toBe('repo');
      expect(execSync).toHaveBeenCalledWith('git remote get-url origin', { encoding: 'utf8' });
    });

    test('должен обрабатывать ошибки получения имени репозитория', () => {
      execSync.mockImplementation(() => {
        throw new Error('No remote');
      });
      
      const repoName = monitor.getRepositoryName();
      
      expect(repoName).toBe('unknown-repository');
    });

    test('функция sleep должна работать корректно', async () => {
      const start = Date.now();
      await monitor.sleep(50);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(45); // Небольшая погрешность
    });
  });

  describe('Логирование', () => {
    test('должен логировать сообщения с временными метками', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      monitor.log('Test message', 'info');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] ℹ️ Test message/)
      );
      
      consoleSpy.mockRestore();
    });

    test('должен использовать правильные префиксы для разных уровней', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      monitor.log('Debug', 'debug');
      monitor.log('Info', 'info');
      monitor.log('Warning', 'warn');
      monitor.log('Error', 'error');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔍 Debug'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️ Info'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️ Warning'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Error'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Интеграционные тесты', () => {
    test('должен корректно обрабатывать полный цикл разрешения конфликтов', async () => {
      // Настраиваем мокающие данные для полного сценария
      monitor.getConflictFiles = jest.fn()
        .mockReturnValueOnce(['conflict1.txt', 'conflict2.json']) // Первая проверка - конфликты есть
        .mockReturnValueOnce([]); // После разрешения - конфликтов нет

      const mockResolver = {
        resolveAllConflicts: jest.fn().mockResolvedValue({
          success: true,
          message: 'Все конфликты разрешены',
          details: [
            { file: 'conflict1.txt', success: true },
            { file: 'conflict2.json', success: true }
          ]
        })
      };

      jest.doMock('../../scripts/merge-conflict-resolver', () => ({
        MergeConflictResolver: jest.fn(() => mockResolver)
      }));

      monitor.sendNotification = jest.fn();
      monitor.continueGitOperation = jest.fn();

      await monitor.checkForConflicts();

      expect(monitor.stats.conflictsDetected).toBe(1);
      expect(monitor.stats.autoResolved).toBe(1);
      expect(monitor.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('успешно разрешены'),
        'success'
      );
    });
  });
});