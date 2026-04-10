from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db, SessionLocal  # 👈 IMPORTANTE
import models
import schemas
import auth
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from datetime import timedelta, datetime
from sqlalchemy import text

# Crear las tablas en la BD si no existen
models.Base.metadata.create_all(bind=engine)

# Script de inyección/migración de datos de prueba
try:
    with engine.connect() as conn:
        conn.execute(text("""
        INSERT INTO empresa_aplicacion (empresa_id, aplicacion_id)
        SELECT empresa_id, id FROM aplicaciones
        WHERE empresa_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM empresa_aplicacion ea
            WHERE ea.empresa_id = aplicaciones.empresa_id
            AND ea.aplicacion_id = aplicaciones.id
        )
        """))
        conn.commit()
except Exception as e:
    print("Migration check passed or failed:", e)

try:
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE aplicaciones ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)"
        ))
except Exception:
    pass


# ✅ FUNCIÓN CORREGIDA
def create_default_admin():
    db: Session = SessionLocal()
    try:
        admin_user = db.query(models.Usuario).filter(
            models.Usuario.username == "admin"
        ).first()

        if not admin_user:
            hashed_password = auth.get_password_hash("admin123")

            nuevo_admin = models.Usuario(
                username="admin",
                email="admin@localhost",
                hashed_password=hashed_password,
                rol="admin"
            )

            db.add(nuevo_admin)
            db.commit()
            print("✅ Admin creado correctamente")
        else:
            print("ℹ️ Admin ya existe")

    except Exception as e:
        print("❌ Error creando admin:", e)
    finally:
        db.close()


# 🚀 APP
app = FastAPI(title="Bitácora de Disponibilidad API")


# ✅ EVENTO STARTUP (CLAVE)
@app.on_event("startup")
def startup_event():
    create_default_admin()


# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)