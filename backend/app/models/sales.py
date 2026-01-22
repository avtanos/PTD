from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class SalesProposalStatus(str, enum.Enum):
    """Статусы коммерческого предложения для клиента"""
    DRAFT = "draft"  # Черновик
    SENT = "sent"  # Отправлено клиенту
    UNDER_REVIEW = "under_review"  # На рассмотрении
    APPROVED = "approved"  # Одобрено клиентом
    REJECTED = "rejected"  # Отклонено
    EXPIRED = "expired"  # Истек срок действия


class SalesProposal(Base):
    """Модель коммерческого предложения для клиента (от отдела продаж)"""
    __tablename__ = "sales_proposals"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.id"), comment="Связанная смета")
    proposal_number = Column(String(100), nullable=False, unique=True, index=True, comment="Номер КП")
    proposal_date = Column(Date, nullable=False, comment="Дата КП")
    customer_name = Column(String(500), nullable=False, comment="Клиент")
    customer_contact = Column(String(200), comment="Контактное лицо")
    customer_phone = Column(String(50), comment="Телефон")
    customer_email = Column(String(200), comment="Email")
    total_amount = Column(Numeric(15, 2), nullable=False, comment="Общая сумма")
    discount_percentage = Column(Numeric(5, 2), default=0, comment="Скидка (%)")
    discount_amount = Column(Numeric(15, 2), default=0, comment="Сумма скидки")
    final_amount = Column(Numeric(15, 2), nullable=False, comment="Итоговая сумма")
    validity_period = Column(Date, comment="Срок действия КП")
    payment_terms = Column(Text, comment="Условия оплаты")
    delivery_terms = Column(Text, comment="Условия поставки")
    status = Column(Enum(SalesProposalStatus), default=SalesProposalStatus.DRAFT, comment="Статус")
    prepared_by = Column(String(200), nullable=False, comment="Подготовил (менеджер по продажам)")
    sent_date = Column(Date, comment="Дата отправки")
    response_date = Column(Date, comment="Дата ответа клиента")
    notes = Column(Text, comment="Примечания")
    file_path = Column(String(1000), comment="Путь к файлу КП")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="sales_proposals")
    estimate = relationship("Estimate")
    items = relationship("SalesProposalItem", back_populates="proposal", cascade="all, delete-orphan")


class SalesProposalItem(Base):
    """Модель позиции коммерческого предложения для клиента"""
    __tablename__ = "sales_proposal_items"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("sales_proposals.id"), nullable=False, index=True)
    line_number = Column(Integer, comment="Номер строки")
    work_name = Column(String(1000), nullable=False, comment="Наименование работ/услуг")
    unit = Column(String(50), comment="Единица измерения")
    quantity = Column(Numeric(15, 3), comment="Количество")
    unit_price = Column(Numeric(15, 2), nullable=False, comment="Цена за единицу")
    amount = Column(Numeric(15, 2), comment="Сумма")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    proposal = relationship("SalesProposal", back_populates="items")


class CustomerAgreement(Base):
    """Модель согласования с клиентом"""
    __tablename__ = "customer_agreements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    proposal_id = Column(Integer, ForeignKey("sales_proposals.id"), comment="Связанное КП")
    estimate_id = Column(Integer, ForeignKey("estimates.id"), comment="Связанная смета")
    agreement_date = Column(Date, nullable=False, comment="Дата согласования")
    customer_name = Column(String(500), nullable=False, comment="Клиент")
    agreed_amount = Column(Numeric(15, 2), nullable=False, comment="Согласованная сумма")
    changes_requested = Column(Text, comment="Запрошенные изменения")
    agreement_status = Column(String(50), default="pending", comment="Статус (pending, approved, rejected, modified)")
    agreed_by = Column(String(200), comment="Согласовал (от клиента)")
    sales_manager = Column(String(200), nullable=False, comment="Менеджер по продажам")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="customer_agreements")
    proposal = relationship("SalesProposal")
    estimate = relationship("Estimate")