"""Семена для справочников: организации, контрагенты, виды оплаты."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.database import engine


def seed():
    with engine.connect() as conn:
        try:
            r = conn.execute(text("SELECT COUNT(*) FROM organizations"))
            if r.scalar() == 0:
                conn.execute(text(
                    "INSERT INTO organizations (name, code, description, is_active, created_at) VALUES "
                    "('ООО «СтройКом»', 'SK', 'Основная организация', 1, datetime('now')), "
                    "('ИП Иванов', 'IP1', 'Подрядчик', 1, datetime('now'))"
                ))
                conn.commit()
                print("Добавлены организации.")
            else:
                print("Организации уже есть.")

            r = conn.execute(text("SELECT COUNT(*) FROM counterparties"))
            if r.scalar() == 0:
                conn.execute(text(
                    "INSERT INTO counterparties (name, inn, contacts, is_active, created_at) VALUES "
                    "('ООО «СтройМатериалы»', '1234567890', '+7 999 123-45-67', 1, datetime('now')), "
                    "('ЗАО «ТехСнаб»', '0987654321', '+7 999 765-43-21', 1, datetime('now'))"
                ))
                conn.commit()
                print("Добавлены контрагенты.")
            else:
                print("Контрагенты уже есть.")

            r = conn.execute(text("SELECT COUNT(*) FROM payment_types"))
            if r.scalar() == 0:
                conn.execute(text(
                    "INSERT INTO payment_types (name, code, is_active, created_at) VALUES "
                    "('Безналичная', 'cashless', 1, datetime('now')), "
                    "('Наличная', 'cash', 1, datetime('now')), "
                    "('Аванс', 'advance', 1, datetime('now'))"
                ))
                conn.commit()
                print("Добавлены виды оплаты.")
            else:
                print("Виды оплаты уже есть.")

            r = conn.execute(text("SELECT COUNT(*) FROM material_kinds"))
            if r.scalar() == 0:
                conn.execute(text(
                    "INSERT INTO material_kinds (name, code, is_active, created_at) VALUES "
                    "('Строительные материалы', 'construction', 1, datetime('now')), "
                    "('Оборудование', 'equipment', 1, datetime('now')), "
                    "('Инструменты', 'tools', 1, datetime('now')), "
                    "('Расходники', 'consumables', 1, datetime('now'))"
                ))
                conn.commit()
                print("Добавлены виды материала.")
            else:
                print("Виды материала уже есть.")
        except Exception as e:
            conn.rollback()
            print(f"Ошибка: {e}")
            raise


if __name__ == "__main__":
    seed()
