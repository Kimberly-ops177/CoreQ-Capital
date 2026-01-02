@echo off
echo Stopping all Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Killing Node processes...
    taskkill /IM node.exe /F
) else (
    echo No Node processes running
)

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting backend server...
cd backend
start "Backend Server" cmd /k "npm start"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend server...
cd ..
cd frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
