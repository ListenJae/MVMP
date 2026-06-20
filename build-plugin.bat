@echo off
setlocal
call "%~dp0scripts\mvmp-env.bat" || goto :error
cd /d "%MVMP_ROOT%"

echo [MVMP] Building Minecraft Discord bridge plugin...
call "%NPM_CMD%" run build:plugin || goto :error

echo [MVMP] Copying plugin jar into infra\minecraft\plugins...
copy /Y "plugins\mvmp-discord-bridge\build\libs\mvmp-discord-bridge-0.1.0.jar" "infra\minecraft\plugins\mvmp-discord-bridge-0.1.0.jar" >nul || goto :error

echo [MVMP] Plugin is ready.
goto :done

:error
echo.
echo [MVMP] Failed. Check the messages above.
pause
exit /b 1

:done
pause
