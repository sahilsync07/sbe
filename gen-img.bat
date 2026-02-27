@echo off
echo ============================================
echo   SBE Catalog Image Generator
echo ============================================
echo.
cd /d "%~dp0frontend"
node gen-img.cjs
echo.
pause
