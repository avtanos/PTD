"""
Скрипт для заполнения базы данных тестовыми данными проектов
Использование: python seed_projects.py
"""

import sys
from datetime import date, datetime, timedelta
from pathlib import Path

# Добавляем путь к приложению
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal, engine


def create_departments(db: Session):
    """Создать подразделения, если их нет"""
    departments_data = [
        {
            "code": "PTO",
            "name": "Производственно-технический отдел",
            "short_name": "ПТО",
            "head": "Иванов Иван Иванович",
            "description": "Отдел, отвечающий за производственно-техническое обеспечение строительства",
            "is_active": True
        },
        {
            "code": "OGE",
            "name": "Отдел главного энергетика",
            "short_name": "ОГЭ",
            "head": "Петров Петр Петрович",
            "description": "Отдел, отвечающий за энергетическое обеспечение",
            "is_active": True
        },
        {
            "code": "OGM",
            "name": "Отдел главного механика",
            "short_name": "ОГМ",
            "head": "Сидоров Сидор Сидорович",
            "description": "Отдел, отвечающий за механическое оборудование",
            "is_active": True
        },
        {
            "code": "GEODESY",
            "name": "Геодезический отдел",
            "short_name": "Геодезия",
            "head": "Смирнов Алексей Алексеевич",
            "description": "Отдел геодезических работ и съемок",
            "is_active": True
        },
        {
            "code": "WAREHOUSE",
            "name": "Склад",
            "short_name": "Склад",
            "head": "Козлов Владимир Владимирович",
            "description": "Складское хозяйство",
            "is_active": True
        }
    ]
    
    created_count = 0
    department_ids = {}
    
    for dept_data in departments_data:
        # Проверяем существование через raw SQL
        result = db.execute(
            text("SELECT id FROM departments WHERE code = :code"),
            {"code": dept_data["code"]}
        ).first()
        
        if not result:
            # Создаем через raw SQL
            db.execute(
                text("""
                    INSERT INTO departments (code, name, short_name, head, description, is_active, created_at)
                    VALUES (:code, :name, :short_name, :head, :description, :is_active, datetime('now'))
                """),
                dept_data
            )
            created_count += 1
            # Получаем ID созданного подразделения
            result = db.execute(
                text("SELECT id FROM departments WHERE code = :code"),
                {"code": dept_data["code"]}
            ).first()
        
        if result:
            department_ids[dept_data["code"]] = result[0]
    
    db.commit()
    print(f"Создано подразделений: {created_count}")
    
    # Получаем все подразделения
    result = db.execute(text("SELECT id, code, name FROM departments")).fetchall()
    departments = [{"id": r[0], "code": r[1], "name": r[2]} for r in result]
    return departments, department_ids


def create_projects(db: Session, departments: list, department_ids: dict):
    """Создать тестовые проекты"""
    projects_data = [
        {
            "name": 'Жилой комплекс "Солнечный"',
            "code": "PROJ-001",
            "address": "г. Москва, ул. Солнечная, д. 1-10",
            "customer": 'ООО "Застройщик"',
            "contractor": 'ООО "СтройГрупп"',
            "description": "Строительство жилого комплекса из 5 корпусов общей площадью 45 000 м²",
            "work_type": "Бетонные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-01-01",
            "end_date": "2025-12-31",
            "status": "active",
            "is_active": True
        },
        {
            "name": 'Офисный центр "Бизнес Парк"',
            "code": "PROJ-002",
            "address": "г. Санкт-Петербург, пр. Невский, д. 100",
            "customer": 'АО "Девелопмент"',
            "contractor": 'ООО "СтройГрупп"',
            "description": "Строительство многоэтажного офисного центра с подземной парковкой",
            "work_type": "Бетонные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-03-01",
            "end_date": "2026-06-30",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Реконструкция моста через р. Волга",
            "code": "PROJ-003",
            "address": "г. Нижний Новгород, мост через р. Волга",
            "customer": 'ГКУ "Дорстрой"',
            "contractor": 'ООО "МостСтрой"',
            "description": "Реконструкция автомобильного моста с расширением проезжей части",
            "work_type": "Металл",
            "department_id": department_ids.get("OGE"),
            "start_date": "2024-02-01",
            "end_date": "2025-11-30",
            "status": "active",
            "is_active": True
        },
        {
            "name": 'Торговый центр "МегаМолл"',
            "code": "PROJ-004",
            "address": "г. Казань, ул. Баумана, д. 50",
            "customer": 'ООО "ТоргЦентр"',
            "contractor": 'ООО "СтройКомплекс"',
            "description": "Строительство торгового центра площадью 25 000 м²",
            "work_type": "Кладка",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-04-15",
            "end_date": "2025-10-31",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Ремонт фасада административного здания",
            "code": "PROJ-005",
            "address": "г. Екатеринбург, ул. Ленина, д. 25",
            "customer": 'МУП "ГорУправление"',
            "contractor": 'ООО "ФасадСтрой"',
            "description": "Капитальный ремонт фасада с утеплением",
            "work_type": "Отделка",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-05-01",
            "end_date": "2024-09-30",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Благоустройство парка Победы",
            "code": "PROJ-006",
            "address": "г. Новосибирск, парк Победы",
            "customer": "Администрация города",
            "contractor": 'ООО "ЛандшафтСтрой"',
            "description": "Благоустройство территории парка: дорожки, освещение, малые архитектурные формы",
            "work_type": "Благоустройство",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-06-01",
            "end_date": "2024-10-31",
            "status": "suspended",
            "is_active": True
        },
        {
            "name": "Прокладка инженерных сетей для микрорайона",
            "code": "PROJ-007",
            "address": "г. Краснодар, микрорайон Центральный",
            "customer": 'ООО "Коммунальные сети"',
            "contractor": 'ООО "СетиСтрой"',
            "description": "Прокладка водопровода, канализации, электросетей для нового микрорайона",
            "work_type": "Сети",
            "department_id": department_ids.get("OGE"),
            "start_date": "2024-07-01",
            "end_date": "2025-05-31",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Строительство школы на 500 мест",
            "code": "PROJ-008",
            "address": "г. Ростов-на-Дону, ул. Школьная, д. 15",
            "customer": "Департамент образования",
            "contractor": 'ООО "ОбразованиеСтрой"',
            "description": "Строительство трехэтажной школы с спортивным залом и столовой",
            "work_type": "Бетонные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2023-09-01",
            "end_date": "2024-08-31",
            "status": "completed",
            "is_active": False
        },
        {
            "name": "Реконструкция стадиона",
            "code": "PROJ-009",
            "address": "г. Сочи, ул. Спортивная, д. 1",
            "customer": 'ООО "СпортКомплекс"',
            "contractor": 'ООО "СтадионСтрой"',
            "description": "Реконструкция футбольного стадиона: трибуны, поле, освещение",
            "work_type": "Бетонные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-01-15",
            "end_date": "2025-06-30",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Устройство кровли производственного цеха",
            "code": "PROJ-010",
            "address": "г. Самара, промзона, цех №3",
            "customer": 'ООО "Завод"',
            "contractor": 'ООО "КровляСтрой"',
            "description": "Замена кровельного покрытия производственного цеха",
            "work_type": "Кровля",
            "department_id": department_ids.get("OGM"),
            "start_date": "2024-08-01",
            "end_date": "2024-11-30",
            "status": "draft",
            "is_active": True
        },
        {
            "name": "Земляные работы под фундамент",
            "code": "PROJ-011",
            "address": "г. Уфа, ул. Строителей, участок 12",
            "customer": 'ООО "Новострой"',
            "contractor": 'ООО "ЗемляСтрой"',
            "description": "Подготовка котлована и устройство фундамента для жилого дома",
            "work_type": "Земляные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-09-01",
            "end_date": "2024-12-31",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Монтаж металлоконструкций склада",
            "code": "PROJ-012",
            "address": "г. Челябинск, складской комплекс",
            "customer": 'ООО "Логистик"',
            "contractor": 'ООО "МеталлСтрой"',
            "description": "Монтаж металлических конструкций складского комплекса",
            "work_type": "Металл",
            "department_id": department_ids.get("OGM"),
            "start_date": "2024-10-01",
            "end_date": "2025-03-31",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Строительство детского сада",
            "code": "PROJ-013",
            "address": "г. Воронеж, ул. Детская, д. 5",
            "customer": "Департамент образования",
            "contractor": 'ООО "ДетСтрой"',
            "description": "Строительство двухэтажного детского сада на 200 мест",
            "work_type": "Бетонные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-11-01",
            "end_date": "2025-08-31",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Ремонт дорожного покрытия",
            "code": "PROJ-014",
            "address": "г. Тюмень, ул. Центральная",
            "customer": 'ГКУ "Дорстрой"',
            "contractor": 'ООО "ДорСтрой"',
            "description": "Капитальный ремонт асфальтового покрытия с заменой основания",
            "work_type": "Земляные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-05-15",
            "end_date": "2024-09-30",
            "status": "completed",
            "is_active": False
        },
        {
            "name": "Установка систем видеонаблюдения",
            "code": "PROJ-015",
            "address": "г. Омск, промзона",
            "customer": 'ООО "Безопасность"',
            "contractor": 'ООО "ЭлектроСтрой"',
            "description": "Монтаж систем видеонаблюдения и контроля доступа",
            "work_type": "Сети",
            "department_id": department_ids.get("OGE"),
            "start_date": "2024-12-01",
            "end_date": "2025-02-28",
            "status": "draft",
            "is_active": True
        },
        {
            "name": "Реконструкция системы отопления",
            "code": "PROJ-016",
            "address": "г. Пермь, ул. Тепловая, д. 10",
            "customer": 'ООО "ЖилКомСервис"',
            "contractor": 'ООО "ТеплоСтрой"',
            "description": "Замена системы отопления в многоквартирном доме",
            "work_type": "Сети",
            "department_id": department_ids.get("OGE"),
            "start_date": "2024-06-01",
            "end_date": "2024-10-31",
            "status": "suspended",
            "is_active": True
        },
        {
            "name": "Строительство автостоянки",
            "code": "PROJ-017",
            "address": "г. Калининград, ул. Парковая",
            "customer": 'ООО "Паркинг"',
            "contractor": 'ООО "АсфальтСтрой"',
            "description": "Строительство многоуровневой автостоянки на 300 мест",
            "work_type": "Бетонные",
            "department_id": department_ids.get("PTO"),
            "start_date": "2025-01-15",
            "end_date": "2025-10-31",
            "status": "draft",
            "is_active": True
        },
        {
            "name": "Геодезическая съемка участка",
            "code": "PROJ-018",
            "address": "г. Иркутск, участок под застройку",
            "customer": 'ООО "Застройщик Сибири"',
            "contractor": 'ООО "ГеодезияПлюс"',
            "description": "Топографическая съемка и геодезические работы",
            "work_type": "Земляные",
            "department_id": department_ids.get("GEODESY"),
            "start_date": "2024-08-01",
            "end_date": "2024-11-30",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Монтаж лифтового оборудования",
            "code": "PROJ-019",
            "address": "г. Хабаровск, жилой комплекс",
            "customer": 'ООО "ЛифтСервис"',
            "contractor": 'ООО "ЛифтМонтаж"',
            "description": "Установка и настройка лифтового оборудования",
            "work_type": "Металл",
            "department_id": department_ids.get("OGM"),
            "start_date": "2024-09-15",
            "end_date": "2025-01-31",
            "status": "active",
            "is_active": True
        },
        {
            "name": "Обустройство придомовой территории",
            "code": "PROJ-020",
            "address": "г. Ярославль, ул. Жилая, д. 20",
            "customer": 'ООО "УК Комфорт"',
            "contractor": 'ООО "БлагоустройствоСтрой"',
            "description": "Обустройство детских площадок, парковок, озеленение",
            "work_type": "Благоустройство",
            "department_id": department_ids.get("PTO"),
            "start_date": "2024-07-01",
            "end_date": "2024-10-31",
            "status": "completed",
            "is_active": False
        }
    ]
    
    created_count = 0
    skipped_count = 0
    
    for project_data in projects_data:
        # Проверяем существование через raw SQL
        result = db.execute(
            text("SELECT id FROM projects WHERE code = :code"),
            {"code": project_data["code"]}
        ).first()
        
        if result:
            skipped_count += 1
            continue
        
        # Создаем через raw SQL
        db.execute(
            text("""
                INSERT INTO projects (name, code, address, customer, contractor, description, work_type, 
                                     department_id, start_date, end_date, status, is_active, created_at)
                VALUES (:name, :code, :address, :customer, :contractor, :description, :work_type,
                        :department_id, :start_date, :end_date, :status, :is_active, datetime('now'))
            """),
            project_data
        )
        created_count += 1
    
    db.commit()
    print(f"Создано проектов: {created_count}")
    if skipped_count > 0:
        print(f"Пропущено (уже существуют): {skipped_count}")
    
    # Получаем общее количество проектов
    result = db.execute(text("SELECT COUNT(*) FROM projects")).scalar()
    return result


def main():
    """Основная функция"""
    print("=" * 60)
    print("Заполнение базы данных тестовыми данными")
    print("=" * 60)
    
    # Создаем только нужные таблицы и добавляем недостающие колонки
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    db = SessionLocal()
    try:
        # Создаем таблицы, если их нет
        if 'departments' not in existing_tables:
            db.execute(text("""
                CREATE TABLE departments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code VARCHAR(50) UNIQUE,
                    name VARCHAR(200) NOT NULL,
                    short_name VARCHAR(50),
                    description TEXT,
                    head VARCHAR(200),
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME
                )
            """))
            db.commit()
        
        if 'projects' not in existing_tables:
            db.execute(text("""
                CREATE TABLE projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(500) NOT NULL,
                    code VARCHAR(100) UNIQUE,
                    address VARCHAR(1000),
                    customer VARCHAR(500),
                    contractor VARCHAR(500),
                    description TEXT,
                    work_type VARCHAR(200),
                    department_id INTEGER,
                    start_date DATE,
                    end_date DATE,
                    status VARCHAR(50) DEFAULT 'active',
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME,
                    FOREIGN KEY (department_id) REFERENCES departments(id)
                )
            """))
            db.commit()
        else:
            # Проверяем и добавляем недостающие колонки
            existing_columns = [col['name'] for col in inspector.get_columns('projects')]
            
            if 'work_type' not in existing_columns:
                db.execute(text("ALTER TABLE projects ADD COLUMN work_type VARCHAR(200)"))
                db.commit()
            
            if 'department_id' not in existing_columns:
                db.execute(text("ALTER TABLE projects ADD COLUMN department_id INTEGER"))
                db.commit()
    finally:
        db.close()
    
    db = SessionLocal()
    try:
        # Создаем подразделения
        print("\n1. Создание подразделений...")
        departments, department_ids = create_departments(db)
        print(f"   Всего подразделений в базе: {len(departments)}")
        
        # Создаем проекты
        print("\n2. Создание проектов...")
        projects_count = create_projects(db, departments, department_ids)
        print(f"   Всего проектов в базе: {projects_count}")
        
        print("\n" + "=" * 60)
        print("Заполнение завершено успешно!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nОшибка: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
