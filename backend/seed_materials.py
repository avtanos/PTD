"""
Скрипт для заполнения базы данных тестовыми данными материалов и объемов работ
Использование: python seed_materials.py
"""

import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from decimal import Decimal
import random

# Добавляем путь к приложению
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.db.database import SessionLocal, engine, Base
from app.models.material import MaterialType, MovementType, WriteOffReason

def init_db():
    """Инициализация базы данных и миграции"""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Создаем все таблицы, если их нет
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        # Проверка и добавление колонок для work_volumes
        if 'work_volumes' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('work_volumes')]
            if 'planned_amount' not in columns:
                print("Adding 'planned_amount' column to work_volumes table...")
                conn.execute(text("ALTER TABLE work_volumes ADD COLUMN planned_amount DECIMAL(15, 2)"))
            if 'actual_amount' not in columns:
                print("Adding 'actual_amount' column to work_volumes table...")
                conn.execute(text("ALTER TABLE work_volumes ADD COLUMN actual_amount DECIMAL(15, 2)"))
            conn.commit()
            
        # Проверка и добавление колонок для material_movements
        if 'material_movements' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('material_movements')]
            if 'supplier' not in columns:
                print("Adding 'supplier' column to material_movements table...")
                conn.execute(text("ALTER TABLE material_movements ADD COLUMN supplier VARCHAR(500)"))
            conn.commit()

def create_materials(db: Session):
    """Создать справочник материалов"""
    print("Creating materials...")
    
    materials_data = [
        {"code": "MAT-001", "name": "Бетон B25", "material_type": MaterialType.CONSTRUCTION, "unit": "м3", "standard_price": 5500.00},
        {"code": "MAT-002", "name": "Арматура А500С d12", "material_type": MaterialType.CONSTRUCTION, "unit": "т", "standard_price": 65000.00},
        {"code": "MAT-003", "name": "Кирпич керамический полнотелый", "material_type": MaterialType.CONSTRUCTION, "unit": "шт", "standard_price": 25.00},
        {"code": "MAT-004", "name": "Песок строительный", "material_type": MaterialType.CONSTRUCTION, "unit": "м3", "standard_price": 800.00},
        {"code": "MAT-005", "name": "Щебень гранитный 20-40", "material_type": MaterialType.CONSTRUCTION, "unit": "м3", "standard_price": 1200.00},
        {"code": "MAT-006", "name": "Цемент М500", "material_type": MaterialType.CONSTRUCTION, "unit": "т", "standard_price": 8000.00},
        {"code": "MAT-007", "name": "Доска обрезная 50х150х6000", "material_type": MaterialType.CONSTRUCTION, "unit": "м3", "standard_price": 18000.00},
        {"code": "EQP-001", "name": "Перфоратор Bosch", "material_type": MaterialType.EQUIPMENT, "unit": "шт", "standard_price": 15000.00},
        {"code": "EQP-002", "name": "Бетономешалка 200л", "material_type": MaterialType.EQUIPMENT, "unit": "шт", "standard_price": 25000.00},
        {"code": "TOOL-001", "name": "Лопата штыковая", "material_type": MaterialType.TOOLS, "unit": "шт", "standard_price": 500.00},
        {"code": "TOOL-002", "name": "Молоток 500г", "material_type": MaterialType.TOOLS, "unit": "шт", "standard_price": 300.00},
        {"code": "CONS-001", "name": "Перчатки рабочие", "material_type": MaterialType.CONSUMABLES, "unit": "пар", "standard_price": 50.00},
        {"code": "CONS-002", "name": "Диск отрезной по металлу 125мм", "material_type": MaterialType.CONSUMABLES, "unit": "шт", "standard_price": 40.00},
    ]
    
    count = 0
    for mat_data in materials_data:
        existing = db.execute(text("SELECT id FROM materials WHERE code = :code"), {"code": mat_data["code"]}).first()
        if not existing:
            db.execute(text("""
                INSERT INTO materials (code, name, material_type, unit, standard_price, is_active, created_at)
                VALUES (:code, :name, :material_type, :unit, :standard_price, 1, datetime('now'))
            """), mat_data)
            count += 1
    
    db.commit()
    print(f"Created {count} materials.")
    return db.execute(text("SELECT id, code, standard_price FROM materials")).fetchall()

def create_warehouses(db: Session):
    """Создать склады"""
    print("Creating warehouses...")
    
    warehouses_data = [
        {"code": "WH-MAIN", "name": "Центральный склад", "location": "База, ул. Промышленная 1", "responsible": "Петров П.П."},
        {"code": "WH-SITE1", "name": "Склад ЖК Солнечный", "location": "Стройплощадка 1", "responsible": "Иванов И.И."},
        {"code": "WH-SITE2", "name": "Склад БЦ Плаза", "location": "Стройплощадка 2", "responsible": "Сидоров С.С."},
    ]
    
    count = 0
    for wh_data in warehouses_data:
        existing = db.execute(text("SELECT id FROM warehouses WHERE code = :code"), {"code": wh_data["code"]}).first()
        if not existing:
            db.execute(text("""
                INSERT INTO warehouses (code, name, location, responsible, is_active, created_at)
                VALUES (:code, :name, :location, :responsible, 1, datetime('now'))
            """), wh_data)
            count += 1
            
    db.commit()
    print(f"Created {count} warehouses.")
    return db.execute(text("SELECT id, code FROM warehouses")).fetchall()

def create_movements(db: Session, materials, warehouses):
    """Создать движения материалов (приход и перемещение)"""
    print("Creating movements...")
    
    main_wh = next((w for w in warehouses if w.code == "WH-MAIN"), None)
    site_whs = [w for w in warehouses if w.code != "WH-MAIN"]
    
    if not main_wh:
        print("Main warehouse not found, skipping movements.")
        return

    # 1. Приход на центральный склад
    count = 0
    for i, mat in enumerate(materials):
        # Проверяем, есть ли уже движения для этого материала
        existing = db.execute(text("SELECT id FROM material_movements WHERE material_id = :mid AND movement_type = 'receipt'"), {"mid": mat.id}).first()
        if existing:
            continue
            
        qty = Decimal(random.randint(100, 1000))
        price = Decimal(mat.standard_price)
        amount = qty * price
        
        db.execute(text("""
            INSERT INTO material_movements (
                movement_type, movement_number, movement_date, material_id, quantity, price, amount,
                to_warehouse_id, supplier, responsible, created_at
            ) VALUES (
                'receipt', :num, date('now', '-30 days'), :mid, :qty, :price, :amount,
                :wh_id, 'ООО Поставщик', 'Менеджер', datetime('now')
            )
        """), {
            "num": f"REC-{1000+i}",
            "mid": mat.id,
            "qty": str(qty),
            "price": str(price),
            "amount": str(amount),
            "wh_id": main_wh.id
        })
        
        # Обновляем остатки
        existing_stock = db.execute(text("SELECT id, quantity FROM warehouse_stocks WHERE warehouse_id = :wh AND material_id = :mid"), 
                                  {"wh": main_wh.id, "mid": mat.id}).first()
        
        if existing_stock:
            db.execute(text("UPDATE warehouse_stocks SET quantity = quantity + :qty WHERE id = :id"), 
                     {"qty": str(qty), "id": existing_stock.id})
        else:
            db.execute(text("""
                INSERT INTO warehouse_stocks (warehouse_id, material_id, quantity, reserved_quantity, updated_at)
                VALUES (:wh, :mid, :qty, 0, datetime('now'))
            """), {"wh": main_wh.id, "mid": mat.id, "qty": str(qty)})
            
        count += 1
        
    # 2. Перемещение на приобъектные склады
    if site_whs:
        for i, mat in enumerate(materials[:5]): # Первые 5 материалов
            wh = random.choice(site_whs)
            qty = Decimal(random.randint(10, 50))
            
            # Проверяем наличие на главном складе
            stock = db.execute(text("SELECT quantity FROM warehouse_stocks WHERE warehouse_id = :wh AND material_id = :mid"),
                             {"wh": main_wh.id, "mid": mat.id}).scalar()
            
            if stock and stock > qty:
                 db.execute(text("""
                    INSERT INTO material_movements (
                        movement_type, movement_number, movement_date, material_id, quantity, price, amount,
                        from_warehouse_id, to_warehouse_id, responsible, created_at
                    ) VALUES (
                        'transfer', :num, date('now', '-10 days'), :mid, :qty, :price, :amount,
                        :from_wh, :to_wh, 'Кладовщик', datetime('now')
                    )
                """), {
                    "num": f"TRF-{1000+i}",
                    "mid": mat.id,
                    "qty": str(qty),
                    "price": str(mat.standard_price),
                    "amount": str(qty * Decimal(mat.standard_price)),
                    "from_wh": main_wh.id,
                    "to_wh": wh.id
                })
                
                 # Списываем с главного
                 db.execute(text("UPDATE warehouse_stocks SET quantity = quantity - :qty WHERE warehouse_id = :wh AND material_id = :mid"),
                           {"qty": str(qty), "wh": main_wh.id, "mid": mat.id})
                 
                 # Зачисляем на объектный
                 existing_stock = db.execute(text("SELECT id FROM warehouse_stocks WHERE warehouse_id = :wh AND material_id = :mid"), 
                                          {"wh": wh.id, "mid": mat.id}).first()
                 if existing_stock:
                     db.execute(text("UPDATE warehouse_stocks SET quantity = quantity + :qty WHERE id = :id"), 
                              {"qty": str(qty), "id": existing_stock[0]})
                 else:
                     db.execute(text("""
                        INSERT INTO warehouse_stocks (warehouse_id, material_id, quantity, reserved_quantity, updated_at)
                        VALUES (:wh, :mid, :qty, 0, datetime('now'))
                    """), {"wh": wh.id, "mid": mat.id, "qty": str(qty)})
                 count += 1

    db.commit()
    print(f"Created {count} movements.")

def create_work_volumes(db: Session):
    """Создать объемы работ"""
    print("Creating work volumes...")
    
    projects = db.execute(text("SELECT id, name FROM projects LIMIT 5")).fetchall()
    
    works_templates = [
        {"name": "Разработка грунта механизированным способом", "unit": "м3", "price": 450.00, "volume": 12000},
        {"name": "Устройство бетонной подготовки", "unit": "м3", "price": 4500.00, "volume": 350},
        {"name": "Устройство фундаментной плиты", "unit": "м3", "price": 12000.00, "volume": 1500},
        {"name": "Армирование стен и колонн", "unit": "т", "price": 25000.00, "volume": 45},
        {"name": "Бетонирование стен и колонн", "unit": "м3", "price": 6500.00, "volume": 600},
        {"name": "Кирпичная кладка перегородок", "unit": "м3", "price": 5500.00, "volume": 800},
    ]
    
    count = 0
    for project in projects:
        # Для каждого проекта создаем несколько работ
        for i, work in enumerate(works_templates):
            # Проверяем существование
            existing = db.execute(text("SELECT id FROM work_volumes WHERE project_id = :pid AND work_name = :name"),
                                {"pid": project.id, "name": work["name"]}).first()
            
            if existing:
                continue
                
            planned_vol = Decimal(work["volume"] * (0.8 + random.random() * 0.4)) # +/- 20%
            price = Decimal(work["price"])
            planned_amt = planned_vol * price
            
            # Создаем ВОР
            db.execute(text("""
                INSERT INTO work_volumes (
                    project_id, work_name, work_code, unit, planned_volume, estimated_price, planned_amount,
                    actual_volume, actual_amount, completed_percentage, status, start_date, end_date, created_at
                ) VALUES (
                    :pid, :name, :code, :unit, :vol, :price, :amt,
                    0, 0, 0, 'planned', date('now'), date('now', '+3 months'), datetime('now')
                )
            """), {
                "pid": project.id,
                "name": work["name"],
                "code": f"WORK-{10+i}",
                "unit": work["unit"],
                "vol": str(planned_vol),
                "price": str(price),
                "amt": str(planned_amt)
            })
            
            wv_id = db.execute(text("SELECT last_insert_rowid()")).scalar()
            
            # Добавляем выполнение (факт)
            if random.random() > 0.3: # 70% вероятность наличия факта
                actual_vol1 = planned_vol * Decimal(0.1)
                db.execute(text("""
                    INSERT INTO work_volume_entries (
                        work_volume_id, entry_date, actual_volume, entered_by, created_at
                    ) VALUES (
                        :wvid, date('now', '-20 days'), :vol, 'Прораб', datetime('now')
                    )
                """), {"wvid": wv_id, "vol": str(actual_vol1)})
                
                actual_vol2 = planned_vol * Decimal(0.15)
                db.execute(text("""
                    INSERT INTO work_volume_entries (
                        work_volume_id, entry_date, actual_volume, entered_by, created_at
                    ) VALUES (
                        :wvid, date('now', '-5 days'), :vol, 'Прораб', datetime('now')
                    )
                """), {"wvid": wv_id, "vol": str(actual_vol2)})
                
                total_actual = actual_vol1 + actual_vol2
                pct = (total_actual / planned_vol) * 100
                status = 'in_progress' if pct < 100 else 'completed'
                
                db.execute(text("""
                    UPDATE work_volumes 
                    SET actual_volume = :act, 
                        actual_amount = :amt, 
                        completed_percentage = :pct, 
                        status = :status 
                    WHERE id = :id
                """), {
                    "act": str(total_actual),
                    "amt": str(total_actual * price),
                    "pct": str(pct),
                    "status": status,
                    "id": wv_id
                })
            
            count += 1
            
    db.commit()
    print(f"Created {count} work volumes.")

def main():
    print("=" * 60)
    print("Seeding Materials and Work Volumes Data")
    print("=" * 60)
    
    init_db()
    
    db = SessionLocal()
    try:
        materials = create_materials(db)
        warehouses = create_warehouses(db)
        create_movements(db, materials, warehouses)
        create_work_volumes(db)
        
        print("\nSuccess! Materials and Work Volumes seeded.")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
