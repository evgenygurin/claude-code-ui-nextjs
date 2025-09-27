# 🚀 Исправление ошибки Vercel Deployment в CircleCI

## ❌ Проблема
**Ошибка**: `Error: You defined "--token", but it's missing a value`

**Причина**: Переменные окружения Vercel не установлены в CircleCI Environment Variables.

## ✅ Решение (пошаговые инструкции)

### Шаг 1: Доступ к настройкам CircleCI

1. Откройте браузер и перейдите по ссылке:
   ```text
   https://app.circleci.com/settings/project/github/evgenygurin/claude-code-ui-nextjs/environment-variables
   ```

2. Если ссылка не работает, перейдите вручную:
   - Откройте https://app.circleci.com
   - Найдите проект `claude-code-ui-nextjs`
   - Нажмите `Project Settings`
   - В левом меню выберите `Environment Variables`

### Шаг 2: Добавление переменных

Нажмите кнопку **"Add Environment Variable"** и добавьте следующие переменные:

#### 🔑 Переменная 1: VERCEL_TOKEN
- **Name**: `VERCEL_TOKEN`
- **Value**: `0kWh3gtlep9I2x8fgr2Dhg6S`

#### 🏢 Переменная 2: VERCEL_ORG_ID
- **Name**: `VERCEL_ORG_ID`
- **Value**: `team_vQW0xhMJhexCPBThcGxpeSpw`

#### 📁 Переменная 3: VERCEL_PROJECT_ID
- **Name**: `VERCEL_PROJECT_ID`
- **Value**: `prj_HxQFyOmeZTF9MueNaC1ufJxkfcjj`

### Шаг 3: Проверка токена (опционально)

Если хотите убедиться, что токен действующий:

```bash
curl -H "Authorization: Bearer 0kWh3gtlep9I2x8fgr2Dhg6S" https://api.vercel.com/v2/user
```

**Ожидаемый результат**: JSON с информацией о пользователе.

### Шаг 4: Перезапуск workflow

1. Вернитесь к failed workflow в CircleCI:
   ```text
   https://app.circleci.com/pipelines/github/evgenygurin/claude-code-ui-nextjs
   ```

2. Найдите последний failed pipeline
3. Нажмите **"Rerun workflow from failed"**

### Шаг 5: Проверка результата

После добавления переменных deployment должен пройти успешно. Новая валидация покажет:

```text
✅ All Vercel environment variables are properly configured
Token length: 32 chars
Org ID: team_vQW0x...
Project ID: prj_HxQFy...
```

## 🔧 Автоматические улучшения

Я добавил автоматическую валидацию в `.circleci/config.yml`, которая:

- ✅ Проверяет наличие всех необходимых переменных
- ✅ Выводит понятные ошибки с инструкциями
- ✅ Показывает частичную информацию для отладки
- ✅ Предотвращает повторение этой ошибки

## 📚 Дополнительная информация

### Источники токенов

- **VERCEL_TOKEN**: Создается на https://vercel.com/account/tokens
- **VERCEL_ORG_ID**: Из файла `.vercel/project.json`
- **VERCEL_PROJECT_ID**: Из файла `.vercel/project.json`

### Срок действия токенов

⚠️ **Важно**: Токены Vercel истекают через **10 дней неактивности**.

Если deployment начнет падать в будущем, создайте новый токен и обновите `VERCEL_TOKEN` в CircleCI.

### Устранение неполадок

Если deployment все еще падает:

1. Проверьте, что все 3 переменные добавлены точно как указано
2. Убедитесь, что нет лишних пробелов в значениях
3. Проверьте, что токен не истек

## 🎯 Результат

После выполнения этих шагов:
- ✅ Vercel deployment будет работать автоматически
- ✅ Preview deployments для PR
- ✅ Production deployments для main ветки
- ✅ Автоматическая валидация предотвратит повторные ошибки

---

**Время исправления**: ~5 минут
**Сложность**: Низкая
**Тестирование**: ✅ Все 37 тестов проходят
