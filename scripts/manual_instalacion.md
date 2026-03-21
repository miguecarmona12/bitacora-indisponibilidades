# Manual de Instalación Local
*Para Desarrolladores / Integrantes de Equipo*

Este manual está diseñado para que consigas encender la aplicación en tu computadora local incluso si es la primera vez que programas con el stack tecnológico de la Bitácora (PotsgreSQL, FastAPI, React).

Sigue los pasos **estrictamente en el orden indicado**.

---

### Paso 1: Instalación de Entorno Base
Si ya tienes instalados estos tres programas de base en tu PC, avanza directo al **Paso 2**. De lo contrario, descárgalos e instálalos usando sus opciones predeterminadas ("Siguiente", "Siguiente"):
1.  **Git:** Para descargar el código. [Descargar aquí](https://git-scm.com/downloads)
2.  **Node.js:** El procesador de JavaScript necesario para el Frontend. Instala la versión LTS (Recomendada). [Descargar aquí](https://nodejs.org/)
3.  **Python (v3.10 o superior):** Al instalarlo para Windows asegúrate de marcar la casilla **"Add python.exe to PATH"** en la mismísima primera pantalla de instalación. [Descargar aquí](https://www.python.org/downloads/)
4.  **PostgreSQL + pgAdmin:** Para la Base de Datos. [Descargar aquí](https://www.postgresql.org/download/windows/) (Recuerda muy bien la contraseña del súper usuario `postgres` que definas durante la instalación).

---

### Paso 2: Crear el Entorno de Base de Datos
En este punto debes restaurar las tablas estructuradas del proyecto en tu motor de base de datos recién instalado.

1.  Abre el programa **pgAdmin 4** (Viene junto a tu instalador de PostgreSQL).
2.  Inicia sesión y a la izquierda verás un servidor. Haz clic derecho sobre **Databases** > **Create** > **Database...**.
3.  Llámala **`bitacora`** (todo minúsculas y sin tildes) y dale a Guardar (Save).
4.  Abre la herramienta de línea de comandos de tu sistema (CMD, Git Bash o PowerShell) y descarga el proyecto usando Git:
    ```bash
    git clone https://github.com/miguecarmona12/bitacora-indisponibilidades.git
    cd bitacora-indisponibilidades
    ```
5.  Entra de nuevo en `pgAdmin 4`, selecciona la base de datos `bitacora` arriba a la izquierda, presiona arriba en el **Query Tool** (Icono de cilindro con rayito).
6.  Abre el archivo `/scripts/esquema_base_datos.sql` que descargaste con el git, copia absolutamente todo el código que trae adentro, pégalo en el editor SQL de pgAdmin y **ejecútalo** (Boton Play `▶` o tecla F5).
7.  *¡Listo! Tu base de datos ahora tiene todas las tablas e incluso ha creado un usuario `admin` interno por defecto para que puedas iniciar sesión.*

---

### Paso 3: Desplegar el Backend (Python)
Vamos a instalar las librerías lógicas del sistema (como FastAPI y SQLAlchemy). Abre la **Terminal** dentro de la carpeta raíz del proyecto (`bitacora-indisponibilidades`) en tu editor como VSCode.

1.  Ve hacia la carpeta del servidor:
    ```bash
    cd backend
    ```
2.  Crea un archivo llamado literalmente `.env` *(punto env)*. Adentro pega la conexión que preparaste en el Paso 2:
    ```env
    # Asegúrate de reemplazar tu_contraseña_del_paso_1 por la clave real de tu Postgres
    DATABASE_URL=postgresql://postgres:tu_contraseña_del_paso_1@localhost:5432/bitacora
    ```
3.  Crea un entorno de trabajo virtual (`venv`) llamado localmente "venv":
    ```bash
    python -m venv venv
    ```
4.  Enciéndelo (si estás en una terminal Unix/Mac usa `source venv/bin/activate`):
    ```bash
    # Para Windows:
    .\venv\Scripts\activate
    ```
    *Notarás un `(venv)` adelante del prompt de tu consola si funcionó.*
5.  Instala las dependencias necesarias de python dentro del entorno:
    ```bash
    pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] pydantic email-validator python-dotenv
    ```
6.  Prende en caliente el servidor API (`main.py` -> `app`):
    ```bash
    uvicorn main:app --reload
    ```
    *(Si al final aparece la barra verde `Uvicorn running on http://127.0.0.1:8000`, todo salió bien. Déjalo encendido)*.

---

### Paso 4: Desplegar el Frontend (React)
A partir de aquí es súper sencillo. Abre **una nueva pestaña de Terminal** sin cerrar el anterior paso (es necesario que tanto el back como el front estén en la vida al mismo tiempo).

1.  Asegúrate de estar en el nivel de las carpetas y entra en "frontend":
    ```bash
    cd frontend
    ```
2.  Dile a Node (NPM) que instale la carpeta mágica de librerías de Javascript (Tailwind, Lucide, Axios) en base a lo estipulado en el archivo `package.json`:
    ```bash
    npm install
    ```
3.  Ejecuta el servidor de Interfaz (`Vite`):
    ```bash
    npm run dev
    ```

### ¡Fiesta Terminada! 🎉
Aparecerá un mensaje verde claro diciendo: `➜ Local: http://localhost:5173/`. ¡Córtalo y pégalo en Google Chrome! Te redirigirá al logueo general.

**Tus Claves Maestro (Root) son:**
- **Usuario:** `admin`
- **Contrasteña:** `admin123`
