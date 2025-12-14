@echo off
echo ========================================
echo BharatFlow AI - Development Environment
echo ========================================
echo.

echo Checking environment...
if not exist ".env.local" (
    echo WARNING: .env.local file not found!
    echo Please create .env.local with your GEMINI_API_KEY
    echo.
    pause
)

if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run install-deps.bat first
    pause
    exit /b 1
)

if not exist "backend/node_modules" (
    echo ERROR: Backend dependencies not installed!
    echo Please run install-deps.bat first
    pause
    exit /b 1
)

echo [1/2] Starting backend server...
start "BharatFlow Backend" cmd /k "cd /d %~dp0backend && echo Starting BharatFlow Backend Server... && npm start"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo [2/2] Starting frontend development server...
start "BharatFlow Frontend" cmd /k "cd /d %~dp0 && echo Starting BharatFlow Frontend... && npm run dev"

echo.
echo ========================================
echo Development servers are starting...
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Frontend:    http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul