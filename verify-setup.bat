@echo off
echo ========================================
echo BharatFlow AI - Setup Verification
echo ========================================
echo.

echo Checking project structure...
if not exist "package.json" (
    echo ERROR: package.json not found!
    goto :error
)
if not exist "backend/package.json" (
    echo ERROR: backend/package.json not found!
    goto :error
)
if not exist "App.tsx" (
    echo ERROR: App.tsx not found!
    goto :error
)
if not exist "index.tsx" (
    echo ERROR: index.tsx not found!
    goto :error
)
if not exist "tailwind.config.js" (
    echo ERROR: tailwind.config.js not found!
    goto :error
)
if not exist "vite.config.ts" (
    echo ERROR: vite.config.ts not found!
    goto :error
)
if not exist "src/index.css" (
    echo ERROR: src/index.css not found!
    goto :error
)
echo ✓ All core files present

echo.
echo Checking environment...
if not exist ".env.local" (
    echo WARNING: .env.local not found - you'll need this for Gemini AI
) else (
    echo ✓ .env.local exists
)

echo.
echo Checking dependencies...
if not exist "node_modules" (
    echo WARNING: Frontend dependencies not installed
    echo Run install-deps.bat to install them
) else (
    echo ✓ Frontend dependencies installed
)

if not exist "backend/node_modules" (
    echo WARNING: Backend dependencies not installed
    echo Run install-deps.bat to install them
) else (
    echo ✓ Backend dependencies installed
)

echo.
echo ========================================
echo Setup verification complete!
echo ========================================
echo.
echo If all checks passed, you can run start-dev.bat
echo.
goto :end

:error
echo.
echo ERROR: Setup verification failed!
echo Please check the project files and try again.
echo.

:end
pause