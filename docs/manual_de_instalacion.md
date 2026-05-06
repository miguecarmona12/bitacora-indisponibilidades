#  Manual de Instalación - Bitácora de Indisponibilidades

Guía para levantar la aplicación localmente o en AWS con Docker.

---

##  Tabla de Contenidos
1. [Instalación Local (Docker Desktop)](#instalación-local-docker-desktop)
2. [Instalación en AWS](#instalación-en-aws)
3. [Configuración Común](#configuración-común)
4. [Acceso a la Aplicación](#acceso-a-la-aplicación)
5. [Troubleshooting](#troubleshooting)

---

##  Instalación Local (Docker Desktop)

### Paso 1: Descargar e Instalar Docker Desktop

- **Windows/Mac**: https://www.docker.com/products/docker-desktop
- **Linux**: 
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

Verificar instalación:
```bash
docker --version
docker-compose --version
```

### Paso 2: Clonar el Repositorio

```bash
# Ir a una carpeta de trabajo
cd /ruta/donde/quieras

# Clonar el repositorio
git clone https://tu-repositorio.git bitacora-app
cd bitacora-app
```

### Paso 3: Crear Archivo .env

En la raíz del proyecto, crear archivo `.env`:

```env
# Base de Datos
DATABASE_URL=postgresql://postgres:postgres@db:5432/bitacora
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=bitacora

# Backend
SECRET_KEY=desarrollo_clave_123456789_no_para_produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

### Paso 4: Iniciar la Aplicación

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

Esperarás algo como:
```
NAME                COMMAND                  STATUS
postgres_db         docker-entrypoint.s...   Up 30 seconds
fastapi_backend     uvicorn main:app ...     Up 10 seconds
react_frontend      npm run dev               Up 5 seconds
```

###  Paso 5: Acceder a la Aplicación

-  **Frontend**: http://localhost:5173
-  **Backend API**: http://localhost:8000
-  **Documentación API**: http://localhost:8000/docs

** Credenciales**:
-  Usuario: `admin`
-  Contraseña: `admin123`

###  Ver Logs (opcional)

```bash
# Todos los logs
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo base de datos
docker-compose logs -f db
```

###  Detener la Aplicación

```bash
docker-compose stop

# O bajar completamente
docker-compose down
```

---

##  Instalación en AWS

###  Paso 1: Crear Instancia EC2

1. Accede a [AWS Console](https://console.aws.amazon.com)
2. Ir a **EC2 → Instancias → Lanzar Instancia**
3. Configurar:
   - **Nombre**: `bitacora-app`
   - **AMI**: Amazon Linux 2023
   - **Tipo**: `t3.medium` (o `t3.small` mínimo)
   - **Almacenamiento**: 50 GB
   - **Security Group**: Abrir puertos 80, 443, 22, 5173

4. Descargar clave `.pem` y guardar en lugar seguro

###  Paso 2: Conectar a la Instancia

```bash
# Dar permisos a la clave
chmod 600 tu-clave.pem

# Conectar por SSH
ssh -i tu-clave.pem ec2-user@tu-ip-publica
```

###  Paso 3: Instalar Docker

```bash
# Actualizar sistema
sudo dnf update -y

# Instalar Docker
sudo dnf install -y docker docker-compose git

# Iniciar y habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario al grupo docker
sudo usermod -aG docker ec2-user

# Aplicar cambios (salir y reconectar, o ejecutar)
newgrp docker
```

Verificar:
```bash
docker --version
docker-compose --version
```

### Paso 4: Descargar Aplicación

```bash
# Crear directorio
sudo mkdir -p /opt/bitacora
cd /opt/bitacora

# Clonar repositorio
sudo git clone https://tu-repositorio.git .

# Dar permisos
sudo chown -R ec2-user:ec2-user /opt/bitacora
```

### Paso 5: Crear Archivo .env

```bash
cd /opt/bitacora
nano .env
```

Contenido:

```env
# Base de Datos
DATABASE_URL=postgresql://postgres:contraseña_fuerte_aqui@db:5432/bitacora
POSTGRES_USER=postgres
POSTGRES_PASSWORD=contraseña_fuerte_aqui
POSTGRES_DB=bitacora

# Backend
SECRET_KEY=clave_secreta_muy_larga_y_segura_aqui_minimo_32_caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Frontend
VITE_API_BASE_URL=http://tu-dominio.com

# General
ENVIRONMENT=production
```

** Importante**:
- Cambiar `contraseña_fuerte_aqui` por contraseña segura
- Generar SECRET_KEY: `openssl rand -hex 32`

Guardar con `Ctrl+O`, `Enter`, `Ctrl+X`

### Paso 6: Preparar Estructura de Datos

```bash
cd /opt/bitacora

# Crear directorio para datos de base de datos
sudo mkdir -p postgres_data
sudo chown -R 999:999 postgres_data
sudo chmod -R 700 postgres_data
```

### Paso 8: Verificar Acceso

Una vez que los contenedores están activos, acceder directamente:

```
Frontend:  http://tu-ip-publica:5173
Backend:   http://tu-ip-publica:8000
API Docs:  http://tu-ip-publica:8000/docs
```

Ejemplo con tu IP:
```
http://18.190.186.181:5173/login
```

---

##  Configuración Común

### Cambiar Contraseña del Admin (Primer Acceso)

1. Acceder a http://localhost:5173 (local) o http://tu-dominio.com (AWS)
2. Iniciar sesión con:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. El sistema pedirá cambiar contraseña en primer login

### Ver Logs de la Aplicación

```bash
# Local
docker-compose logs -f backend

# AWS
cd /opt/bitacora && docker-compose logs -f backend
```

### Actualizar Aplicación

```bash
# Local
git pull
docker-compose build
docker-compose restart

# AWS
cd /opt/bitacora
git pull
docker-compose build
docker-compose restart
```

### Backup de Base de Datos

```bash
# Local
docker exec postgres_db pg_dump -U postgres bitacora > backup.sql

# AWS
docker exec postgres_db pg_dump -U postgres bitacora > /opt/bitacora/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar desde Backup

```bash
# Local
cat backup.sql | docker exec -i postgres_db psql -U postgres -d bitacora

# AWS
gunzip < /opt/bitacora/backups/backup_20260505_120000.sql.gz | \
docker exec -i postgres_db psql -U postgres -d bitacora
```

---

##  Acceso a la Aplicación

### Local
| Componente | URL |
|-----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### AWS
| Componente | URL |
|-----------|-----|
| Frontend | http://tu-ip-publica:5173 |
| Backend API | http://tu-ip-publica:8000 |
| API Docs | http://tu-ip-publica:8000/docs |

**Ejemplo**: http://18.190.186.181:5173/login

---

##  Troubleshooting

### Problema: "Connection refused"

```bash
# Esperar 30 segundos y ver logs
docker-compose logs db

# Si persiste, reiniciar
docker-compose restart db
```

### Problema: "Port already in use"

```bash
# Cambiar puerto en docker-compose.yml
# Buscar "ports:" y cambiar, ej:
# ports:
#   - "5174:5173"  # Cambiar de 5173 a 5174
```

### Problema: "No such file or directory" (.env)

```bash
# Crear .env en la raíz del proyecto
cd /ruta/del/proyecto
nano .env
# Pegar contenido (ver sección .env arriba)
```

### Problema: Base de datos no inicializa

```bash
# Ver logs detallados
docker-compose logs db

# Limpiar volúmenes (DESTRUCTIVO)
docker-compose down -v
docker-compose up -d db
```

### Problema: Frontend muestra error de API

1. Verificar `VITE_API_BASE_URL` en `.env`
2. Reconstruir:
```bash
docker-compose build frontend
docker-compose restart frontend
```

### Problema: Credenciales no funcionan

```bash
# En AWS, ejecutar script de reset
cd /opt/bitacora/backend
python reset_admin.py
```

---

##  Comandos Útiles

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose stop

# Reiniciar servicios
docker-compose restart

# Entrar a contenedor
docker exec -it postgres_db psql -U postgres -d bitacora

# Ver uso de recursos
docker stats

# Limpiar espacio no usado
docker system prune -a
```

---

##  Consideraciones de Seguridad

**Local (Desarrollo)**:
- Las contraseñas por defecto son OK
- No exponer a internet

**AWS (Producción)**:
-  Cambiar todas las contraseñas
-  Generar SECRET_KEY segura
-  Hacer backups regulares
-  Configurar Security Groups
-  Restringir SSH a tu IP
-  Acceso sin SSL (http) - agregar SSL con Nginx y Let's Encrypt si es necesario para producción

---

**Versión**: 1.0  
**Última actualización**: 05 Mayo 2026
