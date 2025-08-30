@echo off
echo Starting Tally Stock Frontend and Backend...

REM Get the folder where this batch file is located
set SCRIPT_DIR=%~dp0

REM Start Frontend
start "Frontend" cmd /k "cd /d %SCRIPT_DIR%frontend && npm run dev"

REM Start Backend
start "Backend" cmd /k "cd /d %SCRIPT_DIR%backend && npm start"

echo Both processes started in separate terminals.
