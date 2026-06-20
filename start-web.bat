@echo off
setlocal
call "%~dp0scripts\mvmp-env.bat" || goto :error
cd /d "%MVMP_ROOT%"

echo [MVMP] Starting MVMP web app...
echo [MVMP] Open http://localhost:3000 in your browser.
echo [MVMP] This window should stay open while the web app is running.
call "%NPM_CMD%" run dev:web || goto :error
goto :done

:error
echo.
echo [MVMP] Failed. Check the messages above.
pause
exit /b 1

:done
pause
