@echo off
echo ========================================================
echo   Stopping 3D ULPIN Cadastre & Land Records System
echo ========================================================

echo Stopping Node.js and Python processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

echo.
echo [DONE] All servers (Port 5173 and Port 8000) have been stopped.
echo.
timeout /t 3
