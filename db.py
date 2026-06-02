"""
Database: SQLite locally, Neon Postgres on Vercel.
Reads connection string from Vercel/Neon environment variables.
"""
import os
import sqlite3

IS_VERCEL = os.environ.get("VERCEL") == "1" or bool(os.environ.get("VERCEL_ENV"))


def _resolve_postgres_url():
    """Neon on Vercel sets several vars; prefer pooled URL for serverless."""
    for key in (
        "POSTGRES_URL",
        "DATABASE_URL",
        "POSTGRES_URL_NON_POOLING",
        "POSTGRES_PRISMA_URL",
    ):
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return None


POSTGRES_URL = _resolve_postgres_url()

if IS_VERCEL:
    DATABASE = None
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE = os.path.join(BASE_DIR, "nayakaam_productions.db")


def use_postgres():
    return bool(POSTGRES_URL)


def db_backend_name():
    if not use_postgres():
        return "sqlite"
    if IS_VERCEL:
        return "neon"
    return "postgres"


def _adapt_sql(sql):
    return sql.replace("?", "%s") if use_postgres() else sql


def get_db():
    if use_postgres():
        import psycopg2
        from psycopg2.extras import RealDictCursor

        conn = psycopg2.connect(POSTGRES_URL, cursor_factory=RealDictCursor)
        return conn
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def execute(conn, sql, params=()):
    cur = conn.cursor()
    cur.execute(_adapt_sql(sql), params)
    return cur


def fetchall(conn, sql, params=()):
    return execute(conn, sql, params).fetchall()


def fetchone(conn, sql, params=()):
    return execute(conn, sql, params).fetchone()


def init_db():
    conn = get_db()
    execute(
        conn,
        """
        CREATE TABLE IF NOT EXISTS highlights (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            video_url TEXT DEFAULT '',
            image_filename TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """,
    )
    execute(
        conn,
        """
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            mobile TEXT DEFAULT '',
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """,
    )
    conn.commit()
    conn.close()
    print(f"[DB] Initialized ({db_backend_name()}).")
