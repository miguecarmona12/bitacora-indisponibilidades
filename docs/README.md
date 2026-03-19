# 🖥️ Bitácora de Indisponibilidades

Sistema para la gestión automatizada de indisponibilidades en entornos TI, orientado a mejorar la trazabilidad, tiempos de respuesta y cumplimiento de SLA.

---

## 📌 ¿Qué es este proyecto?

Esta aplicación permite registrar, gestionar y hacer seguimiento a incidentes (fallas o caídas de sistemas) dentro de una organización.

En lugar de llevar registros manuales o desordenados, este sistema centraliza toda la información en una sola plataforma, facilitando:

- El control de incidentes
- La trazabilidad de eventos
- La mejora en tiempos de respuesta
- El cumplimiento de SLA (acuerdos de nivel de servicio)

---

## 📸 Vista del sistema

A continuación se muestran algunas pantallas del sistema en funcionamiento:

### 🔐 Login (Inicio de sesión)
Pantalla donde el usuario ingresa sus credenciales.

![Login](docs/img/login.png)

---

### 🖥️ Dashboard (Pantalla principal)
Vista general del sistema donde se visualiza la información principal.

![Dashboard](docs/img/dashboard.png)

---

### 📝 Registro de incidentes
Formulario donde se registran nuevas incidencias.

![Registro](docs/img/registro_incidente.png)

---

### 📋 Lista de incidentes
Listado de todos los incidentes registrados con su estado.

![Lista](docs/img/lista_incidentes.png)

---

## 🚀 Funcionalidades principales

El sistema permite:

- Registrar nuevos incidentes
- Consultar incidentes existentes
- Editar información de incidentes
- Cambiar el estado (abierto, en proceso, cerrado)
- Hacer seguimiento de eventos
- Centralizar la información en un solo lugar

---

## 🏗️ ¿Cómo funciona el sistema?

El sistema sigue una arquitectura de tres partes:

# 🖥️ Bitácora de Indisponibilidades

Sistema para la gestión automatizada de indisponibilidades en entornos TI, orientado a mejorar la trazabilidad, tiempos de respuesta y cumplimiento de SLA.

---

## 📌 ¿Qué es este proyecto?

Esta aplicación permite registrar, gestionar y hacer seguimiento a incidentes (fallas o caídas de sistemas) dentro de una organización.

En lugar de llevar registros manuales o desordenados, este sistema centraliza toda la información en una sola plataforma, facilitando:

- El control de incidentes
- La trazabilidad de eventos
- La mejora en tiempos de respuesta
- El cumplimiento de SLA (acuerdos de nivel de servicio)

---

## 📸 Vista del sistema

A continuación se muestran algunas pantallas del sistema en funcionamiento:

### 🔐 Login (Inicio de sesión)
Pantalla donde el usuario ingresa sus credenciales.

![Login](docs/img/login.png)

---

### 🖥️ Dashboard (Pantalla principal)
Vista general del sistema donde se visualiza la información principal.

![Dashboard](docs/img/dashboard.png)

---

### 📝 Registro de incidentes
Formulario donde se registran nuevas incidencias.

![Registro](docs/img/registro_incidente.png)

---

### 📋 Lista de incidentes
Listado de todos los incidentes registrados con su estado.

![Lista](docs/img/lista_incidentes.png)

---

## 🚀 Funcionalidades principales

El sistema permite:

- Registrar nuevos incidentes
- Consultar incidentes existentes
- Editar información de incidentes
- Cambiar el estado (abierto, en proceso, cerrado)
- Hacer seguimiento de eventos
- Centralizar la información en un solo lugar

---

## 🏗️ ¿Cómo funciona el sistema?

El sistema sigue una arquitectura de tres partes:

Usuario → Frontend → Backend → Base de Datos



### Explicación sencilla:

1. El usuario interactúa con la interfaz (Frontend)
2. El Frontend envía solicitudes al Backend
3. El Backend procesa la información
4. Los datos se guardan en la Base de Datos
5. El sistema responde al usuario

---

### 📊 Diagrama del sistema

![Arquitectura](docs/img/arquitectura.png)

---

## 📊 Flujo de uso del sistema

1. El usuario inicia sesión
2. Registra un incidente
3. El sistema guarda la información
4. El incidente puede ser gestionado
5. Se actualiza su estado
6. Finalmente se cierra

---

## 🧱 Tecnologías utilizadas

### Frontend (Interfaz gráfica)
- React
- Vite
- TailwindCSS

### Backend (Lógica del sistema)
- Python
- FastAPI
- SQLAlchemy

### Base de Datos
- PostgreSQL

### Seguridad
- JWT (autenticación)
- Bcrypt (encriptación de contraseñas)

---

## 📂 Estructura del proyecto

El proyecto está organizado de la siguiente forma:

/backend → Código del servidor (API)
/frontend → Aplicación web (interfaz)
/docs → Documentación y manuales
/scripts → Scripts auxiliares



---

## ⚙️ ¿Cómo ejecutar el proyecto?

A continuación se explican los pasos para ejecutar el sistema desde cero.

---

### 🔹 1. Clonar el repositorio

Primero debes descargar el proyecto en tu computador:

```bash
git clone https://github.com/miguecarmona12/bitacora-indisponibilidades.git
cd bitacora-indisponibilidades



---

## ⚙️ ¿Cómo ejecutar el proyecto?

A continuación se explican los pasos para ejecutar el sistema desde cero.

---

### 🔹 1. Clonar el repositorio

Primero debes descargar el proyecto en tu computador:

```bash
git clone https://github.com/miguecarmona12/bitacora-indisponibilidades.git
cd bitacora-indisponibilidades

cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
.\venv\Scripts\activate

# Instalar dependencias
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] pydantic email-validator python-dotenv

# Ejecutar servidor
uvicorn main:app --reload

```bash

El backend quedará disponible en:
http://localhost:8000


🔹 3. Ejecutar el Frontend (Interfaz)

```bash

Abre otra terminal y ejecuta:

cd frontend

# Instalar dependencias
npm install

# Ejecutar aplicación
npm run dev

```bash

El frontend estará disponible en:
http://localhost:5173



🧪 Documentación de la API

FastAPI genera automáticamente documentación interactiva:

👉 http://localhost:8000/docs

Aquí puedes probar los endpoints del sistema.

🔐 Credenciales de prueba

Para ingresar al sistema:

Usuario: admin

Contraseña: admin123

📊 Objetivo del proyecto

Este proyecto busca:

Automatizar la gestión de incidentes

Reducir tiempos de respuesta

Mejorar la trazabilidad

Centralizar la información

Apoyar el cumplimiento de SLA

📈 Estado actual

🚧 Proyecto en desarrollo

👥 Autores

Miguel Ángel Carmona

Norbeys Martínez