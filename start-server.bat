@echo off
echo Installing dependencies if needed...
if not exist node_modules npm install

echo Starting server...
node server.js

pause 