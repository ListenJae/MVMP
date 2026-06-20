@echo off
set "MVMP_ROOT=%~dp0.."
for %%I in ("%MVMP_ROOT%") do set "MVMP_ROOT=%%~fI"

set "NODE_HOME=%MVMP_ROOT%\.tools\node"
set "JAVA_HOME=%MVMP_ROOT%\.tools\jdk"
set "GRADLE_HOME=%MVMP_ROOT%\.tools\gradle"
set "GRADLE_USER_HOME=%MVMP_ROOT%\.tools\gradle-user-home"
set "PATH=%NODE_HOME%;%JAVA_HOME%\bin;%GRADLE_HOME%\bin;%PATH%"

set "NPM_CMD=%NODE_HOME%\npm.cmd"
set "NODE_CMD=%NODE_HOME%\node.exe"
set "GRADLE_CMD=%GRADLE_HOME%\bin\gradle.bat"

if not exist "%NPM_CMD%" (
  echo [MVMP] Node.js was not found at "%NODE_HOME%".
  exit /b 1
)

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [MVMP] JDK was not found at "%JAVA_HOME%".
  exit /b 1
)

if not exist "%GRADLE_CMD%" (
  echo [MVMP] Gradle was not found at "%GRADLE_HOME%".
  exit /b 1
)

if not exist "%MVMP_ROOT%\.env" (
  echo [MVMP] .env was not found. Creating it from .env.example.
  copy "%MVMP_ROOT%\.env.example" "%MVMP_ROOT%\.env" >nul
)
