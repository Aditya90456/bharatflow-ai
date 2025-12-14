@echo off
echo ========================================
echo BharatFlow AI - Dependency Installation
echo ========================================
echo.

echo [1/3] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed!
    echo.
    echo Troubleshooting:
    echo - Check your internet connection
    echo - Try running as administrator
    echo - Delete node_modules and package-lock.json, then retry
    pause
    exit /b 1
)

echo.
echo [2/3] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed!
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo [3/3] Verifying installation...
if not exist "node_modules" (
    echo ERROR: Frontend node_modules not found!
    pause
    exit /b 1
)
if not exist "backend/node_modules" (
    echo ERROR: Backend node_modules not found!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS: All dependencies installed!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure GEMINI_API_KEY is set in .env.local
echo 2. Double-click start-dev.bat to run the application
echo.
echo Manual start commands:
echo   Backend:  npm run start:backend
echo   Frontend: npm run dev
echo.
pause