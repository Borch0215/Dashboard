@echo off
chcp 65001 >nul
cls
echo.
echo 🛑 Deteniendo servidores de Cableworld Dashboard...
echo.

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⏹️  Terminando Cableworld...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 1 /nobreak >nul
    echo ✓ Servidor detenido correctamente
) else (
    echo ⚠️  No hay servidor Node corriendo
)

echo.
echo ✅ Servidores detenidos correctamente
echo.
pause
