from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from database import engine, get_db, SessionLocal
import models
import schemas
import auth
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from datetime import timedelta, datetime
from sqlalchemy import text
import re
import os
import sys
import io
import smtplib
from email.mime.text import MIMEText
from pathlib import Path
from loguru import logger
import json
from openpyxl import Workbook
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import urllib.parse
import urllib.request
from urllib.error import HTTPError, URLError
import google.generativeai as genai

logger.remove()
logger.add(sys.stdout, level="INFO", colorize=True)
logger.add("logs/bitacora.log", rotation="10 MB", retention="30 days", level="DEBUG", encoding="utf-8", enqueue=True)

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
    logger.warning(f"Migration check: {e}")

try:
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE aplicaciones ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)"
        ))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE incidentes ADD COLUMN tipo_afectacion VARCHAR(50)"
        ))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE incidentes ADD COLUMN origen_afectacion VARCHAR(50)"
        ))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE incidentes ADD COLUMN fecha_fin TIMESTAMP"
        ))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS feature_flags (
                id SERIAL PRIMARY KEY,
                flag VARCHAR(100) UNIQUE NOT NULL,
                activo BOOLEAN DEFAULT FALSE
            )
        """))
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

        # Password default or from env
        default_password = os.getenv("ADMIN_PASSWORD", "admin123")
        reset_password = os.getenv("RESET_ADMIN_PASSWORD", "false").lower() == "true"

        if not admin_user:
            hashed_password = auth.get_password_hash(default_password)
            nuevo_admin = models.Usuario(
                username="admin",
                email="admin@localhost",
                hashed_password=hashed_password,
                rol="admin"
            )
            db.add(nuevo_admin)
            db.commit()
            logger.info(f"Admin creado con contraseña: {default_password}")
        else:
            # Resetear contraseña si RESET_ADMIN_PASSWORD=true
            if reset_password:
                admin_user.hashed_password = auth.get_password_hash(default_password)
                admin_user.must_change_password = False
                db.commit()
                logger.info(f"Admin password resetada a: {default_password}")
            else:
                logger.info("Admin ya existe")

    except Exception as e:
        logger.error(f"Error admin: {e}")
    finally:
        db.close()


def get_ai_settings():
    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()
    api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    base_url = os.getenv("AI_BASE_URL")
    model = os.getenv("AI_MODEL")
    return provider, api_key, base_url, model


def openai_request(path: str, body: dict, api_key: str, base_url: str):
    if not base_url:
        raise RuntimeError("AI_BASE_URL no configurado en el backend")
    url = urllib.parse.urljoin(base_url if base_url.endswith("/") else base_url + "/", path.lstrip("/"))
    data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as e:
        content = e.read().decode("utf-8") if e.fp else ""
        raise RuntimeError(f"OpenAI request failed {e.code}: {content}")
    except URLError as e:
        raise RuntimeError(f"OpenAI request failed: {e.reason}")


def ensure_ai_config():
    provider, api_key, base_url, model = get_ai_settings()
    if provider == "gemini":
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurado en el backend")
        genai.configure(api_key=api_key)
        return provider, model or "gemini-2.5-flash"

    if provider in ["openai", "modelarts", "openai-compatible"]:
        if not api_key:
            raise HTTPException(status_code=500, detail="AI_API_KEY no configurado en el backend")
        if not base_url:
            raise HTTPException(status_code=500, detail="AI_BASE_URL no configurado en el backend")
        return provider, model or "gpt-3.5-turbo"

    raise HTTPException(status_code=500, detail=f"AI_PROVIDER desconocido: {provider}")


# ==============================
# APP
# ==============================
app = FastAPI(title="Bitácora API", docs_url=None, redoc_url=None, openapi_url=None)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ==============================
# CORS - MUST be first middleware
# ==============================
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [origin.strip() for origin in frontend_url.split(",")] if frontend_url else ["http://localhost:5173"]

# Agregar orígenes locales comunes de desarrollo (puertos correlativos de Vite)
puertos_adicionales = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
                       "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"]
for p in puertos_adicionales:
    if p not in origins:
        origins.append(p)

logger.info(f"FRONTEND_URL env: {os.getenv('FRONTEND_URL', 'NOT SET')}")
logger.info(f"CORS origins configured: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    create_default_admin()

# ==============================
# ROOT
# ==============================
@app.get("/")
def root():
    return {"ok": True}

@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

# ==============================
# FEATURE FLAGS
# ==============================
@app.get("/feature-flags", response_model=List[schemas.FeatureFlagResponse])
def get_feature_flags(db: Session = Depends(get_db)):
    flags = db.query(models.FeatureFlag).all()
    if not flags:
        defaults = [
            models.FeatureFlag(flag="chat_ia", activo=True),
            models.FeatureFlag(flag="onboarding", activo=True),
        ]
        for f in defaults: db.add(f)
        db.commit()
        flags = defaults
    return flags

@app.put("/feature-flags/{flag}", response_model=schemas.FeatureFlagResponse)
def update_feature_flag(flag: str, body: schemas.FeatureFlagUpdate, db: Session = Depends(get_db), usuario: models.Usuario = Depends(auth.get_current_user)):
    if usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    f = db.query(models.FeatureFlag).filter(models.FeatureFlag.flag == flag).first()
    if not f:
        raise HTTPException(status_code=404, detail="Flag no encontrada")
    f.activo = body.activo
    db.commit()
    db.refresh(f)
    return f

# ==============================
# LOGIN
# ==============================
@app.post("/token", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt: username={form_data.username}")
    user = db.query(models.Usuario).filter(
        models.Usuario.username == form_data.username
    ).first()

    if not user:
        logger.warning(f"User not found: {form_data.username}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    password_match = auth.verify_password(form_data.password, user.hashed_password)
    logger.info(f"Password verification: {password_match} (plain len={len(form_data.password)}, hash len={len(user.hashed_password)})")
    
    if not password_match:
        logger.warning(f"Password mismatch for user: {form_data.username}")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = auth.create_access_token(
        data={"sub": user.username, "rol": user.rol},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    logger.info(f"Login successful for: {form_data.username}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user.rol,
        "username": user.username,
        "empresa_id": user.empresa_id,
        "must_change_password": user.must_change_password
    }

@app.post("/refresh")
def refresh_token(
    request: Request,
    token: str = Depends(auth.oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = db.query(models.Usuario).filter(models.Usuario.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        new_token = auth.create_access_token(
            data={"sub": user.username, "rol": user.rol},
            expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": new_token, "token_type": "bearer"}
    except auth.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

@app.post("/logout")
def logout(
    token: str = Depends(auth.oauth2_scheme),
    db: Session = Depends(get_db)
):
    # Guardar token en blacklist
    blacklisted = models.TokenBlacklist(token=token)
    db.add(blacklisted)
    db.commit()
    return {"ok": True, "message": "Sesión cerrada correctamente"}

# ==============================
# USUARIOS
# ==============================
@app.post("/usuarios/change-password-first")
def change_password_first(datos: schemas.ChangePasswordRequest, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.username != datos.username:
        raise HTTPException(status_code=403, detail="No autorizado para cambiar esta contraseña")
        
    user = db.query(models.Usuario).filter(models.Usuario.username == datos.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if not auth.verify_password(datos.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
        
    auth.validate_password_strength(datos.new_password)
        
    user.hashed_password = auth.get_password_hash(datos.new_password)
    user.must_change_password = False
    db.commit()
    return {"ok": True, "message": "Contraseña actualizada exitosamente"}

@app.get("/usuarios", response_model=List[schemas.UsuarioResponse])
def get_usuarios(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    return db.query(models.Usuario).all()

@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def create_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    if db.query(models.Usuario).filter(models.Usuario.username == usuario.username).first():
        raise HTTPException(status_code=400, detail="Username ya existe")
    if db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email ya existe")
        
    auth.validate_password_strength(usuario.password)
    
    nuevo = models.Usuario(
        username=usuario.username,
        email=usuario.email,
        hashed_password=auth.get_password_hash(usuario.password),
        rol=usuario.rol,
        empresa_id=usuario.empresa_id
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
def update_usuario(usuario_id: int, datos: schemas.UsuarioAdminUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    usuario_db = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # 1. SEGURIDAD: Solo puedes editarte a ti mismo, a menos que seas ADMIN
    if current_user.id != usuario_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar este usuario")

    # 2. PROCESAR CAMPOS BÁSICOS (Cualquier usuario dueño de la cuenta)
    if datos.username is not None:
        usuario_db.username = datos.username
    if datos.email is not None:
        usuario_db.email = datos.email
    if datos.password is not None:
        auth.validate_password_strength(datos.password)
        usuario_db.hashed_password = auth.get_password_hash(datos.password)

    # 3. SEGURIDAD CRÍTICA: Campos Sensibles (Solo ADMIN)
    # Si alguien intenta cambiar ROL o EMPRESA_ID
    if datos.rol is not None or datos.empresa_id is not None:
        if current_user.rol == "admin":
            if datos.rol is not None: usuario_db.rol = datos.rol
            if datos.empresa_id is not None: usuario_db.empresa_id = datos.empresa_id
        else:
            # BLOQUEO: Un técnico intentó cambiarse el rol o empresa
            raise HTTPException(
                status_code=403, 
                detail="Solo un administrador puede cambiar el rol o la empresa asignada"
            )
    db.commit()
    db.refresh(usuario_db)
    return usuario_db

@app.delete("/usuarios/{usuario_id}")
def delete_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"ok": True}

# ==============================
# EMPRESAS
# ==============================
@app.get("/empresas", response_model=List[schemas.EmpresaResponse])
def get_empresas(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol == "cliente":
        return db.query(models.Empresa).filter(models.Empresa.id == current_user.empresa_id).all()
    elif current_user.rol == "tecnico" and current_user.empresa_id is not None:
        return db.query(models.Empresa).filter(models.Empresa.id == current_user.empresa_id).all()
    return db.query(models.Empresa).all()

@app.post("/empresas", response_model=schemas.EmpresaResponse)
def create_empresa(empresa: schemas.EmpresaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    if db.query(models.Empresa).filter(models.Empresa.nombre == empresa.nombre).first():
        raise HTTPException(status_code=400, detail="Empresa ya existe")
    nueva = models.Empresa(nombre=empresa.nombre)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.put("/empresas/{empresa_id}", response_model=schemas.EmpresaResponse)
def update_empresa(empresa_id: int, datos: schemas.EmpresaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    empresa.nombre = datos.nombre
    db.commit()
    db.refresh(empresa)
    return empresa

@app.delete("/empresas/{empresa_id}")
def delete_empresa(empresa_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    db.delete(empresa)
    db.commit()
    return {"ok": True}

# ==============================
# APLICACIONES
# ==============================
@app.get("/aplicaciones", response_model=List[schemas.AplicacionResponse])
def get_aplicaciones(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol == "cliente" or (current_user.rol == "tecnico" and current_user.empresa_id is not None):
        return db.query(models.Aplicacion).join(models.Aplicacion.empresas).filter(models.Empresa.id == current_user.empresa_id).all()
    return db.query(models.Aplicacion).all()

@app.post("/aplicaciones", response_model=schemas.AplicacionResponse)
def create_aplicacion(aplicacion: schemas.AplicacionCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    if db.query(models.Aplicacion).filter(models.Aplicacion.nombre == aplicacion.nombre).first():
        raise HTTPException(status_code=400, detail="Aplicación ya existe")
    nueva = models.Aplicacion(nombre=aplicacion.nombre)
    if aplicacion.empresa_ids:
        empresas = db.query(models.Empresa).filter(
            models.Empresa.id.in_(aplicacion.empresa_ids)
        ).all()
        nueva.empresas = empresas
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.put("/aplicaciones/{aplicacion_id}", response_model=schemas.AplicacionResponse)
def update_aplicacion(aplicacion_id: int, datos: schemas.AplicacionUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    aplicacion = db.query(models.Aplicacion).filter(models.Aplicacion.id == aplicacion_id).first()
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    if datos.nombre is not None:
        aplicacion.nombre = datos.nombre
    if datos.empresa_ids is not None:
        empresas = db.query(models.Empresa).filter(
            models.Empresa.id.in_(datos.empresa_ids)
        ).all()
        aplicacion.empresas = empresas
    db.commit()
    db.refresh(aplicacion)
    return aplicacion

@app.delete("/aplicaciones/{aplicacion_id}")
def delete_aplicacion(aplicacion_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    aplicacion = db.query(models.Aplicacion).filter(models.Aplicacion.id == aplicacion_id).first()
    if not aplicacion:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    db.delete(aplicacion)
    db.commit()
    return {"ok": True}

# ==============================
# CATEGORIAS
# ==============================
@app.get("/categorias", response_model=List[schemas.CategoriaResponse])
def get_categorias(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return db.query(models.Categoria).all()

@app.post("/categorias", response_model=schemas.CategoriaResponse)
def create_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    if db.query(models.Categoria).filter(models.Categoria.nombre == categoria.nombre).first():
        raise HTTPException(status_code=400, detail="Categoría ya existe")
    nueva = models.Categoria(nombre=categoria.nombre)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.put("/categorias/{categoria_id}", response_model=schemas.CategoriaResponse)
def update_categoria(categoria_id: int, datos: schemas.CategoriaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    categoria = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    categoria.nombre = datos.nombre
    db.commit()
    db.refresh(categoria)
    return categoria

@app.delete("/categorias/{categoria_id}")
def delete_categoria(categoria_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    categoria = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(categoria)
    db.commit()
    return {"ok": True}

# ==============================
# PRODUCTOS
# ==============================
@app.get("/productos", response_model=List[schemas.ProductoResponse])
def get_productos(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return db.query(models.Producto).all()

@app.post("/productos", response_model=schemas.ProductoResponse)
def create_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    if db.query(models.Producto).filter(models.Producto.nombre == producto.nombre).first():
        raise HTTPException(status_code=400, detail="Producto ya existe")
    nuevo = models.Producto(nombre=producto.nombre, categoria_id=producto.categoria_id)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.put("/productos/{producto_id}", response_model=schemas.ProductoResponse)
def update_producto(producto_id: int, datos: schemas.ProductoUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if datos.nombre is not None:
        producto.nombre = datos.nombre
    if datos.categoria_id is not None:
        producto.categoria_id = datos.categoria_id
    db.commit()
    db.refresh(producto)
    return producto

@app.delete("/productos/{producto_id}")
def delete_producto(producto_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
    return {"ok": True}

# ==============================
# INCIDENTES
# ==============================
@app.get("/incidentes", response_model=List[schemas.IncidenteResponse])
def get_incidentes(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    empresa_id: Optional[int] = None,
    aplicacion_id: Optional[int] = None,
    producto_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    q = db.query(models.Incidente)
    if current_user.rol != "admin":
        if current_user.empresa_id:
            q = q.filter(models.Incidente.empresa_id == current_user.empresa_id)
        else:
            q = q.filter(models.Incidente.usuario_id == current_user.id)
    if empresa_id:
        q = q.filter(models.Incidente.empresa_id == empresa_id)
    if aplicacion_id:
        q = q.filter(models.Incidente.aplicacion_id == aplicacion_id)
    if producto_id:
        q = q.filter(models.Incidente.producto_id == producto_id)
    if fecha_desde:
        q = q.filter(models.Incidente.fecha_inicio >= datetime.fromisoformat(fecha_desde))
    if fecha_hasta:
        q = q.filter(models.Incidente.fecha_inicio <= datetime.fromisoformat(fecha_hasta))
    return q.all()

@app.post("/incidentes", response_model=schemas.IncidenteResponse)
def create_incidente(incidente: schemas.IncidenteCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):
    if current_user.rol == "tecnico" and current_user.empresa_id is not None:
        if incidente.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No autorizado para registrar incidentes en otra empresa")
    if incidente.fecha_inicio > datetime.now():
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser futura")
    if incidente.fecha_fin and incidente.fecha_fin < incidente.fecha_inicio:
        raise HTTPException(status_code=400, detail="La fecha de fin no puede ser anterior a la de inicio")
    nuevo = models.Incidente(**incidente.dict())
    nuevo.usuario_id = current_user.id
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    enviar_notificacion_incidente(nuevo, db)
    return nuevo

@app.post("/incidentes/bulk", response_model=List[schemas.IncidenteResponse])
def create_incidentes_bulk(incidentes: List[schemas.IncidenteCreate], db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):
    if current_user.rol == "tecnico" and current_user.empresa_id is not None:
        for i in incidentes:
            if i.empresa_id != current_user.empresa_id:
                raise HTTPException(status_code=403, detail="No autorizado para registrar incidentes en otra empresa")
    nuevos = []
    for i in incidentes:
        n = models.Incidente(**i.dict())
        n.usuario_id = current_user.id
        nuevos.append(n)
    db.add_all(nuevos)
    db.commit()
    for n in nuevos:
        db.refresh(n)
    return nuevos

@app.put("/incidentes/{incidente_id}", response_model=schemas.IncidenteResponse)
def update_incidente(incidente_id: int, datos: schemas.IncidenteUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):
    incidente = db.query(models.Incidente).filter(models.Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    if current_user.rol == "tecnico" and current_user.empresa_id is not None:
        if incidente.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No autorizado para modificar incidentes de otra empresa")
        if datos.empresa_id is not None and datos.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No autorizado para cambiar el incidente a otra empresa")
    if datos.fecha_inicio and datos.fecha_inicio > datetime.now():
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser futura")
    if datos.fecha_fin and datos.fecha_inicio and datos.fecha_fin < datos.fecha_inicio:
        raise HTTPException(status_code=400, detail="La fecha de fin no puede ser anterior a la de inicio")
    for field, value in datos.dict(exclude_unset=True).items():
        setattr(incidente, field, value)
    db.commit()
    db.refresh(incidente)
    return incidente

@app.delete("/incidentes/{incidente_id}")
def delete_incidente(incidente_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):
    incidente = db.query(models.Incidente).filter(models.Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    if current_user.rol == "tecnico" and current_user.empresa_id is not None:
        if incidente.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No autorizado para eliminar incidentes de otra empresa")
    db.delete(incidente)
    db.commit()
    return {"ok": True}


# ==============================
# EXPORTAR INCIDENTES A EXCEL
# ==============================
@app.get("/incidentes/exportar")
def exportar_incidentes(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    q = db.query(models.Incidente)
    if current_user.rol != "admin":
        if current_user.empresa_id:
            q = q.filter(models.Incidente.empresa_id == current_user.empresa_id)
        else:
            q = q.filter(models.Incidente.usuario_id == current_user.id)
    incidentes = q.order_by(models.Incidente.fecha_inicio.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Incidentes"
    ws.append(["ID", "Empresa", "Aplicación", "Categoría", "Producto",
               "Fecha Inicio", "Fecha Fin", "Duración (min)", "Motivo",
               "Solución", "Ticket", "Tipo Afectación", "Origen", "Usuario"])

    for i in incidentes:
        ws.append([
            i.id,
            i.empresa.nombre if i.empresa else "",
            i.aplicacion.nombre if i.aplicacion else "",
            i.categoria.nombre if i.categoria else "",
            i.producto.nombre if i.producto else "",
            i.fecha_inicio.strftime("%d/%m/%Y %H:%M") if i.fecha_inicio else "",
            i.fecha_fin.strftime("%d/%m/%Y %H:%M") if i.fecha_fin else "",
            i.duracion_minutos,
            i.motivo or "",
            i.solucion or "",
            i.ticket or "",
            i.tipo_afectacion or "",
            i.origen_afectacion or "",
            i.usuario.username if i.usuario else "",
        ])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=incidentes.xlsx"}
    )

# ==============================
# ADJUNTOS (ARCHIVOS)
# ==============================
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/incidentes/{incidente_id}/adjuntos", response_model=List[schemas.AdjuntoResponse])
def listar_adjuntos(incidente_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return db.query(models.Adjunto).filter(models.Adjunto.incidente_id == incidente_id).all()

@app.post("/incidentes/{incidente_id}/adjuntos", response_model=schemas.AdjuntoResponse)
def subir_adjunto(
    incidente_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))
):
    ext = Path(file.filename).suffix
    nombre_unico = f"{incidente_id}_{int(datetime.now().timestamp())}{ext}"
    ruta = UPLOAD_DIR / nombre_unico
    with open(ruta, "wb") as f:
        f.write(file.file.read())
    adj = models.Adjunto(incidente_id=incidente_id, filename=file.filename, filepath=str(ruta))
    db.add(adj)
    db.commit()
    db.refresh(adj)
    return adj

@app.delete("/adjuntos/{adjunto_id}")
def eliminar_adjunto(adjunto_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):
    adj = db.query(models.Adjunto).filter(models.Adjunto.id == adjunto_id).first()
    if not adj:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    if os.path.exists(adj.filepath):
        os.remove(adj.filepath)
    db.delete(adj)
    db.commit()
    return {"ok": True}

@app.get("/adjuntos/{adjunto_id}/descargar")
def descargar_adjunto(adjunto_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    adj = db.query(models.Adjunto).filter(models.Adjunto.id == adjunto_id).first()
    if not adj or not os.path.exists(adj.filepath):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(adj.filepath, filename=adj.filename)

# ==============================
# NOTIFICACIONES EMAIL
# ==============================
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@bitacora.local")

def enviar_notificacion_incidente(incidente, db: Session):
    if not SMTP_HOST:
        return
    try:
        tecnicos = db.query(models.Usuario).filter(models.Usuario.rol.in_(["admin", "tecnico"])).all()
        destinatarios = [u.email for u in tecnicos if u.email]
        if not destinatarios:
            return
        msg = MIMEText(
            f"Nuevo incidente registrado:\n\n"
            f"ID: {incidente.id}\n"
            f"Empresa: {incidente.empresa.nombre if incidente.empresa else 'N/A'}\n"
            f"Aplicación: {incidente.aplicacion.nombre if incidente.aplicacion else 'N/A'}\n"
            f"Duración: {incidente.duracion_minutos} min\n"
            f"Motivo: {incidente.motivo or 'N/A'}\n"
            f"Registrado por: {incidente.usuario.username if incidente.usuario else 'N/A'}"
        )
        msg["Subject"] = f"[Bitácora] Nuevo incidente #{incidente.id}"
        msg["From"] = EMAIL_FROM
        msg["To"] = ", ".join(destinatarios)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USER:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, destinatarios, msg.as_string())
        logger.info(f"Notificación enviada a {len(destinatarios)} destinatarios")
    except Exception as e:
        logger.error(f"Error al enviar email: {e}")

# ==============================
# AI INTELLIGENT AGENT ENDPOINTS
# ==============================

@app.post("/api/ai/analizar", response_model=schemas.IncidenteExtraidoResponse)
def analizar_incidente_ia(
    datos: schemas.AIPromptRequest,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))
):
    # 1. Obtener catálogos de la BD
    empresas = db.query(models.Empresa).all()
    aplicaciones = db.query(models.Aplicacion).all()
    categorias = db.query(models.Categoria).all()
    productos = db.query(models.Producto).all()
    
    empresas_list = [{"id": e.id, "nombre": e.nombre} for e in empresas]
    aplicaciones_list = [{"id": a.id, "nombre": a.nombre} for a in aplicaciones]
    categorias_list = [{"id": c.id, "nombre": c.nombre} for c in categorias]
    productos_list = [{"id": p.id, "nombre": p.nombre, "categoria_id": p.categoria_id} for p in productos]
    
    # Restricción: Si el usuario es técnico y está asignado a una empresa, forzar esa empresa
    empresa_fijada_id = current_user.empresa_id if current_user.rol == "tecnico" else None
    
    # 2. Configurar proveedor de IA
    provider, api_key, base_url, model_name = get_ai_settings()
    provider, model_name = ensure_ai_config()
    
    fecha_actual_iso = datetime.now().isoformat()
    
    # Generar texto instructivo
    empresa_restrictive_rule = ""
    if empresa_fijada_id:
        empresa_restrictive_rule = f"IMPORTANTE: El usuario actual es un técnico limitado a la empresa con ID {empresa_fijada_id}. Por lo tanto, el empresa_id DEBE ser {empresa_fijada_id}."

    system_instruction = f"""
    Eres Bita, el asistente inteligente de la aplicación. Tu tarea es analizar un reporte de caída de servicio / indisponibilidad escrito en lenguaje natural y estructurarlo en un objeto JSON correspondiente a un incidente.
    
    Fecha y hora de referencia actual del servidor: {fecha_actual_iso}
    
    CATÁLOGOS ACTUALES EN LA BASE DE DATOS (Usa estrictamente estos IDs para los registros existentes):
    - Empresas (Proveedores/Redes): {json.dumps(empresas_list)}
    - Aplicaciones: {json.dumps(aplicaciones_list)}
    - Categorías: {json.dumps(categorias_list)}
    - Productos: {json.dumps(productos_list)}
    
    REGLAS DE EXTRACCIÓN Y MAPEO:
    1. Identifica la Empresa (proveedor/red) afectada. Si coincide semánticamente (ej: "Claro Colombia" o "Red Claro" -> "Claro"), asocia su `empresa_id`.
       {empresa_restrictive_rule}
    2. Identifica la Aplicación afectada.
       - Si el usuario indica explícitamente "aplicación" o "app" o "aplicativo" (ej: "afectación aplicación invictus"), debes mapearlo a la aplicación.
       - Si ya existe en la lista, asocia su `aplicacion_id`.
       - Si NO existe en el catálogo, pon `aplicacion_id` como null y coloca el nombre en `nueva_aplicacion_nombre`.
       - Si NO se menciona ni se infiere ninguna aplicación, pon `aplicacion_id` como null y establece `nueva_aplicacion_nombre` exactamente como "SIN APP".
    3. Identifica el Producto afectado.
       - Si el usuario indica explícitamente "producto" (ej: "producto recargas metro"), debes mapearlo al producto.
       - Si el producto ya existe en la lista, asocia su `producto_id` y su `categoria_id`.
       - Si el producto NO existe en el catálogo, pon `producto_id` como null y coloca el nombre en `nuevo_producto_nombre`.
       - Si el producto es nuevo, debes determinar su categoría. Revisa las categorías existentes y asocia la que mejor se adapte en `categoria_id`. Si ninguna categoría se adapta, pon `categoria_id` como null y sugiere un nombre de categoría nuevo en `nueva_categoria_nombre`.
       - Si NO se menciona ni se infiere ningún producto, pon `producto_id` como null y establece `nuevo_producto_nombre` exactamente como "SIN PROD".
    4. REGLA ESTRICTA DE DIFERENCIACIÓN:
       - No confundas aplicaciones con productos. Si el prompt dice "aplicación invictus", "invictus" es una Aplicación, por lo tanto debes poner `nueva_aplicacion_nombre = "invictus"` y `nuevo_producto_nombre = "SIN PROD"`. No lo crees como producto.
       - Si el prompt dice "producto recargas metro", "recargas metro" es un Producto, por lo tanto debes poner `nuevo_producto_nombre = "recargas metro"` y `nueva_aplicacion_nombre = "SIN APP"`. No lo crees como aplicación.
    5. Convierte descripciones relativas de fecha/hora de inicio y fin (ej: "hace 30 minutos", "hoy a las 9:15am", "ayer en la noche") en fechas exactas en formato ISO 8601 (YYYY-MM-DDTHH:MM:SS) utilizando la fecha de referencia del servidor. Si no se puede inferir una fecha/hora de finalización (`fecha_fin`), calcúlala sumando `duracion_minutos` a la `fecha_inicio`.
    6. Extrae la duración. Si se indica en horas (ej: "1.5 horas"), conviértela a minutos (ej: 90). El campo `duracion_minutos` es numérico.
    7. Determina el mes y año del reporte en el campo `mes_reporte` en español con formato "NombreMes Año" (ej: "Mayo 2026"), basándote en la fecha del incidente.
    8. Extrae el 'motivo' y la 'solucion' del texto. Si no se menciona una solución, pon null.
    9. Extrae el número de ticket (ej: "INC0032912" o "ticket 12345") en el campo `ticket` si se menciona. Si no, pon null.
    10. Identifica el tipo de afectación en `tipo_afectacion`:
        - Si el texto indica que el servicio se cayó por completo, quedó offline o no funciona del todo, pon "Caída Total".
        - Si el texto indica inestabilidad, lentitud, intermitencias o que funciona a ratos, pon "Intermitencia".
        - Por defecto, si no se especifica la naturaleza de la falla, pon "Caída Total".
    11. Identifica el origen de la afectación en `origen_afectacion`:
        - Si la falla fue causada por un proveedor externo, aliado, operador móvil, corte de fibra externo o vencimiento de certificados del proveedor, pon "Aliado / Tercero".
        - Si la falla fue interna, por ejemplo el servidor de la empresa se llenó de memoria, base de datos bloqueada, errores de código propios o mantenimiento interno, pon "Interna".
        - Por defecto, si no es claro quién la causó, pon "Aliado / Tercero".
        
    Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
    {{
      "empresa_id": integer o null,
      "aplicacion_id": integer o null,
      "categoria_id": integer o null,
      "producto_id": integer o null,
      "nuevo_producto_nombre": string o null,
      "nueva_categoria_nombre": string o null,
      "nueva_aplicacion_nombre": string o null,
      "fecha_inicio": "YYYY-MM-DDTHH:MM:SS",
      "fecha_fin": "YYYY-MM-DDTHH:MM:SS" o null,
      "duracion_minutos": number,
      "motivo": string o null,
      "solucion": string o null,
      "ticket": string o null,
      "mes_reporte": "NombreMes Año",
      "tipo_afectacion": "Caída Total" | "Intermitencia" | null,
      "origen_afectacion": "Aliado / Tercero" | "Interna" | null
    }}
    """
    
    try:
        if provider == "gemini":
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
            
            raw_schema = {
                "type": "OBJECT",
                "properties": {
                    "empresa_id": {"type": "INTEGER", "nullable": True},
                    "aplicacion_id": {"type": "INTEGER", "nullable": True},
                    "categoria_id": {"type": "INTEGER", "nullable": True},
                    "producto_id": {"type": "INTEGER", "nullable": True},
                    "nuevo_producto_nombre": {"type": "STRING", "nullable": True},
                    "nueva_categoria_nombre": {"type": "STRING", "nullable": True},
                    "nueva_aplicacion_nombre": {"type": "STRING", "nullable": True},
                    "fecha_inicio": {"type": "STRING", "description": "ISO 8601 string format YYYY-MM-DDTHH:MM:SS"},
                    "fecha_fin": {"type": "STRING", "description": "ISO 8601 string format YYYY-MM-DDTHH:MM:SS", "nullable": True},
                    "duracion_minutos": {"type": "NUMBER"},
                    "motivo": {"type": "STRING", "nullable": True},
                    "solucion": {"type": "STRING", "nullable": True},
                    "ticket": {"type": "STRING", "nullable": True},
                    "mes_reporte": {"type": "STRING"},
                    "tipo_afectacion": {"type": "STRING", "enum": ["Caída Total", "Intermitencia"], "nullable": True},
                    "origen_afectacion": {"type": "STRING", "enum": ["Aliado / Tercero", "Interna"], "nullable": True}
                },
                "required": ["fecha_inicio", "duracion_minutos", "mes_reporte"]
            }
            
            response = model.generate_content(
                f"Analiza e identifica los datos de indisponibilidad en el siguiente reporte: '{datos.prompt}'",
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=raw_schema
                )
            )
            parsed_data = json.loads(response.text)
        else:
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Analiza e identifica los datos de indisponibilidad en el siguiente reporte: '{datos.prompt}'"}
            ]
            body = {
                "model": model_name,
                "messages": messages,
                "response_format": {"type": "json_object"},
                "temperature": 0.1,
                "max_tokens": 2000
            }
            result = openai_request("chat/completions", body, api_key, base_url)
            raw_content = result["choices"][0]["message"].get("content", "")
            if not raw_content or raw_content.isspace():
                raise RuntimeError("La IA devolvió una respuesta vacía")
            try:
                parsed_data = json.loads(raw_content)
            except json.JSONDecodeError:
                m = re.search(r'\{.*\}', raw_content, re.DOTALL)
                if m:
                    parsed_data = json.loads(m.group())
                else:
                    parsed_data = {"empresa_id": None}
        
        # Validación extra: si el técnico tiene empresa_id, forzarlo
        if empresa_fijada_id:
            parsed_data["empresa_id"] = empresa_fijada_id
            
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar con IA: {str(e)}")


@app.post("/api/ai/chat", response_model=schemas.AIChatResponse)
def chat_asesor_ia(
    chat_req: schemas.AIChatRequest,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    # 1. Consultar catálogos
    empresas = db.query(models.Empresa).all()
    aplicaciones = db.query(models.Aplicacion).all()
    categorias = db.query(models.Categoria).all()
    productos = db.query(models.Producto).all()
    
    empresas_list = [{"id": e.id, "nombre": e.nombre} for e in empresas]
    aplicaciones_list = [{"id": a.id, "nombre": a.nombre} for a in aplicaciones]
    categorias_list = [{"id": c.id, "nombre": c.nombre} for c in categorias]
    productos_list = [{"id": p.id, "nombre": p.nombre, "categoria_id": p.categoria_id} for p in productos]
    
    # 2. RAG - Historial de incidentes para dar sugerencias basadas en el histórico
    query_incidentes = db.query(models.Incidente)
    if current_user.rol in ["cliente", "tecnico"] and current_user.empresa_id is not None:
        query_incidentes = query_incidentes.filter(models.Incidente.empresa_id == current_user.empresa_id)
        
    incidentes_db = query_incidentes.order_by(models.Incidente.fecha_inicio.desc()).limit(30).all()
    
    historial_incidentes_text = ""
    for idx, inc in enumerate(incidentes_db):
        emp = inc.empresa.nombre if inc.empresa else "N/A"
        app = inc.aplicacion.nombre if inc.aplicacion else "N/A"
        cat = inc.categoria.nombre if inc.categoria else "N/A"
        prod = inc.producto.nombre if inc.producto else "N/A"
        fecha_str = inc.fecha_inicio.strftime("%d/%m/%Y %H:%M") if inc.fecha_inicio else "N/A"
        historial_incidentes_text += (
            f"{idx+1}. Fecha: {fecha_str} | Red/Empresa: {emp} | App: {app} | Categoría: {cat} | "
            f"Producto: {prod} | Motivo: {inc.motivo or 'N/A'} | Solución: {inc.solucion or 'N/A'} | Duración: {inc.duracion_minutos} min\n"
        )
    
    # 3. Configurar proveedor de IA
    provider, api_key, base_url, model_name = get_ai_settings()
    provider, model_name = ensure_ai_config()
    
    fecha_actual_iso = datetime.now().isoformat()
    empresa_fijada_id = current_user.empresa_id if current_user.rol == "tecnico" else None
    
    empresa_restrictive_rule_chat = ""
    if empresa_fijada_id:
        empresa_restrictive_rule_chat = f"- IMPORTANTE: Como el usuario es técnico de la empresa {empresa_fijada_id}, el empresa_id en la extracción debe ser obligatoriamente {empresa_fijada_id}."

    # 4. Diseñar System Instruction para clasificar y responder
    system_instruction = f"""
    Eres Bita, el asistente inteligente y amigable de esta aplicación. Tu personalidad es servicial, cálida y conversacional, como un colega experto que siempre está dispuesto a ayudar. Además de ser una enciclopedia de soporte TI, puedes conversar sobre temas generales de tecnología, responder preguntas cotidianas y asistir en cualquier duda sobre el funcionamiento de la app. Tus roles principales son:
    
    1. ASESOR TÉCNICO Y DE HISTÓRICOS (RAG):
       - Si el usuario te hace preguntas sobre errores técnicos (ej: error 502, falla de enlace, etc.) o consultas sobre el histórico de caídas, revisa el HISTORIAL DE INCIDENTES DEL SISTEMA provisto abajo.
       - Si encuentras incidentes similares en el historial, menciónalos y explica qué solución se aplicó en el pasado. Ej: "Veo en el histórico que el 15/05/2026 se solucionó una caída de Nginx reiniciando el servicio...".
       - Si no hay coincidencias directas en el historial, responde con tus conocimientos técnicos generales recomendando mejores prácticas para diagnosticar y solucionar el error planteado.
       
    2. DETECTOR DE REGISTROS DE INCIDENTES:
       - Analiza la última entrada del usuario. Si el usuario describe un incidente ocurrido recientemente para que sea registrado (ej: "Quiero registrar que hoy a las 8 am...", o "Tuvimos una caída en la red Claro de 2 horas por falla de fibra..."), debes hacer lo siguiente:
         - Establece `incident_detected = true`.
         - Extrae la información estructurada del incidente en `extracted_data` siguiendo los catálogos y reglas detalladas abajo.
         - En el campo `response`, da un saludo cordial y dile que has detectado un incidente y que puede confirmarlo en la tarjeta que aparece abajo.
       - Si el usuario solo está conversando, preguntando soluciones o no está reportando un incidente específico para registrar, establece `incident_detected = false`, `extracted_data = null` y responde de forma conversacional/técnica en `response`.
       
    DATOS DEL USUARIO ACTUAL:
    - Nombre: {current_user.username}
    - Rol: {current_user.rol}
    - Empresa Asignada: {current_user.empresa_id or 'Todas (Administrador)'}
    
    HISTORIAL DE INCIDENTES REGISTRADOS EN EL SISTEMA (Usa esto para responder preguntas de soporte basadas en el histórico):
    {historial_incidentes_text or 'No hay incidentes registrados actualmente en el sistema.'}
    
    CATÁLOGOS ACTUALES DE LA BASE DE DATOS (Para extracción de incidentes):
    - Empresas (Proveedores): {json.dumps(empresas_list)}
    - Aplicaciones: {json.dumps(aplicaciones_list)}
    - Categorías: {json.dumps(categorias_list)}
    - Productos: {json.dumps(productos_list)}
    
    REGLAS DE EXTRACCIÓN PARA 'extracted_data':
    - Rige bajo las mismas normas de análisis de fecha y mapeo semántico.
    - Fecha de referencia del servidor: {fecha_actual_iso}
    {empresa_restrictive_rule_chat}
    - Identifica la Aplicación afectada:
      - Si el usuario indica explícitamente "aplicación" o "app" o "aplicativo" (ej: "afectación aplicación invictus"), debes mapearlo a la aplicación.
      - Si ya existe en la lista, asocia su `aplicacion_id`.
      - Si NO existe en el catálogo, pon `aplicacion_id` como null y coloca el nombre en `nueva_aplicacion_nombre`.
      - Si NO se menciona ni se infiere ninguna aplicación, pon `aplicacion_id` como null y establece `nueva_aplicacion_nombre` exactamente como "SIN APP".
    - Identifica el Producto afectado:
      - Si el usuario indica explícitamente "producto" (ej: "producto recargas metro"), debes mapearlo al producto.
      - Si el producto ya existe en la lista, asocia su `producto_id` y su `categoria_id`.
      - Si el producto NO existe en el catálogo, pon `producto_id` como null y coloca el nombre en `nuevo_producto_nombre`.
      - Si el producto es nuevo, debes determinar su categoría. Revisa las categorías existentes y asocia la que mejor se adapte en `categoria_id`. Si ninguna categoría se adapta, pon `categoria_id` como null y sugiere un nombre de categoría nuevo en `nueva_categoria_nombre`.
      - Si NO se menciona ni se infiere ningún producto, pon `producto_id` como null y establece `nuevo_producto_nombre` exactamente como "SIN PROD".
    - REGLA ESTRICTA DE DIFERENCIACIÓN:
      - No confundas aplicaciones con productos. Si el prompt dice "aplicación invictus", "invictus" es una Aplicación, por lo tanto debes poner `nueva_aplicacion_nombre = "invictus"` y `nuevo_producto_nombre = "SIN PROD"`. No lo crees como producto.
      - Si el prompt dice "producto recargas metro", "recargas metro" es un Producto, por lo tanto debes poner `nuevo_producto_nombre = "recargas metro"` y `nueva_aplicacion_nombre = "SIN APP"`. No lo crees como aplicación.
    - Identifica el tipo de afectación en `tipo_afectacion`:
      - Si se cayó por completo, quedó fuera de línea o no funciona en absoluto, pon "Caída Total".
      - Si presenta inestabilidades, intermitencias o lentitud, pon "Intermitencia".
      - Por defecto, pon "Caída Total".
    - Identifica el origen de la afectación en `origen_afectacion`:
      - Si es por fallas de un proveedor externo, aliado, operador, corte de fibra del proveedor o vencimiento de certificados ajenos, pon "Aliado / Tercero".
      - Si es por fallas internas de la empresa, servidor propio lleno de memoria, bugs locales, etc., pon "Interna".
      - Por defecto, pon "Aliado / Tercero".
    - Convierte descripciones relativas de fecha/hora de inicio y fin (ej: "hace 30 minutos", "hoy a las 9:15am", "ayer en la noche") en fechas exactas en formato ISO 8601 (YYYY-MM-DDTHH:MM:SS) utilizando la fecha de referencia del servidor. Si no se puede inferir una fecha/hora de finalización (`fecha_fin`), calcúlala sumando `duracion_minutos` a la `fecha_inicio`.
    - Extrae la duración. Si se indica en horas (ej: "1.5 horas"), conviértela a minutos (ej: 90). El campo `duracion_minutos` es numérico.
    - Determina el mes y año del reporte en el campo `mes_reporte` en español con formato "NombreMes Año" (ej: "Mayo 2026"), basándote en la fecha del incidente.
    
    Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
    {{
      "response": "string (tu respuesta conversacional)",
      "incident_detected": true o false,
      "extracted_data": {{
        "empresa_id": integer o null,
        "aplicacion_id": integer o null,
        "categoria_id": integer o null,
        "producto_id": integer o null,
        "nuevo_producto_nombre": string o null,
        "nueva_categoria_nombre": string o null,
        "nueva_aplicacion_nombre": string o null,
        "fecha_inicio": "YYYY-MM-DDTHH:MM:SS",
        "fecha_fin": "YYYY-MM-DDTHH:MM:SS" o null,
        "duracion_minutos": number,
        "motivo": string o null,
        "solucion": string o null,
        "ticket": string o null,
        "mes_reporte": "NombreMes Año",
        "tipo_afectacion": "Caída Total" | "Intermitencia" | null,
        "origen_afectacion": "Aliado / Tercero" | "Interna" | null
      }} o null
    }}
    """
    
    try:
        if provider == "gemini":
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
            
            contents = []
            for msg in chat_req.messages[:-1]:
                role = 'user' if msg.role == 'user' else 'model'
                contents.append({"role": role, "parts": [{"text": msg.content}]})
            
            ultimo_mensaje = chat_req.messages[-1].content
            contents.append({"role": "user", "parts": [{"text": ultimo_mensaje}]})
            
            raw_schema = {
                "type": "OBJECT",
                "properties": {
                    "response": {"type": "STRING", "description": "Respuesta conversacional al usuario."},
                    "incident_detected": {"type": "BOOLEAN", "description": "Si se detectó que el usuario reporta un incidente."},
                    "extracted_data": {
                        "type": "OBJECT",
                        "nullable": True,
                        "properties": {
                            "empresa_id": {"type": "INTEGER", "nullable": True},
                            "aplicacion_id": {"type": "INTEGER", "nullable": True},
                            "categoria_id": {"type": "INTEGER", "nullable": True},
                            "producto_id": {"type": "INTEGER", "nullable": True},
                            "nuevo_producto_nombre": {"type": "STRING", "nullable": True},
                            "nueva_categoria_nombre": {"type": "STRING", "nullable": True},
                            "nueva_aplicacion_nombre": {"type": "STRING", "nullable": True},
                            "fecha_inicio": {"type": "STRING", "description": "ISO 8601 string format YYYY-MM-DDTHH:MM:SS"},
                            "fecha_fin": {"type": "STRING", "description": "ISO 8601 string format YYYY-MM-DDTHH:MM:SS", "nullable": True},
                            "duracion_minutos": {"type": "NUMBER"},
                            "motivo": {"type": "STRING", "nullable": True},
                            "solucion": {"type": "STRING", "nullable": True},
                            "ticket": {"type": "STRING", "nullable": True},
                            "mes_reporte": {"type": "STRING"},
                            "tipo_afectacion": {"type": "STRING", "enum": ["Caída Total", "Intermitencia"], "nullable": True},
                            "origen_afectacion": {"type": "STRING", "enum": ["Aliado / Tercero", "Interna"], "nullable": True}
                        },
                        "required": ["fecha_inicio", "duracion_minutos", "mes_reporte"]
                    }
                },
                "required": ["response", "incident_detected"]
            }
            
            response = model.generate_content(
                contents,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=raw_schema
                )
            )
            parsed_res = json.loads(response.text)
        else:
            messages = [{"role": "system", "content": system_instruction}]
            for msg in chat_req.messages:
                role = "assistant" if msg.role == "model" else msg.role
                messages.append({"role": role, "content": msg.content})
            
            body = {
                "model": model_name,
                "messages": messages,
                "response_format": {"type": "json_object"},
                "temperature": 0.1,
                "max_tokens": 4000
            }
            result = openai_request("chat/completions", body, api_key, base_url)
            raw_content = result["choices"][0]["message"].get("content", "")
            if not raw_content or raw_content.isspace():
                raise RuntimeError("La IA devolvió una respuesta vacía")
            try:
                parsed_res = json.loads(raw_content)
            except json.JSONDecodeError:
                m = re.search(r'\{.*\}', raw_content, re.DOTALL)
                if m:
                    parsed_res = json.loads(m.group())
                else:
                    parsed_res = {"response": raw_content, "incident_detected": False, "extracted_data": None}
        
        # Forzar empresa_id del técnico
        if parsed_res.get("incident_detected") and parsed_res.get("extracted_data") and empresa_fijada_id:
            parsed_res["extracted_data"]["empresa_id"] = empresa_fijada_id
            
        return parsed_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el chat de IA: {str(e)}")


@app.post("/api/ai/registrar", response_model=schemas.IncidenteResponse)
def registrar_incidente_ia(
    datos: schemas.IncidenteExtraidoResponse,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))
):
    # 1. Validaciones de empresa para técnicos
    if current_user.rol == "tecnico" and current_user.empresa_id is not None:
        if datos.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No autorizado para registrar incidentes en otra empresa")

    # 2. Validaciones de creación de entidades para técnicos (analistas)
    if current_user.rol != "admin":
        has_new_app = datos.nueva_aplicacion_nombre and datos.nueva_aplicacion_nombre.strip() and datos.nueva_aplicacion_nombre.strip().upper() != "SIN APP"
        has_new_prod = datos.nuevo_producto_nombre and datos.nuevo_producto_nombre.strip() and datos.nuevo_producto_nombre.strip().upper() != "SIN PROD"
        if has_new_app or has_new_prod:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para crear nuevas aplicaciones o productos. Comunícate con el administrador para que sean creados."
            )

    # 3. Resolver/Crear Aplicación si aplica
    aplicacion_id = datos.aplicacion_id
    app_nombre = datos.nueva_aplicacion_nombre.strip() if datos.nueva_aplicacion_nombre else None
    if not aplicacion_id:
        if not app_nombre:
            app_nombre = "SIN APP"
        
        aplicacion_db = db.query(models.Aplicacion).filter(
            models.Aplicacion.nombre.ilike(app_nombre)
        ).first()
        if not aplicacion_db:
            aplicacion_db = models.Aplicacion(nombre=app_nombre)
            if datos.empresa_id:
                empresa_db = db.query(models.Empresa).filter(models.Empresa.id == datos.empresa_id).first()
                if empresa_db:
                    aplicacion_db.empresas.append(empresa_db)
            db.add(aplicacion_db)
            db.commit()
            db.refresh(aplicacion_db)
        aplicacion_id = aplicacion_db.id

    # 3. Resolver/Crear Categoría si aplica
    categoria_id = datos.categoria_id
    if datos.nueva_categoria_nombre:
        nombre_cat = datos.nueva_categoria_nombre.strip()
        categoria_db = db.query(models.Categoria).filter(
            models.Categoria.nombre.ilike(nombre_cat)
        ).first()
        if not categoria_db:
            categoria_db = models.Categoria(nombre=nombre_cat)
            db.add(categoria_db)
            db.commit()
            db.refresh(categoria_db)
        categoria_id = categoria_db.id

    # 4. Resolver/Crear Producto si aplica
    producto_id = datos.producto_id
    prod_nombre = datos.nuevo_producto_nombre.strip() if datos.nuevo_producto_nombre else None
    if not producto_id:
        if not prod_nombre:
            prod_nombre = "SIN PROD"
            
        producto_db = db.query(models.Producto).filter(
            models.Producto.nombre.ilike(prod_nombre)
        ).first()
        if not producto_db:
            if not categoria_id:
                primera_cat = db.query(models.Categoria).first()
                if primera_cat:
                    categoria_id = primera_cat.id
                else:
                    general_cat = models.Categoria(nombre="General")
                    db.add(general_cat)
                    db.commit()
                    db.refresh(general_cat)
                    categoria_id = general_cat.id
            
            producto_db = models.Producto(nombre=prod_nombre, categoria_id=categoria_id)
            db.add(producto_db)
            db.commit()
            db.refresh(producto_db)
        producto_id = producto_db.id

    # 5. Crear el registro del Incidente
    nuevo_incidente = models.Incidente(
        empresa_id=datos.empresa_id,
        aplicacion_id=aplicacion_id,
        categoria_id=categoria_id,
        producto_id=producto_id,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
        duracion_minutos=datos.duracion_minutos,
        motivo=datos.motivo,
        solucion=datos.solucion,
        ticket=datos.ticket,
        mes_reporte=datos.mes_reporte,
        usuario_id=current_user.id,
        tipo_afectacion=datos.tipo_afectacion,
        origen_afectacion=datos.origen_afectacion
    )
    
    db.add(nuevo_incidente)
    db.commit()
    db.refresh(nuevo_incidente)
    return nuevo_incidente
