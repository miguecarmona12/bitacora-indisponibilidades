#!/bin/bash

set -e  # corta ejecución si algo falla

echo "========================================================"
echo "🚀 INICIANDO SISTEMA AUTOMÁTICO: BITÁCORA MVP"
echo "========================================================"

ROOT_DIR=$(pwd)

# --------------------------------------------------------
# 1. BACKEND (PYTHON / FASTAPI)
# --------------------------------------------------------
echo ""
echo "⚙️  Paso 1: Backend..."
cd "$ROOT_DIR/backend" || exit

# Detectar Python correctamente
PYTHON_CMD=$(command -v python || command -v python3)

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Python no está instalado o no está en PATH"
    exit 1
fi

echo "🐍 Usando Python: $PYTHON_CMD"

# Validar o recrear entorno virtual
if [ ! -f "venv/Scripts/python.exe" ]; then
    echo "📦 Creando/Recreando entorno virtual..."
    rm -rf venv
    "$PYTHON_CMD" -m venv venv
fi

# Activar entorno (Git Bash en Windows)
source venv/Scripts/activate

# Validar que el python del venv funciona
if ! python -c "import sys" &>/dev/null; then
    echo "💥 venv corrupto, recreando..."
    deactivate 2>/dev/null || true
    rm -rf venv
    "$PYTHON_CMD" -m venv venv
    source venv/Scripts/activate
fi

echo "📥 Instalando dependencias backend..."

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib bcrypt==4.0.1 pydantic email-validator python-dotenv
fi

echo "🔥 Backend en http://localhost:8000"
uvicorn main:app --reload &
BACKEND_PID=$!

cd "$ROOT_DIR"

# --------------------------------------------------------
# 2. FRONTEND (REACT / VITE)
# --------------------------------------------------------
echo ""
echo "⚙️  Paso 2: Frontend..."
cd "$ROOT_DIR/frontend" || exit

# Validar Node
if ! command -v npm &>/dev/null; then
    echo "❌ Node.js no está instalado"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "🟢 Node detectado: $(node -v)"

# Validar dependencias reales (no solo carpeta)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vite" ]; then
    echo "📦 Instalando dependencias frontend..."
    rm -rf node_modules package-lock.json
    npm install
else
    echo "✅ Dependencias OK"
fi

echo ""
echo "========================================================"
echo "💥 SISTEMA LISTO Y CORRIENDO"
echo "👉 Ctrl + C para apagar TODO"
echo "========================================================"
echo ""

# Levantar frontend con fallback robusto
npm run dev || npx vite

# --------------------------------------------------------
# 3. SHUTDOWN LIMPIO
# --------------------------------------------------------
echo ""
echo "🛑 Apagando sistema..."

kill $BACKEND_PID 2>/dev/null || true

echo "✅ Backend detenido"
echo "👋 Adiós"