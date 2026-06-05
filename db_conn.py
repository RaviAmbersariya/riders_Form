import os
from dotenv import load_dotenv

load_dotenv()

CONN_STRING = os.getenv("NEON_CONNECTION_STRING") or os.getenv("DATABASE_URL")

if not CONN_STRING:
    raise RuntimeError("Database connection string not found in NEON_CONNECTION_STRING or DATABASE_URL")

pool = None

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
        def get_connection():
            raise RuntimeError(
                "No psycopg driver available. Install with: pip install psycopg[binary] psycopg_pool"
            )


__all__ = ["get_connection", "pool", "CONN_STRING"]


if __name__ == '__main__':
    try:
        with get_connection() as conn:
            try:
                with conn.cursor() as cur:
                    cur.execute('SELECT 1')
                    _ = cur.fetchone()
            except Exception:
                pass
        print('✅ Connection established (test ok)')
    except Exception as e:
        print('❌ Error connecting to the database:', e)
