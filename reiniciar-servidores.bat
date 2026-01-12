@echo off
chcp 65001 >nul
cls
echo.
echo 🔄 Reiniciando servidores de Cableworld Dashboard...
echo.

echo ⏹️  Deteniendo procesos actuales...
taskkill /F /IM node.exe >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ✓ Procesos detenidos
) else (
    echo ⚠️  No había procesos Node corriendo
)

timeout /t 2 /nobreak >nul
echo.

echo Iniciando Cableworld Dashboard en puerto 5000...
echo (Frontend + Backend en un solo servidor)
echo.
cd backend
node server.js
echo.
echo Puedes cerrar esta ventana. Los servidores seguirán corriendo.
echo.
pause
