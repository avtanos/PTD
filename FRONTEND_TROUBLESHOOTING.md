# Решение проблемы запуска Frontend (spawn EPERM)

## Проблема
Ошибка `spawn EPERM` при запуске `npm start` - это проблема прав доступа в Windows.

## Решения

### 1. Запуск через batch-файл
Используйте созданный файл `frontend/start-frontend.bat`:
- Двойной клик на `start-frontend.bat`
- Или запустите из командной строки: `cd D:\PTD\frontend && start-frontend.bat`

### 2. Запуск из командной строки с правами администратора
1. Откройте PowerShell или CMD **от имени администратора**
2. Выполните:
```powershell
cd D:\PTD\frontend
$env:SKIP_PREFLIGHT_CHECK="true"
$env:ESLINT_NO_DEV_ERRORS="true"
npm start
```

### 3. Проверка антивируса
- Временно отключите антивирус или добавьте папку `D:\PTD\frontend` в исключения
- Особенно проверьте защиту в реальном времени

### 4. Переустановка node_modules
```powershell
cd D:\PTD\frontend
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

### 5. Использование альтернативного порта
Если порт 3000 занят, попробуйте другой:
```powershell
cd D:\PTD\frontend
$env:PORT=3001
npm start
```

### 6. Проверка блокировки файлов
Убедитесь, что файлы не открыты в других программах:
- Закройте все редакторы кода (VS Code, Cursor)
- Закройте все процессы Node.js: `taskkill /F /IM node.exe`
- Попробуйте запустить снова

### 7. Использование WSL (если доступно)
Если у вас установлен WSL, можно запустить там:
```bash
cd /mnt/d/PTD/frontend
npm start
```

## Альтернатива: Использование только Backend

Если frontend не запускается, вы можете:
1. Использовать Backend API напрямую через документацию: http://127.0.0.1:8000/docs
2. Или собрать production build:
```powershell
cd D:\PTD\frontend
npm run build
# Затем разверните папку build на любом веб-сервере
```

## Текущий статус

✅ **Backend работает**: http://127.0.0.1:8000
- API документация: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

❌ **Frontend**: Требует решения проблемы с правами доступа
