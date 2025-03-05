@echo off
echo Starting DnD Brand Production Server with HTTPS...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if required packages are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dependencies.
        exit /b 1
    )
)

REM Check if SSL certificates exist
if not exist "%SSL_KEY_PATH%" (
    echo Warning: SSL key file not found at %SSL_KEY_PATH%
    echo The server will run in HTTP-only mode, which is not recommended for production.
    echo Please configure SSL certificates for secure HTTPS connections.
    echo.
)

REM Set production environment
set NODE_ENV=production

REM Start the server
echo Starting production server...
node production-server.js

REM Check if server started successfully
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to start the server.
    exit /b 1
)

pause 