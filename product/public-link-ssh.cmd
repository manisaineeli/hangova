@echo off
REM Public tunnel over SSH (localhost.run), used instead of the Cloudflare
REM quick tunnel whose bot protection blocks a real browser from loading the
REM app's JS and CSS bundles.
REM
REM Prints a https://*.lhr.life URL that serves the app to anyone.
setlocal
set "ROOT=%~dp0"
set "LOGS=%TEMP%\opencode\logs"
if not exist "%LOGS%" mkdir "%LOGS%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%health.ps1"

echo.
echo Opening a public tunnel to http://localhost:8080 ...
echo.

REM -R 80:localhost:8080 forwards the remote port 80 to the local gateway.
REM StrictHostKeyChecking is off because these are throwaway hosts.
start "hangova-ssh-tunnel" /min cmd /c ^
  "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes ^
   -R 80:localhost:8080 nokey@localhost.run > \"%LOGS%\ssh-tunnel.log\" 2>&1"

echo The URL will appear in %LOGS%\ssh-tunnel.log within a few seconds.
exit /b 0
