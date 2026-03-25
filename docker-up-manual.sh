#!/bin/bash

echo "========================================================"
echo "🚀 INICIANDO BITÁCORA CON DOCKER DESKTOP (GIT BASH)"
echo "========================================================"

# Verificar que Docker Desktop está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop no está corriendo."
    echo "📌 Por favor, inicia Docker Desktop desde el menú de inicio"
    exit 1
fi

echo "✅ Docker Desktop está corriendo"

# Detener contenedores existentes
echo ""
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down 2>/dev/null || true

# Construir imágenes
echo ""
echo "🏗️  Construyendo imágenes Docker..."
docker-compose build --no-cache

# Levantar servicios
echo ""
echo "🚀 Levantando servicios..."
docker-compose up -d

# Esperar a que la base de datos esté lista
echo ""
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 10

# Inicializar base de datos
echo ""
echo "🗄️  Inicializando base de datos..."
docker exec bitacora_backend python -c "from database import init_db; init_db()" 2>/dev/null || echo "⚠️  La base de datos ya estaba inicializada"

# Mostrar estado
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "========================================================"
echo "✅ SISTEMA LISTO"
echo "========================================================"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🐘 PostgreSQL: localhost:5432"
echo ""
echo "📊 Comandos útiles:"
echo "   Ver logs: docker-compose logs -f"
echo "   Detener: docker-compose down"
echo "   Reconstruir: docker-compose build --no-cache"
echo "   Ver logs backend: docker logs bitacora_backend -f"
echo "   Ver logs frontend: docker logs bitacora_frontend -f"
echo "   Acceder a DB: docker exec -it bitacora_db psql -U postgres -d bitacora"
echo "========================================================"