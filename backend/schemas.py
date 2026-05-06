from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

# --- EMPRESA ---


class EmpresaBase(BaseModel):
    nombre: str


class EmpresaCreate(EmpresaBase):
    pass


class EmpresaUpdate(BaseModel):
    nombre: str


class EmpresaResponse(EmpresaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- APLICACION ---
class AplicacionBase(BaseModel):
    nombre: str


class AplicacionCreate(AplicacionBase):
    empresa_ids: List[int] = []


class AplicacionUpdate(BaseModel):
    nombre: str | None = None
    empresa_ids: List[int] | None = None


class AplicacionResponse(AplicacionBase):
    id: int
    empresas: List[EmpresaResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- CATEGORIA ---
class CategoriaBase(BaseModel):
    nombre: str


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    nombre: str


class CategoriaResponse(CategoriaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- PRODUCTO ---
class ProductoBase(BaseModel):
    nombre: str
    categoria_id: int


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    categoria_id: int | None = None


class ProductoResponse(ProductoBase):
    id: int
    categoria: Optional[CategoriaResponse] = None
    model_config = ConfigDict(from_attributes=True)


# --- INCIDENTE ---
class IncidenteBase(BaseModel):
    empresa_id: int | None = None
    aplicacion_id: int | None = None
    categoria_id: int | None = None
    producto_id: int | None = None
    fecha_inicio: datetime
    duracion_minutos: float
    motivo: str | None = None
    solucion: str | None = None
    ticket: str | None = None
    mes_reporte: str


class IncidenteUpdate(BaseModel):
    empresa_id: int | None = None
    aplicacion_id: int | None = None
    categoria_id: int | None = None
    producto_id: int | None = None
    duracion_minutos: float | None = None
    motivo: str | None = None
    solucion: str | None = None
    ticket: str | None = None


class UsuarioBase(BaseModel):
    username: str
    email: str
    rol: str
    empresa_id: int | None = None


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioResponse(UsuarioBase):
    id: int
    must_change_password: bool = True
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    rol: str
    username: str
    empresa_id: int | None = None
    must_change_password: bool = True


class TokenData(BaseModel):
    username: str | None = None


class IncidenteCreate(IncidenteBase):
    pass


class IncidenteResponse(IncidenteBase):
    id: int
    usuario_id: int | None = None
    empresa: Optional[EmpresaResponse] = None
    aplicacion: Optional[AplicacionResponse] = None
    categoria: Optional[CategoriaResponse] = None
    producto: Optional[ProductoResponse] = None
    usuario: Optional[UsuarioResponse] = None
    model_config = ConfigDict(from_attributes=True)


# --- Usuarios ---
class UsuarioUpdate(BaseModel):
    username:   Optional[str] = None
    email:      Optional[str] = None
    password:   Optional[str] = None
    rol:        Optional[str] = None
    empresa_id: Optional[int] = None

class ChangePasswordRequest(BaseModel):
    username: str
    old_password: str
    new_password: str
