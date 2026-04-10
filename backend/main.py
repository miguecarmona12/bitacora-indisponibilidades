from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, SessionLocal
import models
import schemas
import auth
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from datetime import timedelta
from sqlalchemy import text

# ==============================
# CREAR TABLAS
# ==============================
models.Base.metadata.create_all(bind=engine)

# ==============================
# MIGRACIONES
# ==============================
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
    print("Migration check:", e)

try:
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE aplicaciones ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)"
        ))
except Exception:
    pass

# ==============================
# CREAR ADMIN
# ==============================
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
            print(" Admin creado")
        else:
            print(" Admin ya existe")

    except Exception as e:
        print(" Error admin:", e)
    finally:
        db.close()

# ==============================
# APP
# ==============================
app = FastAPI(title="Bitácora API")

@app.on_event("startup")
def startup_event():
    create_default_admin()

# ==============================
# CORS
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # IMPORTANTE para EC2
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# ROOT
# ==============================
@app.get("/")
def root():
    return {"ok": True}

# ==============================
# LOGIN
# ==============================
@app.post("/token", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.Usuario).filter(
        models.Usuario.username == form_data.username
    ).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = auth.create_access_token(
        data={"sub": user.username, "rol": user.rol},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user.rol,
        "username": user.username,
        "empresa_id": user.empresa_id
    }

# ==============================
# USUARIOS
# ==============================
@app.get("/usuarios", response_model=List[schemas.UsuarioResponse])
def usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

# ==============================
# EMPRESAS
# ==============================
@app.get("/empresas")
def empresas(db: Session = Depends(get_db)):
    return db.query(models.Empresa).all()

# ==============================
# APLICACIONES
# ==============================
@app.get("/aplicaciones")
def aplicaciones(db: Session = Depends(get_db)):
    return db.query(models.Aplicacion).all()

# ==============================
# CATEGORIAS
# ==============================
@app.get("/categorias")
def categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).all()

# ==============================
# PRODUCTOS
# ==============================
@app.get("/productos")
def productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).all()

# ==============================
# INCIDENTES
# ==============================
@app.get("/incidentes")
def incidentes(db: Session = Depends(get_db)):
    return db.query(models.Incidente).all()