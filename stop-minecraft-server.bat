@echo off
setlocal
call "%~dp0scripts\mvmp-env.bat" || goto :error
cd /d "%MVMP_ROOT%"

echo [MVMP] Stopping Minecraft server...
call "%NPM_CMD%" run server:down || goto :error

echo [MVMP] Minecraft server stopped.
goto :done

:error
echo.
echo [MVMP] Failed. Check the messages above.
pause
exit /b 1

:done
pause
