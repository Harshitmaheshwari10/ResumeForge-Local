@echo off
echo Starting ResumeForge Local (browser-only)...
cd /d "%~dp0frontend"
if not exist node_modules call npm install
call npm run dev
