import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def alter_table():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE;"))
            print("Columna must_change_password agregada correctamente.")
        except Exception as e:
            if "already exists" in str(e).lower() or "ya existe" in str(e).lower() or "duplicada" in str(e).lower():
                print("La columna ya existe.")
            else:
                print(f"Error al agregar la columna: {e}")
        
        try:
            conn.execute(text("UPDATE usuarios SET must_change_password = FALSE;"))
            print("Usuarios existentes actualizados a FALSE.")
        except Exception as e:
            print(f"Error al actualizar usuarios: {e}")

if __name__ == "__main__":
    alter_table()
