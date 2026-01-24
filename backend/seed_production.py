import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
import random

# Add app path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.db.database import SessionLocal, engine, Base

# Import models
from app.models.project import Project
from app.models.executive_doc import ExecutiveDocument, DocumentType
from app.models.gpr import GPR, GPRTask
from app.models.ppr import PPR, PPRSection
from app.models.application import Application, ApplicationItem, ApplicationType, ApplicationStatus
from app.models.tender import Tender, Contractor, TenderParticipant, CommercialProposal, CommercialProposalItem, TenderStatus
from app.models.project_change import ProjectChange, ChangeApproval, Defect, ChangeType, ChangeStatus, ApprovalStatus

def init_db():
    """Инициализация базы данных и миграции"""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Создаем все таблицы, если их нет
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        # Проверка и добавление колонок для executive_documents
        if 'executive_documents' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('executive_documents')]
            # Add any missing columns if needed in future
            pass

def get_projects(db: Session):
    return db.query(Project).all()

def create_contractors(db: Session):
    print("Creating contractors...")
    contractors_data = [
        {"name": 'ООО "СтройМатериал"', "inn": "7701001001", "specialization": "Поставка материалов"},
        {"name": 'АО "СпецТехника"', "inn": "7702002002", "specialization": "Аренда техники"},
        {"name": 'ИП Петров В.В.', "inn": "7703003003", "specialization": "Отделочные работы"},
        {"name": 'ООО "ЭлектроМонтаж"', "inn": "7704004004", "specialization": "Электромонтаж"},
    ]
    
    created_contractors = []
    for data in contractors_data:
        contractor = db.query(Contractor).filter(Contractor.inn == data["inn"]).first()
        if not contractor:
            contractor = Contractor(**data)
            db.add(contractor)
            db.flush()
        created_contractors.append(contractor)
    
    db.commit()
    return created_contractors

def create_executive_docs(db: Session, projects):
    print("Creating executive documentation...")
    for project in projects:
        if db.query(ExecutiveDocument).filter(ExecutiveDocument.project_id == project.id).first():
            continue
            
        docs = [
            {
                "doc_type": "work_journal",
                "name": "Общий журнал работ",
                "number": f"OZR-{project.code}-01",
                "date": date.today() - timedelta(days=100),
                "status": "in_work"
            },
            {
                "doc_type": "hidden_work_act",
                "name": "Акт освидетельствования скрытых работ (армирование)",
                "number": f"AOSR-{project.code}-01",
                "date": date.today() - timedelta(days=30),
                "status": "signed"
            },
            {
                "doc_type": "executive_scheme",
                "name": "Исполнительная схема котлована",
                "number": f"IS-{project.code}-01",
                "date": date.today() - timedelta(days=60),
                "status": "approved"
            }
        ]
        
        for doc_data in docs:
            doc = ExecutiveDocument(
                project_id=project.id,
                **doc_data,
                created_by="Инженер ПТО",
                department="ПТО"
            )
            db.add(doc)
    db.commit()

def create_gpr_ppr(db: Session, projects):
    print("Creating GPR and PPR...")
    for project in projects:
        # GPR
        if not db.query(GPR).filter(GPR.project_id == project.id).first():
            gpr = GPR(
                project_id=project.id,
                name="График производства работ (основной)",
                version="1.0",
                start_date=date.today(),
                end_date=date.today() + timedelta(days=365),
                status="active",
                created_by="Нач. участка"
            )
            db.add(gpr)
            db.flush()
            
            # Tasks
            tasks = [
                {"name": "Подготовительный период", "start": 0, "dur": 30},
                {"name": "Земляные работы", "start": 30, "dur": 45},
                {"name": "Фундаментные работы", "start": 75, "dur": 60},
                {"name": "Возведение каркаса", "start": 135, "dur": 120},
            ]
            
            for i, task in enumerate(tasks):
                t = GPRTask(
                    gpr_id=gpr.id,
                    name=task["name"],
                    start_date=gpr.start_date + timedelta(days=task["start"]),
                    end_date=gpr.start_date + timedelta(days=task["start"] + task["dur"]),
                    planned_duration=task["dur"],
                    status="planned"
                )
                db.add(t)

        # PPR
        if not db.query(PPR).filter(PPR.project_id == project.id).first():
            ppr = PPR(
                project_id=project.id,
                name="ППР на основной период строительства",
                number=f"PPR-{project.code}-01",
                version="1.0",
                development_date=date.today() - timedelta(days=10),
                developer="ПТО",
                status="approved"
            )
            db.add(ppr)
            db.flush()
            
            sections = [
                {"title": "Пояснительная записка", "type": "text"},
                {"title": "Стройгенплан", "type": "drawing"},
                {"title": "Технологические карты", "type": "tech_card"},
            ]
            
            for i, sec in enumerate(sections):
                s = PPRSection(
                    ppr_id=ppr.id,
                    section_type=sec["type"],
                    title=sec["title"],
                    order_number=i+1
                )
                db.add(s)
                
    db.commit()

def create_applications(db: Session, projects):
    print("Creating applications...")
    for project in projects:
        if db.query(Application).filter(Application.project_id == project.id).first():
            continue
            
        app = Application(
            project_id=project.id,
            application_type="materials", # Use string literal
            number=f"APP-{project.code}-001",
            date=date.today(),
            requested_by="Прораб Иванов",
            status="submitted", # Use string literal
            description="Материалы для бетонирования",
            total_amount=Decimal("500000.00")
        )
        db.add(app)
        db.flush()
        
        db.add(ApplicationItem(
            application_id=app.id,
            line_number=1,
            material_name="Бетон В25",
            unit="м3",
            quantity=Decimal("100"),
            price=Decimal("5000"),
            amount=Decimal("500000")
        ))
    db.commit()

def create_tenders(db: Session, projects, contractors):
    print("Creating tenders...")
    for project in projects:
        if db.query(Tender).filter(Tender.project_id == project.id).first():
            continue
            
        tender = Tender(
            project_id=project.id,
            number=f"TND-{project.code}-001",
            name="Поставка бетона",
            status="announced", # Use string literal
            announcement_date=date.today() - timedelta(days=5),
            submission_deadline=date.today() + timedelta(days=10),
            budget=Decimal("1000000.00")
        )
        db.add(tender)
        db.flush()
        
        # Participants
        for contractor in contractors[:2]:
            db.add(TenderParticipant(
                tender_id=tender.id,
                contractor_id=contractor.id,
                status="participated"
            ))
            
    db.commit()

def create_changes_defects(db: Session, projects):
    print("Creating changes and defects...")
    for project in projects:
        if db.query(ProjectChange).filter(ProjectChange.project_id == project.id).first():
            continue
            
        # Change
        change = ProjectChange(
            project_id=project.id,
            change_type="planning", # Use string literal
            change_number=f"CHG-{project.code}-001",
            title="Перенос перегородки",
            description="Изменение планировки 1 этажа",
            initiator="Архитектор",
            initiator_date=date.today() - timedelta(days=15),
            status="in_approval" # Use string literal
        )
        db.add(change)
        db.flush()
        
        db.add(ChangeApproval(
            project_change_id=change.id,
            order_number=1,
            approver_role="ГИП",
            status="approved", # Use string literal
            approved_date=datetime.now()
        ))
        
        # Defect
        defect = Defect(
            project_id=project.id,
            title="Трещина в стяжке",
            description="Обнаружена усадочная трещина",
            severity="medium",
            detected_date=date.today() - timedelta(days=2),
            status="open"
        )
        db.add(defect)
        
    db.commit()

def main():
    print("=" * 60)
    print("Seeding Production Data (Docs, GPR/PPR, Tenders, Apps, Changes)")
    print("=" * 60)
    
    init_db()
    
    db = SessionLocal()
    try:
        projects = get_projects(db)
        if not projects:
            print("No projects found. Please run seed_projects.py first.")
            return

        contractors = create_contractors(db)
        create_executive_docs(db, projects)
        create_gpr_ppr(db, projects)
        create_applications(db, projects)
        create_tenders(db, projects, contractors)
        create_changes_defects(db, projects)
        
        print("\nSuccess! Production data seeded.")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
