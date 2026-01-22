from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ContractStatus(str, enum.Enum):
    """Статусы договора"""
    DRAFT = "draft"  # Черновик
    SIGNED = "signed"  # Подписан
    ACTIVE = "active"  # Действует
    SUSPENDED = "suspended"  # Приостановлен
    COMPLETED = "completed"  # Завершен
    TERMINATED = "terminated"  # Расторгнут


class Contract(Base):
    """Модель договора"""
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    contractor_name = Column(String(500), nullable=False, comment="Наименование подрядчика")
    contract_number = Column(String(100), nullable=False, unique=True, index=True, comment="Номер договора")
    contract_date = Column(Date, nullable=False, comment="Дата договора")
    start_date = Column(Date, comment="Дата начала действия")
    end_date = Column(Date, comment="Дата окончания действия")
    total_amount = Column(Numeric(15, 2), default=0, comment="Сумма договора")
    advance_payment = Column(Numeric(15, 2), default=0, comment="Аванс")
    work_description = Column(Text, comment="Описание работ")
    terms = Column(Text, comment="Условия договора")
    status = Column(Enum(ContractStatus), default=ContractStatus.DRAFT, comment="Статус")
    signed_by_customer = Column(String(200), comment="Подписан заказчиком")
    signed_by_contractor = Column(String(200), comment="Подписан подрядчиком")
    tender_id = Column(Integer, ForeignKey("tenders.id"), comment="Связанный тендер")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="contracts")
    tender = relationship("Tender", back_populates="contracts", foreign_keys=[tender_id])
    estimate_links = relationship("EstimateContractLink", back_populates="contract", cascade="all, delete-orphan")