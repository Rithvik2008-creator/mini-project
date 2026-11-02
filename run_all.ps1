Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " SMART MUNICIPAL ROAD MAINTENANCE SYSTEM - LAUNCHER" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan

# 1. Check MySQL (Port 3306)
Write-Host "`n[1/3] Checking MySQL Server (Port 3306)..." -ForegroundColor Yellow
$mysqlListening = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if (-not $mysqlListening) {
    Write-Host "Starting MySQL server from C:\xampp\mysql\bin\mysqld.exe..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=C:\xampp\mysql\bin\my.ini --standalone" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "MySQL is already active on port 3306." -ForegroundColor Green
}

# Ensure database exists
if (Test-Path "C:\xampp\mysql\bin\mysql.exe") {
    & "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS road_maintenance_db;" 2>$null
}

# 2. Check & Start Backend (Port 8080)
Write-Host "`n[2/3] Checking Spring Boot Backend (Port 8080)..." -ForegroundColor Yellow
$backendListening = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if (-not $backendListening) {
    Write-Host "Launching Spring Boot backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\mp\backend'; & 'C:\tools\maven\apache-maven-3.9.9\bin\mvn.cmd' spring-boot:run"
} else {
    Write-Host "Backend is already active on http://localhost:8080." -ForegroundColor Green
}

# 3. Check & Start Frontend (Port 5173)
Write-Host "`n[3/3] Checking React Frontend (Port 5173)..." -ForegroundColor Yellow
$frontendListening = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $frontendListening) {
    Write-Host "Launching React Vite frontend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\mp\frontend'; npm.cmd run dev"
} else {
    Write-Host "Frontend is already active on http://localhost:5173." -ForegroundColor Green
}

Write-Host "`n==============================================================" -ForegroundColor Cyan
Write-Host " Opening Application in browser: http://localhost:5173" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
Start-Process "http://localhost:5173"
