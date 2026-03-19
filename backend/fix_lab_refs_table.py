"""Миграция: добавление полей в справочники LabTestType и Laboratory (SQLite)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.database import engine


def _add_col_if_missing(conn, table: str, col: str, col_def: str):
    r = conn.execute(text(f"PRAGMA table_info({table})"))
    cols = [row[1] for row in r.fetchall()]
    if col not in cols:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
        print(f"  + {table}.{col}")


def fix_tables():
    with engine.connect() as conn:
        try:
            # lab_test_types
            _add_col_if_missing(conn, "lab_test_types", "code", "VARCHAR(80)")
            _add_col_if_missing(conn, "lab_test_types", "description", "TEXT")

            # laboratories
            _add_col_if_missing(conn, "laboratories", "code", "VARCHAR(80)")
            _add_col_if_missing(conn, "laboratories", "address", "VARCHAR(500)")
            _add_col_if_missing(conn, "laboratories", "phone", "VARCHAR(80)")
            _add_col_if_missing(conn, "laboratories", "email", "VARCHAR(200)")
            _add_col_if_missing(conn, "laboratories", "contact_person", "VARCHAR(200)")
            _add_col_if_missing(conn, "laboratories", "notes", "TEXT")

            conn.commit()
            print("Миграция справочников лабораторных испытаний завершена.")
        except Exception as e:
            conn.rollback()
            print(f"Ошибка: {e}")
            raise


if __name__ == "__main__":
    fix_tables()

