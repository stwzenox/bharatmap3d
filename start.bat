@echo off
echo ========================================================
echo   Starting BharatMap3D Cadastre & Land Records System
echo ========================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "FastAPI Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python run.py"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
start "Vite Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers launched in their own terminal windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000
echo - API Docs: http://localhost:8000/docs
echo.
pause
