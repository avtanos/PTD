"""
Скрипт для заполнения базы данных тестовыми данными кадров (сотрудники).
Использование: python seed_personnel.py
Перед запуском желательно выполнить seed_projects.py для создания подразделений.
"""

import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

# Подгружаем все модели приложения (нужно для ORM-связей между таблицами)
import app.main  # noqa: F401

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.department import Department
from app.models.personnel import (
    Personnel,
    PersonnelStatus,
    PersonnelHistory,
    PersonnelHistoryAction,
)

# Подразделения (коды из seed_projects)
DEPT_CODES = ["PTO", "OGE", "OGM", "GEODESY", "WAREHOUSE"]

# Мок-данные сотрудников: (табельный, ФИО, должность, код подразделения, дата приёма, дата увольнения или None, телефон, email, статус)
PERSONNEL_MOCK = [
    ("001", "Иванов Иван Иванович", "Руководитель ПТО", "PTO", date(2020, 3, 15), None, "+7 (495) 111-22-33", "i.ivanov@company.ru", "employed"),
    ("002", "Петрова Анна Сергеевна", "Инженер ПТО", "PTO", date(2021, 6, 1), None, "+7 (495) 111-22-34", "a.petrova@company.ru", "employed"),
    ("003", "Сидоров Пётр Михайлович", "Инженер ПТО", "PTO", date(2022, 1, 10), None, "+7 (495) 111-22-35", "p.sidorov@company.ru", "employed"),
    ("004", "Козлова Мария Александровна", "Инженер-сметчик", "PTO", date(2019, 9, 1), None, "+7 (495) 111-22-36", "m.kozlova@company.ru", "employed"),
    ("005", "Новиков Алексей Владимирович", "Прораб", "PTO", date(2023, 2, 20), None, "+7 (495) 111-22-37", "a.novikov@company.ru", "employed"),
    ("006", "Петров Пётр Петрович", "Руководитель ОГЭ", "OGE", date(2018, 5, 1), None, "+7 (495) 222-33-11", "p.petrov@company.ru", "employed"),
    ("007", "Смирнова Елена Игоревна", "Инженер ОГЭ", "OGE", date(2021, 11, 15), None, "+7 (495) 222-33-12", "e.smirnova@company.ru", "employed"),
    ("008", "Сидоров Сидор Сидорович", "Руководитель ОГМ", "OGM", date(2017, 4, 10), None, "+7 (495) 333-44-11", "s.sidorov@company.ru", "employed"),
    ("009", "Федорова Ольга Николаевна", "Инженер ОГМ", "OGM", date(2022, 7, 1), None, "+7 (495) 333-44-12", "o.fedorova@company.ru", "vacation"),
    ("010", "Смирнов Алексей Алексеевич", "Геодезист", "GEODESY", date(2020, 8, 1), None, "+7 (495) 444-55-11", "a.smirnov@company.ru", "employed"),
    ("011", "Волкова Дарья Павловна", "Геодезист", "GEODESY", date(2023, 4, 10), None, "+7 (495) 444-55-12", "d.volkova@company.ru", "employed"),
    ("012", "Козлов Владимир Владимирович", "Мастер", "WAREHOUSE", date(2019, 1, 15), None, "+7 (495) 555-66-11", "v.kozlov@company.ru", "employed"),
    ("013", "Морозов Дмитрий Андреевич", "Техник", "PTO", date(2022, 9, 1), date(2024, 6, 30), "+7 (495) 111-22-38", "d.morozov@company.ru", "dismissed"),
    ("014", "Васильева Татьяна Олеговна", "Документовед", "PTO", date(2021, 3, 1), None, "+7 (495) 111-22-39", "t.vasilieva@company.ru", "maternity"),
    ("015", "Павлов Игорь Сергеевич", "Инженер-конструктор", "PTO", date(2023, 11, 1), None, "+7 (495) 111-22-40", "i.pavlov@company.ru", "sick_leave"),
]


def get_department_ids(db: Session):
    """Получить id подразделений по коду."""
    depts = db.query(Department).filter(Department.code.in_(DEPT_CODES)).all()
    return {d.code: d.id for d in depts}


def seed_personnel(db: Session):
    """Создать мок-данные кадров."""
    dept_ids = get_department_ids(db)
    if not dept_ids:
        print("Подразделения не найдены. Запустите сначала: python seed_projects.py")
        return 0

    created = 0
    for row in PERSONNEL_MOCK:
        tab_number, full_name, position, dept_code, hire_date, dismissal_date, phone, email, status = row
        department_id = dept_ids.get(dept_code)
        if not department_id:
            continue
        existing = db.query(Personnel).filter(Personnel.tab_number == tab_number).first()
        if existing:
            continue
        personnel = Personnel(
            tab_number=tab_number,
            full_name=full_name,
            position=position,
            department_id=department_id,
            hire_date=hire_date,
            dismissal_date=dismissal_date,
            birth_date=None,
            phone=phone,
            email=email,
            status=PersonnelStatus(status),
            is_active=(status == "employed"),
            notes=None,
        )
        db.add(personnel)
        db.flush()
        hist = PersonnelHistory(
            personnel_id=personnel.id,
            action=PersonnelHistoryAction.CREATED,
            description="Создана карточка сотрудника (мок-данные)",
        )
        db.add(hist)
        created += 1

    db.commit()
    return created


def add_sample_history(db: Session):
    """Добавить несколько записей истории «изменений» для наглядности."""
    # Найдём пару сотрудников и добавим им запись об обновлении
    persons = db.query(Personnel).filter(Personnel.tab_number.in_(["002", "007"])).all()
    for p in persons:
        existing = db.query(PersonnelHistory).filter(
            PersonnelHistory.personnel_id == p.id,
            PersonnelHistory.action == PersonnelHistoryAction.UPDATED,
        ).first()
        if existing:
            continue
        h = PersonnelHistory(
            personnel_id=p.id,
            action=PersonnelHistoryAction.UPDATED,
            field_name="phone",
            old_value="+7 (495) 000-00-00",
            new_value=p.phone or "",
            description="Телефон: было «+7 (495) 000-00-00», стало «" + (p.phone or "") + "»",
        )
        db.add(h)
    db.commit()


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        n = seed_personnel(db)
        add_sample_history(db)
        print(f"Кадры: добавлено сотрудников: {n}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
