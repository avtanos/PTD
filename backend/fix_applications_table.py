"""Миграция: добавление полей новой структуры заявок в applications и application_items."""
from sqlalchemy import text
from app.db.database import engine


def _add_col_if_missing(conn, table: str, col: str, col_def: str):
    result = conn.execute(text(f"PRAGMA table_info({table})"))
    columns = [row[1] for row in result]
    if col not in columns:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
        print(f"  + {table}.{col}")


def fix_tables():
    with engine.connect() as conn:
        try:
            _add_col_if_missing(conn, "applications", "department_id", "INTEGER REFERENCES departments(id)")
            _add_col_if_missing(conn, "applications", "organization_id", "INTEGER REFERENCES organizations(id)")
            _add_col_if_missing(conn, "applications", "basis", "TEXT")
            _add_col_if_missing(conn, "applications", "old_number", "VARCHAR(120)")
            _add_col_if_missing(conn, "applications", "material_kind_id", "INTEGER REFERENCES material_kinds(id)")
            _add_col_if_missing(conn, "applications", "warehouse_id", "INTEGER REFERENCES warehouses(id)")
            _add_col_if_missing(conn, "applications", "payment_type_id", "INTEGER REFERENCES payment_types(id)")
            _add_col_if_missing(conn, "applications", "counterparty_id", "INTEGER REFERENCES counterparties(id)")
            _add_col_if_missing(conn, "applications", "initiator_counterparty_id", "INTEGER REFERENCES counterparties(id)")
            _add_col_if_missing(conn, "applications", "author_user_id", "INTEGER REFERENCES users(id)")
            _add_col_if_missing(conn, "applications", "responsible_personnel_id", "INTEGER REFERENCES personnel(id)")
            _add_col_if_missing(conn, "applications", "comment", "TEXT")
            _add_col_if_missing(conn, "applications", "is_posted", "BOOLEAN DEFAULT 0")

            _add_col_if_missing(conn, "application_items", "payment_type_id", "INTEGER REFERENCES payment_types(id)")
            _add_col_if_missing(conn, "application_items", "counterparty_id", "INTEGER REFERENCES counterparties(id)")
            _add_col_if_missing(conn, "application_items", "contractor_id", "INTEGER REFERENCES counterparties(id)")

            conn.commit()
            print("Миграция applications завершена.")
        except Exception as e:
            conn.rollback()
            print(f"Ошибка: {e}")
            raise


if __name__ == "__main__":
    fix_tables()
