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

El sistema sigue esta arquitectura:


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
4. El incidente es gestionado  
5. Se actualiza su estado  
6. Se cierra el incidente  

---

## 🧱 Tecnologías utilizadas

### Frontend
- React  
- Vite  
- TailwindCSS  

### Backend
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


/backend # API (servidor)
/frontend # Interfaz web
/docs # Documentación
/scripts # Scripts auxiliares


---

## ⚙️ ¿Cómo ejecutar el proyecto?

Sigue estos pasos para ejecutar el sistema desde cero.

---

### 🔹 1. Clonar el repositorio

```bash
git clone https://github.com/miguecarmona12/bitacora-indisponibilidades.git
cd bitacora-indisponibilidades
🔹 2. Ejecutar el Backend
Requisitos:

Python 3.10 o superior

PostgreSQL en ejecución

cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Instalar dependencias
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] pydantic email-validator python-dotenv

# Ejecutar servidor
uvicorn main:app --reload

El backend estará disponible en:
http://localhost:8000

🔹 3. Ejecutar el Frontend

Abre otra terminal y ejecuta:

cd frontend

# Instalar dependencias
npm install

# Ejecutar aplicación
npm run dev

El frontend estará disponible en:
http://localhost:5173

🧪 Documentación de la API

FastAPI genera documentación automática:

👉 http://localhost:8000/docs

Aquí puedes probar los endpoints del sistema.

🔐 Credenciales de prueba

Usuario: admin

Contraseña: admin123

📊 Objetivo del proyecto

Este proyecto busca:

Automatizar la gestión de incidentes

Reducir tiempos de respuesta

Mejorar la trazabilidad

Centralizar la información

Cumplir SLA

📈 Estado actual

🚧 Proyecto en desarrollo

👥 Autores

Miguel Ángel Carmona

Norbeys Martínez