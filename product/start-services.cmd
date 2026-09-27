@echo off
REM Starts the five Hangova backend services in the background.
setlocal
set "JAVA_HOME=C:\Program Files\Java\jdk-25"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "BACKEND=%~dp0backend"
set "LOGS=%TEMP%\opencode\logs"
if not exist "%LOGS%" mkdir "%LOGS%"

start "hangova-user"    /min java -jar "%BACKEND%\user-service\target\user-service.jar"         > "%LOGS%\user.log" 2>&1
start "hangova-trip"    /min java -jar "%BACKEND%\trip-service\target\trip-service.jar"         > "%LOGS%\trip.log" 2>&1
start "hangova-booking" /min java -jar "%BACKEND%\booking-service\target\booking-service.jar"   > "%LOGS%\booking.log" 2>&1
start "hangova-info"    /min java -jar "%BACKEND%\info-service\target\info-service.jar"         > "%LOGS%\info.log" 2>&1
start "hangova-gateway" /min java -jar "%BACKEND%\api-gateway\target\api-gateway.jar"            > "%LOGS%\gateway.log" 2>&1

echo services launching, logs in %LOGS%
exit /b 0
