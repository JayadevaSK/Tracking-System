@echo off
cd /d "%~dp0"
echo Starting Work Tracker Agent...
node dist/index.js
pause
