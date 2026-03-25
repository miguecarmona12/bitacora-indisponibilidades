from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
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
        conn.execute(text("INSERT INTO empresa_aplicacion (empresa_id, aplicacion_id) SELECT empresa_id, id FROM aplicaciones WHERE empresa_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM empresa_aplicacion ea WHERE ea.empresa_id = aplicaciones.empresa_id AND ea.aplicacion_id = aplicaciones.id)"))
        conn.commit()
except Exception as e:
    print("Migration check passed or failed:", e)

try:
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE aplicaciones ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)"))
except Exception:
    pass


def create_default_admin():
    db = next(get_db())
    admin_user = db.query(models.Usuario).filter(
        models.Usuario.username == "admin").first()
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


try:
    create_default_admin()
except Exception as e:
    print("Error creando admin:", e)

app = FastAPI(title="Bitácora de Disponibilidad API")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "API de Bitácora iniciada correctamente (Con Seguridad JWT)"}

# === RUTAS DE AUTENTICACION ===


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(
        models.Usuario.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "rol": user.rol}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rol": user.rol,
        "username": user.username,
        "empresa_id": user.empresa_id
    }


@app.get("/users/me", response_model=schemas.UsuarioResponse)
def read_users_me(current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return current_user

# === RUTAS DE GESTION DE USUARIOS (Solo Admin) ===


@app.get("/usuarios", response_model=List[schemas.UsuarioResponse])
def get_usuarios(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    return db.query(models.Usuario).all()


@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def create_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_user = db.query(models.Usuario).filter(
        models.Usuario.username == usuario.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Usuario ya registrado")
    hashed_password = auth.get_password_hash(usuario.password)
    nuevo_usuario = models.Usuario(
        username=usuario.username,
        email=usuario.email,
        hashed_password=hashed_password,
        rol=usuario.rol,
        empresa_id=usuario.empresa_id
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@app.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
def update_usuario(usuario_id: int, usuario_update: schemas.UsuarioUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_user = db.query(models.Usuario).filter(
        models.Usuario.id == usuario_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario_update.username is not None:
        existing = db.query(models.Usuario).filter(
            models.Usuario.username == usuario_update.username,
            models.Usuario.id != usuario_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="El nombre de usuario ya está en uso")
        db_user.username = usuario_update.username

    if usuario_update.email is not None:
        db_user.email = usuario_update.email

    if usuario_update.rol is not None:
        db_user.rol = usuario_update.rol

    # empresa_id puede ser None para desasignar
    if 'empresa_id' in usuario_update.model_fields_set:
        db_user.empresa_id = usuario_update.empresa_id

    if usuario_update.password is not None:
        db_user.hashed_password = auth.get_password_hash(
            usuario_update.password)

    db.commit()
    db.refresh(db_user)
    return db_user


@app.delete("/usuarios/{usuario_id}")
def delete_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    if current_user.id == usuario_id:
        raise HTTPException(
            status_code=400, detail="No puedes eliminar tu propia cuenta")
    db_user = db.query(models.Usuario).filter(
        models.Usuario.id == usuario_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(db_user)
    db.commit()
    return {"detail": "Usuario eliminado"}

# === RUTAS PARA EMPRESAS ===


@app.get("/empresas", response_model=List[schemas.EmpresaResponse])
def get_empresas(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return db.query(models.Empresa).all()


@app.post("/empresas", response_model=schemas.EmpresaResponse)
def create_empresa(empresa: schemas.EmpresaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_empresa = db.query(models.Empresa).filter(
        models.Empresa.nombre == empresa.nombre).first()
    if db_empresa:
        raise HTTPException(status_code=400, detail="Empresa ya registrada")
    nueva_empresa = models.Empresa(nombre=empresa.nombre)
    db.add(nueva_empresa)
    db.commit()
    db.refresh(nueva_empresa)
    return nueva_empresa


@app.put("/empresas/{empresa_id}", response_model=schemas.EmpresaResponse)
def update_empresa(empresa_id: int, empresa_update: schemas.EmpresaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_empresa = db.query(models.Empresa).filter(
        models.Empresa.id == empresa_id).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    db_empresa.nombre = empresa_update.nombre
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

# === RUTAS PARA APLICACIONES ===


@app.get("/aplicaciones", response_model=List[schemas.AplicacionResponse])
def get_aplicaciones(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return db.query(models.Aplicacion).all()


@app.post("/aplicaciones", response_model=schemas.AplicacionResponse)
def create_aplicacion(aplicacion: schemas.AplicacionCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_aplicacion = db.query(models.Aplicacion).filter(
        models.Aplicacion.nombre == aplicacion.nombre).first()
    if db_aplicacion:
        raise HTTPException(status_code=400, detail="Aplicación ya registrada")
    nueva_aplicacion = models.Aplicacion(nombre=aplicacion.nombre)
    if aplicacion.empresa_ids:
        empresas_vinculadas = db.query(models.Empresa).filter(
            models.Empresa.id.in_(aplicacion.empresa_ids)).all()
        nueva_aplicacion.empresas.extend(empresas_vinculadas)
    db.add(nueva_aplicacion)
    db.commit()
    db.refresh(nueva_aplicacion)
    return nueva_aplicacion


@app.put("/aplicaciones/{aplicacion_id}", response_model=schemas.AplicacionResponse)
def update_aplicacion(aplicacion_id: int, aplicacion_update: schemas.AplicacionUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_aplicacion = db.query(models.Aplicacion).filter(
        models.Aplicacion.id == aplicacion_id).first()
    if not db_aplicacion:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    if aplicacion_update.nombre is not None:
        db_aplicacion.nombre = aplicacion_update.nombre
    if aplicacion_update.empresa_ids is not None:
        db_aplicacion.empresas.clear()
        if aplicacion_update.empresa_ids:
            empresas_vinculadas = db.query(models.Empresa).filter(
                models.Empresa.id.in_(aplicacion_update.empresa_ids)).all()
            db_aplicacion.empresas.extend(empresas_vinculadas)
    db.commit()
    db.refresh(db_aplicacion)
    return db_aplicacion

# === RUTAS PARA CATEGORÍAS ===


@app.get("/categorias", response_model=List[schemas.CategoriaResponse])
def get_categorias(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return db.query(models.Categoria).all()


@app.post("/categorias", response_model=schemas.CategoriaResponse)
def create_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_categoria = db.query(models.Categoria).filter(
        models.Categoria.nombre == categoria.nombre).first()
    if db_categoria:
        raise HTTPException(status_code=400, detail="Categoría ya registrada")
    nueva_categoria = models.Categoria(nombre=categoria.nombre)
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    return nueva_categoria


@app.put("/categorias/{categoria_id}", response_model=schemas.CategoriaResponse)
def update_categoria(categoria_id: int, categoria_update: schemas.CategoriaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_categoria = db.query(models.Categoria).filter(
        models.Categoria.id == categoria_id).first()
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db_categoria.nombre = categoria_update.nombre
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

# === RUTAS PARA PRODUCTOS ===


@app.get("/productos", response_model=List[schemas.ProductoResponse])
def get_productos(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    return db.query(models.Producto).all()


@app.post("/productos", response_model=schemas.ProductoResponse)
def create_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_producto = db.query(models.Producto).filter(
        models.Producto.nombre == producto.nombre).first()
    if db_producto:
        raise HTTPException(status_code=400, detail="Producto ya registrado")
    nuevo_producto = models.Producto(
        nombre=producto.nombre, categoria_id=producto.categoria_id)
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto


@app.put("/productos/{producto_id}", response_model=schemas.ProductoResponse)
def update_producto(producto_id: int, producto_update: schemas.ProductoUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No autorizado")
    db_producto = db.query(models.Producto).filter(
        models.Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    update_data = producto_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_producto, key, value)
    db.commit()
    db.refresh(db_producto)
    return db_producto

# === RUTAS PARA INCIDENTES (Bitácora) ===


@app.get("/incidentes", response_model=List[schemas.IncidenteResponse])
def get_incidentes(db: Session = Depends(get_db), mes: str = None, current_user: models.Usuario = Depends(auth.get_current_active_user)):
    query = db.query(models.Incidente)
    if current_user.rol == 'cliente':
        query = query.filter(models.Incidente.empresa_id ==
                             current_user.empresa_id)
    if mes:
        query = query.filter(models.Incidente.mes_reporte == mes)
    return query.all()


@app.post("/incidentes", response_model=schemas.IncidenteResponse)
def create_incidente(incidente: schemas.IncidenteCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol == 'cliente':
        raise HTTPException(
            status_code=403, detail="Los clientes no pueden crear incidentes")
    nuevo_incidente = models.Incidente(
        empresa_id=incidente.empresa_id,
        aplicacion_id=incidente.aplicacion_id,
        categoria_id=incidente.categoria_id,
        producto_id=incidente.producto_id,
        fecha_inicio=incidente.fecha_inicio,
        duracion_minutos=incidente.duracion_minutos,
        motivo=incidente.motivo,
        solucion=incidente.solucion,
        ticket=incidente.ticket,
        mes_reporte=incidente.mes_reporte,
        usuario_id=current_user.id
    )
    db.add(nuevo_incidente)
    db.commit()
    db.refresh(nuevo_incidente)
    return nuevo_incidente


@app.post("/incidentes/bulk", response_model=List[schemas.IncidenteResponse])
def create_incidentes_bulk(incidentes: List[schemas.IncidenteCreate], db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol == 'cliente':
        raise HTTPException(
            status_code=403, detail="Los clientes no pueden crear incidentes")
    creados = []
    for inc in incidentes:
        nuevo_incidente = models.Incidente(
            empresa_id=inc.empresa_id,
            aplicacion_id=inc.aplicacion_id,
            categoria_id=inc.categoria_id,
            producto_id=inc.producto_id,
            fecha_inicio=inc.fecha_inicio,
            duracion_minutos=inc.duracion_minutos,
            motivo=inc.motivo,
            solucion=inc.solucion,
            ticket=inc.ticket,
            mes_reporte=inc.mes_reporte,
            usuario_id=current_user.id
        )
        db.add(nuevo_incidente)
        creados.append(nuevo_incidente)
    db.commit()
    for inc in creados:
        db.refresh(inc)
    return creados


@app.delete("/incidentes/{incidente_id}")
def delete_incidente(incidente_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol != 'admin':
        raise HTTPException(
            status_code=403, detail="Sin permisos para eliminar incidentes")
    incidente = db.query(models.Incidente).filter(
        models.Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    db.delete(incidente)
    db.commit()
    return {"detail": "Incidente eliminado"}


@app.put("/incidentes/{incidente_id}", response_model=schemas.IncidenteResponse)
def update_incidente(incidente_id: int, incidente_update: schemas.IncidenteUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):
    if current_user.rol not in ['admin', 'tecnico']:
        raise HTTPException(
            status_code=403, detail="Sin permisos para editar incidentes")
    db_incidente = db.query(models.Incidente).filter(
        models.Incidente.id == incidente_id).first()
    if not db_incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    update_data = incidente_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_incidente, key, value)
    db.commit()
    db.refresh(db_incidente)
    return db_incidente
