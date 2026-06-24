@echo off
setlocal
call "%~dp0scripts\mvmp-env.bat" || goto :error
cd /d "%MVMP_ROOT%"

echo [MVMP] Publishing exported web data to GitHub Pages...
git status --short apps\discord-web\public\data apps\discord-web\public\feed.json

git add apps\discord-web\public\data apps\discord-web\public\feed.json || goto :error
git diff --cached --quiet
if %ERRORLEVEL% EQU 0 (
  echo [MVMP] No web data changes to publish.
  goto :done
)

for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set "TODAY=%%a-%%b-%%c"
for /f "tokens=1-2 delims=:." %%a in ("%time%") do set "NOW=%%a%%b"
git commit -m "Update MVMP web data %TODAY% %NOW%" || goto :error
git push || goto :error

echo [MVMP] Pushed web data. GitHub Actions will redeploy Pages shortly.
goto :done

:error
echo.
echo [MVMP] Failed. Check the messages above.
pause
exit /b 1

:done
pause
