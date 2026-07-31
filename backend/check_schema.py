import sqlite3
import sys
import os

def check_database_schema():
    db_path = "bitacora.db"
    
    if not os.path.exists(db_path):
        print(f"Database file '{db_path}' does not exist!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("=== Database Schema ===")
        print(f"Tables found: {len(tables)}")
        
        for table in tables:
            table_name = table[0]
            print(f"\nTable: {table_name}")
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            print("  Columns:")
            for col in columns:
                col_id, col_name, col_type, not_null, default_value, pk = col
                print(f"    - {col_name} ({col_type})")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            row_count = cursor.fetchone()[0]
            print(f"  Row count: {row_count}")
            
            # Show sample data for small tables
            if row_count > 0 and row_count <= 10:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5;")
                rows = cursor.fetchall()
                print(f"  Sample data (first {len(rows)} rows):")
                for row in rows:
                    print(f"    {row}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking database: {e}")

if __name__ == "__main__":
    check_database_schema()