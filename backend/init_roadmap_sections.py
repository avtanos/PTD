"""
Скрипт для инициализации структуры дорожной карты документов
Запускать один раз для создания структуры узлов в БД
"""
from app.db.database import SessionLocal, Base, engine
# Импортируем все модели для правильной инициализации relationships
from app.models.document_roadmap import DocumentRoadmapSection
from app.models.document_notification import DocumentNotification  # Для инициализации relationships
from app.models.project import Project  # Для инициализации relationships

# Структура дорожной карты согласно схеме
ROADMAP_STRUCTURE = [
    # Эскизный проект
    {"code": "sketch", "name": "Эскизный проект", "parent_code": None, "order": 1},
    
    # Инженерно-технические условия
    {"code": "sketch.itc", "name": "Инженерно-технические условия", "parent_code": "sketch", "order": 1},
    {"code": "sketch.itc.heat", "name": "Теплоснабжение", "parent_code": "sketch.itc", "order": 1},
    {"code": "sketch.itc.power", "name": "Электроснабжение", "parent_code": "sketch.itc", "order": 2},
    {"code": "sketch.itc.water", "name": "Водопровод и канализация", "parent_code": "sketch.itc", "order": 3},
    {"code": "sketch.itc.gas", "name": "Газоснабжение", "parent_code": "sketch.itc", "order": 4},
    {"code": "sketch.itc.phone", "name": "Телефонизация", "parent_code": "sketch.itc", "order": 5},
    
    # Инженерно-геологические условия
    {"code": "sketch.geo", "name": "Инженерно-геологические условия", "parent_code": "sketch", "order": 2},
    
    # Градостроительное заключение
    {"code": "sketch.urban", "name": "Градостроительное заключение", "parent_code": "sketch", "order": 3},
    
    # Рабочий проект
    {"code": "working", "name": "Рабочий проект", "parent_code": None, "order": 2},
    
    # Подразделы рабочего проекта
    {"code": "working.genplan", "name": "Стройгенплан", "parent_code": "working", "order": 1},
    {"code": "working.ppr", "name": "ППР (План производственных работ)", "parent_code": "working", "order": 2},
    {"code": "working.survey", "name": "Акт выноса в натуру", "parent_code": "working", "order": 3},
    
    # ГП АР
    {"code": "working.gp_ar", "name": "ГП АР (Генеральный план и Архитектурные решения)", "parent_code": "working", "order": 4},
    {"code": "working.gp_ar.mchs", "name": "Согласование с МЧС", "parent_code": "working.gp_ar", "order": 1},
    {"code": "working.gp_ar.sanepid", "name": "Согласование с Санэпид", "parent_code": "working.gp_ar", "order": 2},
    {"code": "working.gp_ar.mpret", "name": "Согласование с МПРЭТН (экология)", "parent_code": "working.gp_ar", "order": 3},
    
    # Госэкспертиза
    {"code": "working.expertise", "name": "Прохождение госэкспертизы", "parent_code": "working", "order": 5},
    {"code": "working.expertise.stage1", "name": "1 этап Госэкспертизы", "parent_code": "working.expertise", "order": 1},
    {"code": "working.expertise.stage2", "name": "2 этап Госэкспертизы", "parent_code": "working.expertise", "order": 2},
    
    # Инженерные сети (из 2 этапа)
    {"code": "working.networks", "name": "Проекты Инженерные сети", "parent_code": "working.expertise.stage2", "order": 1},
    
    # Наружные сети
    {"code": "working.networks.external", "name": "Наружные сети", "parent_code": "working.networks", "order": 1},
    {"code": "working.networks.external.heat", "name": "Теплоснабжение", "parent_code": "working.networks.external", "order": 1},
    {"code": "working.networks.external.power", "name": "Электроснабжение", "parent_code": "working.networks.external", "order": 2},
    {"code": "working.networks.external.water", "name": "Наружный водопровод и канализация", "parent_code": "working.networks.external", "order": 3},
    {"code": "working.networks.external.gas", "name": "Газоснабжение", "parent_code": "working.networks.external", "order": 4},
    
    # Внутренние сети
    {"code": "working.networks.internal", "name": "Внутренние сети", "parent_code": "working.networks", "order": 2},
    {"code": "working.networks.internal.hvac", "name": "Отопление и вентиляция", "parent_code": "working.networks.internal", "order": 1},
    {"code": "working.networks.internal.electrical", "name": "Электромонтаж и электрооборудования", "parent_code": "working.networks.internal", "order": 2},
    {"code": "working.networks.internal.water", "name": "Водопровод и канализация", "parent_code": "working.networks.internal", "order": 3},
    {"code": "working.networks.internal.gas", "name": "Газоснабжение", "parent_code": "working.networks.internal", "order": 4},
    {"code": "working.networks.internal.fire", "name": "Пожаротушение и сигнализация", "parent_code": "working.networks.internal", "order": 5},
    
    # Включение в реестр
    {"code": "working.register", "name": "Включение в реестр строящихся объектов", "parent_code": "working.expertise.stage1", "order": 1},
]


def init_roadmap_sections():
    """Инициализирует структуру дорожной карты в БД"""
    # Создаем таблицы если их еще нет
    print("Создание таблиц...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Проверяем, есть ли уже секции
        existing = db.query(DocumentRoadmapSection).first()
        if existing:
            print("Структура дорожной карты уже инициализирована. Пропускаем.")
            return
        
        # Создаем словарь для быстрого поиска по коду
        code_to_id = {}
        
        # Создаем секции в два прохода: сначала все, потом обновляем parent_id
        sections_to_create = []
        for section_data in ROADMAP_STRUCTURE:
            section = DocumentRoadmapSection(
                code=section_data["code"],
                name=section_data["name"],
                parent_id=None,  # Временно None
                order_number=section_data["order"]
            )
            db.add(section)
            sections_to_create.append((section, section_data["parent_code"]))
        
        db.flush()  # Получаем ID для всех секций
        
        # Обновляем parent_id на основе parent_code
        for section, parent_code in sections_to_create:
            if parent_code:
                parent_section = db.query(DocumentRoadmapSection).filter(
                    DocumentRoadmapSection.code == parent_code
                ).first()
                if parent_section:
                    section.parent_id = parent_section.id
        
        db.commit()
        print(f"Успешно создано {len(ROADMAP_STRUCTURE)} секций дорожной карты")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при инициализации: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_roadmap_sections()
