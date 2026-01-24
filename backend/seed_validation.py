import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
import random

# Add app path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal, engine, Base

# Import models
from app.models.project import Project
from app.models.standard_rate import StandardRate
from app.models.estimate import Estimate, EstimateItem, EstimateType
from app.models.estimate_validation import EstimateValidation, VolumeProjectMatch, ValidationRule, ValidationStatus
from app.models.project_documentation import ProjectDocumentation
from app.models.work_volume import WorkVolume
from app.models.object_construct import ObjectConstruct

def init_db():
    Base.metadata.create_all(bind=engine)

def get_projects(db: Session):
    return db.query(Project).all()

def create_standard_rates(db: Session):
    print("Creating standard rates...")
    if db.query(StandardRate).count() > 0:
        print("Standard rates already exist.")
        return

    rates = [
        {
            "code": "FER-01-01-001-01",
            "name": "Разработка грунта в отвал экскаваторами",
            "unit": "1000 м3",
            "materials_cost": Decimal(0),
            "labor_cost": Decimal(5000),
            "equipment_cost": Decimal(15000),
            "collection": "ФЕР-2001",
            "section": "Земляные работы"
        },
        {
            "code": "FER-06-01-001-01",
            "name": "Устройство бетонной подготовки",
            "unit": "м3",
            "materials_cost": Decimal(3500),
            "labor_cost": Decimal(1200),
            "equipment_cost": Decimal(300),
            "collection": "ФЕР-2001",
            "section": "Бетонные работы"
        },
        {
            "code": "FER-08-02-001-01",
            "name": "Кладка стен из кирпича",
            "unit": "м3",
            "materials_cost": Decimal(4500),
            "labor_cost": Decimal(2500),
            "equipment_cost": Decimal(500),
            "collection": "ФЕР-2001",
            "section": "Каменные работы"
        },
        {
            "code": "FER-10-01-001-01",
            "name": "Установка деревянных оконных блоков",
            "unit": "м2",
            "materials_cost": Decimal(8000),
            "labor_cost": Decimal(1500),
            "equipment_cost": Decimal(100),
            "collection": "ФЕР-2001",
            "section": "Деревянные конструкции"
        },
        {
            "code": "GESN-15-01-001-01",
            "name": "Облицовка стен керамической плиткой",
            "unit": "100 м2",
            "materials_cost": Decimal(50000),
            "labor_cost": Decimal(30000),
            "equipment_cost": Decimal(2000),
            "collection": "ГЭСН-2020",
            "section": "Отделочные работы"
        }
    ]

    for rate_data in rates:
        rate = StandardRate(
            **rate_data,
            total_cost=rate_data["materials_cost"] + rate_data["labor_cost"] + rate_data["equipment_cost"]
        )
        db.add(rate)
    
    db.commit()
    print(f"Created {len(rates)} standard rates.")

def create_validation_data(db: Session, projects):
    print("Creating validation data (Docs, Work Volumes, Matches)...")
    
    for project in projects:
        # 1. Ensure Project Documentation exists
        doc = db.query(ProjectDocumentation).filter(ProjectDocumentation.project_id == project.id).first()
        if not doc:
            try:
                # Use string 'kr' directly to avoid Enum issues
                doc = ProjectDocumentation(
                project_id=project.id,
                doc_type="KR",
                name="Рабочая документация. Конструктивные решения",
                    number=f"RD-{project.code}-KR",
                    version="1.0",
                    development_date=date.today() - timedelta(days=90),
                    developer="Проектный Институт",
                    approved_by="Гл. Инженер",
                    approval_date=date.today() - timedelta(days=80)
                )
                db.add(doc)
                db.flush()
            except Exception as e:
                print(f"Skipping doc creation for project {project.id}: {e}")
                db.rollback()
                continue

        # 2. Ensure Work Volumes exist
        wv = db.query(WorkVolume).filter(WorkVolume.project_id == project.id).first()
        if not wv:
            wv = WorkVolume(
                project_id=project.id,
                work_code="W-001",
                work_name="Разработка грунта котлована",
                unit="м3",
                planned_volume=Decimal(1000),
                actual_volume=Decimal(0),
                start_date=date.today() - timedelta(days=60),
                end_date=date.today() - timedelta(days=50)
            )
            db.add(wv)
            db.flush()

        # 3. Ensure Estimate exists
        estimate = db.query(Estimate).filter(Estimate.project_id == project.id).first()
        if not estimate:
            continue

        # 4. Create Validation Results (Volume Match)
        if not db.query(VolumeProjectMatch).filter(VolumeProjectMatch.estimate_id == estimate.id).first():
            # Find item in estimate that matches work volume
            est_volume = Decimal(0)
            for item in estimate.items:
                if "грунт" in item.work_name.lower():
                    est_volume += item.quantity
            
            project_vol = Decimal(1000)
            est_vol = est_volume if est_volume > 0 else Decimal(1100) # Mismatch!
            
            match = VolumeProjectMatch(
                project_id=project.id,
                work_volume_id=wv.id,
                estimate_id=estimate.id,
                work_name="Разработка грунта",
                project_volume=project_vol,
                estimated_volume=est_vol,
                deviation_estimate=est_vol - project_vol,
                deviation_percentage=((est_vol - project_vol) / project_vol * 100),
                status="pending"
            )
            db.add(match)

        # 5. Create Estimate Validation Rule Result
        if not db.query(EstimateValidation).filter(EstimateValidation.estimate_id == estimate.id).first():
            val = EstimateValidation(
                estimate_id=estimate.id,
                validation_type="automatic",
                rule="volume_match", # Use string
                status="failed", # Use string
                description="Обнаружено расхождение объемов работ с проектом более 5%",
                deviation_percentage=Decimal(10.0),
                is_critical=True
            )
            db.add(val)

    db.commit()
    print("Validation data created.")

def main():
    init_db()
    db = SessionLocal()
    try:
        projects = get_projects(db)
        if not projects:
            print("No projects found. Please run seed_projects.py first.")
            return

        create_standard_rates(db)
        create_validation_data(db, projects)
        
        print("Success! Validation data seeded.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
