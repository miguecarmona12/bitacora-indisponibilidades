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
import re
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
            print(f"Admin creado con contraseña: {default_password}")
        else:
            # Resetear contraseña si RESET_ADMIN_PASSWORD=true
            if reset_password:
                admin_user.hashed_password = auth.get_password_hash(default_password)
                admin_user.must_change_password = False
                db.commit()
                print(f"Admin password resetada a: {default_password}")
            else:
                print("Admin ya existe")

    except Exception as e:
        print("Error admin:", e)
    finally:
        db.close()

# ==============================
# APP
# ==============================
app = FastAPI(title="Bitácora API", docs_url=None, redoc_url=None, openapi_url=None)

# ==============================
# CORS - MUST be first middleware
# ==============================
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [origin.strip() for origin in frontend_url.split(",")] if frontend_url else ["http://localhost:5173"]

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

# ==============================
# LOGIN
# ==============================
@app.post("/token", response_model=schemas.Token)
def login(
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
def get_incidentes(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol == "cliente":
        return db.query(models.Incidente).filter(models.Incidente.empresa_id == current_user.empresa_id).all()
    elif current_user.rol == "tecnico" and current_user.empresa_id is not None:
        return db.query(models.Incidente).filter(models.Incidente.empresa_id == current_user.empresa_id).all()
    return db.query(models.Incidente).all()

@app.post("/incidentes", response_model=schemas.IncidenteResponse)
def create_incidente(incidente: schemas.IncidenteCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):
    if current_user.rol == "tecnico" and current_user.empresa_id is not None:
        if incidente.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No autorizado para registrar incidentes en otra empresa")
    nuevo = models.Incidente(**incidente.dict())
    nuevo.usuario_id = current_user.id
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
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