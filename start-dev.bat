@echo off
chcp 65001 > nul
title Dashkit Dev Launcher

cls
echo.
echo  ===================================================================
echo                 Dashkit DEVELOPMENT SUITE                     
echo                Full-Stack LAN Launcher v1.0                    
echo  ===================================================================
echo.

REM --- Detect LAN IP ---
FOR /F "tokens=2 delims=:" %%a IN ('ipconfig ^| findstr /R /C:"IPv4.*172\." /C:"IPv4.*192\."') DO (
    FOR /F "tokens=1" %%b IN ("%%a") DO SET LAN_IP=%%b
)

IF NOT DEFINED LAN_IP (
    FOR /F "tokens=2 delims=:" %%a IN ('ipconfig ^| findstr "IPv4"') DO (
        FOR /F "tokens=1" %%b IN ("%%a") DO SET LAN_IP=%%b
    )
)

SET LAN_IP=%LAN_IP: =%

echo  [*] LAN IP Detected: %LAN_IP%
echo.
echo  [*] Starting Dashkit Microservices...
echo.

REM --- Start Backend ---
echo     [1/6] Backend API            (Port 3003)
start "Dashkit - Backend API" cmd /k "cd /d %~dp0Server && npm run dev"
timeout /t 2 /nobreak >nul

REM --- Start Shop Dashboard ---
echo     [2/6] Shop Dashboard        (Port 4200)
start "Dashkit - Shop Dashboard" cmd /k "cd /d %~dp0Frontend && ng serve --host 0.0.0.0 --port 4200"
timeout /t 2 /nobreak >nul

REM --- Start Admin Dashboard ---
echo     [3/6] Admin Dashboard       (Port 4201)
start "Dashkit - Admin Dashboard" cmd /k "cd /d %~dp0Admin && ng serve --host 0.0.0.0 --port 4201"
timeout /t 2 /nobreak >nul

REM --- Start Showcase ---
echo     [4/6] Showcase   (Port 4202)
start "Dashkit - Showcase" cmd /k "cd /d %~dp0Showcase && ng serve --host 0.0.0.0 --port 4202"
timeout /t 2 /nobreak >nul

REM --- Start Android Expo ---
echo     [5/6] Android Expo Server    (Port 8081)
start "Dashkit - Android App" cmd /k "cd /d %~dp0App && npx expo start"
timeout /t 2 /nobreak >nul

REM --- Start Android Expo ---
echo     [6/6] Android Expo Server    (Port 4203)
start "Dashkit - Storefront" cmd /k "cd /d %~dp0Storefront && ng serve --host 0.0.0.0 --port 4202"
timeout /t 2 /nobreak >nul



cls
echo.
echo  +---------------------------------------------------------------------+
echo  |                     Dashkit SERVICES ACTIVE                        |
echo  +---------------------------------------------------------------------+
echo  |  SERVICE            LOCAL URL               NETWORK (LAN) URL       |
echo  +---------------------------------------------------------------------+
echo  |  Server Api         http://localhost:3003   http://%LAN_IP%:3003   |
echo  |  Shop Dash          http://localhost:4200   http://%LAN_IP%:4200   |
echo  |  Admin Dash         http://localhost:4201   http://%LAN_IP%:4201   |
echo  |  Showcase UI        http://localhost:4202   http://%LAN_IP%:4202   |
echo  |  Android App        http://localhost:8081   http://%LAN_IP%:8081   |
echo  +---------------------------------------------------------------------+
echo  |  Health Check:     http://%LAN_IP%:3003/health                       |
echo  +---------------------------------------------------------------------+
echo.
echo  Tips:
echo   * Share the NETWORK URLs above with any mobile/PC on the same Wi-Fi.
echo   * Close individual terminal windows to stop a specific service.
echo.
pause

