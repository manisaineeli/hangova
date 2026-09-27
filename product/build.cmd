@echo off
setlocal
set "JAVA_HOME=C:\Program Files\Java\jdk-25"
set "PATH=%JAVA_HOME%\bin;C:\Users\ganes\AppData\Local\Temp\opencode\tools\apache-maven-3.9.11\bin;%PATH%"
cd /d "%~dp0backend"
mvn %*
