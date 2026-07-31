#!/usr/bin/env python3
import sys
import os
sys.path.append('.')

from sqlalchemy import create_engine, inspect, func, select
from sqlalchemy.orm import sessionmaker
from models import Base, Aplicacion, Empresa, Usuario, empresa_aplicacion

# Configurar conexión a la base de datos (usando la misma configuración que main.py)
DATABASE_URL = "sqlite:///./bitacora.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print('=== Consulta de base de datos ===')

# Contar aplicaciones
app_count = db.query(func.count(Aplicacion.id)).scalar()
print(f'Total de aplicaciones en la base de datos: {app_count}')

# Listar todas las aplicaciones
apps = db.query(Aplicacion).all()
print(f'\nLista completa de aplicaciones:')
for app in apps:
    print(f'  - ID: {app.id}, Nombre: {app.nombre}, Empresa ID (deprecated): {app.empresa_id}')

# Ver estructura de la tabla empresa_aplicacion
inspector = inspect(engine)
if 'empresa_aplicacion' in inspector.get_table_names():
    print(f'\nTabla empresa_aplicacion existe')
    # Contar relaciones
    rel_count = db.query(func.count(empresa_aplicacion.c.aplicacion_id)).scalar()
    print(f'Total de relaciones empresa-aplicación: {rel_count}')
    
    # Mostrar todas las relaciones
    if rel_count > 0:
        print(f'\nTodas las relaciones empresa-aplicación:')
        stmt = select(empresa_aplicacion)
        results = db.execute(stmt).fetchall()
        for row in results:
            print(f'  Empresa ID: {row.empresa_id}, Aplicación ID: {row.aplicacion_id}')
            
            # Obtener nombres
            empresa = db.query(Empresa).filter(Empresa.id == row.empresa_id).first()
            aplicacion = db.query(Aplicacion).filter(Aplicacion.id == row.aplicacion_id).first()
            if empresa and aplicacion:
                print(f'    Empresa: {empresa.nombre}, Aplicación: {aplicacion.nombre}')
else:
    print(f'\nTabla empresa_aplicacion NO existe')

# Ver empresas
empresas = db.query(Empresa).all()
print(f'\nTotal de empresas: {len(empresas)}')
for emp in empresas:
    print(f'  - ID: {emp.id}, Nombre: {emp.nombre}')

# Ver usuarios
users = db.query(Usuario).limit(10).all()
print(f'\nPrimeros 10 usuarios:')
for user in users:
    print(f'  - ID: {user.id}, Username: {user.username}, Rol: {user.rol}, Empresa ID: {user.empresa_id}')

db.close()