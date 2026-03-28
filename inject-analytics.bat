@echo off
:: ═══════════════════════════════════════════════════
::  inject-analytics.bat
::  Bodhanika — Analytics ID Injector
::  Double-click this file to patch index.html
::  with your real GA4 and Clarity IDs.
:: ═══════════════════════════════════════════════════

title Bodhanika — Analytics Injector
color 0A

echo.
echo  ██████╗  ██████╗ ██████╗ ██╗  ██╗ █████╗ ███╗   ██╗██╗██╗  ██╗ █████╗
echo  ██╔══██╗██╔═══██╗██╔══██╗██║  ██║██╔══██╗████╗  ██║██║██║ ██╔╝██╔══██╗
echo  ██████╔╝██║   ██║██║  ██║███████║███████║██╔██╗ ██║██║█████╔╝ ███████║
echo  ██╔══██╗██║   ██║██║  ██║██╔══██║██╔══██║██║╚██╗██║██║██╔═██╗ ██╔══██║
echo  ██████╔╝╚██████╔╝██████╔╝██║  ██║██║  ██║██║ ╚████║██║██║  ██╗██║  ██║
echo  ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
echo.
echo  Analytics ID Injector
echo  -------------------------------------------------------
echo.

:: ── Check Node.js is installed ──
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo  Please install Node.js from: https://nodejs.org
    echo  Then run this script again.
    echo.
    pause
    exit /b 1
)

:: ── Check analytics.config exists ──
if not exist "analytics.config" (
    echo  [ERROR] analytics.config not found in this folder.
    echo.
    echo  Make sure analytics.config is in the same folder as this bat file.
    echo  It should contain:
    echo    GA4_ID=G-XXXXXXXXXX
    echo    CLARITY_ID=your_clarity_id
    echo.
    pause
    exit /b 1
)

:: ── Check index.html exists ──
if not exist "index.html" (
    echo  [ERROR] index.html not found in this folder.
    echo.
    echo  Download the latest index.html from Claude and place it here first.
    echo.
    pause
    exit /b 1
)

:: ── Check inject script exists ──
if not exist "scripts\inject-analytics.js" (
    echo  [ERROR] scripts\inject-analytics.js not found.
    echo.
    echo  Make sure the scripts\ folder is present.
    echo.
    pause
    exit /b 1
)

:: ── Run the injection ──
echo  Found all required files. Running injection...
echo.

node scripts\inject-analytics.js

:: ── Check if script succeeded ──
if errorlevel 1 (
    echo.
    echo  [ERROR] Injection failed. Check the error above.
    echo.
    pause
    exit /b 1
)

echo.
echo  -------------------------------------------------------
echo  Next steps:
echo    1. Upload index.html to your GitHub repo
echo    2. GitHub Pages will auto-deploy in ~1 minute
echo    3. Visit bodhanika.in to verify
echo  -------------------------------------------------------
echo.

:: ── Ask if user wants to open GitHub ──
set /p OPEN="  Open GitHub repo in browser? (y/n): "
if /i "%OPEN%"=="y" (
    start https://github.com/josephvalexander/bodhanika
)

echo.
echo  Done! Press any key to close.
pause >nul
