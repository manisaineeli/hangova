@echo off
REM Builds the 3D presentation and publishes it to the gh-pages branch.
setlocal
cd /d "%~dp0.."

echo [1/3] building the presentation...
call npm run build
if errorlevel 1 exit /b 1

echo [2/3] committing the built site to gh-pages...
cd dist
if exist .git rmdir /s /q .git
git init -q
git checkout -q -b gh-pages
git config user.name  "manisaineeli"
git config user.email "manisaineeli@users.noreply.github.com"
git remote add origin "https://github.com/manisaineeli/hangova.git"
git add -A
git commit -q -m "Deploy presentation"
cd ..

echo [3/3] pushing gh-pages...
git push -q --force origin gh-pages
if errorlevel 1 (
  echo PUSH FAILED
  exit /b 1
)
echo published: https://manisaineeli.github.io/hangova
exit /b 0
