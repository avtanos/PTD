from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Project(Base):
    """Модель проекта"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False, comment="Наименование проекта")
    code = Column(String(100), unique=True, index=True, comment="Код проекта")
    address = Column(String(1000), comment="Адрес объекта")
    customer = Column(String(500), comment="Заказчик")
    contractor = Column(String(500), comment="Подрядчик")
    description = Column(Text, comment="Описание проекта")
    work_type = Column(String(200), comment="Вид работ")
    department_id = Column(Integer, ForeignKey("departments.id"), comment="Подразделение (ПТО)")
    start_date = Column(Date, comment="Дата начала работ")
    end_date = Column(Date, comment="Планируемая дата окончания работ")
    status = Column(String(50), default="active", comment="Статус проекта")
    is_active = Column(Boolean, default=True, comment="Активен ли проект")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="projects")
    stages = relationship("ProjectStage", back_populates="project", cascade="all, delete-orphan", order_by="ProjectStage.order_number")
    executive_docs = relationship("ExecutiveDocument", back_populates="project", cascade="all, delete-orphan")
    ks2_forms = relationship("KS2", back_populates="project", cascade="all, delete-orphan")
    ks3_forms = relationship("KS3", back_populates="project", cascade="all, delete-orphan")
    gprs = relationship("GPR", back_populates="project", cascade="all, delete-orphan")
    pprs = relationship("PPR", back_populates="project", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="project", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="project", cascade="all, delete-orphan")
    tenders = relationship("Tender", back_populates="project", cascade="all, delete-orphan")
    estimates = relationship("Estimate", back_populates="project", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="project", cascade="all, delete-orphan")
    project_documentation = relationship("ProjectDocumentation", back_populates="project", cascade="all, delete-orphan")
    executive_surveys = relationship("ExecutiveSurvey", back_populates="project", cascade="all, delete-orphan")
    constructs = relationship("ProjectConstruct", back_populates="project", cascade="all, delete-orphan")
    work_volumes = relationship("WorkVolume", back_populates="project", cascade="all, delete-orphan")
    project_changes = relationship("ProjectChange", back_populates="project", cascade="all, delete-orphan")
    defects = relationship("Defect", back_populates="project", cascade="all, delete-orphan")
    material_movements = relationship("MaterialMovement", back_populates="project")
    material_write_offs = relationship("MaterialWriteOff", back_populates="project", cascade="all, delete-orphan")
    volume_matches = relationship("VolumeProjectMatch", back_populates="project", cascade="all, delete-orphan")
    receivables = relationship("Receivable", back_populates="project", cascade="all, delete-orphan")
    sales_proposals = relationship("SalesProposal", back_populates="project", cascade="all, delete-orphan")
    customer_agreements = relationship("CustomerAgreement", back_populates="project", cascade="all, delete-orphan")
    document_roadmap_statuses = relationship("DocumentSectionStatus", back_populates="project", cascade="all, delete-orphan")
    project_personnel = relationship("ProjectPersonnel", back_populates="project", cascade="all, delete-orphan")