"""Скрипт для добавления недостающей колонки department в таблицу executive_documents"""
from sqlalchemy import text
from app.db.database import engine

def fix_table():
    conn = engine.connect()
    try:
        # Проверяем, существует ли колонка
        result = conn.execute(text("PRAGMA table_info(executive_documents)"))
        columns = [row[1] for row in result]
        
        if 'department' not in columns:
            conn.execute(text("ALTER TABLE executive_documents ADD COLUMN department VARCHAR(200)"))
            conn.commit()
            print("Колонка department добавлена в таблицу executive_documents")
        else:
            print("Колонка department уже существует")
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_table()
