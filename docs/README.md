# Bitacora-indisponibilidades
Sistema para la gestión automatizada de indisponibilidades en entornos TI, orientado a mejorar la trazabilidad, tiempos de respuesta y cumplimiento de SLA.


## 🚀 Funcionalidades

- Registro de incidentes
- Gestión de estados
- Seguimiento de eventos
- Reportes básicos
- Centralización de información

## 🧱 Tecnologías

- **Frontend:** React + Vite + TailwindCSS (Single Page Application).
- **Backend:** Python + FastAPI + SQLAlchemy (REST API veloz y tipada).
- **Base de Datos:** PostgreSQL (Relacional, segura y robusta).
- **Seguridad:** JSON Web Tokens (JWT) y Passwords Hasheados (Bcrypt).

## 📂 Estructura del proyecto

/backend
/docs
/frontend
/scripts



## ⚙️ Instalación

A continuación están los comandos exactos que cualquier persona del equipo debe correr en la terminal (PowerShell o Git Bash) para obtener y prender el proyecto localmente por primera vez.

### 1. Clonar el repositorio
```bash
git clone https://github.com/miguecarmona12/bitacora-indisponibilidades.git
cd bitacora-indisponibilidades
```

### 2. Levantar el Backend (FastAPI)
Abre una terminal y ejecuta los siguientes comandos para crear tu entorno virtual de Python, instalar las librerías necesarias y prender el servidor conectado a PostgreSQL.

**Nota:** Debes tener instalado `Python 3.10+` y tener corriendo tu gestor de base de datos Postgres de fondo.
```bash
cd backend

# Crear y activar Entorno Virtual
python -m venv venv
.\venv\Scripts\activate

# Instalar los requerimientos (pip)
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] pydantic email-validator python-dotenv

# Prender el Servidor
uvicorn main:app --reload
```
*El servidor backend quedará escuchando en `http://localhost:8000`. No cierres esta terminal.*

### 3. Levantar el Frontend (React)
Abre **otra pestaña nueva** en tu terminal y ejecuta los comandos para instalar el ecosistema Moderno de JS (Node.js y NPM requeridos).

```bash
cd frontend

# Instalar empaquetadores, Tailwind, React Router y Lucide Icons
npm install

# Iniciar servidor de pruebas de interfaz
npm run dev
```
*El frontend se encenderá en `http://localhost:5173`. Abre esa URL en tu navegador y verás la pantalla de inicio de sesión.*

**Credenciales de Administrador por defecto:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`

## 📊 Objetivo

Optimizar la gestión de indisponibilidades mediante automatización y centralización de datos.

## 👨‍💻 Autores

- Miguel Ángel Carmona
- Norbeys Martínez
