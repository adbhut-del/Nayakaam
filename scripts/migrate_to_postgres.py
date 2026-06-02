"""
Copy highlights and messages from local SQLite to Vercel Postgres.
Usage: set POSTGRES_URL then run from project root:
  python scripts/migrate_to_postgres.py
"""
import os
import sqlite3
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

SQLITE_PATH = os.path.join(ROOT, "nayakaam_productions.db")
POSTGRES_URL = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL")


def main():
    if not POSTGRES_URL:
        print("Set POSTGRES_URL (from Vercel Storage) and try again.")
        sys.exit(1)
    if not os.path.isfile(SQLITE_PATH):
        print(f"No local database at {SQLITE_PATH}")
        sys.exit(1)

    import psycopg2

    src = sqlite3.connect(SQLITE_PATH)
    src.row_factory = sqlite3.Row
    dst = psycopg2.connect(POSTGRES_URL)
    dst.autocommit = False
    cur = dst.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS highlights (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            video_url TEXT DEFAULT '',
            image_filename TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            mobile TEXT DEFAULT '',
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    for table, cols in (
        (
            "highlights",
            ("id", "title", "description", "video_url", "image_filename", "created_at"),
        ),
        ("messages", ("id", "name", "email", "mobile", "message", "created_at")),
    ):
        rows = src.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print(f"  {table}: 0 rows")
            continue
        values = [tuple(row[c] for c in cols) for row in rows]
        placeholders = ", ".join(["%s"] * len(cols))
        col_list = ", ".join(cols)
        for row in values:
            cur.execute(
                f"""
                INSERT INTO {table} ({col_list})
                VALUES ({placeholders})
                ON CONFLICT (id) DO NOTHING
                """,
                row,
            )
        print(f"  {table}: migrated {len(values)} row(s)")

    dst.commit()
    src.close()
    dst.close()
    print("Done.")


if __name__ == "__main__":
    main()
