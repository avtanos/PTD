@echo off
echo Запуск frontend сервера...
cd /d %~dp0
set SKIP_PREFLIGHT_CHECK=true
set ESLINT_NO_DEV_ERRORS=true
set CHOKIDAR_USEPOLLING=true
npm start
pause
