@echo off
echo [1/5] Verificando Node.js...
where node >nul 2>&1 || (echo Node.js no esta instalado (>= 20) & exit /b 1)
echo [2/5] Verificando npm...
where npm >nul 2>&1 || (echo npm no esta instalado & exit /b 1)
echo [3/5] Instalando dependencias...
call npm install || exit /b 1
echo [4/5] Configurando .env...
if not exist .env copy .env.example .env
echo [5/5] Ejecutando lint...
call npm run lint || echo Lint con advertencias

echo.
echo Instalacion completada!
echo   npm run start:dev   Desarrollo
echo   npm test            Tests
echo   http://localhost:3000/api-docs
