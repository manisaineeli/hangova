@echo off
REM Builds the 3D presentation and publishes it to the gh-pages branch.
REM Uses git -C rather than cd so the push always runs against the built
REM site's own repository and never the parent one.
setlocal
set "ROOT=%~dp0.."
set "DIST=%ROOT%\dist"

echo [1/3] building the presentation...
pushd "%ROOT%"
call npm run build
if errorlevel 1 (
  popd
  echo BUILD FAILED
  exit /b 1
)
popd

echo [2/3] committing the built site to gh-pages...
if exist "%DIST%\.git" rmdir /s /q "%DIST%\.git"
git -C "%DIST%" init -q
git -C "%DIST%" checkout -q -b gh-pages
git -C "%DIST%" config user.name  "manisaineeli"
git -C "%DIST%" config user.email "manisaineeli@users.noreply.github.com"
git -C "%DIST%" remote add origin "https://github.com/manisaineeli/hangova.git"
git -C "%DIST%" add -A
git -C "%DIST%" commit -q -m "Deploy presentation"
if errorlevel 1 (
  echo COMMIT FAILED
  exit /b 1
)

echo [3/3] pushing gh-pages...
git -C "%DIST%" push --force origin gh-pages 2>nul | findstr /C:"->" >nul
git -C "%DIST%" ls-remote --exit-code --heads origin gh-pages >nul 2>&1
if errorlevel 1 (
  echo PUSH FAILED
  exit /b 1
)
echo published: https://manisaineeli.github.io/hangova
exit /b 0
