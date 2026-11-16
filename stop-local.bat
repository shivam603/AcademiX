@echo off
echo Stopping AcademiX Local Environment...

"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "%~dp0.db_data" stop

taskkill /F /IM node.exe 2>nul

echo All AcademiX processes stopped.
