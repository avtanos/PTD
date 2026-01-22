from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class InvoiceStatus(str, enum.Enum):
    """Статусы счета"""
    DRAFT = "draft"  # Черновик
    SUBMITTED = "submitted"  # Подан
    VERIFIED = "verified"  # Проверен
    APPROVED = "approved"  # Утвержден
    PAID = "paid"  # Оплачен
    CANCELLED = "cancelled"  # Отменен


class Invoice(Base):
    """Модель счета на оплату"""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    ks3_id = Column(Integer, ForeignKey("ks3.id"), comment="Связанная форма КС-3")
    invoice_number = Column(String(100), nullable=False, unique=True, index=True, comment="Номер счета")
    invoice_date = Column(Date, nullable=False, comment="Дата счета")
    contractor = Column(String(500), comment="Подрядчик")
    total_amount = Column(Numeric(15, 2), nullable=False, comment="Сумма счета")
    vat_amount = Column(Numeric(15, 2), default=0, comment="НДС")
    total_with_vat = Column(Numeric(15, 2), comment="Всего с НДС")
    payment_terms = Column(Text, comment="Условия оплаты")
    due_date = Column(Date, comment="Срок оплаты")
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, comment="Статус")
    verified_by = Column(String(200), comment="Проверил")
    verified_date = Column(Date, comment="Дата проверки")
    approved_by = Column(String(200), comment="Утвердил")
    approved_date = Column(Date, comment="Дата утверждения")
    paid_date = Column(Date, comment="Дата оплаты")
    payment_number = Column(String(100), comment="Номер платежного поручения")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="invoices")
    ks3 = relationship("KS3", back_populates="invoices")