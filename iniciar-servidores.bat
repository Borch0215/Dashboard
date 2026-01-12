@echo off
chcp 65001 >nul
cls
echo.
echo 🚀 Iniciando servidores de Cableworld Dashboard...
echo.

REM Verificar si ya hay procesos node corriendo
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  Ya hay procesos Node corriendo. Deteniendo primero...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
)

echo ✓ Limpieza completada
echo.
echo Iniciando Cableworld Dashboard en puerto 5000...
echo (Frontend + Backend en un solo servidor)
echo.
cd backend

REM Iniciar el servidor en background usando START
start /B node server.js
timeout /t 3 /nobreak >nul

REM Verificar si el servidor se inició correctamente
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ Servidor iniciado correctamente
    echo.
    echo 🌐 Cableworld Dashboard disponible en: http://localhost:5000
    echo.
    echo Puedes cerrar esta ventana cuando quieras. El servidor sigue corriendo.
    echo.
    exit /b 0
) else (
    echo ❌ Error: El servidor no se inició
    echo Ejecuta manualmente: cd backend ^&^& node server.js
    echo.
    pause
    exit /b 1
)
