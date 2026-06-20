@echo off
setlocal
call "%~dp0scripts\mvmp-env.bat" || goto :error
cd /d "%MVMP_ROOT%"

echo [MVMP] Starting Discord channel sync worker...
echo [MVMP] This window should stay open while the worker is running.
call "%NPM_CMD%" run dev:worker || goto :error
goto :done

:error
echo.
echo [MVMP] Failed. Check DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID in .env.
pause
exit /b 1

:done
pause
