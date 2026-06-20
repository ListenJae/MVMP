@echo off
setlocal
call "%~dp0scripts\mvmp-env.bat" || goto :error
cd /d "%MVMP_ROOT%"

echo [MVMP] Installing npm dependencies...
call "%NPM_CMD%" install || goto :error

echo [MVMP] Building web app...
call "%NPM_CMD%" run build:web || goto :error

echo [MVMP] Building plugin...
call "%NPM_CMD%" run build:plugin:online || goto :error

echo [MVMP] Copying plugin jar...
copy /Y "plugins\mvmp-discord-bridge\build\libs\mvmp-discord-bridge-0.1.0.jar" "infra\minecraft\plugins\mvmp-discord-bridge-0.1.0.jar" >nul || goto :error

echo [MVMP] Dependencies and builds are ready.
goto :done

:error
echo.
echo [MVMP] Failed. Check the messages above.
pause
exit /b 1

:done
pause
