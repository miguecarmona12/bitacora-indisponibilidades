from pydantic import BaseModel, ConfigDict ,EmailStr
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
    fecha_fin: Optional[datetime] = None
    duracion_minutos: float
    motivo: str | None = None
    solucion: str | None = None
    ticket: str | None = None
    mes_reporte: str
    tipo_afectacion: Optional[str] = None
    origen_afectacion: Optional[str] = None


class IncidenteUpdate(BaseModel):
    empresa_id: int | None = None
    aplicacion_id: int | None = None
    categoria_id: int | None = None
    producto_id: int | None = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    duracion_minutos: float | None = None
    motivo: str | None = None
    solucion: str | None = None
    ticket: str | None = None
    tipo_afectacion: Optional[str] = None
    origen_afectacion: Optional[str] = None


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



# --- AUTENTICACIÓN ---
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

# --- ACTUALIZACIÓN DE USUARIO (DIFERENCIADA) ---

# Esto es lo que el usuario común puede editar (su perfil)
class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    # NOTA: NO incluimos 'rol' ni 'empresa_id' aquí para evitar Mass Assignment.

# Esto es lo que SOLO el admin enviará desde el panel de administración
class UsuarioAdminUpdate(UsuarioUpdate):
    rol: Optional[str] = None
    empresa_id: Optional[int] = None


class ChangePasswordRequest(BaseModel):
    username: str
    old_password: str
    new_password: str


# --- AI ENDPOINTS SCHEMAS ---

class AIPromptRequest(BaseModel):
    prompt: str


class IncidenteExtraidoResponse(BaseModel):
    empresa_id: Optional[int] = None
    aplicacion_id: Optional[int] = None
    categoria_id: Optional[int] = None
    producto_id: Optional[int] = None
    
    # Entidades nuevas a crear si no existen en la BD
    nuevo_producto_nombre: Optional[str] = None
    nueva_categoria_nombre: Optional[str] = None
    nueva_aplicacion_nombre: Optional[str] = None
    
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    duracion_minutos: float
    motivo: Optional[str] = None
    solucion: Optional[str] = None
    ticket: Optional[str] = None
    mes_reporte: str
    tipo_afectacion: Optional[str] = None
    origen_afectacion: Optional[str] = None


class AIChatMessage(BaseModel):
    role: str  # 'user' o 'model'
    content: str


class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]


class AIChatResponse(BaseModel):
    response: str
    incident_detected: bool  # Indica si se detectó una intención de reportar indisponibilidad
    extracted_data: Optional[IncidenteExtraidoResponse] = None

