@echo off
REM Exposes the running app on a temporary public URL.
REM The app is already serving everything on port 8080, so that is the tunnel target.
setlocal
set "ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%health.ps1"
echo.
echo Starting a public tunnel to http://localhost:8080 ...
echo (the URL is printed below and also written to %TEMP%\opencode\tunnel-url.txt)
echo.
start "hangova-tunnel" /min "%ROOT%cloudflared.exe" tunnel --no-autoupdate --url http://localhost:8080
exit /b 0
