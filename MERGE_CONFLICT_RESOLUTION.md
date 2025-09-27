# 🔧 Система автоматического разрешения конфликтов слияния

Комплексная система для надёжного и автоматического разрешения конфликтов при слиянии веток в Git-репозитории.

## 🎯 Основные возможности

- **Автоматическое обнаружение** конфликтов слияния
- **Интеллектуальное разрешение** различных типов конфликтов
- **Многоуровневые стратегии** для разных типов файлов
- **Continuous monitoring** состояния репозитория
- **Уведомления** в Slack и GitHub Issues
- **Резервное копирование** файлов перед изменениями
- **Подробная отчётность** и логирование

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Trigger                   │
├─────────────────────────────────────────────────────────────┤
│  • Push events          • PR events      • Manual trigger   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Conflict Detection                        │
├─────────────────────────────────────────────────────────────┤
│  • Git status parsing   • Conflict markers  • Test merges   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Merge Conflict Resolver                     │
├─────────────────────────────────────────────────────────────┤
│  • Strategy selection   • File backup     • Resolution      │
│  • Validation           • Git operations  • Error handling  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Monitoring System                       │
├─────────────────────────────────────────────────────────────┤
│  • Continuous watch     • Notifications   • Health checks   │
│  • Auto-retry           • Escalation      • Reporting       │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Компоненты системы

### 1. MergeConflictResolver
Основной класс для разрешения конфликтов:

```javascript
const resolver = new MergeConflictResolver({
  dryRun: false,
  verbose: true,
  maxAttempts: 3
});

const result = await resolver.resolveAllConflicts();
```

**Поддерживаемые стратегии разрешения:**
- **`packageLock`** - Полная регенерация package-lock.json
- **`packageJson`** - Интеллектуальное слияние зависимостей
- **`jsonMerge`** - Глубокое слияние JSON объектов
- **`yamlMerge`** - Разрешение YAML конфликтов
- **`codeMerge`** - Анализ и слияние кода
- **`documentMerge`** - Объединение документации
- **`intelligentMerge`** - Универсальная стратегия

### 2. MergeMonitor
Система непрерывного мониторинга:

```javascript
const monitor = new MergeMonitor({
  interval: 30000,
  enableSlackNotifications: true,
  slackWebhook: process.env.SLACK_WEBHOOK_URL
});

await monitor.startMonitoring();
```

**Возможности мониторинга:**
- Автоматическое обнаружение конфликтов
- Запуск разрешения при обнаружении
- Уведомления о результатах
- Продолжение Git операций
- Статистика и отчёты

### 3. GitHub Actions Workflow
Интеграция с CI/CD пайплайном:

- **Триггеры:** Push, PR, Manual
- **Этапы:** Detection → Resolution → Monitoring → Notifications
- **Артефакты:** Логи, отчёты, резервные копии
- **Интеграции:** Slack, GitHub Issues, PR комментарии

## 🚀 Быстрый старт

### Установка и настройка

1. **Клонируйте репозиторий** и установите зависимости:
```bash
git clone <repository-url>
cd <repository-name>
npm install
```

2. **Настройте переменные окружения** (опционально):
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

3. **Сделайте скрипты исполняемыми**:
```bash
chmod +x scripts/merge-conflict-resolver.js
chmod +x scripts/merge-monitor.js
```

### Использование

#### Разовое разрешение конфликтов
```bash
# Обычное разрешение
npm run merge:resolve

# Тест-режим с подробным выводом
npm run merge:resolve-dry

# Ручной запуск с параметрами
node scripts/merge-conflict-resolver.js --verbose --max-attempts=5
```

#### Непрерывный мониторинг
```bash
# Стандартный мониторинг
npm run merge:monitor

# Детальное логирование
npm run merge:monitor-verbose

# С настройками
node scripts/merge-monitor.js --interval=10000 --slack --log-level=debug
```

#### Автоматический запуск через GitHub Actions
Система автоматически активируется при:
- Push в защищённые ветки
- Создании/обновлении Pull Request
- Ручном запуске workflow

## 📋 Стратегии разрешения конфликтов

### Package-lock.json
```javascript
// Стратегия: Полная регенерация
await resolvePackageLockConflict(filePath);
// 1. Удаление конфликтующего файла
// 2. Очистка node_modules
// 3. npm install для создания нового lock файла
```

### Package.json
```javascript
// Стратегия: Интеллектуальное слияние
const merged = mergePackageJson(ourVersion, theirVersion);
// 1. Объединение зависимостей (выбор новых версий)
// 2. Слияние скриптов (добавление уникальных)
// 3. Сохранение метаданных
```

### JSON файлы
```javascript
// Стратегия: Глубокое слияние объектов
const merged = deepMerge(ourVersion, theirVersion);
// 1. Рекурсивное слияние вложенных объектов
// 2. Приоритет для их значений при конфликте
// 3. Валидация результата
```

### Код (JS/TS)
```javascript
// Стратегия: Анализ содержимого
const analysis = analyzeCodeConflict(sections);
if (analysis.canAutoResolve) {
  // Автоматическое разрешение на основе эвристик
} else {
  // Fallback к стратегии "наша версия"
}
```

## ⚙️ Конфигурация

### Параметры MergeConflictResolver
```javascript
const options = {
  dryRun: false,           // Тестовый режим без изменений
  verbose: false,          // Подробное логирование
  logFile: 'merge.log',    // Файл логов
  backupDir: '.backups',   // Директория резервных копий
  maxAttempts: 3          // Максимальное количество попыток
};
```

### Параметры MergeMonitor
```javascript
const options = {
  interval: 30000,                    // Интервал проверки (мс)
  maxRetries: 3,                     // Максимальное количество повторов
  enableSlackNotifications: false,   // Уведомления в Slack
  slackWebhook: null,               // URL webhook для Slack
  enableEmailNotifications: false,  // Email уведомления (TODO)
  logLevel: 'info'                  // Уровень логирования
};
```

### GitHub Actions конфигурация
```yaml
# Ручной запуск workflow с параметрами
on:
  workflow_dispatch:
    inputs:
      resolution_strategy:
        type: choice
        options: [auto, aggressive, conservative, manual]
      enable_monitoring:
        type: boolean
        default: true
      notification_level:
        type: choice
        options: [silent, normal, verbose]
```

## 🧪 Тестирование

### Запуск тестов
```bash
# Все тесты системы разрешения конфликтов
npm run merge:test

# Конкретный тест файл
npm test tests/merge-conflicts/merge-conflict-resolver.test.js

# С покрытием кода
npm run test:coverage tests/merge-conflicts/
```

### Тестовые сценарии
- **Базовая функциональность** - Создание, инициализация, настройки
- **Обнаружение конфликтов** - Парсинг git status, поиск маркеров
- **Стратегии разрешения** - Каждая стратегия отдельно
- **Интеграционные тесты** - Полный цикл разрешения
- **Обработка ошибок** - Некорректные входные данные
- **Мониторинг** - Циклы, уведомления, отчёты

### Создание тестовых конфликтов
```bash
# Создание тестового репозитория с конфликтами
git init test-repo
cd test-repo

# Создание базового файла
echo "line 1" > test.txt
git add test.txt && git commit -m "initial"

# Создание ветки с изменениями
git checkout -b feature
echo "line 1 - feature change" > test.txt
git commit -am "feature change"

# Возвращение к main и создание конфликтующих изменений
git checkout main
echo "line 1 - main change" > test.txt
git commit -am "main change"

# Попытка слияния создаст конфликт
git merge feature
```

## 📊 Мониторинг и отчётность

### Структура отчётов
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "duration": "45s",
  "summary": {
    "totalConflicts": 3,
    "resolvedConflicts": 2,
    "failedConflicts": 1,
    "successRate": "67%"
  },
  "strategies": {
    "packageLock": 1,
    "jsonMerge": 1,
    "codeMerge": 1
  },
  "files": [
    {
      "file": "package-lock.json",
      "success": true,
      "strategy": "packageLock",
      "message": "package-lock.json регенерирован"
    }
  ]
}
```

### Логирование
Система создаёт подробные логи всех операций:

```
[2024-01-15T10:30:00.000Z] 🚀 Инициализация системы разрешения конфликтов...
[2024-01-15T10:30:01.000Z] 🔍 Поиск конфликтов слияния...
[2024-01-15T10:30:02.000Z] ⚠️ Обнаружено конфликтов: 2
[2024-01-15T10:30:03.000Z] 🛠️ Разрешение конфликта в файле: package-lock.json
[2024-01-15T10:30:05.000Z] ✅ Конфликт в package-lock.json разрешён (packageLock)
```

### Метрики производительности
- **Время разрешения** по типам файлов
- **Процент успешности** для каждой стратегии
- **Частота конфликтов** по файлам/директориям
- **Эффективность** автоматического разрешения

## 🔔 Система уведомлений

### Slack интеграция
```javascript
// Настройка Slack webhook
const monitor = new MergeMonitor({
  enableSlackNotifications: true,
  slackWebhook: process.env.SLACK_WEBHOOK_URL
});

// Типы уведомлений:
// ✅ Успешное разрешение
// ⚠️ Частичное разрешение  
// ❌ Критическая ошибка
```

### GitHub Issues
Автоматическое создание issues для:
- **Критических ошибок** системы разрешения
- **Конфликтов, требующих ручного вмешательства**
- **Повторяющихся проблем** в определённых файлах

### PR комментарии
Автоматические комментарии в Pull Request:
```markdown
## 🔧 Результаты обработки конфликтов слияния

✅ **Конфликты успешно разрешены автоматически!**

- 📊 Обработано файлов: 3
- 🛠️ Стратегии: packageLock(1), jsonMerge(2) 
- 🤖 Изменения применены автоматически

Вы можете продолжить review этого PR.
```

## 🚨 Устранение неполадок

### Частые проблемы

#### 1. Конфликты не обнаруживаются
```bash
# Проверка git статуса
git status --porcelain

# Поиск маркеров конфликтов
git grep -l "<<<<<<< HEAD"

# Ручной запуск детекции
node scripts/merge-conflict-resolver.js --verbose
```

#### 2. Не удаётся разрешить package-lock.json
```bash
# Очистка кеша npm
npm cache clean --force

# Удаление node_modules и package-lock.json
rm -rf node_modules package-lock.json

# Чистая установка
npm install
```

#### 3. Ошибки в JSON файлах
```bash
# Проверка синтаксиса JSON
jq . package.json

# Исправление формата
cat package.json | jq . > package.json.tmp
mv package.json.tmp package.json
```

#### 4. Проблемы с Git операциями
```bash
# Проверка состояния Git
git status
git log --oneline -5

# Сброс к известному состоянию
git reset --hard HEAD~1

# Ручное завершение операций
git rebase --continue
git merge --continue
```

### Отладка

#### Включение подробного логирования
```bash
# Детальные логи разрешения
node scripts/merge-conflict-resolver.js --verbose

# Отладка мониторинга  
node scripts/merge-monitor.js --log-level=debug

# Dry-run для тестирования без изменений
node scripts/merge-conflict-resolver.js --dry-run --verbose
```

#### Проверка артефактов
```bash
# Резервные копии
ls -la .merge-backups/

# Отчёты
ls -la merge-resolution-report-*.json

# Логи
tail -f merge-resolution.log
```

## 🔧 Расширение системы

### Добавление новой стратегии разрешения

```javascript
// 1. Добавить стратегию в конструктор
this.conflictStrategies.set('.xml', 'xmlMerge');

// 2. Реализовать метод стратегии
async resolveXmlConflict(filePath, content) {
  // Логика разрешения XML конфликтов
  const sections = this.parseConflictSections(content);
  // ... custom resolution logic
  return { success: true, message: 'XML conflict resolved' };
}

// 3. Добавить вызов в applyStrategy
case 'xmlMerge':
  return await this.resolveXmlConflict(filePath, content);
```

### Добавление нового типа уведомлений

```javascript
// Расширение MergeMonitor
async sendCustomNotification(message, level) {
  // Реализация кастомного канала уведомлений
  // Например: Telegram, Discord, Email и т.д.
}

// Интеграция в sendNotification
async sendNotification(message, level) {
  const notifications = [
    this.sendSlackNotification(message, level),
    this.sendCustomNotification(message, level)
  ];
  
  await Promise.allSettled(notifications);
}
```

## 📚 API Reference

### MergeConflictResolver

#### Конструктор
```javascript
new MergeConflictResolver(options)
```

#### Основные методы
- `resolveAllConflicts()` - Разрешение всех конфликтов
- `resolveFileConflict(filePath)` - Разрешение конфликта в файле
- `determineStrategy(filePath)` - Определение стратегии
- `validateResolution()` - Проверка результата
- `createBackups(files)` - Создание резервных копий

#### Стратегии разрешения
- `resolvePackageLockConflict(filePath)`
- `resolvePackageJsonConflict(filePath, content)`  
- `resolveJsonConflict(filePath, content)`
- `resolveYamlConflict(filePath, content)`
- `resolveCodeConflict(filePath, content)`

### MergeMonitor

#### Конструктор
```javascript
new MergeMonitor(options)
```

#### Основные методы
- `startMonitoring()` - Запуск мониторинга
- `stopMonitoring()` - Остановка мониторинга
- `checkForConflicts()` - Проверка конфликтов
- `handleConflicts(files)` - Обработка конфликтов
- `sendNotification(message, level)` - Отправка уведомлений

## 🤝 Вклад в развитие

### Как внести свой вклад

1. **Fork** репозитория
2. **Создайте feature branch** (`git checkout -b feature/amazing-feature`)
3. **Коммитьте изменения** (`git commit -m 'Add amazing feature'`)
4. **Push в branch** (`git push origin feature/amazing-feature`)
5. **Откройте Pull Request**

### Guidelines

- **Тесты обязательны** для новой функциональности
- **Документация** должна быть обновлена
- **Соблюдайте code style** проекта
- **Добавляйте логирование** для новых операций

### Roadmap

- [ ] **Email уведомления** через SMTP
- [ ] **Telegram бот** интеграция  
- [ ] **Machine Learning** для улучшения стратегий
- [ ] **Web UI** для мониторинга
- [ ] **Metrics** экспорт в Prometheus
- [ ] **Webhooks** для внешних интеграций

---

## 📄 Лицензия

MIT License - смотрите файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

- **GitHub Issues**: [Создать issue](../../issues)
- **Documentation**: [Wiki](../../wiki)
- **Email**: support@example.com

---

*🤖 Система автоматического разрешения конфликтов слияния для надёжной и бесшовной разработки*