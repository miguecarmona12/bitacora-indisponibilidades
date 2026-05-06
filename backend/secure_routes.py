import re
import os

filepath = os.path.join("backend", "main.py")
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Define the replacements
replacements = [
    # Usuarios (Admin solo)
    (r'def get_usuarios\(db: Session = Depends\(get_db\)\):', 
     r'def get_usuarios(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def create_usuario\(usuario: schemas\.UsuarioCreate, db: Session = Depends\(get_db\)\):',
     r'def create_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def update_usuario\(usuario_id: int, datos: schemas\.UsuarioUpdate, db: Session = Depends\(get_db\)\):',
     r'def update_usuario(usuario_id: int, datos: schemas.UsuarioUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def delete_usuario\(usuario_id: int, db: Session = Depends\(get_db\)\):',
     r'def delete_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),

    # Empresas
    (r'def get_empresas\(db: Session = Depends\(get_db\)\):',
     r'def get_empresas(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):'),
    (r'def create_empresa\(empresa: schemas\.EmpresaCreate, db: Session = Depends\(get_db\)\):',
     r'def create_empresa(empresa: schemas.EmpresaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def update_empresa\(empresa_id: int, datos: schemas\.EmpresaUpdate, db: Session = Depends\(get_db\)\):',
     r'def update_empresa(empresa_id: int, datos: schemas.EmpresaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def delete_empresa\(empresa_id: int, db: Session = Depends\(get_db\)\):',
     r'def delete_empresa(empresa_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),

    # Aplicaciones
    (r'def get_aplicaciones\(db: Session = Depends\(get_db\)\):',
     r'def get_aplicaciones(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):'),
    (r'def create_aplicacion\(aplicacion: schemas\.AplicacionCreate, db: Session = Depends\(get_db\)\):',
     r'def create_aplicacion(aplicacion: schemas.AplicacionCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def update_aplicacion\(aplicacion_id: int, datos: schemas\.AplicacionUpdate, db: Session = Depends\(get_db\)\):',
     r'def update_aplicacion(aplicacion_id: int, datos: schemas.AplicacionUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def delete_aplicacion\(aplicacion_id: int, db: Session = Depends\(get_db\)\):',
     r'def delete_aplicacion(aplicacion_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),

    # Categorias
    (r'def get_categorias\(db: Session = Depends\(get_db\)\):',
     r'def get_categorias(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):'),
    (r'def create_categoria\(categoria: schemas\.CategoriaCreate, db: Session = Depends\(get_db\)\):',
     r'def create_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def update_categoria\(categoria_id: int, datos: schemas\.CategoriaUpdate, db: Session = Depends\(get_db\)\):',
     r'def update_categoria(categoria_id: int, datos: schemas.CategoriaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def delete_categoria\(categoria_id: int, db: Session = Depends\(get_db\)\):',
     r'def delete_categoria(categoria_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),

    # Productos
    (r'def get_productos\(db: Session = Depends\(get_db\)\):',
     r'def get_productos(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):'),
    (r'def create_producto\(producto: schemas\.ProductoCreate, db: Session = Depends\(get_db\)\):',
     r'def create_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def update_producto\(producto_id: int, datos: schemas\.ProductoUpdate, db: Session = Depends\(get_db\)\):',
     r'def update_producto(producto_id: int, datos: schemas.ProductoUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),
    (r'def delete_producto\(producto_id: int, db: Session = Depends\(get_db\)\):',
     r'def delete_producto(producto_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin"]))):'),

    # Incidentes
    (r'def get_incidentes\(db: Session = Depends\(get_db\)\):',
     r'def get_incidentes(db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_active_user)):'),
    (r'def create_incidente\(incidente: schemas\.IncidenteCreate, db: Session = Depends\(get_db\)\):',
     r'def create_incidente(incidente: schemas.IncidenteCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):'),
    (r'def create_incidentes_bulk\(incidentes: List\[schemas\.IncidenteCreate\], db: Session = Depends\(get_db\)\):',
     r'def create_incidentes_bulk(incidentes: List[schemas.IncidenteCreate], db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):'),
    (r'def update_incidente\(incidente_id: int, datos: schemas\.IncidenteUpdate, db: Session = Depends\(get_db\)\):',
     r'def update_incidente(incidente_id: int, datos: schemas.IncidenteUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):'),
    (r'def delete_incidente\(incidente_id: int, db: Session = Depends\(get_db\)\):',
     r'def delete_incidente(incidente_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.require_role(["admin", "tecnico"]))):'),
]

for search, replace in replacements:
    content = re.sub(search, replace, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rutas aseguradas correctamente.")
