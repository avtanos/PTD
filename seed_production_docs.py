"""
Скрипт для генерации мокап данных для производственной документации:
- КС-2 (Акт о приемке выполненных работ)
- КС-3 (Справка о стоимости выполненных работ)
- ГПР (График производства работ)
- ППР (Проект производства работ)
"""

import sys
import os
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal, engine
from app.models.ks2 import KS2, KS2Item
from app.models.ks3 import KS3, KS3Item
from app.models.gpr import GPR, GPRTask
from app.models.ppr import PPR, PPRSection
from app.models.project import Project
from decimal import Decimal
from datetime import date, datetime, timedelta
import random

random.seed(42)

# Простые функции для генерации данных
def fake_name():
    names = ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Козлов К.К.", "Смирнов С.С.", 
             "Попов П.П.", "Лебедев Л.Л.", "Новиков Н.Н.", "Морозов М.М.", "Волков В.В."]
    return random.choice(names)

def fake_text(max_chars=200):
    words = ["Работы выполнены в соответствии с проектом.", "Требуется дополнительная проверка.",
             "Все материалы соответствуют требованиям.", "Работы выполнены качественно.",
             "Необходимо провести дополнительные испытания.", "Документация оформлена правильно."]
    text = random.choice(words)
    while len(text) < max_chars and random.random() > 0.3:
        text += " " + random.choice(words)
    return text[:max_chars]

def fake_date_between(start_date, end_date):
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    elif end_date == 'today':
        end_date = date.today()
    
    days_between = (end_date - start_date).days
    random_days = random.randint(0, days_between)
    return start_date + timedelta(days=random_days)


def get_projects(db: Session):
    """Получить список проектов"""
    result = db.execute(text("SELECT id, name, code, customer, contractor FROM projects WHERE is_active = 1 ORDER BY id")).fetchall()
    projects = []
    for r in result:
        project = type('Project', (), {
            'id': r[0],
            'name': r[1],
            'code': r[2],
            'customer': r[3],
            'contractor': r[4]
        })()
        projects.append(project)
    return projects


def create_ks2_forms(db: Session, projects: list):
    """Создать формы КС-2"""
    print("Создание форм КС-2...")
    
    ks2_count = 0
    for project in projects[:15]:  # Для первых 15 проектов
        # Создаем 1-3 формы КС-2 на проект
        num_forms = random.randint(1, 3)
        
        for i in range(num_forms):
            # Проверяем, существует ли уже форма с таким номером
            number = f"КС-2-{project.code or project.id}-{i+1:03d}"
            existing = db.execute(text("SELECT id FROM ks2 WHERE number = :number"), {"number": number}).first()
            if existing:
                continue
            
            # Период для акта
            period_from = fake_date_between(date.today() - timedelta(days=180), date.today())
            period_to = period_from + timedelta(days=random.randint(15, 30))
            act_date = period_to + timedelta(days=random.randint(1, 5))
            
            # Используем raw SQL для вставки, используя только базовые колонки
            result = db.execute(
                text("""
                    INSERT INTO ks2 (project_id, number, date, period_from, period_to, customer, contractor, 
                                    object_name, total_amount, status, notes, created_at)
                    VALUES (:project_id, :number, :date, :period_from, :period_to, :customer, :contractor,
                            :object_name, 0, :status, :notes, datetime('now'))
                """),
                {
                    "project_id": project.id,
                    "number": number,
                    "date": act_date,
                    "period_from": period_from,
                    "period_to": period_to,
                    "customer": project.customer or "Заказчик",
                    "contractor": project.contractor or "Подрядчик",
                    "object_name": project.name,
                    "status": random.choice(['draft', 'in_review', 'signed', 'approved']),
                    "notes": fake_text(200) if random.random() > 0.7 else None,
                }
            )
            ks2_id = result.lastrowid
            
            # Создаем позиции для формы КС-2
            num_items = random.randint(3, 8)
            total_amount = Decimal(0)
            
            work_names = [
                "Земляные работы",
                "Бетонные работы",
                "Арматурные работы",
                "Кирпичная кладка",
                "Монтаж конструкций",
                "Устройство кровли",
                "Отделочные работы",
                "Электромонтажные работы",
                "Сантехнические работы",
            ]
            
            for j in range(num_items):
                volume_estimated = Decimal(str(random.uniform(10, 1000))).quantize(Decimal('0.01'))
                volume_completed = volume_estimated * Decimal(str(random.uniform(0.5, 1.0))).quantize(Decimal('0.01'))
                price = Decimal(str(random.uniform(100, 5000))).quantize(Decimal('0.01'))
                amount = (volume_completed * price).quantize(Decimal('0.01'))
                total_amount += amount
                
                db.execute(
                    text("""
                        INSERT INTO ks2_items (ks2_id, line_number, work_name, unit, volume_estimated, 
                                              volume_completed, volume_total, price, amount, notes, created_at)
                        VALUES (:ks2_id, :line_number, :work_name, :unit, :volume_estimated, :volume_completed,
                                :volume_total, :price, :amount, :notes, datetime('now'))
                    """),
                    {
                        "ks2_id": ks2_id,
                        "line_number": j + 1,
                        "work_name": random.choice(work_names),
                        "unit": random.choice(['м³', 'м²', 'м', 'шт', 'т']),
                        "volume_estimated": float(volume_estimated),
                        "volume_completed": float(volume_completed),
                        "volume_total": float(volume_estimated),
                        "price": float(price),
                        "amount": float(amount),
                        "notes": fake_text(100) if random.random() > 0.8 else None,
                    }
                )
            
            # Обновляем общую сумму
            db.execute(
                text("UPDATE ks2 SET total_amount = :total_amount WHERE id = :id"),
                {"total_amount": float(total_amount), "id": ks2_id}
            )
            ks2_count += 1
    
    db.commit()
    print(f"Создано форм КС-2: {ks2_count}")
    return ks2_count


def create_ks3_forms(db: Session, projects: list):
    """Создать формы КС-3"""
    print("Создание форм КС-3...")
    
    # Получаем все формы КС-2
    ks2_result = db.execute(text("SELECT id, project_id FROM ks2")).fetchall()
    ks2_by_project = {}
    for r in ks2_result:
        project_id = r[1]
        if project_id not in ks2_by_project:
            ks2_by_project[project_id] = []
        ks2_by_project[project_id].append(r[0])  # Сохраняем только ID
    
    ks3_count = 0
    for project in projects[:15]:  # Для первых 15 проектов
        # Создаем 1-2 формы КС-3 на проект
        num_forms = random.randint(1, 2)
        
        for i in range(num_forms):
            # Проверяем, существует ли уже форма с таким номером
            number = f"КС-3-{project.code or project.id}-{i+1:03d}"
            existing = db.execute(text("SELECT id FROM ks3 WHERE number = :number"), {"number": number}).first()
            if existing:
                continue
            
            # Период для справки
            period_from = fake_date_between(date.today() - timedelta(days=180), date.today())
            period_to = period_from + timedelta(days=random.randint(15, 30))
            cert_date = period_to + timedelta(days=random.randint(1, 5))
            
            # Связываем с КС-2, если есть
            ks2_id = None
            if project.id in ks2_by_project and ks2_by_project[project.id]:
                ks2_id = random.choice(ks2_by_project[project.id])
            
            # Используем raw SQL для вставки КС-3
            result = db.execute(
                text("""
                    INSERT INTO ks3 (project_id, ks2_id, number, date, period_from, period_to, customer, contractor, 
                                    object_name, total_amount, total_vat, total_with_vat, status, notes, created_at)
                    VALUES (:project_id, :ks2_id, :number, :date, :period_from, :period_to, :customer, :contractor,
                            :object_name, 0, 0, 0, :status, :notes, datetime('now'))
                """),
                {
                    "project_id": project.id,
                    "ks2_id": ks2_id,
                    "number": number,
                    "date": cert_date,
                    "period_from": period_from,
                    "period_to": period_to,
                    "customer": project.customer or "Заказчик",
                    "contractor": project.contractor or "Подрядчик",
                    "object_name": project.name,
                    "status": random.choice(['draft', 'submitted', 'verified', 'signed', 'approved']),
                    "notes": fake_text(200) if random.random() > 0.7 else None,
                }
            )
            ks3_id = result.lastrowid
            
            # Создаем позиции для формы КС-3
            num_items = random.randint(3, 8)
            total_amount = Decimal(0)
            total_vat = Decimal(0)
            
            work_names = [
                "Земляные работы",
                "Бетонные работы",
                "Арматурные работы",
                "Кирпичная кладка",
                "Монтаж конструкций",
                "Устройство кровли",
                "Отделочные работы",
                "Электромонтажные работы",
                "Сантехнические работы",
            ]
            
            for j in range(num_items):
                volume = Decimal(str(random.uniform(10, 1000))).quantize(Decimal('0.01'))
                price = Decimal(str(random.uniform(100, 5000))).quantize(Decimal('0.01'))
                amount = (volume * price).quantize(Decimal('0.01'))
                vat_rate = Decimal("20.00")
                vat_amount = (amount * vat_rate / (100 + vat_rate)).quantize(Decimal('0.01'))
                amount_with_vat = amount
                
                total_amount += amount
                total_vat += vat_amount
                
                db.execute(
                    text("""
                        INSERT INTO ks3_items (ks3_id, line_number, work_name, unit, volume, price, amount,
                                              vat_rate, vat_amount, amount_with_vat, notes, created_at)
                        VALUES (:ks3_id, :line_number, :work_name, :unit, :volume, :price, :amount,
                                :vat_rate, :vat_amount, :amount_with_vat, :notes, datetime('now'))
                    """),
                    {
                        "ks3_id": ks3_id,
                        "line_number": j + 1,
                        "work_name": random.choice(work_names),
                        "unit": random.choice(['м³', 'м²', 'м', 'шт', 'т']),
                        "volume": float(volume),
                        "price": float(price),
                        "amount": float(amount),
                        "vat_rate": float(vat_rate),
                        "vat_amount": float(vat_amount),
                        "amount_with_vat": float(amount_with_vat),
                        "notes": fake_text(100) if random.random() > 0.8 else None,
                    }
                )
            
            # Обновляем суммы
            db.execute(
                text("UPDATE ks3 SET total_amount = :total_amount, total_vat = :total_vat, total_with_vat = :total_with_vat WHERE id = :id"),
                {
                    "total_amount": float(total_amount),
                    "total_vat": float(total_vat),
                    "total_with_vat": float(total_amount + total_vat),
                    "id": ks3_id
                }
            )
            ks3_count += 1
    
    db.commit()
    print(f"Создано форм КС-3: {ks3_count}")
    return ks3_count


def create_gprs(db: Session, projects: list):
    """Создать графики производства работ (ГПР)"""
    print("Создание ГПР...")
    
    gpr_count = 0
    for project in projects[:12]:  # Для первых 12 проектов
        # Создаем 1-2 ГПР на проект
        num_gprs = random.randint(1, 2)
        
        for i in range(num_gprs):
            # Проверяем, существует ли уже ГПР с таким именем
            name = f"ГПР {project.name} v{i+1}"
            existing = db.execute(text("SELECT id FROM gpr WHERE name = :name AND project_id = :project_id"), 
                                 {"name": name, "project_id": project.id}).first()
            if existing:
                continue
            
            start_date = fake_date_between(date.today() - timedelta(days=90), date.today() + timedelta(days=90))
            end_date = start_date + timedelta(days=random.randint(90, 365))
            
            # Используем raw SQL для вставки ГПР
            result = db.execute(
                text("""
                    INSERT INTO gpr (project_id, name, version, start_date, end_date, created_by, approved_by,
                                    status, description, created_at)
                    VALUES (:project_id, :name, :version, :start_date, :end_date, :created_by, :approved_by,
                            :status, :description, datetime('now'))
                """),
                {
                    "project_id": project.id,
                    "name": name,
                    "version": f"v{i+1}.0",
                    "start_date": start_date,
                    "end_date": end_date,
                    "created_by": fake_name(),
                    "approved_by": fake_name() if random.random() > 0.5 else None,
                    "status": random.choice(['draft', 'approved', 'active']),
                    "description": fake_text(300) if random.random() > 0.5 else None,
                }
            )
            gpr_id = result.lastrowid
            
            # Создаем задачи для ГПР
            num_tasks = random.randint(5, 15)
            task_dates = []
            current_date = start_date
            
            task_names = [
                "Подготовительные работы",
                "Земляные работы",
                "Устройство фундамента",
                "Возведение стен",
                "Монтаж перекрытий",
                "Устройство кровли",
                "Фасадные работы",
                "Внутренняя отделка",
                "Электромонтажные работы",
                "Сантехнические работы",
                "Благоустройство территории",
                "Сдача объекта",
            ]
            
            for j in range(num_tasks):
                task_start = current_date + timedelta(days=random.randint(0, 30))
                task_duration = random.randint(5, 30)
                task_end = task_start + timedelta(days=task_duration)
                
                if task_end > end_date:
                    task_end = end_date
                    task_start = task_end - timedelta(days=task_duration)
                
                actual_start = task_start + timedelta(days=random.randint(-5, 5)) if random.random() > 0.3 else None
                actual_end = task_end + timedelta(days=random.randint(-5, 10)) if random.random() > 0.3 else None
                progress = random.randint(0, 100) if actual_start else 0
                
                db.execute(
                    text("""
                        INSERT INTO gpr_tasks (gpr_id, name, work_type, responsible, start_date, end_date,
                                              planned_duration, actual_start_date, actual_end_date, progress,
                                              status, dependencies, notes, created_at)
                        VALUES (:gpr_id, :name, :work_type, :responsible, :start_date, :end_date,
                                :planned_duration, :actual_start_date, :actual_end_date, :progress,
                                :status, :dependencies, :notes, datetime('now'))
                    """),
                    {
                        "gpr_id": gpr_id,
                        "name": random.choice(task_names) if j < len(task_names) else f"Задача {j+1}",
                        "work_type": random.choice(['Строительные', 'Монтажные', 'Отделочные', 'Специальные']),
                        "responsible": fake_name(),
                        "start_date": task_start,
                        "end_date": task_end,
                        "planned_duration": task_duration,
                        "actual_start_date": actual_start,
                        "actual_end_date": actual_end,
                        "progress": progress,
                        "status": random.choice(['planned', 'in_progress', 'completed', 'delayed']),
                        "dependencies": str(random.randint(1, j)) if j > 0 and random.random() > 0.5 else None,
                        "notes": fake_text(150) if random.random() > 0.7 else None,
                    }
                )
                
                current_date = task_end
                task_dates.append((task_start, task_end))
            
            gpr_count += 1
    
    db.commit()
    print(f"Создано ГПР: {gpr_count}")
    return gpr_count


def create_pprs(db: Session, projects: list):
    """Создать проекты производства работ (ППР)"""
    print("Создание ППР...")
    
    ppr_count = 0
    for project in projects[:10]:  # Для первых 10 проектов
        # Создаем 1-2 ППР на проект
        num_pprs = random.randint(1, 2)
        
        for i in range(num_pprs):
            # Проверяем, существует ли уже ППР с таким именем
            name = f"ППР {project.name} v{i+1}"
            existing = db.execute(text("SELECT id FROM ppr WHERE name = :name AND project_id = :project_id"), 
                                 {"name": name, "project_id": project.id}).first()
            if existing:
                continue
            
            dev_date = fake_date_between(date.today() - timedelta(days=180), date.today())
            
            # Используем raw SQL для вставки ППР
            result = db.execute(
                text("""
                    INSERT INTO ppr (project_id, name, number, version, development_date, developer, approved_by,
                                    status, description, file_path, created_at)
                    VALUES (:project_id, :name, :number, :version, :development_date, :developer, :approved_by,
                            :status, :description, :file_path, datetime('now'))
                """),
                {
                    "project_id": project.id,
                    "name": name,
                    "number": f"ППР-{project.code or project.id}-{i+1:03d}",
                    "version": f"v{i+1}.0",
                    "development_date": dev_date,
                    "developer": fake_name(),
                    "approved_by": fake_name() if random.random() > 0.5 else None,
                    "status": random.choice(['draft', 'approved', 'active']),
                    "description": fake_text(300) if random.random() > 0.5 else None,
                    "file_path": f"/docs/ppr/{project.code or project.id}/ppr_{i+1}.pdf" if random.random() > 0.5 else None,
                }
            )
            ppr_id = result.lastrowid
            
            # Создаем разделы для ППР
            sections_data = [
                ("general", "Общая часть", "Общие сведения о проекте производства работ"),
                ("organization", "Организация работ", "Организационные мероприятия"),
                ("technology", "Технология работ", "Технологические решения"),
                ("safety", "Охрана труда и техника безопасности", "Мероприятия по охране труда"),
                ("quality", "Контроль качества", "Требования к качеству работ"),
                ("materials", "Материалы и оборудование", "Перечень необходимых материалов"),
                ("schedule", "Календарный план", "График выполнения работ"),
            ]
            
            for order, (section_type, title, content) in enumerate(sections_data[:random.randint(4, 7)]):
                db.execute(
                    text("""
                        INSERT INTO ppr_sections (ppr_id, section_type, title, content, order_number, file_path, created_at)
                        VALUES (:ppr_id, :section_type, :title, :content, :order_number, :file_path, datetime('now'))
                    """),
                    {
                        "ppr_id": ppr_id,
                        "section_type": section_type,
                        "title": title,
                        "content": content + ". " + fake_text(500),
                        "order_number": order + 1,
                        "file_path": f"/docs/ppr/{project.code or project.id}/section_{order+1}.pdf" if random.random() > 0.7 else None,
                    }
                )
            
            ppr_count += 1
    
    db.commit()
    print(f"Создано ППР: {ppr_count}")
    return ppr_count


def main():
    """Основная функция"""
    print("=" * 60)
    print("Генерация мокап данных для производственной документации")
    print("=" * 60)
    
    db: Session = SessionLocal()
    
    try:
        # Получаем проекты
        projects = get_projects(db)
        if not projects:
            print("ОШИБКА: Нет активных проектов в базе данных!")
            print("Сначала запустите seed_projects.py для создания проектов.")
            return
        
        print(f"Найдено проектов: {len(projects)}")
        print()
        
        # Создаем данные
        ks2_count = create_ks2_forms(db, projects)
        print()
        
        ks3_count = create_ks3_forms(db, projects)
        print()
        
        gpr_count = create_gprs(db, projects)
        print()
        
        ppr_count = create_pprs(db, projects)
        print()
        
        print("=" * 60)
        print("Генерация завершена!")
        print(f"Создано:")
        print(f"  - Форм КС-2: {ks2_count}")
        print(f"  - Форм КС-3: {ks3_count}")
        print(f"  - ГПР: {gpr_count}")
        print(f"  - ППР: {ppr_count}")
        print("=" * 60)
        
    except Exception as e:
        print(f"ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
