import os
from dotenv import load_dotenv
import sqlite3
from contextlib import contextmanager

load_dotenv()

CONN_STRING = os.getenv("NEON_CONNECTION_STRING") or os.getenv("DATABASE_URL")

pool = None
use_sqlite = False

if CONN_STRING:
    try:
        from psycopg_pool import ConnectionPool
        pool = ConnectionPool(CONN_STRING, min_size=1, max_size=5)

        def get_connection():
            return pool.connection()

    except Exception:
        try:
            import psycopg

            def get_connection():
                return psycopg.connect(CONN_STRING)

        except Exception:
            use_sqlite = True
else:
    use_sqlite = True

if use_sqlite:
    DB_FILE = 'riders_data.db'
    
    def init_db():
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS rider_insurance_details (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    brand_name TEXT NOT NULL,
                    store_name TEXT NOT NULL,
                    employee_no TEXT NOT NULL,
                    employee_name TEXT NOT NULL,
                    employee_email TEXT NOT NULL,
                    employee_phone TEXT NOT NULL,
                    employee_gender TEXT,
                    employee_dob TEXT,
                    pan_number TEXT NOT NULL,
                    employee_address TEXT,
                    employee_city TEXT,
                    employee_state TEXT,
                    employee_pin_code TEXT,
                    nominee_name TEXT,
                    nominee_gender TEXT,
                    nominee_dob TEXT,
                    nominee_relationship TEXT,
                    insurance_status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
        except Exception:
            pass
    
    @contextmanager
    def get_connection():
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    init_db()

__all__ = ["get_connection", "pool", "CONN_STRING", "use_sqlite"]
