@echo off
echo Starting Dashboard (Frontend, Backend, AI API) on Windows

set SCRIPT_DIR=%~dp0
set DASHBOARD_DIR=%SCRIPT_DIR%..\dashboard

cd /d "%DASHBOARD_DIR%"

echo Installing dependencies if missing...
call npm install --silent >nul 2>&1
call npm install --prefix frontend --silent >nul 2>&1
call npm install --prefix backend --silent >nul 2>&1

echo Ensuring Python environment is present...
cd backend\api
if not exist ".venv" (
    call C:\Users\ferna\.local\bin\uv venv --python 3.11 .venv
    call C:\Users\ferna\.local\bin\uv pip install -r requirements.txt --python .venv
)
cd ..\..

echo.
echo ========================================================
echo Dashboard is starting!
echo Frontend: http://localhost:3000
echo Backend API (Node): http://localhost:3001
echo AI API (Python): http://localhost:8000
echo ========================================================
echo.

:: We run node services and the python AI backend concurrently
call npx concurrently "npm run dev --prefix frontend" "npm run dev --prefix backend" "cd backend\api && .venv\Scripts\uvicorn main:app --port 8000"
