@echo off
echo Starting DnD Brand E-commerce Application...
echo.

echo Installing dependencies...
call npm run install:all
echo.

echo Starting server...
start cmd /k "npm run dev:server"
echo.

echo Opening application in browser...
timeout /t 5
start http://localhost:5000
echo.

echo DnD Brand E-commerce Application is now running!
echo Server: http://localhost:5000/api
echo Frontend: http://localhost:5000
echo.
echo Press any key to exit this window...
pause > nul