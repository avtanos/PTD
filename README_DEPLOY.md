# Инструкция по публикации на GitHub Pages

## Автоматическая публикация через GitHub Actions

Проект настроен для автоматической публикации на GitHub Pages при каждом push в ветку `main`.

### Настройка GitHub Pages

1. Перейдите в настройки репозитория: `Settings` → `Pages`
2. В разделе `Source` выберите:
   - **Source**: `GitHub Actions`
3. Сохраните изменения

### Настройка переменных окружения (опционально)

Если ваш API находится на другом домене, добавьте секрет:

1. Перейдите в `Settings` → `Secrets and variables` → `Actions`
2. Нажмите `New repository secret`
3. Добавьте:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-api-domain.com/api/v1`

### Ручная публикация

Если нужно опубликовать вручную:

```bash
cd frontend
npm install
npm run build
```

Затем используйте GitHub CLI или загрузите содержимое папки `frontend/build` в ветку `gh-pages`.

## Важные замечания

1. **Роутинг**: Проект использует `HashRouter` для GitHub Pages, что обеспечивает корректную работу SPA роутинга.

2. **API URL**: По умолчанию API запросы идут на `/api/v1`. Для production настройте `REACT_APP_API_URL` в секретах GitHub.

3. **Базовая ссылка**: После публикации сайт будет доступен по адресу:
   ```
   https://avtanos.github.io/PTD/
   ```

4. **Обновление**: После каждого push в `main` GitHub Actions автоматически соберет и опубликует новую версию.

## Локальная проверка сборки

Перед публикацией можно проверить сборку локально:

```bash
cd frontend
npm run build
npm install -g serve
serve -s build
```

Откройте `http://localhost:3000` в браузере для проверки.
