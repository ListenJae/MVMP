@echo off
setlocal
call "%~dp0scripts\mvmp-env.bat" || goto :error
cd /d "%MVMP_ROOT%"

echo [MVMP] Checking Docker...
docker version >nul 2>nul || goto :docker_error

echo [MVMP] Building and copying the latest plugin jar...
call "%NPM_CMD%" run build:plugin || goto :error
copy /Y "plugins\mvmp-discord-bridge\build\libs\mvmp-discord-bridge-0.1.0.jar" "infra\minecraft\plugins\mvmp-discord-bridge-0.1.0.jar" >nul || goto :error

echo [MVMP] Starting Minecraft server...
call "%NPM_CMD%" run server:up || goto :error

echo.
echo [MVMP] Minecraft server is starting on port 25565.
echo [MVMP] Use stop-minecraft-server.bat to shut it down.
goto :done

:docker_error
echo.
echo [MVMP] Docker is not running. Open Docker Desktop and wait until it says Docker is running.
pause
exit /b 1

:error
echo.
echo [MVMP] Failed. Check the messages above.
pause
exit /b 1

:done
pause
