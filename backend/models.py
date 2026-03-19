from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime

empresa_aplicacion = Table(
    'empresa_aplicacion', Base.metadata,
    Column('empresa_id', Integer, ForeignKey('empresas.id', ondelete="CASCADE"), primary_key=True),
    Column('aplicacion_id', Integer, ForeignKey('aplicaciones.id', ondelete="CASCADE"), primary_key=True)
)

class Empresa(Base):
    __tablename__ = "empresas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True)
    
    incidentes = relationship("Incidente", back_populates="empresa")
    usuarios = relationship("Usuario", back_populates="empresa")
    aplicaciones = relationship("Aplicacion", secondary=empresa_aplicacion, back_populates="empresas")

class Aplicacion(Base):
    __tablename__ = "aplicaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True)
    # empresa_id is deprecated and will be ignored/dropped
    empresa_id = Column(Integer, nullable=True) 
    
    empresas = relationship("Empresa", secondary=empresa_aplicacion, back_populates="aplicaciones")
    incidentes = relationship("Incidente", back_populates="aplicacion")

class Categoria(Base):
    __tablename__ = "categorias"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True)
    
    productos = relationship("Producto", back_populates="categoria")
    incidentes = relationship("Incidente", back_populates="categoria")

class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), unique=True, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True) # Ligado a Categoria
    
    categoria = relationship("Categoria", back_populates="productos")
    incidentes = relationship("Incidente", back_populates="producto")

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    rol = Column(String(20), nullable=False) # 'admin', 'tecnico', 'cliente'
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True) # Ligado a empresa si es cliente/tecnico restrictivo
    
    empresa = relationship("Empresa", back_populates="usuarios")
    incidentes_registrados = relationship("Incidente", back_populates="usuario")

class Incidente(Base):
    __tablename__ = "incidentes"
    
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    aplicacion_id = Column(Integer, ForeignKey("aplicaciones.id"), nullable=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    
    fecha_inicio = Column(DateTime, default=datetime.datetime.utcnow)
    duracion_minutos = Column(Float, nullable=False) # Duración de la caída
    motivo = Column(Text, nullable=True) # Razón o comentario adicional de la caída
    solucion = Column(Text, nullable=True) # Solución o acciones frente a la novedad
    ticket = Column(String(100), nullable=True) # Ticket/Caso reportado
    mes_reporte = Column(String(20), index=True) # Ej: "Abril 2024"
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # Quien registró la falla
    
    empresa = relationship("Empresa", back_populates="incidentes")
    aplicacion = relationship("Aplicacion", back_populates="incidentes")
    categoria = relationship("Categoria", back_populates="incidentes")
    producto = relationship("Producto", back_populates="incidentes")
    usuario = relationship("Usuario", back_populates="incidentes_registrados")
