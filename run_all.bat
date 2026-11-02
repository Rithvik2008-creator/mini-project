@echo off
title Smart Municipal Road Maintenance - All Services Launcher
echo ==============================================================
echo  SMART MUNICIPAL ROAD MAINTENANCE SYSTEM - LAUNCHER
echo ==============================================================
echo.

:: 1. Check if MySQL is running
echo [1/3] Checking MySQL Server on port 3306...
netstat -ano | findstr :3306 | findstr LISTENING >nul
if errorlevel 1 (
    echo Starting MySQL from XAMPP...
    start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --console
    timeout /t 3 /nobreak >nul
) else (
    echo MySQL is already running on port 3306.
)

:: Create database if not exists
if exist "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS road_maintenance_db;" >nul 2>&1
)

:: 2. Start Backend
echo.
echo [2/3] Starting Spring Boot Backend (http://localhost:8080)...
netstat -ano | findstr :8080 | findstr LISTENING >nul
if errorlevel 1 (
    start "Road Maintenance - Spring Boot Backend (Port 8080)" cmd /k "cd /d d:\mp\backend && C:\tools\maven\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run"
) else (
    echo Spring Boot backend is already running on port 8080.
)

:: 3. Start Frontend
echo.
echo [3/3] Starting React Frontend (http://localhost:5173)...
netstat -ano | findstr :5173 | findstr LISTENING >nul
if errorlevel 1 (
    start "Road Maintenance - React Frontend (Port 5173)" cmd /k "cd /d d:\mp\frontend && npm.cmd run dev"
) else (
    echo React Vite frontend is already running on port 5173.
)

echo.
echo ==============================================================
echo  Opening application in browser: http://localhost:5173
echo ==============================================================
timeout /t 3 /nobreak >nul
start http://localhost:5173
