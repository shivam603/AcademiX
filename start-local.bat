@echo off
echo ========================================================
echo Starting AcademiX Local Environment
echo ========================================================

REM Check if PostgreSQL on port 5433 is running
"C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -p 5433 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting local PostgreSQL cluster on port 5433...
    start /B "" "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "%~dp0.db_data" -o "-p 5433" -l "%~dp0.db_data\pg.log" start
    timeout /t 2 >nul
) else (
    echo Local PostgreSQL is already running on port 5433.
)

REM Start server and client
echo Starting Backend & Frontend...
start "AcademiX Server" cmd /k "cd /d %~dp0 && npm start"
start "AcademiX Client" cmd /k "cd /d %~dp0 && npm run client"

timeout /t 3 >nul
echo Opening application in default browser...
start http://localhost:5173

echo ========================================================
echo AcademiX is running!
echo Frontend: http://localhost:5173 (or http://localhost:5000)
echo Demo Student: s001@student.edu (Password: Demo@1234)
echo ========================================================
