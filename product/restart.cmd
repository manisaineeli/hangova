@echo off
REM Stops, rebuilds, and restarts every Hangova service.
REM Builds the front end into the gateway, so one port (8080) serves everything.
setlocal
set "JAVA_HOME=C:\Program Files\Java\jdk-25"
set "MAVEN_BIN=C:\Users\ganes\AppData\Local\Temp\opencode\tools\apache-maven-3.9.11\bin"
set "PATH=%JAVA_HOME%\bin;%MAVEN_BIN%;%PATH%"

echo [1/4] stopping services...
REM Must happen before packaging: a running JVM locks its own jar.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-services.ps1"
if errorlevel 1 exit /b 1

echo [2/4] building the front end into the gateway...
cd /d "%~dp0frontend"
call npm run build
if errorlevel 1 (
  echo FRONT END BUILD FAILED
  exit /b 1
)

echo [3/4] building the backend...
cd /d "%~dp0backend"
call mvn -B -q package -DskipTests
if errorlevel 1 (
  echo BACKEND BUILD FAILED
  exit /b 1
)

echo [4/4] starting...
call "%~dp0start-services.cmd"
echo.
echo Once healthy, the whole app is on one URL:  http://localhost:8080
exit /b 0
