@echo off
echo Initializing Dashboard...

set SCRIPT_DIR=%~dp0
set DASHBOARD_DIR=%SCRIPT_DIR%..\dashboard

cd /d "%DASHBOARD_DIR%"

echo ----------------------------------------
echo Installing root dashboard dependencies...
call npm install

echo ----------------------------------------
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo ----------------------------------------
echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo ----------------------------------------
echo Setting up Python environment for backend API...
cd backend\api
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\python.exe -m pip install --upgrade pip
call .venv\Scripts\pip.exe install -r requirements.txt

echo ----------------------------------------
echo Initialization complete!
