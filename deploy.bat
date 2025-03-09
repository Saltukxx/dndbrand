@echo off
echo ==== DnD Brand Deployment Script ====
echo This script will prepare the application for deployment
echo.

REM Check if we're in the root directory
if not exist "server" (
  echo Error: This script must be run from the root directory of the project
  exit /b 1
)

if not exist "public" (
  echo Error: This script must be run from the root directory of the project
  exit /b 1
)

REM Install root dependencies
echo Installing root dependencies...
call npm install

REM Install server dependencies
echo Installing server dependencies...
cd server
call npm install
call npm install node-cache winston --no-save

REM Create .env file from example if it doesn't exist
if not exist "config\.env" if exist "config\production.env.example" (
  echo Creating .env file from example...
  copy config\production.env.example config\.env
  echo Please update the .env file with your configuration values
)

REM Go back to root
cd ..

echo.
echo Deployment preparation complete!
echo You can now deploy to Render using the 'render.yaml' configuration
echo.
echo For manual deployment, run:
echo   cd server ^&^& set NODE_ENV=production ^&^& node production-server.js
echo. 
echo Make sure to set up all required environment variables in your Render dashboard
echo ==== End of Deployment Script ====

pause 