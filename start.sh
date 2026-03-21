#!/bin/bash

echo "========================================================"
echo "🚀 INICIANDO SISTEMA AUTOMÁTICO: BITÁCORA MVP"
echo "========================================================"

# --- 1. CONFIGURACIÓN DEL BACKEND ---
echo ""
echo "⚙️  Paso 1: Revisando Backend (Python/FastAPI)..."
cd backend || exit

# Si no existe la carpeta venv, la creamos y bajamos todo
if [ ! -d "venv" ]; then
    echo "📦 Creando Entorno Virtual por primera vez..."
    python -m venv venv
    
    echo "📥 Instalando requerimientos. Esto tardará unos segundos..."
    # Activar venv en Git Bash (Windows)
    source venv/Scripts/activate
    pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] pydantic email-validator python-dotenv
else
    echo "✅ Entorno Python detectado."
    source venv/Scripts/activate
fi

# Levantamos el servidor en segundo plano (&) para que no bloquee la consola
echo "🔥 Encendiendo Servidor API en http://localhost:8000..."
uvicorn main:app --reload &
BACKEND_PID=$!

# Volvemos a la raíz
cd ..

# --- 2. CONFIGURACIÓN DEL FRONTEND ---
echo ""
echo "⚙️  Paso 2: Revisando Frontend (React/Vite)..."
cd frontend || exit

# Si no existen los modulos de Node, bajamos todo
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando librerías de React por primera vez..."
    npm install
else
    echo "✅ Módulos de Node detectados."
fi

echo ""
echo "========================================================"
echo "💥 SISTEMA LISTO Y CORRIENDO"
echo "👉 Para apagar TODO el sistema en el futuro, solo presiona Ctrl + C"
echo "========================================================"
echo ""

# Levantamos el Frontend (esto se queda pegado en la consola mostrando logs)
npm run dev

# --- 3. APAGADO SEGURO ---
# Cuando el usuario presione Ctrl + C, el script llegará aquí
echo "Apagando Frontend..."
# Matamos también el servidor Backend que dejamos corriendo en el fondo
kill $BACKEND_PID
echo "Apagando Backend... ¡Adios!"
exit 0
