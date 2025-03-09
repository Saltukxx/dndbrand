@echo off
echo DnD Brand E-commerce Website
echo ============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Creating logs directory...
if not exist logs mkdir logs

echo Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo Setting up database...
node server/scripts/setup-db.js
if %ERRORLEVEL% neq 0 (
    echo Error: Database setup failed.
    pause
    exit /b 1
)

echo.
echo Starting DnD Brand server...
echo.
echo Server will be available at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm start