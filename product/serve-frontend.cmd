@echo off
REM Serves the built front end on :4174 and proxies /api to the gateway.
REM This is what should be exposed publicly, not the Vite dev server.
setlocal
cd /d "%~dp0frontend"
start "hangova-ui-preview" /min npm run preview
echo preview server launching on http://localhost:4174
exit /b 0
