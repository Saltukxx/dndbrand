@echo off
echo Starting DnD Brand API Server on port 3000...
cd /d %~dp0
node api-server-alt-port.js
pause 