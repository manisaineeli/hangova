@echo off
REM Keeps the app and the public tunnel running, and prints the current link.
REM Stop it with:  powershell -ExecutionPolicy Bypass -File keep-online.ps1 -Stop
setlocal
start "hangova-keep-online" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0keep-online.ps1"
echo keep-online watcher started.
echo The public link is written to: %TEMP%\opencode\tunnel-url.txt
exit /b 0
