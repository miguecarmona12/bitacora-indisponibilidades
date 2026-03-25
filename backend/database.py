from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
import time
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Obtener URL de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bitacora")

# Configurar engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

# Crear sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

def get_db():
    """Obtiene una sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_db_connection():
    """Prueba la conexión a la base de datos"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
            logger.info("✅ Conexión a base de datos exitosa")
            return True
    except Exception as e:
        logger.error(f"❌ Error de conexión: {e}")
        return False

def init_db():
    """Inicializa la base de datos creando las tablas"""
    logger.info("🔄 Inicializando base de datos...")
    max_retries = 5
    
    for attempt in range(max_retries):
        try:
            # Probar conexión
            if test_db_connection():
                # Importar modelos aquí para evitar circular imports
                try:
                    from models import Base as ModelsBase
                except ImportError:
                    # Si no hay modelos definidos, crear al menos una tabla de ejemplo
                    logger.warning("No se encontraron modelos, creando tabla de ejemplo...")
                    
                    # Crear una tabla de ejemplo si no existen modelos
                    from sqlalchemy import Column, Integer, String, DateTime
                    from datetime import datetime
                    
                    class Example(Base):
                        __tablename__ = "example"
                        id = Column(Integer, primary_key=True, index=True)
                        name = Column(String, unique=True, index=True)
                        created_at = Column(DateTime, default=datetime.utcnow)
                
                # Crear todas las tablas
                Base.metadata.create_all(bind=engine)
                logger.info("✅ Base de datos inicializada correctamente")
                return True
        except Exception as e:
            logger.warning(f"Intento {attempt + 1}/{max_retries} falló: {e}")
            if attempt < max_retries - 1:
                logger.info(f"Reintentando en 5 segundos...")
                time.sleep(5)
            else:
                logger.error("❌ No se pudo conectar a la base de datos")
                raise e
    
    return False

# Ejecutar init_db si se ejecuta directamente
if __name__ == "__main__":
    init_db()