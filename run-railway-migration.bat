@echo off
echo ========================================
echo Railway Migration Script
echo ========================================
echo.
echo Step 1: Logging into Railway...
echo This will open your browser for authentication.
echo.
call railway login
echo.
echo Step 2: Linking to your Railway project...
call railway link
echo.
echo Step 3: Running the database migration...
call railway run node backend/run-migration.js
echo.
echo ========================================
echo Migration completed!
echo ========================================
pause
