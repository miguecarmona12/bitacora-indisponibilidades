#!/usr/bin/env bash
set -euo pipefail

# Deploy automático para Bitácora
# Uso: ./deploy.sh [env] [branch] [app_url]
# env: production|staging|local (default: production)
# branch: rama git (default: master)
# app_url: URL pública donde el backend debe ser accesible desde el navegador (ej: http://bita.ux.local:8000)

APP_DIR="/bita/bitacora-indisponibilidades"
ENV=${1:-production}
BRANCH=${2:-master}
APP_URL=${3:-}

if [ -z "$APP_URL" ]; then
  case "$ENV" in
    production)
      APP_URL="http://bita.ux.local:8000"
      ;;
    staging)
      APP_URL="http://staging.bita.ux.local:8000"
      ;;
    local)
      APP_URL="http://localhost:8000"
      ;;
    *)
      echo "Entorno desconocido: $ENV"
      exit 1
      ;;
  esac
fi

echo "========================================"
echo " Deploy Bitácora (env=$ENV branch=$BRANCH)"
echo " Using APP_URL=$APP_URL"
echo "========================================"

cd "$APP_DIR"

# 1. Actualizar código
echo "[1/5] Actualizando repo..."
# Intentar fetch remoto, quieto si no hay red
git fetch --all --prune || true
git reset --hard "origin/$BRANCH"
git clean -fd

# 2. Parar contenedores y limpiar (mantener volúmenes si quieres persistencia de db)
echo "[2/5] Bajando contenedores..."
docker compose down --remove-orphans || true

# 3. Eliminar imágenes antiguas (opcional)
echo "[3/5] Limpiando imágenes y volúmenes temporales..."
docker compose down --rmi all --volumes --remove-orphans || true || true

# 4. Build: pasar APP_URL como build-arg y variable de entorno para frontend
echo "[4/5] Construyendo imágenes con VITE_API_URL=$APP_URL..."
# Export env vars para que docker compose los use
export VITE_API_URL="$APP_URL"
export RESET_ADMIN_PASSWORD="${RESET_ADMIN_PASSWORD:-true}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
# Infer FRONTEND_URL from APP_URL (replace backend port 8000 with frontend port 5173)
FRONTEND_HOST=$(echo "$APP_URL" | sed 's|:8000||g')
export FRONTEND_URL="${FRONTEND_URL:-${FRONTEND_HOST}:5173}"
echo "   FRONTEND_URL: $FRONTEND_URL"

# Build con build-arg
docker compose build --no-cache --build-arg VITE_API_URL="$VITE_API_URL"

# 5. Levantar servicios
echo "[5/5] Levantando servicios..."
docker compose up -d --remove-orphans

# Estado final
echo "========================================"
echo " Estado contenedores"
echo "========================================"
docker ps --format 'table {{.Names}}	{{.Status}}	{{.Ports}}'

echo ""
echo "✅ Deploy completado."
echo "   Frontend URL: $FRONTEND_URL"
echo "   Backend API:  $APP_URL"
echo "   Admin user:   admin / $ADMIN_PASSWORD"
