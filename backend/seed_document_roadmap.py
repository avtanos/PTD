"""
Скрипт для создания мок-данных дорожной карты документов
Запускать после инициализации структуры дорожной карты
"""
from app.db.database import SessionLocal, Base, engine
from app.models.document_roadmap import DocumentRoadmapSection, DocumentSectionStatus, ExecutionStatus, DocumentStatus
from app.models.project import Project
from app.models.document_notification import DocumentNotification  # Для инициализации relationships
from datetime import date, datetime, timedelta
import random

# Инициализируем все модели для правильной работы relationships
Base.metadata.create_all(bind=engine)

# Мок-данные для статусов
MOCK_STATUSES = [
    # Эскизный проект
    {
        "section_code": "sketch.itc.heat",
        "request_date": date(2024, 1, 15),
        "due_date": date(2024, 2, 15),
        "valid_until_date": date(2025, 2, 15),
        "executor_company": "Иванов И.И.",
        "executor_authority": "Петров П.П. (Теплосети)",
        "execution_status": "completed",
        "note": "Документ получен, все условия выполнены",
    },
    {
        "section_code": "sketch.itc.power",
        "request_date": date(2024, 1, 20),
        "due_date": date(2024, 2, 20),
        "valid_until_date": date(2025, 1, 20),
        "executor_company": "Сидоров С.С.",
        "executor_authority": "Козлов К.К. (Энергосбыт)",
        "execution_status": "completed",
        "note": "Согласовано",
    },
    {
        "section_code": "sketch.itc.water",
        "request_date": date(2024, 2, 1),
        "due_date": date(2024, 3, 1),
        "valid_until_date": date(2025, 3, 1),
        "executor_company": "Морозов М.М.",
        "executor_authority": "Водоканал",
        "execution_status": "in_progress",
        "note": "В процессе согласования",
    },
    {
        "section_code": "sketch.itc.gas",
        "request_date": date(2024, 2, 10),
        "due_date": date(2024, 3, 10),
        "valid_until_date": date(2025, 3, 10),
        "executor_company": "Волков В.В.",
        "executor_authority": "Газпром",
        "execution_status": "on_approval",
        "note": "На согласовании у руководства",
    },
    {
        "section_code": "sketch.itc.phone",
        "request_date": date(2024, 2, 15),
        "due_date": date(2024, 3, 15),
        "valid_until_date": None,
        "executor_company": "Новиков Н.Н.",
        "executor_authority": None,
        "execution_status": "not_started",
        "note": "Ожидание начала работ",
    },
    {
        "section_code": "sketch.geo",
        "request_date": date(2024, 1, 10),
        "due_date": date(2024, 2, 10),
        "valid_until_date": date(2025, 2, 10),
        "executor_company": "Геодезист Г.Г.",
        "executor_authority": None,
        "execution_status": "completed",
        "note": "Геологические изыскания завершены",
    },
    {
        "section_code": "sketch.urban",
        "request_date": date(2024, 1, 5),
        "due_date": date(2024, 2, 5),
        "valid_until_date": date(2025, 1, 5),
        "executor_company": "Архитектор А.А.",
        "executor_authority": "Бишкекглавархитектура",
        "execution_status": "completed",
        "note": "Градостроительное заключение получено",
    },
    # Рабочий проект
    {
        "section_code": "working.genplan",
        "request_date": date(2024, 3, 1),
        "due_date": date(2024, 4, 1),
        "valid_until_date": date(2025, 4, 1),
        "executor_company": "Проектировщик П.П.",
        "executor_authority": None,
        "execution_status": "completed",
        "note": "Стройгенплан готов",
    },
    {
        "section_code": "working.ppr",
        "request_date": date(2024, 3, 10),
        "due_date": date(2024, 4, 10),
        "valid_until_date": date(2025, 4, 10),
        "executor_company": "Инженер И.И.",
        "executor_authority": None,
        "execution_status": "in_progress",
        "note": "Разработка ППР в процессе",
    },
    {
        "section_code": "working.survey",
        "request_date": date(2024, 3, 15),
        "due_date": date(2024, 4, 15),
        "valid_until_date": date(2025, 4, 15),
        "executor_company": "Геодезист Г.Г.",
        "executor_authority": None,
        "execution_status": "not_started",
        "note": "Ожидание начала работ",
    },
    {
        "section_code": "working.gp_ar.mchs",
        "request_date": date(2024, 4, 1),
        "due_date": date(2024, 5, 1),
        "valid_until_date": date(2025, 5, 1),
        "executor_company": "Пожарный инспектор П.И.",
        "executor_authority": "МЧС",
        "execution_status": "on_approval",
        "note": "Согласование с МЧС в процессе",
    },
    {
        "section_code": "working.gp_ar.sanepid",
        "request_date": date(2024, 4, 5),
        "due_date": date(2024, 5, 5),
        "valid_until_date": date(2025, 5, 5),
        "executor_company": "Санитарный врач С.В.",
        "executor_authority": "Санэпид",
        "execution_status": "in_progress",
        "note": "Проверка санитарных норм",
    },
    {
        "section_code": "working.gp_ar.mpret",
        "request_date": date(2024, 4, 10),
        "due_date": date(2024, 5, 10),
        "valid_until_date": date(2025, 5, 10),
        "executor_company": "Эколог Э.Э.",
        "executor_authority": "МПРЭТН",
        "execution_status": "not_started",
        "note": "Ожидание начала экологической экспертизы",
    },
    {
        "section_code": "working.expertise.stage1",
        "request_date": date(2024, 5, 1),
        "due_date": date(2024, 7, 1),
        "valid_until_date": date(2025, 7, 1),
        "executor_company": "Эксперт Э.Э.",
        "executor_authority": "Госэкспертиза",
        "execution_status": "in_progress",
        "note": "Первый этап госэкспертизы в процессе",
    },
    {
        "section_code": "working.register",
        "request_date": date(2024, 6, 1),
        "due_date": date(2024, 7, 1),
        "valid_until_date": date(2025, 7, 1),
        "executor_company": "Регистратор Р.Р.",
        "executor_authority": "Реестр строящихся объектов",
        "execution_status": "not_started",
        "note": "Ожидание завершения 1 этапа экспертизы",
    },
    {
        "section_code": "working.expertise.stage2",
        "request_date": date(2024, 7, 1),
        "due_date": date(2024, 9, 1),
        "valid_until_date": date(2025, 9, 1),
        "executor_company": "Эксперт Э.Э.",
        "executor_authority": "Госэкспертиза",
        "execution_status": "not_started",
        "note": "Ожидание начала 2 этапа",
    },
    {
        "section_code": "working.networks.external.heat",
        "request_date": date(2024, 7, 10),
        "due_date": date(2024, 8, 10),
        "valid_until_date": date(2025, 8, 10),
        "executor_company": "Теплотехник Т.Т.",
        "executor_authority": None,
        "execution_status": "not_started",
        "note": "Проект наружных теплосетей",
    },
    {
        "section_code": "working.networks.external.power",
        "request_date": date(2024, 7, 15),
        "due_date": date(2024, 8, 15),
        "valid_until_date": date(2025, 8, 15),
        "executor_company": "Электрик Э.Э.",
        "executor_authority": None,
        "execution_status": "not_started",
        "note": "Проект наружных электросетей",
    },
    {
        "section_code": "working.networks.internal.hvac",
        "request_date": date(2024, 7, 20),
        "due_date": date(2024, 9, 20),
        "valid_until_date": date(2025, 9, 20),
        "executor_company": "Вентиляционщик В.В.",
        "executor_authority": None,
        "execution_status": "not_started",
        "note": "Проект отопления и вентиляции",
    },
    {
        "section_code": "working.networks.internal.electrical",
        "request_date": date(2024, 7, 25),
        "due_date": date(2024, 9, 25),
        "valid_until_date": date(2025, 9, 25),
        "executor_company": "Электромонтажник Э.Э.",
        "executor_authority": None,
        "execution_status": "not_started",
        "note": "Проект внутренних электросетей",
    },
    # Примеры с истекающими сроками для демонстрации уведомлений
    {
        "section_code": "sketch.itc",
        "request_date": date(2023, 12, 1),
        "due_date": date(2024, 1, 1),
        "valid_until_date": date(2024, 2, 1),  # Просрочен
        "executor_company": "Координатор К.К.",
        "executor_authority": None,
        "execution_status": "completed",
        "note": "Все условия получены",
    },
    {
        "section_code": "working.gp_ar",
        "request_date": date(2024, 3, 20),
        "due_date": date(2024, 4, 20),
        "valid_until_date": date(2025, 2, 5),  # Скоро истекает (менее 30 дней)
        "executor_company": "Архитектор А.А.",
        "executor_authority": "Бишкекглавархитектура",
        "execution_status": "completed",
        "note": "ГП АР согласован",
    },
]


def seed_document_roadmap(project_id: int = None):
    """Создает мок-данные для дорожной карты документов"""
    db = SessionLocal()
    try:
        # Получаем проект (используем первый активный или создаем тестовый)
        if project_id:
            project = db.query(Project).filter(Project.id == project_id).first()
        else:
            project = db.query(Project).filter(Project.is_active == True).first()
        
        if not project:
            print("Проект не найден. Создайте проект перед заполнением мок-данных.")
            return
        
        print(f"Заполнение мок-данных для проекта: {project.name} (ID: {project.id})")
        
        # Получаем все секции дорожной карты
        sections = {s.code: s for s in db.query(DocumentRoadmapSection).all()}
        
        created_count = 0
        updated_count = 0
        
        for mock_status in MOCK_STATUSES:
            section_code = mock_status["section_code"]
            
            if section_code not in sections:
                print(f"Предупреждение: Секция {section_code} не найдена в структуре дорожной карты")
                continue
            
            section = sections[section_code]
            
            # Проверяем, существует ли уже статус
            existing = db.query(DocumentSectionStatus).filter(
                DocumentSectionStatus.project_id == project.id,
                DocumentSectionStatus.section_code == section_code
            ).first()
            
            if existing:
                # Обновляем существующий статус
                for key, value in mock_status.items():
                    if key == "execution_status":
                        setattr(existing, key, ExecutionStatus(value))
                    elif hasattr(existing, key):
                        setattr(existing, key, value)
                
                # Рассчитываем статус документа
                if existing.valid_until_date:
                    today = date.today()
                    days_left = (existing.valid_until_date - today).days
                    if days_left < 0:
                        existing.document_status = DocumentStatus.EXPIRED
                    elif days_left <= 7:
                        existing.document_status = DocumentStatus.EXPIRING
                    elif days_left <= 30:
                        existing.document_status = DocumentStatus.EXPIRING
                    else:
                        existing.document_status = DocumentStatus.VALID
                    existing.document_status_calculated_at = datetime.now()
                
                updated_count += 1
            else:
                # Создаем новый статус
                status_data = {
                    "project_id": project.id,
                    "section_id": section.id,
                    "section_code": section_code,
                    "execution_status": ExecutionStatus(mock_status["execution_status"]),
                }
                
                # Добавляем остальные поля
                for key, value in mock_status.items():
                    if key != "execution_status" and hasattr(DocumentSectionStatus, key):
                        status_data[key] = value
                
                # Рассчитываем статус документа
                if status_data.get("valid_until_date"):
                    today = date.today()
                    days_left = (status_data["valid_until_date"] - today).days
                    if days_left < 0:
                        status_data["document_status"] = DocumentStatus.EXPIRED
                    elif days_left <= 7:
                        status_data["document_status"] = DocumentStatus.EXPIRING
                    elif days_left <= 30:
                        status_data["document_status"] = DocumentStatus.EXPIRING
                    else:
                        status_data["document_status"] = DocumentStatus.VALID
                    status_data["document_status_calculated_at"] = datetime.now()
                
                db_status = DocumentSectionStatus(**status_data)
                db.add(db_status)
                created_count += 1
        
        db.commit()
        print(f"✅ Успешно создано {created_count} статусов, обновлено {updated_count} статусов")
        print(f"📊 Всего статусов для проекта: {created_count + updated_count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при заполнении мок-данных: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    project_id = int(sys.argv[1]) if len(sys.argv) > 1 else None
    seed_document_roadmap(project_id)
