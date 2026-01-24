# Настройка API URL для GitHub Pages

## Проблема

Фронтенд на GitHub Pages пытается обращаться к `api.example.com`, который не существует, что вызывает ошибки:
- `NS_ERROR_UNKNOWN_HOST` - домен не найден
- `CORS Failed` - проблемы с CORS (если домен существует, но CORS не настроен)

## Решение

### Шаг 1: Удалить блокировку Git (если есть)

Если при коммите возникает ошибка `Unable to create '.git/index.lock'`:

```bash
# Windows
del D:\PTD\.git\index.lock

# Или через PowerShell
Remove-Item D:\PTD\.git\index.lock -Force
```

### Шаг 2: Закоммитить исправления

```bash
cd D:\PTD
git add .github/workflows/deploy.yml README_DEPLOY.md backend/app/core/config.py frontend/src/utils/api.ts
git commit -m "Fix API URL configuration - remove api.example.com placeholder"
git push origin main
```

### Шаг 3: Настроить реальный API URL

После пуша GitHub Actions автоматически пересоберет фронтенд. Но для работы API нужно настроить секрет:

1. Перейдите: https://github.com/avtanos/PTD/settings/secrets/actions
2. Нажмите `New repository secret`
3. Добавьте:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-actual-api-domain.com/api/v1`

### Варианты развертывания бэкенда

#### Вариант A: Локальный бэкенд с туннелем (для тестирования)

1. Запустите бэкенд локально:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Создайте туннель (например, через ngrok):
   ```bash
   ngrok http 8000
   # Скопируйте URL (например: https://abc123.ngrok.io)
   ```

3. Добавьте этот URL как секрет `REACT_APP_API_URL`:
   - Значение: `https://abc123.ngrok.io/api/v1`

#### Вариант B: Развертывание на хостинге

Разверните бэкенд на одном из сервисов:
- **Render**: https://render.com
- **Railway**: https://railway.app
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

После развертывания добавьте URL как секрет `REACT_APP_API_URL`.

#### Вариант C: Использование прокси GitHub Pages

Можно настроить прокси через `_redirects` или использовать GitHub Actions для проксирования запросов.

### Шаг 4: Настроить CORS на бэкенде

Убедитесь, что в `backend/app/core/config.py` или в переменных окружения бэкенда добавлен:

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://avtanos.github.io",  # GitHub Pages
]
```

Или через переменную окружения при запуске:
```bash
CORS_ORIGINS="http://localhost:3000,https://avtanos.github.io" uvicorn app.main:app --reload
```

### Шаг 5: Проверка

После настройки:

1. Дождитесь завершения GitHub Actions workflow (обычно 2-3 минуты)
2. Откройте https://avtanos.github.io/PTD/
3. Откройте консоль браузера (F12)
4. Проверьте:
   - Нет предупреждения `⚠️ REACT_APP_API_URL не настроен!`
   - API запросы идут на правильный домен
   - Нет ошибок CORS

## Текущее состояние

✅ **Исправлено:**
- Удален `api.example.com` из дефолта в GitHub Actions
- Добавлена обработка отсутствующего API URL с предупреждениями
- Добавлен `https://avtanos.github.io` в CORS бэкенда
- Обновлена документация

⏳ **Требуется:**
- Закоммитить и запушить изменения
- Настроить секрет `REACT_APP_API_URL` в GitHub
- Развернуть бэкенд на доступном домене

## Тестирование локально

Для локального тестирования без GitHub Pages:

1. Запустите бэкенд:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Запустите фронтенд:
   ```bash
   cd frontend
   npm start
   ```

Фронтенд автоматически будет использовать `/api/v1` (относительный путь) для локальной разработки.
