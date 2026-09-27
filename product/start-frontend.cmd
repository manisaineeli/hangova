@echo off
REM Starts the Hangova product front end (Vite dev server on 5174).
setlocal
cd /d "%~dp0frontend"
start "hangova-ui" /min npm run dev
echo front end launching on http://localhost:5174
exit /b 0
