#!/bin/bash
set -e

echo "[1/5] Verificando Node.js..."
command -v node >/dev/null 2>&1 || { echo "Node.js no esta instalado (>= 20)"; exit 1; }
echo "[2/5] Verificando npm..."
command -v npm >/dev/null 2>&1 || { echo "npm no esta instalado"; exit 1; }
echo "[3/5] Instalando dependencias..."
npm install
echo "[4/5] Configurando .env..."
[ -f .env ] || cp .env.example .env
echo "[5/5] Ejecutando lint..."
npm run lint || echo "Lint con advertencias"

echo ""
echo "Instalacion completada!"
echo "  npm run start:dev   Desarrollo"
echo "  npm test            Tests"
echo "  http://localhost:3000/api-docs"
