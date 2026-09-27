@echo off
REM Starts everything: the five backend services and the product front end.
setlocal
set "ROOT=%~dp0"

echo starting backend services...
call "%ROOT%start-services.cmd"

echo starting the product front end...
call "%ROOT%start-frontend.cmd"

echo.
echo Waiting for the backend to report healthy...
ping -n 40 127.0.0.1 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%health.ps1"

echo.
echo Product app  : http://localhost:5174
echo Presentation : http://localhost:5173
echo API Gateway  : http://localhost:8080
echo.
echo Sign in with  admin@hangova.ai / admin123  (administrator)
echo           or  demo@hangova.ai  / demo123   (traveller)
exit /b 0
