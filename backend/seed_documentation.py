"""
Скрипт для заполнения базы данных тестовыми данными для:
- Проектная документация
- Исполнительная документация
- Исполнительные съемки
- Изменения проекта

Использование: python seed_documentation.py
"""

import sys
from datetime import date, datetime, timedelta
from pathlib import Path
import random

# Добавляем путь к приложению
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal, engine


def get_projects(db: Session):
    """Получить список всех проектов"""
    result = db.execute(text("SELECT id, name, code FROM projects ORDER BY id")).fetchall()
    return [{"id": r[0], "name": r[1], "code": r[2]} for r in result]


def create_project_documentation(db: Session, projects: list):
    """Создать тестовую проектной документации"""
    doc_types = ["ar", "kr", "vk", "nvk", "es", "em", "other"]
    doc_type_names = {
        "ar": "АР - Архитектурные решения",
        "kr": "КР - Конструктивные решения",
        "vk": "ВК - Водоснабжение и канализация",
        "nvk": "НВК - Отопление и вентиляция",
        "es": "ЭС - Электроснабжение",
        "em": "ЭМ - Электроосвещение",
        "other": "Прочее"
    }
    
    developers = [
        "ООО ПроектСтрой",
        "АО Проектинвест",
        "ИП Иванов И.И.",
        "ООО Архитектурное бюро",
        "ГУП Проектный институт"
    ]
    
    approvers = [
        "Главный инженер проекта",
        "Технический директор",
        "Главный архитектор",
        "Начальник ПТО"
    ]
    
    created_count = 0
    
    for project in projects[:15]:  # Для первых 15 проектов
        # Создаем 2-4 документа для каждого проекта
        num_docs = random.randint(2, 4)
        
        for i in range(num_docs):
            doc_type = random.choice(doc_types)
            doc_name = doc_type_names[doc_type]
            
            # Проверяем существование
            result = db.execute(
                text("SELECT id FROM project_documentation WHERE project_id = :project_id AND name LIKE :name"),
                {"project_id": project["id"], "name": f"%{doc_name}%"}
            ).first()
            
            if result:
                continue
            
            development_date = date.today() - timedelta(days=random.randint(30, 180))
            approval_date = development_date + timedelta(days=random.randint(5, 30))
            
            doc_data = {
                "project_id": project["id"],
                "doc_type": doc_type,
                "name": f"{doc_name} для {project['name']}",
                "number": f"ПД-{project['code']}-{random.randint(1, 100):03d}",
                "version": f"{random.randint(1, 3)}.{random.randint(0, 5)}",
                "development_date": development_date.isoformat(),
                "developer": random.choice(developers),
                "approved_by": random.choice(approvers),
                "approval_date": approval_date.isoformat(),
                "file_path": f"/docs/project/{project['code']}/{doc_type}_{random.randint(1, 1000)}.pdf",
                "description": f"Проектная документация типа {doc_name} для проекта {project['name']}",
                "is_active": random.choice([True, True, True, False]),  # 75% активных
                "notes": random.choice(["", "", "Требует доработки", "Утверждено", ""])
            }
            
            db.execute(
                text("""
                    INSERT INTO project_documentation 
                    (project_id, doc_type, name, number, version, development_date, developer, 
                     approved_by, approval_date, file_path, description, is_active, notes, created_at)
                    VALUES (:project_id, :doc_type, :name, :number, :version, :development_date, :developer,
                            :approved_by, :approval_date, :file_path, :description, :is_active, :notes, datetime('now'))
                """),
                doc_data
            )
            created_count += 1
    
    db.commit()
    print(f"Создано проектной документации: {created_count}")
    return created_count


def create_executive_docs(db: Session, projects: list):
    """Создать тестовую исполнительную документацию"""
    doc_types = ["executive_scheme", "hidden_work_act", "test_act", "work_journal", "material_certificate", "other"]
    doc_type_names = {
        "executive_scheme": "Исполнительная схема",
        "hidden_work_act": "Акт на скрытые работы",
        "test_act": "Акт испытаний",
        "work_journal": "Журнал работ",
        "material_certificate": "Сертификат на материалы",
        "other": "Прочее"
    }
    
    statuses = ["draft", "in_work", "in_review", "approved", "signed", "rejected"]
    creators = ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Смирнов А.А.", "Козлов В.В."]
    approvers = ["Главный инженер", "Технический директор", "Начальник ПТО", "Главный прораб"]
    departments = ["Геодезический отдел", "ПТО", "ОГЭ", "ОГМ", None]
    
    created_count = 0
    
    for project in projects[:15]:  # Для первых 15 проектов
        # Создаем 3-6 документов для каждого проекта
        num_docs = random.randint(3, 6)
        
        for i in range(num_docs):
            doc_type = random.choice(doc_types)
            doc_name = doc_type_names[doc_type]
            
            # Проверяем существование
            result = db.execute(
                text("SELECT id FROM executive_documents WHERE project_id = :project_id AND name LIKE :name"),
                {"project_id": project["id"], "name": f"%{doc_name}%"}
            ).first()
            
            if result:
                continue
            
            doc_date = date.today() - timedelta(days=random.randint(1, 90))
            
            doc_data = {
                "project_id": project["id"],
                "doc_type": doc_type,
                "name": f"{doc_name} для {project['name']}",
                "number": f"ИД-{project['code']}-{random.randint(1, 200):03d}",
                "date": doc_date.isoformat(),
                "description": f"Исполнительная документация: {doc_name}",
                "file_path": f"/docs/executive/{project['code']}/{doc_type}_{random.randint(1, 1000)}.pdf",
                "created_by": random.choice(creators),
                "approved_by": random.choice(approvers) if random.random() > 0.3 else None,
                "status": random.choice(statuses),
                "department": random.choice(departments)
            }
            
            db.execute(
                text("""
                    INSERT INTO executive_documents 
                    (project_id, doc_type, name, number, date, description, file_path, 
                     created_by, approved_by, status, department, created_at)
                    VALUES (:project_id, :doc_type, :name, :number, :date, :description, :file_path,
                            :created_by, :approved_by, :status, :department, datetime('now'))
                """),
                doc_data
            )
            created_count += 1
    
    db.commit()
    print(f"Создано исполнительной документации: {created_count}")
    return created_count


def create_executive_surveys(db: Session, projects: list):
    """Создать тестовые исполнительные съемки"""
    survey_types = ["executive", "control", "marking", "other"]
    survey_type_names = {
        "executive": "Исполнительная съемка",
        "control": "Контрольная съемка",
        "marking": "Разбивочная съемка",
        "other": "Прочее"
    }
    
    statuses = ["completed", "in_progress", "draft"]
    surveyors = ["Смирнов А.А.", "Петров П.П.", "Иванов И.И.", "Козлов В.В.", "Сидоров С.С."]
    departments = ["Геодезический отдел", "ПТО", None]
    
    created_count = 0
    
    for project in projects[:12]:  # Для первых 12 проектов
        # Создаем 2-5 съемок для каждого проекта
        num_surveys = random.randint(2, 5)
        
        for i in range(num_surveys):
            survey_type = random.choice(survey_types)
            survey_name = survey_type_names[survey_type]
            
            # Проверяем существование
            result = db.execute(
                text("SELECT id FROM executive_surveys WHERE project_id = :project_id AND number LIKE :number"),
                {"project_id": project["id"], "number": f"%{project['code']}%"}
            ).first()
            
            if result and i == 0:
                continue
            
            survey_date = date.today() - timedelta(days=random.randint(1, 120))
            
            survey_data = {
                "project_id": project["id"],
                "survey_type": survey_type,
                "number": f"СЪЕМ-{project['code']}-{random.randint(1, 50):02d}",
                "survey_date": survey_date.isoformat(),
                "surveyor": random.choice(surveyors),
                "department": random.choice(departments),
                "description": f"{survey_name} для проекта {project['name']}",
                "coordinates": f"X: {random.randint(500000, 600000)}, Y: {random.randint(500000, 600000)}, Z: {random.randint(100, 200)}",
                "file_path": f"/surveys/{project['code']}/survey_{random.randint(1, 500)}.dwg",
                "drawing_path": f"/surveys/{project['code']}/drawing_{random.randint(1, 500)}.pdf",
                "status": random.choice(statuses),
                "notes": random.choice(["", "", "Требует проверки", "Утверждено", ""])
            }
            
            db.execute(
                text("""
                    INSERT INTO executive_surveys 
                    (project_id, survey_type, number, survey_date, surveyor, department, description,
                     coordinates, file_path, drawing_path, status, notes, created_at)
                    VALUES (:project_id, :survey_type, :number, :survey_date, :surveyor, :department, :description,
                            :coordinates, :file_path, :drawing_path, :status, :notes, datetime('now'))
                """),
                survey_data
            )
            created_count += 1
    
    db.commit()
    print(f"Создано исполнительных съемок: {created_count}")
    return created_count


def create_project_changes(db: Session, projects: list):
    """Создать тестовые изменения проекта"""
    change_types = ["planning", "construction", "material", "volume", "additional", "correction", "other"]
    change_type_names = {
        "planning": "Перепланировка",
        "construction": "Изменение конструктивного решения",
        "material": "Замена материала",
        "volume": "Изменение объемов",
        "additional": "Дополнительные работы",
        "correction": "Исправление ошибок",
        "other": "Прочее"
    }
    
    statuses = ["draft", "submitted", "in_approval", "approved", "rejected", "implemented", "cancelled"]
    initiators = [
        "Иванов И.И. - Главный инженер",
        "Петров П.П. - Прораб",
        "Сидоров С.С. - Технолог",
        "Смирнов А.А. - Архитектор",
        "Козлов В.В. - Сметчик"
    ]
    
    created_count = 0
    
    for project in projects[:10]:  # Для первых 10 проектов
        # Создаем 1-3 изменения для каждого проекта
        num_changes = random.randint(1, 3)
        
        for i in range(num_changes):
            change_type = random.choice(change_types)
            change_name = change_type_names[change_type]
            
            change_number = f"ИЗМ-{project['code']}-{random.randint(1, 99):02d}"
            
            # Проверяем существование
            result = db.execute(
                text("SELECT id FROM project_changes WHERE change_number = :change_number"),
                {"change_number": change_number}
            ).first()
            
            if result:
                change_number = f"ИЗМ-{project['code']}-{random.randint(100, 199):03d}"
            
            initiator_date = date.today() - timedelta(days=random.randint(1, 150))
            approved_date = None
            implemented_date = None
            
            status = random.choice(statuses)
            if status in ["approved", "implemented"]:
                approved_date = initiator_date + timedelta(days=random.randint(5, 30))
            if status == "implemented":
                implemented_date = approved_date + timedelta(days=random.randint(1, 60))
            
            impact_volume = random.choice([None, None, round(random.uniform(10, 500), 2)])
            impact_cost = random.choice([None, None, round(random.uniform(50000, 5000000), 2)])
            impact_schedule = random.choice([None, None, random.randint(1, 30)])
            
            change_data = {
                "project_id": project["id"],
                "change_type": change_type,
                "change_number": change_number,
                "title": f"{change_name} для {project['name']}",
                "description": f"Описание изменения: {change_name}. Детальное описание изменений в проекте.",
                "justification": random.choice([
                    "Требования заказчика",
                    "Технические условия",
                    "Оптимизация решения",
                    "Исправление ошибок",
                    "Дополнительные требования"
                ]),
                "impact_volume": impact_volume,
                "impact_cost": impact_cost,
                "impact_schedule": impact_schedule,
                "initiator": random.choice(initiators),
                "initiator_date": initiator_date.isoformat(),
                "status": status,
                "approved_date": approved_date.isoformat() if approved_date else None,
                "implemented_date": implemented_date.isoformat() if implemented_date else None,
                "file_path": f"/changes/{project['code']}/change_{random.randint(1, 200)}.pdf",
                "notes": random.choice(["", "", "Требует согласования", "Срочно", ""])
            }
            
            db.execute(
                text("""
                    INSERT INTO project_changes 
                    (project_id, change_type, change_number, title, description, justification,
                     impact_volume, impact_cost, impact_schedule, initiator, initiator_date, status,
                     approved_date, implemented_date, file_path, notes, created_at)
                    VALUES (:project_id, :change_type, :change_number, :title, :description, :justification,
                            :impact_volume, :impact_cost, :impact_schedule, :initiator, :initiator_date, :status,
                            :approved_date, :implemented_date, :file_path, :notes, datetime('now'))
                """),
                change_data
            )
            created_count += 1
    
    db.commit()
    print(f"Создано изменений проекта: {created_count}")
    return created_count


def main():
    """Основная функция"""
    print("=" * 60)
    print("Заполнение базы данных тестовыми данными документации")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Получаем проекты
        print("\n1. Получение списка проектов...")
        projects = get_projects(db)
        if not projects:
            print("   ОШИБКА: Проекты не найдены! Сначала запустите seed_projects.py")
            return
        print(f"   Найдено проектов: {len(projects)}")
        
        # Создаем проектной документации
        print("\n2. Создание проектной документации...")
        proj_docs_count = create_project_documentation(db, projects)
        
        # Создаем исполнительную документацию
        print("\n3. Создание исполнительной документации...")
        exec_docs_count = create_executive_docs(db, projects)
        
        # Создаем исполнительные съемки
        print("\n4. Создание исполнительных съемок...")
        surveys_count = create_executive_surveys(db, projects)
        
        # Создаем изменения проекта
        print("\n5. Создание изменений проекта...")
        changes_count = create_project_changes(db, projects)
        
        print("\n" + "=" * 60)
        print("Заполнение завершено успешно!")
        print(f"Итого создано:")
        print(f"  - Проектной документации: {proj_docs_count}")
        print(f"  - Исполнительной документации: {exec_docs_count}")
        print(f"  - Исполнительных съемок: {surveys_count}")
        print(f"  - Изменений проекта: {changes_count}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nОшибка: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
