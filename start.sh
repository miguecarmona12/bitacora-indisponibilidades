#!/bin/bash

set -e

echo "========================================================"
echo "🚀 INICIANDO SISTEMA AUTOMÁTICO: BITÁCORA MVP (LOCAL)"
echo "========================================================"

ROOT_DIR=$(pwd)

# --------------------------------------------------------
# 1. BACKEND
# --------------------------------------------------------
echo ""
echo "⚙️  Paso 1: Backend..."
cd "$ROOT_DIR/backend" || exit

PYTHON_CMD=$(command -v python || command -v python3)

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Python no está instalado"
    exit 1
fi

echo "🐍 Usando Python: $PYTHON_CMD"

# Para Windows Git Bash
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    "$PYTHON_CMD" -m venv venv
fi

# Activar entorno (Windows Git Bash)
source venv/Scripts/activate

echo "📥 Instalando dependencias backend..."
pip install -r requirements.txt

# Variable para local
export DATABASE_URL="postgresql://admin:admin123@localhost:5432/bitacora"

echo "🔥 Backend en http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd "$ROOT_DIR"

# --------------------------------------------------------
# 2. FRONTEND
# --------------------------------------------------------
echo ""
echo "⚙️  Paso 2: Frontend..."
cd "$ROOT_DIR/frontend" || exit

if ! command -v npm &>/dev/null; then
    echo "❌ Node.js no está instalado"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "🟢 Node detectado: $(node -v)"

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias frontend..."
    npm install
fi

# Variable para frontend local
export VITE_API_URL="http://localhost:8000"

echo ""
echo "========================================================"
echo "💥 SISTEMA LISTO Y CORRIENDO"
echo "👉 Frontend: http://localhost:5173"
echo "👉 Backend: http://localhost:8000"
echo "👉 Ctrl + C para apagar TODO"
echo "========================================================"
echo ""

npm run dev

# --------------------------------------------------------
# 3. SHUTDOWN
# --------------------------------------------------------
echo ""
echo "🛑 Apagando sistema..."
kill $BACKEND_PID 2>/dev/null || true
echo "✅ Backend detenido"