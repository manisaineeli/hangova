@echo off
REM Reports the health of all five Hangova services.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0health.ps1"
exit /b %errorlevel%
