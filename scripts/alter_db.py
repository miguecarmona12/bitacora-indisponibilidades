from sqlalchemy import text
from database import engine

def alter_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE productos ADD COLUMN empresa_id INTEGER REFERENCES empresas(id);"))
            conn.commit()
            print("Columna empresa_id añadida exitosamente.")
    except Exception as e:
        print(f"La columna probablemente ya existe o hubo un error: {e}")

alter_db()
