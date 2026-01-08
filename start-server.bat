@echo off
setlocal

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ===================================================
echo      Starting Tally Stock App (SBE)
echo ===================================================

echo.
echo [1/3] Checking for updates...
call git pull
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Git pull failed or not a git repository. Continuing...
)

echo.
echo [2/3] Checking Backend...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

echo Starting Backend Server...
start "SBE Backend (Port 3000)" cmd /k "cd /d "%SCRIPT_DIR%backend" && npm start"

echo.
echo [3/3] Checking Frontend...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo Starting Frontend Dev Server...
start "SBE Frontend" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

echo.
echo ===================================================
echo      App started!
echo      Backend: http://localhost:3000
echo      Frontend: Check the Vite terminal
echo ===================================================
echo.
