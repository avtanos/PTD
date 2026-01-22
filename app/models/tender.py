from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class TenderStatus(str, enum.Enum):
    """Статусы тендера"""
    DRAFT = "draft"  # Черновик
    ANNOUNCED = "announced"  # Объявлен
    IN_PROCESS = "in_process"  # В процессе
    EVALUATION = "evaluation"  # Оценка предложений
    COMPLETED = "completed"  # Завершен
    CANCELLED = "cancelled"  # Отменен


class Tender(Base):
    """Модель тендера"""
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    number = Column(String(100), nullable=False, unique=True, index=True, comment="Номер тендера")
    name = Column(String(500), nullable=False, comment="Наименование тендера")
    description = Column(Text, comment="Описание работ/услуг")
    announcement_date = Column(Date, comment="Дата объявления")
    submission_deadline = Column(Date, comment="Срок подачи предложений")
    evaluation_date = Column(Date, comment="Дата оценки")
    budget = Column(Numeric(15, 2), comment="Бюджет тендера")
    status = Column(Enum(TenderStatus), default=TenderStatus.DRAFT, comment="Статус")
    winner_id = Column(Integer, ForeignKey("contractors.id"), comment="Победитель")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="tenders")
    winner = relationship("Contractor", foreign_keys=[winner_id])
    participants = relationship("TenderParticipant", back_populates="tender", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="tender")


class Contractor(Base):
    """Модель подрядчика/поставщика"""
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False, comment="Наименование")
    inn = Column(String(20), comment="ИНН")
    kpp = Column(String(20), comment="КПП")
    address = Column(String(1000), comment="Адрес")
    phone = Column(String(50), comment="Телефон")
    email = Column(String(200), comment="Email")
    contact_person = Column(String(200), comment="Контактное лицо")
    specialization = Column(String(500), comment="Специализация")
    rating = Column(Integer, default=0, comment="Рейтинг")
    is_active = Column(Boolean, default=True, comment="Активен")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    commercial_proposals = relationship("CommercialProposal", back_populates="contractor")
    tender_participations = relationship("TenderParticipant", back_populates="contractor")


class TenderParticipant(Base):
    """Модель участника тендера"""
    __tablename__ = "tender_participants"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=False, index=True)
    commercial_proposal_id = Column(Integer, ForeignKey("commercial_proposals.id"), comment="Коммерческое предложение")
    status = Column(String(50), default="participated", comment="Статус участия")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tender = relationship("Tender", back_populates="participants")
    contractor = relationship("Contractor", back_populates="tender_participations")
    commercial_proposal = relationship("CommercialProposal", foreign_keys=[commercial_proposal_id])


class CommercialProposal(Base):
    """Модель коммерческого предложения"""
    __tablename__ = "commercial_proposals"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=False, index=True)
    number = Column(String(100), comment="Номер КП")
    date = Column(Date, nullable=False, comment="Дата КП")
    total_amount = Column(Numeric(15, 2), default=0, comment="Общая сумма")
    validity_period = Column(Date, comment="Срок действия")
    payment_terms = Column(Text, comment="Условия оплаты")
    delivery_terms = Column(Text, comment="Условия поставки")
    notes = Column(Text, comment="Примечания")
    file_path = Column(String(1000), comment="Путь к файлу")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tender = relationship("Tender")
    contractor = relationship("Contractor", back_populates="commercial_proposals")
    items = relationship("CommercialProposalItem", back_populates="commercial_proposal", cascade="all, delete-orphan")


class CommercialProposalItem(Base):
    """Модель позиции коммерческого предложения"""
    __tablename__ = "commercial_proposal_items"

    id = Column(Integer, primary_key=True, index=True)
    commercial_proposal_id = Column(Integer, ForeignKey("commercial_proposals.id"), nullable=False, index=True)
    line_number = Column(Integer, comment="Номер строки")
    work_name = Column(String(1000), nullable=False, comment="Наименование работ/материалов")
    unit = Column(String(50), comment="Единица измерения")
    quantity = Column(Numeric(15, 3), comment="Количество")
    price = Column(Numeric(15, 2), nullable=False, comment="Цена")
    amount = Column(Numeric(15, 2), comment="Сумма")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    commercial_proposal = relationship("CommercialProposal", back_populates="items")