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

# Import models to ensure tables are created
from app.models.project import Project
from app.models.estimate import Estimate, EstimateItem, RelatedCost, EstimateType, EstimateItemType
from app.models.ks2 import KS2, KS2Item
from app.models.ks3 import KS3
from app.models.invoice import Invoice
from app.models.receivables import Receivable, ReceivablePayment, ReceivableNotification, CollectionAction
from app.models.sales import SalesProposal, SalesProposalItem, CustomerAgreement

def init_db():
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)
    
    # Add status column to estimates if missing
    if 'estimates' in existing_tables:
        columns = [col['name'] for col in inspector.get_columns('estimates')]
        if 'status' not in columns:
            print("Adding 'status' column to estimates table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE estimates ADD COLUMN status VARCHAR(50) DEFAULT 'draft'"))
                conn.commit()

    # Add columns to ks2 if missing
    if 'ks2' in existing_tables:
        columns = [col['name'] for col in inspector.get_columns('ks2')]
        with engine.connect() as conn:
            if 'contract_id' not in columns:
                print("Adding 'contract_id' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN contract_id INTEGER REFERENCES contracts(id)"))
            if 'period_from' not in columns:
                print("Adding 'period_from' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN period_from DATE"))
            if 'period_to' not in columns:
                print("Adding 'period_to' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN period_to DATE"))
            if 'verified_by' not in columns:
                print("Adding 'verified_by' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN verified_by VARCHAR(200)"))
            if 'verification_date' not in columns:
                print("Adding 'verification_date' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN verification_date DATE"))
            if 'notes' not in columns:
                print("Adding 'notes' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN notes TEXT"))
            if 'customer_signature' not in columns:
                print("Adding 'customer_signature' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN customer_signature VARCHAR(200)"))
            if 'contractor_signature' not in columns:
                print("Adding 'contractor_signature' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN contractor_signature VARCHAR(200)"))
            if 'object_name' not in columns:
                print("Adding 'object_name' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN object_name VARCHAR(1000)"))
            if 'customer' not in columns:
                print("Adding 'customer' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN customer VARCHAR(500)"))
            if 'contractor' not in columns:
                print("Adding 'contractor' column to ks2 table...")
                conn.execute(text("ALTER TABLE ks2 ADD COLUMN contractor VARCHAR(500)"))
            conn.commit()

    # Add columns to ks3 if missing
    if 'ks3' in existing_tables:
        columns = [col['name'] for col in inspector.get_columns('ks3')]
        with engine.connect() as conn:
            if 'period_from' not in columns:
                print("Adding 'period_from' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN period_from DATE"))
            if 'period_to' not in columns:
                print("Adding 'period_to' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN period_to DATE"))
            if 'total_vat' not in columns:
                print("Adding 'total_vat' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN total_vat NUMERIC(15, 2) DEFAULT 0"))
            if 'estimate_id' not in columns:
                print("Adding 'estimate_id' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN estimate_id INTEGER REFERENCES estimates(id)"))
            if 'ks2_id' not in columns:
                print("Adding 'ks2_id' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN ks2_id INTEGER REFERENCES ks2(id)"))
            if 'notes' not in columns:
                print("Adding 'notes' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN notes TEXT"))
            if 'customer_signature' not in columns:
                print("Adding 'customer_signature' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN customer_signature VARCHAR(200)"))
            if 'contractor_signature' not in columns:
                print("Adding 'contractor_signature' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN contractor_signature VARCHAR(200)"))
            if 'object_name' not in columns:
                print("Adding 'object_name' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN object_name VARCHAR(1000)"))
            if 'customer' not in columns:
                print("Adding 'customer' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN customer VARCHAR(500)"))
            if 'contractor' not in columns:
                print("Adding 'contractor' column to ks3 table...")
                conn.execute(text("ALTER TABLE ks3 ADD COLUMN contractor VARCHAR(500)"))
            conn.commit()

    # Add columns to receivable_notifications if missing
    if 'receivable_notifications' in existing_tables:
        columns = [col['name'] for col in inspector.get_columns('receivable_notifications')]
        with engine.connect() as conn:
            if 'is_sent' not in columns:
                print("Adding 'is_sent' column to receivable_notifications table...")
                conn.execute(text("ALTER TABLE receivable_notifications ADD COLUMN is_sent BOOLEAN DEFAULT 0"))
            if 'sent_at' not in columns:
                print("Adding 'sent_at' column to receivable_notifications table...")
                conn.execute(text("ALTER TABLE receivable_notifications ADD COLUMN sent_at DATETIME"))
            conn.commit()

def get_projects(db: Session):
    return db.query(Project).all()

def create_estimates(db: Session, projects):
    print("Creating estimates...")
    count = 0
    for project in projects:
        # Check if estimates exist for this project
        if db.query(Estimate).filter(Estimate.project_id == project.id).first():
            continue

        # 1. Local Estimate (Foundation)
        est1 = Estimate(
            project_id=project.id,
            estimate_type=EstimateType.LOCAL,
            number=f"LOC-{project.code}-001",
            name="Земляные работы и устройство фундамента",
            date=date.today() - timedelta(days=60),
            version="1.0",
            total_amount=Decimal("1500000.00"),
            materials_cost=Decimal("800000.00"),
            labor_cost=Decimal("500000.00"),
            equipment_cost=Decimal("200000.00"),
            overhead_cost=Decimal("0.00"),
            related_costs=Decimal("0.00"),
            developed_by="Иванов И.И.",
            approved_by="Петров П.П.",
            status="approved"
        )
        db.add(est1)
        db.flush()

        # Items for est1
        db.add_all([
            EstimateItem(estimate_id=est1.id, item_type=EstimateItemType.LABOR, line_number=1, work_name="Разработка грунта экскаватором", unit="м3", quantity=Decimal("500"), unit_price=Decimal("200"), total_price=Decimal("100000"), labor_price=Decimal("50000"), equipment_price=Decimal("50000")),
            EstimateItem(estimate_id=est1.id, item_type=EstimateItemType.MATERIALS, line_number=2, work_name="Песок для подсыпки", unit="м3", quantity=Decimal("100"), unit_price=Decimal("800"), total_price=Decimal("80000"), materials_price=Decimal("80000")),
            EstimateItem(estimate_id=est1.id, item_type=EstimateItemType.MATERIALS, line_number=3, work_name="Бетон М300", unit="м3", quantity=Decimal("150"), unit_price=Decimal("4500"), total_price=Decimal("675000"), materials_price=Decimal("675000")),
            EstimateItem(estimate_id=est1.id, item_type=EstimateItemType.LABOR, line_number=4, work_name="Устройство бетонной подготовки", unit="м3", quantity=Decimal("20"), unit_price=Decimal("1500"), total_price=Decimal("30000"), labor_price=Decimal("30000")),
        ])

        # 2. Local Estimate (Walls)
        est2 = Estimate(
            project_id=project.id,
            estimate_type=EstimateType.LOCAL,
            number=f"LOC-{project.code}-002",
            name="Возведение стен и перегородок",
            date=date.today() - timedelta(days=45),
            version="1.0",
            total_amount=Decimal("2500000.00"),
            materials_cost=Decimal("1500000.00"),
            labor_cost=Decimal("800000.00"),
            equipment_cost=Decimal("100000.00"),
            related_costs=Decimal("100000.00"),
            developed_by="Иванов И.И.",
            status="draft"
        )
        db.add(est2)
        db.flush()
        
        # Items for est2
        db.add_all([
            EstimateItem(estimate_id=est2.id, item_type=EstimateItemType.MATERIALS, line_number=1, work_name="Кирпич полнотелый", unit="тыс.шт", quantity=Decimal("50"), unit_price=Decimal("15000"), total_price=Decimal("750000"), materials_price=Decimal("750000")),
            EstimateItem(estimate_id=est2.id, item_type=EstimateItemType.LABOR, line_number=2, work_name="Кладка стен", unit="м3", quantity=Decimal("120"), unit_price=Decimal("2500"), total_price=Decimal("300000"), labor_price=Decimal("300000")),
        ])
        db.add(RelatedCost(estimate_id=est2.id, cost_type="overhead", description="Доставка материалов", amount=Decimal("100000")))

        count += 2

    db.commit()
    print(f"Created {count} estimates.")

def create_finance_data(db: Session, projects):
    print("Creating finance data (KS, Invoices, Receivables)...")
    
    for project in projects:
        # Check if data exists
        if db.query(Receivable).filter(Receivable.project_id == project.id).first():
            continue

        # 1. Create KS2 (Acts)
        ks2_1 = KS2(
            project_id=project.id,
            number=f"KS2-{project.code}-001",
            date=date.today() - timedelta(days=30),
            period_from=date.today() - timedelta(days=60),
            period_to=date.today() - timedelta(days=30),
            total_amount=Decimal("1000000.00"),
            status="approved"
        )
        db.add(ks2_1)
        db.flush()

        # 2. Create KS3 (Certificates)
        ks3_1 = KS3(
            project_id=project.id,
            number=f"KS3-{project.code}-001",
            date=date.today() - timedelta(days=28),
            period_from=date.today() - timedelta(days=60),
            period_to=date.today() - timedelta(days=30),
            total_amount=Decimal("1000000.00"),
            total_vat=Decimal("200000.00"),
            total_with_vat=Decimal("1200000.00"),
            status="signed"
        )
        db.add(ks3_1)
        db.flush()

        # 3. Create Invoice linked to KS3
        inv1 = Invoice(
            project_id=project.id,
            ks3_id=ks3_1.id,
            invoice_number=f"INV-{project.code}-001",
            invoice_date=date.today() - timedelta(days=25),
            contractor=project.contractor or "Contractor LLC",
            total_amount=Decimal("1000000.00"),
            vat_amount=Decimal("200000.00"),
            total_with_vat=Decimal("1200000.00"),
            status="paid",
            due_date=date.today() - timedelta(days=10),
            paid_date=date.today() - timedelta(days=12)
        )
        db.add(inv1)
        
        # 4. Create Invoice (Overdue)
        inv2 = Invoice(
            project_id=project.id,
            invoice_number=f"INV-{project.code}-002",
            invoice_date=date.today() - timedelta(days=15),
            contractor=project.contractor or "Contractor LLC",
            total_amount=Decimal("500000.00"),
            vat_amount=Decimal("100000.00"),
            total_with_vat=Decimal("600000.00"),
            status="submitted",
            due_date=date.today() - timedelta(days=5) # Overdue by 5 days
        )
        db.add(inv2)
        db.flush()

        # 5. Create Receivables
        # Fully paid
        rec1 = Receivable(
            project_id=project.id,
            customer_name=project.customer or "Customer LLC",
            invoice_number=inv1.invoice_number,
            invoice_date=inv1.invoice_date,
            due_date=inv1.due_date,
            total_amount=inv1.total_with_vat,
            paid_amount=inv1.total_with_vat,
            remaining_amount=Decimal("0.00"),
            days_overdue=0,
            status="paid"
        )
        db.add(rec1)
        db.flush()
        
        db.add(ReceivablePayment(
            receivable_id=rec1.id,
            payment_date=inv1.paid_date,
            amount=inv1.total_with_vat,
            payment_method="Bank Transfer",
            received_by="Accountant"
        ))

        # Overdue
        rec2 = Receivable(
            project_id=project.id,
            customer_name=project.customer or "Customer LLC",
            invoice_number=inv2.invoice_number,
            invoice_date=inv2.invoice_date,
            due_date=inv2.due_date,
            total_amount=inv2.total_with_vat,
            paid_amount=Decimal("0.00"),
            remaining_amount=inv2.total_with_vat,
            days_overdue=(date.today() - inv2.due_date).days,
            status="overdue"
        )
        db.add(rec2)
        db.flush()

        db.add(ReceivableNotification(
            receivable_id=rec2.id,
            notification_date=date.today() - timedelta(days=3),
            notification_type="reminder",
            sent_to="director@customer.com",
            subject="Напоминание об оплате",
            is_sent=True
        ))
        
        db.add(CollectionAction(
            receivable_id=rec2.id,
            action_date=date.today() - timedelta(days=1),
            action_type="phone_call",
            description="Звонок главному бухгалтеру",
            responsible="Менеджер Петров",
            status="completed",
            result="Обещали оплатить завтра"
        ))

    db.commit()
    print("Finance data created.")

def create_sales_data(db: Session, projects):
    print("Creating sales data...")
    
    for project in projects:
        if db.query(SalesProposal).filter(SalesProposal.project_id == project.id).first():
            continue

        # Sales Proposal
        prop = SalesProposal(
            project_id=project.id,
            proposal_number=f"KP-{project.code}-001",
            proposal_date=date.today() - timedelta(days=10),
            customer_name="Potentional Client LLC",
            customer_phone="+79991234567",
            customer_email="info@client.com",
            total_amount=Decimal("5000000.00"),
            discount_percentage=Decimal("5.00"),
            discount_amount=Decimal("250000.00"),
            final_amount=Decimal("4750000.00"),
            status="sent",
            prepared_by="Sales Manager",
            validity_period=date.today() + timedelta(days=20)
        )
        db.add(prop)
        db.flush()

        db.add(SalesProposalItem(
            proposal_id=prop.id,
            work_name="Строительно-монтажные работы (этап 1)",
            unit="компл",
            quantity=Decimal("1"),
            unit_price=Decimal("5000000.00"),
            amount=Decimal("5000000.00")
        ))

        # Agreement
        agree = CustomerAgreement(
            project_id=project.id,
            proposal_id=prop.id,
            agreement_date=date.today(),
            customer_name="Potentional Client LLC",
            agreed_amount=Decimal("4700000.00"), # Slightly negotiated
            agreement_status="pending",
            sales_manager="Sales Manager",
            notes="Клиент просит скидку еще 50к"
        )
        db.add(agree)

    db.commit()
    print("Sales data created.")

def main():
    init_db()
    db = SessionLocal()
    try:
        projects = get_projects(db)
        if not projects:
            print("No projects found. Please run seed_projects.py first.")
            return

        create_estimates(db, projects)
        create_finance_data(db, projects)
        create_sales_data(db, projects)
        
        print("Success! Finance data seeded.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
